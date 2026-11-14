import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ojxusrctvsqkmacnmlwa.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_RYaF9w_iecJr7IzxdG4dCA_y6nth1ck';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_MODE = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase();
const PAYPAL_API_BASE = PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function authenticateSupabaseUser(req: Request) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return { user: null, token: null, error: 'Token de sesión requerido.' };
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data?.user || !data.user.email) {
    return { user: null, token: null, error: 'Sesión inválida o expirada.' };
  }

  return { user: data.user, token, error: null };
}

async function getPayPalAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET || PAYPAL_CLIENT_ID === 'test') {
    throw new Error('Las credenciales privadas de PayPal (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET) no están configuradas en el servidor.');
  }

  const basicAuth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('No se pudo obtener token OAuth de la API de PayPal.');
  }

  const json = await response.json() as { access_token?: string };
  if (!json.access_token) {
    throw new Error('Respuesta inválida al autenticar con PayPal.');
  }
  return json.access_token;
}

function getSupabaseWriteClient(userToken: string) {
  if (SUPABASE_SERVICE_ROLE_KEY) {
    return {
      client: createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY),
      isServiceRole: true,
    };
  }
  return {
    client: createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${userToken}` } },
    }),
    isServiceRole: false,
  };
}

async function upsertPurchaseRecord(
  client: any,
  record: {
    user_id: string;
    user_email: string;
    course_id: string;
    amount_paid: number;
    payment_method: string;
    paypal_order_id?: string;
  }
) {
  const payload: Record<string, any> = {
    user_id: record.user_id,
    user_email: record.user_email,
    course_id: record.course_id,
    amount_paid: record.amount_paid,
    payment_method: record.payment_method,
    purchased_at: new Date().toISOString(),
  };

  if (record.paypal_order_id) {
    payload.paypal_order_id = record.paypal_order_id;
  }

  let { error } = await client
    .from('user_purchases')
    .upsert(payload, { onConflict: 'user_email,course_id' });

  // Backward compatibility if user_id or paypal_order_id columns have not been migrated yet
  let attempts = 0;
  while (error && error.code === 'PGRST204' && attempts < 3) {
    attempts++;
    const msg = error.message || '';
    const match = msg.match(/Could not find the '([^']+)' column/i);
    const col = match?.[1];
    if (col && (col === 'user_id' || col === 'paypal_order_id')) {
      delete payload[col];
      const retry = await client
        .from('user_purchases')
        .upsert(payload, { onConflict: 'user_email,course_id' });
      error = retry.error;
    } else {
      break;
    }
  }

  return error;
}

const STORAGE_BUCKET = 'course-images';
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
const ALLOWED_IMAGE_MIME_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
};

async function isAdminSupabaseUser(user: any, userToken: string): Promise<boolean> {
  if (!user?.id) return false;
  if (user.app_metadata?.role === 'admin') return true;

  const checkClient = SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${userToken}` } },
      });

  const { data: profile } = await checkClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return profile?.role === 'admin';
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));
  await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Admin image upload endpoint: uploads to Supabase Storage (auto-creating public bucket if service key present),
  // with seamless local Express /uploads fallback so images render immediately without permission errors.
  app.post('/api/uploads/image', async (req: Request, res: Response) => {
    try {
      const { user, token, error: authErr } = await authenticateSupabaseUser(req);
      if (!user || !token) {
        return res.status(401).json({ success: false, error: authErr || 'No autorizado.' });
      }

      const adminOk = await isAdminSupabaseUser(user, token);
      if (!adminOk) {
        return res.status(403).json({ success: false, error: 'Solo los administradores pueden subir imágenes.' });
      }

      const rawMime = typeof req.body?.mimeType === 'string' ? req.body.mimeType.trim().toLowerCase() : '';
      const rawData = typeof req.body?.dataBase64 === 'string' ? req.body.dataBase64.trim() : '';
      const rawFolder = req.body?.folder === 'lessons' ? 'lessons' : 'courses';
      const rawFileName = typeof req.body?.fileName === 'string' ? req.body.fileName.trim() : 'imagen';

      const ext = ALLOWED_IMAGE_MIME_TYPES[rawMime];
      if (!ext) {
        return res.status(400).json({
          success: false,
          error: 'Formato de imagen no compatible. Usa PNG, JPG, WEBP, GIF, SVG o AVIF.',
        });
      }

      if (!rawData) {
        return res.status(400).json({ success: false, error: 'El archivo de imagen está vacío.' });
      }

      const cleanBase64 = rawData.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      if (!buffer.length || buffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'La imagen debe pesar menos de 10 MB.',
        });
      }

      const safeBaseName = path
        .basename(rawFileName, path.extname(rawFileName))
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'imagen';

      const uniqueName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${safeBaseName}.${ext}`;
      const objectPath = `${rawFolder}/${uniqueName}`;

      // 1. Try Supabase Storage first (auto-create public bucket if service role key is configured)
      const { client: storageClient, isServiceRole } = getSupabaseWriteClient(token);
      if (isServiceRole) {
        const { data: bucketData, error: bucketErr } = await storageClient.storage.getBucket(STORAGE_BUCKET);
        if (bucketErr || !bucketData) {
          await storageClient.storage.createBucket(STORAGE_BUCKET, {
            public: true,
            fileSizeLimit: 10 * 1024 * 1024,
          });
        } else if (!bucketData.public) {
          await storageClient.storage.updateBucket(STORAGE_BUCKET, { public: true });
        }
      }

      const { error: uploadErr } = await storageClient.storage
        .from(STORAGE_BUCKET)
        .upload(objectPath, buffer, {
          contentType: rawMime,
          upsert: true,
        });

      if (!uploadErr) {
        const { data: pub } = storageClient.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
        if (pub?.publicUrl) {
          return res.json({ success: true, publicUrl: pub.publicUrl, storage: 'supabase' });
        }
      }

      // 2. Reliable local server storage fallback (served publicly at /uploads/...)
      const targetDir = path.join(UPLOADS_DIR, rawFolder);
      await fs.promises.mkdir(targetDir, { recursive: true });
      await fs.promises.writeFile(path.join(targetDir, uniqueName), buffer);

      return res.json({
        success: true,
        publicUrl: `/uploads/${rawFolder}/${uniqueName}`,
        storage: 'server',
      });
    } catch (err: any) {
      console.error('Error en /api/uploads/image:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Error interno al procesar la imagen.',
      });
    }
  });

  // Server-side verification for paid courses via PayPal Orders v2 API
  app.post('/api/payments/verify-paypal', async (req: Request, res: Response) => {
    try {
      const { user, token, error: authErr } = await authenticateSupabaseUser(req);
      if (!user || !token) {
        return res.status(401).json({ success: false, error: authErr || 'No autorizado.' });
      }

      const courseId = typeof req.body?.courseId === 'string' ? req.body.courseId.trim() : '';
      const orderId = typeof req.body?.orderId === 'string' ? req.body.orderId.trim() : '';

      if (!courseId || !orderId) {
        return res.status(400).json({ success: false, error: 'Se requieren courseId y orderId válidos.' });
      }

      const { client, isServiceRole } = getSupabaseWriteClient(token);
      if (!isServiceRole) {
        return res.status(503).json({
          success: false,
          error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor para registrar compras verificadas de forma segura.',
        });
      }

      // 1. Read authoritative course price & status from Supabase (never trust client price)
      const { data: course, error: courseError } = await client
        .from('courses')
        .select('id, price, status')
        .eq('id', courseId)
        .maybeSingle();

      if (courseError || !course) {
        return res.status(404).json({ success: false, error: 'Curso no encontrado en la base de datos.' });
      }

      if (course.status === 'upcoming') {
        return res.status(400).json({ success: false, error: 'Este curso aún se encuentra en preparación.' });
      }

      const expectedPrice = Number(course.price);
      if (!Number.isFinite(expectedPrice) || expectedPrice <= 0) {
        return res.status(400).json({ success: false, error: 'Este curso es gratuito; utiliza la inscripción gratuita.' });
      }

      // 2. Verify order directly with PayPal REST API
      const paypalToken = await getPayPalAccessToken();
      const orderResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
        headers: {
          Authorization: `Bearer ${paypalToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!orderResponse.ok) {
        return res.status(400).json({ success: false, error: 'La orden de PayPal no pudo verificarse.' });
      }

      const orderData = await orderResponse.json() as any;
      const purchaseUnit = orderData?.purchase_units?.[0];
      const capture = purchaseUnit?.payments?.captures?.[0];
      const paidAmount = Number(capture?.amount?.value ?? purchaseUnit?.amount?.value ?? 0);
      const paidCurrency = String(capture?.amount?.currency_code ?? purchaseUnit?.amount?.currency_code ?? '').toUpperCase();
      const captureStatus = capture?.status ?? orderData?.status;

      if (orderData?.status !== 'COMPLETED' || captureStatus !== 'COMPLETED') {
        return res.status(402).json({ success: false, error: 'La orden de PayPal aún no está completada.' });
      }

      if (paidCurrency !== 'USD' || !Number.isFinite(paidAmount) || paidAmount < expectedPrice - 0.01) {
        return res.status(402).json({ success: false, error: 'El importe o moneda del pago no coincide con el precio oficial del curso.' });
      }

      // 3. Prevent PayPal order replay across users or courses
      const { data: existingOrder } = await client
        .from('user_purchases')
        .select('user_email, course_id')
        .eq('paypal_order_id', orderId)
        .maybeSingle();

      if (
        existingOrder &&
        (existingOrder.course_id !== courseId ||
          String(existingOrder.user_email).toLowerCase() !== String(user.email).toLowerCase())
      ) {
        return res.status(409).json({ success: false, error: 'Esta transacción de PayPal ya fue acreditada.' });
      }

      // 4. Persist verified purchase in user_purchases
      const upsertErr = await upsertPurchaseRecord(client, {
        user_id: user.id,
        user_email: String(user.email).toLowerCase(),
        course_id: courseId,
        amount_paid: paidAmount,
        payment_method: 'paypal',
        paypal_order_id: orderId,
      });

      if (upsertErr) {
        console.error('Error registrando compra verificada:', upsertErr);
        return res.status(500).json({ success: false, error: 'No se pudo registrar la compra verificada.' });
      }

      return res.json({ success: true, amountPaid: paidAmount });
    } catch (err: any) {
      console.error('Error en /api/payments/verify-paypal:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Error interno al verificar el pago con PayPal.',
      });
    }
  });

  // Server-side enrollment for strictly free courses (verifies price === 0 in DB)
  app.post('/api/purchases/free', async (req: Request, res: Response) => {
    try {
      const { user, token, error: authErr } = await authenticateSupabaseUser(req);
      if (!user || !token) {
        return res.status(401).json({ success: false, error: authErr || 'No autorizado.' });
      }

      const courseId = typeof req.body?.courseId === 'string' ? req.body.courseId.trim() : '';
      if (!courseId) {
        return res.status(400).json({ success: false, error: 'Se requiere un courseId válido.' });
      }

      const { client } = getSupabaseWriteClient(token);

      const { data: course, error: courseError } = await client
        .from('courses')
        .select('id, price, status')
        .eq('id', courseId)
        .maybeSingle();

      if (courseError || !course) {
        return res.status(404).json({ success: false, error: 'Curso no encontrado.' });
      }

      if (course.status === 'upcoming') {
        return res.status(400).json({ success: false, error: 'Este curso aún se encuentra en preparación.' });
      }

      if (Number(course.price) !== 0) {
        return res.status(403).json({ success: false, error: 'Este curso es de pago y requiere validación de PayPal.' });
      }

      const upsertErr = await upsertPurchaseRecord(client, {
        user_id: user.id,
        user_email: String(user.email).toLowerCase(),
        course_id: courseId,
        amount_paid: 0,
        payment_method: 'free',
      });

      if (upsertErr) {
        return res.status(500).json({ success: false, error: upsertErr.message });
      }

      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err?.message || 'Error interno al registrar inscripción gratuita.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
