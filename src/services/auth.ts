import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'student';
  token: string;
}

interface AuthResult {
  success: boolean;
  user?: UserSession;
  requiresEmailConfirmation?: boolean;
  error?: string;
}

/**
 * Ensures the authenticated user has a profile row in public.profiles (role defaults to 'student').
 */
export async function ensureUserProfile(user: SupabaseUser | null | undefined): Promise<void> {
  if (!user?.id) return;

  try {
    const { data: existing, error: selectError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (selectError) {
      return;
    }

    if (!existing) {
      const displayName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.user_metadata?.display_name ||
        (user.email ? user.email.split('@')[0] : 'Estudiante');

      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email?.toLowerCase() || null,
        full_name: displayName,
        role: 'student',
      });
    }
  } catch {
    // Non-blocking if profiles table has not yet been provisioned
  }
}

/**
 * Resolves user role strictly from Supabase server-side data:
 * 1) JWT app_metadata.role (immutable from client)
 * 2) public.profiles.role protected by RLS
 */
export async function resolveUserRole(user: SupabaseUser | null | undefined): Promise<'admin' | 'student'> {
  if (!user?.id) return 'student';

  if (user.app_metadata?.role === 'admin') {
    return 'admin';
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!error && data?.role === 'admin') {
      return 'admin';
    }
  } catch {
    // Fail closed to student role
  }

  return 'student';
}

/**
 * Verifies against Supabase Auth + profiles table whether the current session belongs to an admin.
 */
export async function verifyAdminAccess(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) {
      return false;
    }
    const role = await resolveUserRole(session.user);
    return role === 'admin';
  } catch {
    return false;
  }
}

/**
 * Registers new students using real Supabase Auth signUp
 */
export async function signUp(email: string, password: string, name: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedPassword = password.trim();
  const cleanName = name.trim() || normalizedEmail.split('@')[0];

  try {
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: trimmedPassword,
      options: {
        data: {
          display_name: cleanName,
          full_name: cleanName,
        },
      },
    });

    if (error) {
      let errorMsg = error.message;
      if (errorMsg.toLowerCase().includes('already registered') || errorMsg.toLowerCase().includes('already exists')) {
        errorMsg = 'El correo ya está registrado. Por favor, inicia sesión.';
      } else if (errorMsg.toLowerCase().includes('at least 6 characters') || errorMsg.toLowerCase().includes('password should be')) {
        errorMsg = 'La contraseña debe tener al menos 6 caracteres.';
      }
      return {
        success: false,
        error: errorMsg,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'No se pudo crear el usuario.',
      };
    }

    if (!data.session) {
      return {
        success: true,
        requiresEmailConfirmation: true,
      };
    }

    await ensureUserProfile(data.user);
    const role = await resolveUserRole(data.user);
    const userDisplayName =
      data.user.user_metadata?.full_name ||
      data.user.user_metadata?.display_name ||
      cleanName;

    return {
      success: true,
      user: {
        id: data.user.id,
        email: normalizedEmail,
        name: userDisplayName,
        role,
        token: data.session.access_token,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Error inesperado durante el registro.',
    };
  }
}

/**
 * Authenticates users exclusively via Supabase Auth
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedPassword = password.trim();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: trimmedPassword,
    });

    if (error) {
      const msg = error.message;
      if (msg === 'Invalid login credentials' || msg.toLowerCase().includes('invalid')) {
        return { success: false, error: 'Credenciales inválidas. Comprueba tu correo y contraseña.' };
      }
      if (msg.toLowerCase().includes('email not confirmed')) {
        return { success: false, error: 'Correo pendiente de confirmación. Revisa tu bandeja de entrada.' };
      }
      return { success: false, error: msg };
    }

    if (!data.user || !data.session) {
      return {
        success: false,
        error: 'No se pudo iniciar una sesión válida.',
      };
    }

    await ensureUserProfile(data.user);
    const role = await resolveUserRole(data.user);
    const userDisplayName =
      data.user.user_metadata?.full_name ||
      data.user.user_metadata?.display_name ||
      normalizedEmail.split('@')[0];

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || normalizedEmail,
        name: userDisplayName,
        role,
        token: data.session.access_token,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Error inesperado al iniciar sesión.',
    };
  }
}

/**
 * Initiates Google OAuth authentication via Supabase
 */
export async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error inesperado al conectar con Google.' };
  }
}
