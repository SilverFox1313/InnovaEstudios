import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getPayPalAccessToken(clientId: string, clientSecret: string, apiBase: string): Promise<string> {
  const credentials = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    throw new Error('No se pudo autenticar con la API de PayPal.');
  }

  const data = await res.json();
  return data.access_token;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Sesión no autorizada.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID') ?? '';
    const paypalClientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET') ?? '';
    const paypalMode = (Deno.env.get('PAYPAL_MODE') ?? 'sandbox').toLowerCase();
    const paypalApiBase = paypalMode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Configuración de servidor Supabase incompleta.' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user || !user.email) {
      return new Response(JSON.stringify({ error: 'Token de usuario inválido o expirado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { courseId, orderId } = await req.json();
    if (!courseId || !orderId) {
      return new Response(JSON.stringify({ error: 'Faltan courseId u orderId.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: course, error: courseError } = await adminClient
      .from('courses')
      .select('id, price, status')
      .eq('id', courseId)
      .maybeSingle();

    if (courseError || !course) {
      return new Response(JSON.stringify({ error: 'Curso no encontrado.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (course.status === 'upcoming') {
      return new Response(JSON.stringify({ error: 'Este curso aún está en preparación.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const expectedPrice = Number(course.price);
    if (!Number.isFinite(expectedPrice) || expectedPrice <= 0) {
      return new Response(JSON.stringify({ error: 'El curso es gratuito; usa el flujo de inscripción gratuita.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!paypalClientId || !paypalClientSecret) {
      return new Response(JSON.stringify({ error: 'Credenciales de PayPal no configuradas en Edge Function.' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paypalToken = await getPayPalAccessToken(paypalClientId, paypalClientSecret, paypalApiBase);
    const orderRes = await fetch(`${paypalApiBase}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${paypalToken}` },
    });

    if (!orderRes.ok) {
      return new Response(JSON.stringify({ error: 'No se pudo verificar la orden en PayPal.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const orderData = await orderRes.json();
    const unit = orderData?.purchase_units?.[0];
    const capture = unit?.payments?.captures?.[0];
    const paidAmount = Number(capture?.amount?.value ?? unit?.amount?.value ?? 0);
    const paidCurrency = String(capture?.amount?.currency_code ?? unit?.amount?.currency_code ?? '').toUpperCase();
    const captureStatus = capture?.status ?? orderData?.status;

    if (orderData?.status !== 'COMPLETED' || captureStatus !== 'COMPLETED') {
      return new Response(JSON.stringify({ error: 'El pago de PayPal no figura como completado.' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (paidCurrency !== 'USD' || paidAmount < expectedPrice - 0.01) {
      return new Response(JSON.stringify({ error: 'El monto o divisa pagados no coinciden con el precio del curso.' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check replay protection for paypal_order_id
    const { data: existingOrder } = await adminClient
      .from('user_purchases')
      .select('user_email, course_id')
      .eq('paypal_order_id', orderId)
      .maybeSingle();

    if (existingOrder && (existingOrder.course_id !== courseId || existingOrder.user_email.toLowerCase() !== user.email.toLowerCase())) {
      return new Response(JSON.stringify({ error: 'Esta orden de PayPal ya fue utilizada.' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: insertError } = await adminClient
      .from('user_purchases')
      .upsert(
        {
          user_id: user.id,
          user_email: user.email.toLowerCase(),
          course_id: courseId,
          amount_paid: paidAmount,
          payment_method: 'paypal',
          paypal_order_id: orderId,
          purchased_at: new Date().toISOString(),
        },
        { onConflict: 'user_email,course_id' }
      );

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, verifiedAmount: paidAmount }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Error interno verificando pago.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
