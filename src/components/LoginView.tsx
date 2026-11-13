import React, { useState } from 'react';
import { Mail, Lock, User, GraduationCap, ShieldCheck, Sparkles, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { signIn, signUp, signInWithGoogle } from '../services/auth';
import { supabase } from '../supabaseClient';

interface LoginViewProps {
  onLoginSuccess: (email: string, name: string, token: string) => void;
}

function mapFriendlyAuthError(rawMsg: string): string {
  const lower = rawMsg.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Credenciales incorrectas. Verifica que tu correo y contraseña sean correctos.';
  }
  if (lower.includes('already registered') || lower.includes('already exists') || lower.includes('user already exists')) {
    return 'El correo ya está registrado. Por favor, inicia sesión o recupera tu contraseña.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Tu correo no ha sido confirmado aún. Por favor revisa tu bandeja de entrada o carpeta de spam.';
  }
  if (lower.includes('password should be at least') || lower.includes('at least 6 characters')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (lower.includes('oauth') || lower.includes('provider') || lower.includes('popup') || lower.includes('google')) {
    return 'No se pudo completar el acceso con Google. Verifica tu conexión o intenta con correo y contraseña.';
  }
  return rawMsg;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (loading || googleLoading) return;
    setError('');
    setSuccessMessage('');
    setGoogleLoading(true);

    try {
      const result = await signInWithGoogle();
      if (!result.success && result.error) {
        setError(mapFriendlyAuthError(result.error));
        setGoogleLoading(false);
      }
      // If success, Supabase initiates browser redirect to Google OAuth
    } catch (err: any) {
      console.error('Error al conectar con Google:', err);
      setError(mapFriendlyAuthError(err?.message || 'Error inesperado al conectar con Google.'));
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setSuccessMessage('');

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError('Por favor, introduce tu correo electrónico.');
      return;
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (!isLogin && !name.trim()) {
      setError('Por favor, dinos tu nombre para personalizar tu perfil.');
      return;
    }
    if (!isLogin && cleanPassword !== confirmPassword.trim()) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const result = isLogin 
        ? await signIn(cleanEmail, cleanPassword)
        : await signUp(cleanEmail, cleanPassword, name);
        
      if (result.requiresEmailConfirmation) {
        setSuccessMessage('Cuenta creada correctamente. Revisa tu correo electrónico para confirmar tu cuenta e iniciar sesión.');
        setIsLogin(true);
        setPassword('');
        setConfirmPassword('');
      } else if (result.success && result.user) {
        onLoginSuccess(result.user.email, result.user.name, result.user.token);
      } else {
        setError(mapFriendlyAuthError(result.error || 'Credenciales inválidas.'));
      }
    } catch (err: any) {
      console.error('Error durante autenticación:', err);
      setError(mapFriendlyAuthError(err?.message || 'Error inesperado durante la autenticación.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setSuccessMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Por favor, introduce tu correo electrónico.');
      return;
    }

    setLoading(true);
    try {
      const redirectURL = window.location.origin.includes('localhost')
        ? 'http://localhost:5173/reset-password'
        : `${window.location.origin}/reset-password`;

      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectURL,
      });

      if (recoveryError) {
        console.error('Error al recuperar contraseña:', recoveryError);
        setError(mapFriendlyAuthError(recoveryError.message || 'Error al intentar enviar el enlace de recuperación.'));
      } else {
        setSuccessMessage('Enlace enviado. Revisa tu bandeja de entrada.');
      }
    } catch (err: any) {
      console.error('Error al recuperar contraseña:', err);
      setError(mapFriendlyAuthError(err.message || 'Error inesperado durante la recuperación.'));
    } finally {
      setLoading(false);
    }
  };

  const toggleTab = (value: boolean) => {
    setError('');
    setSuccessMessage('');
    setIsLogin(value);
    setIsRecovery(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex flex-col justify-center py-12 px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2 mb-2">
          <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md shadow-indigo-100 dark:shadow-none">
            <GraduationCap className="h-6 w-6" id="logo-icon-login" />
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">EstudioInnova</span>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {isRecovery 
            ? 'Recuperar Contraseña' 
            : isLogin 
              ? 'Accede a tu aula virtual' 
              : 'Comienza tu aprendizaje'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          {isRecovery 
            ? 'Introduce tu dirección de correo electrónico para recibir un enlace de recuperación.'
            : isLogin 
              ? 'Explora cursos, adquiere habilidades y certifícate' 
              : 'Regístrate gratis y desbloquea los primeros cursos'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl rounded-2xl border border-slate-100 dark:border-slate-800 sm:px-10 transition-colors">
          
          {/* Tabs header selector - Hide if on password recovery mode */}
          {!isRecovery && (
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg mb-6">
              <button
                id="btn-tab-login"
                type="button"
                onClick={() => toggleTab(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
                  isLogin
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200'
                }`}
              >
                Iniciar sesión
              </button>
              <button
                id="btn-tab-register"
                type="button"
                onClick={() => toggleTab(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
                  !isLogin
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200'
                }`}
              >
                Regístrate
              </button>
            </div>
          )}

          {/* Quick Google OAuth Sign-In Button */}
          {!isRecovery && (
            <div className="mb-6">
              <button
                id="btn-google-auth"
                type="button"
                disabled={loading || googleLoading}
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-150 shadow-xs border bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-slate-500 dark:text-slate-400" />
                    <span>Conectando con Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>
                      {isLogin ? 'Acceder con Google' : 'Registrarse con Google'}
                    </span>
                  </>
                )}
              </button>

              <div className="relative mt-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-500 dark:text-slate-400 font-medium">
                    O continúa con tu correo
                  </span>
                </div>
              </div>
            </div>
          )}

          {isRecovery ? (
            <form className="space-y-5" onSubmit={handleRecoverySubmit} id="recovery-form" noValidate={false}>
              <div>
                <label htmlFor="recovery-email-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Correo Electrónico
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    id="recovery-email-input"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              {error && (
                <div 
                  role="alert" 
                  aria-live="polite" 
                  className="bg-rose-50 text-rose-700 text-xs p-3.5 rounded-xl flex items-start gap-2.5 border border-rose-200/80 shadow-xs animate-fadeIn" 
                  id="recovery-error"
                >
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <span className="font-semibold block mb-0.5">Atención</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {successMessage && (
                <div 
                  role="status" 
                  aria-live="polite" 
                  className="bg-emerald-50 text-emerald-800 text-xs p-3.5 rounded-xl flex items-start gap-2.5 border border-emerald-200 shadow-xs animate-fadeIn" 
                  id="recovery-success"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <span className="font-semibold block mb-0.5">Operación exitosa</span>
                    <span>{successMessage}</span>
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <button
                  id="submit-recovery-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-150 shadow-sm shadow-indigo-100 dark:shadow-none disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span>Enviando enlace...</span>
                    </>
                  ) : (
                    'Enviar enlace de recuperación'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRecovery(false);
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="w-full flex justify-center py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-150 cursor-pointer"
                >
                  Volver al Login
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit} id="login-form">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Nombre Completo
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      id="reg-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required={!isLogin}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Ana Belén"
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                    />
                  </div>
                </motion.div>
              )}

              <div>
                <label htmlFor="email-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Correo Electrónico
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    id="email-input"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Contraseña
                  </label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecovery(true);
                        setError('');
                        setSuccessMessage('');
                      }}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    id="password-input"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password (only on Sign Up mode) */}
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label htmlFor="confirm-password-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Confirmar Contraseña
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      id="confirm-password-input"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required={!isLogin}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Ocultar confirmación de contraseña' : 'Ver confirmación de contraseña'}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {successMessage && (
                <div 
                  role="status" 
                  aria-live="polite" 
                  className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs p-3.5 rounded-xl flex items-start gap-2.5 border border-emerald-200 dark:border-emerald-800/60 shadow-xs animate-fadeIn"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <span className="font-semibold block mb-0.5">Cuenta registrada</span>
                    <span>{successMessage}</span>
                  </div>
                </div>
              )}

              {error && (
                <div 
                  role="alert" 
                  aria-live="polite" 
                  className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs p-3.5 rounded-xl flex items-start gap-2.5 border border-rose-200/80 dark:border-rose-800/60 shadow-xs animate-fadeIn" 
                  id="login-error"
                >
                  <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <span className="font-semibold block mb-0.5">Atención</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <div>
                <button
                  id="submit-auth-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-150 shadow-sm shadow-indigo-100 dark:shadow-none disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span>{isLogin ? 'Validando sesión...' : 'Registrando cuenta...'}</span>
                    </>
                  ) : isLogin ? (
                    'Ingresar al Aula'
                  ) : (
                    'Registrar Cuenta'
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
