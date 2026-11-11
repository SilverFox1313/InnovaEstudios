import React, { useState } from 'react';
import { 
  GraduationCap, 
  Compass, 
  BookMarked, 
  LifeBuoy, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  X,
  Mail,
  Lock,
  ArrowRight
} from 'lucide-react';

interface FooterProps {
  onGoToCatalog?: () => void;
  onGoToLearning?: () => void;
  onGoToAdmin?: () => void;
}

export default function Footer({
  onGoToCatalog,
  onGoToLearning,
  onGoToAdmin
}: FooterProps) {
  // Modal state for Support, Legal, and Privacy
  const [modalType, setModalType] = useState<'support' | 'legal' | 'privacy' | null>(null);

  return (
    <>
      <footer 
        className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 relative overflow-hidden transition-colors duration-200" 
        id="global-courses-footer"
      >
        {/* Subtle background ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-indigo-500/5 dark:bg-indigo-600/10 blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8 relative z-10">
          
          {/* Main 3-Column SaaS Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-12 text-center md:text-left">
            
            {/* Column 1: Brand & Commercial Description */}
            <div className="space-y-4 flex flex-col items-center md:items-start">
              <div 
                onClick={onGoToCatalog}
                className="inline-flex items-center gap-2.5 cursor-pointer group select-none"
                title="Ir al inicio de InnovaEstudios"
              >
                <div className="bg-indigo-600 text-white p-2.5 rounded-xl transition-all duration-200 group-hover:scale-105 shadow-sm shadow-indigo-600/30">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div className="leading-tight text-left">
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    InnovaEstudios
                  </span>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider block">
                    Aula Digital
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm font-normal">
                Plataforma de aprendizaje tecnológico interactivo orientada a potenciar tus competencias profesionales con contenido de vanguardia y certificación verificable.
              </p>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-medium shadow-2xs">
                <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-300 flex-shrink-0" />
                <span>Formación técnica continua y certificada</span>
              </div>
            </div>

            {/* Column 2: Quick Links / Navigation */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Enlaces Rápidos
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <button
                    onClick={onGoToCatalog}
                    className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-2 cursor-pointer group font-medium hover:underline"
                  >
                    <Compass className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                    <span>Catálogo de Cursos</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={onGoToLearning}
                    className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-2 cursor-pointer group font-medium hover:underline"
                  >
                    <BookMarked className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                    <span>Mi Aprendizaje</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setModalType('support')}
                    className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-2 cursor-pointer group font-medium hover:underline"
                  >
                    <LifeBuoy className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                    <span>Soporte Técnico</span>
                  </button>
                </li>
                {onGoToAdmin && (
                  <li>
                    <button
                      onClick={onGoToAdmin}
                      className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-white transition-colors inline-flex items-center gap-2 cursor-pointer group font-semibold hover:underline"
                    >
                      <ShieldCheck className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                      <span>Consola de Administración</span>
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* Column 3: Legal & Live Platform Status */}
            <div className="space-y-4 flex flex-col items-center md:items-start">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Estatus & Legal
              </h3>
              
              {/* Status indicator badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                <span>Todos los sistemas operativos</span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Infraestructura en la nube con Supabase y pasarela segura integrada.
              </p>

              <ul className="space-y-2.5 text-sm">
                <li>
                  <button
                    onClick={() => setModalType('legal')}
                    className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-2 cursor-pointer font-medium hover:underline"
                  >
                    <FileText className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    <span>Aviso Legal</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setModalType('privacy')}
                    className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-2 cursor-pointer font-medium hover:underline"
                  >
                    <Lock className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    <span>Política de Privacidad</span>
                  </button>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Divider & Copyright */}
          <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-sm text-slate-500 dark:text-slate-400">
            <p className="font-normal">
              &copy; 2026 InnovaEstudios. Todos los derechos reservados.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                Seguridad SSL / TLS 256-bit
              </span>
              <span>•</span>
              <span>Educación Interactiva</span>
            </div>
          </div>

        </div>
      </footer>

      {/* ================= MODAL DE SOPORTE / LEGAL / PRIVACIDAD ================= */}
      {modalType && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setModalType(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative text-left transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                {modalType === 'support' && <LifeBuoy className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
                {modalType === 'legal' && <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
                {modalType === 'privacy' && <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">
                  {modalType === 'support' && 'Centro de Soporte Técnico'}
                  {modalType === 'legal' && 'Aviso Legal'}
                  {modalType === 'privacy' && 'Política de Privacidad'}
                </h3>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="text-sm sm:text-base text-slate-800 dark:text-slate-200 space-y-4 max-h-[60vh] overflow-y-auto pr-1 leading-relaxed font-normal">
              {modalType === 'support' && (
                <>
                  <p className="text-slate-800 dark:text-slate-200 font-normal">
                    En <strong className="font-bold text-slate-900 dark:text-white">InnovaEstudios</strong> estamos comprometidos con tu experiencia formativa. Si experimentas alguna dificultad con la reproducción de clases, el acceso a tus certificados o la adquisición de cursos, nuestro equipo de soporte está disponible para asistirte.
                  </p>
                  <div className="bg-indigo-50/90 dark:bg-indigo-950/50 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/60 space-y-2 text-indigo-950 dark:text-indigo-200 shadow-2xs">
                    <p className="font-extrabold text-indigo-950 dark:text-indigo-200 text-sm sm:text-base flex items-center gap-2">
                      <Mail className="w-4 h-4 text-indigo-700 dark:text-indigo-400 flex-shrink-0" />
                      Canal de Contacto Directo:
                    </p>
                    <p className="text-sm font-mono text-indigo-900 dark:text-indigo-300 font-bold bg-white/90 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700 inline-block shadow-2xs">
                      soporte@innovaestudios.edu
                    </p>
                    <p className="text-xs sm:text-sm text-indigo-900 dark:text-indigo-300 font-medium">
                      Tiempo estimado de respuesta: menos de 24 horas laborables.
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-400 font-medium">
                    Horario de atención: Lunes a Viernes de 09:00 a 18:00 (UTC).
                  </p>
                </>
              )}

              {modalType === 'legal' && (
                <>
                  <p className="text-slate-800 dark:text-slate-200">
                    El presente Aviso Legal regula el uso de los servicios de la plataforma educativa <strong className="font-bold text-slate-900 dark:text-white">InnovaEstudios</strong>.
                  </p>
                  <p className="text-slate-800 dark:text-slate-200">
                    <strong className="font-bold text-slate-900 dark:text-white">Propiedad Intelectual:</strong> Todos los contenidos formativos, materiales audiovisuales, guías interactivas, textos, logotipos y código fuente son propiedad exclusiva de InnovaEstudios o de sus respectivos instructores licenciantes, estando protegidos por las leyes internacionales de propiedad intelectual.
                  </p>
                  <p className="text-slate-800 dark:text-slate-200">
                    <strong className="font-bold text-slate-900 dark:text-white">Certificaciones:</strong> Las certificaciones emitidas por la plataforma acreditan la compleción satisfactoria de los planes de estudio correspondientes y pueden ser verificadas conforme a los estándares de la plataforma.
                  </p>
                </>
              )}

              {modalType === 'privacy' && (
                <>
                  <p className="text-slate-800 dark:text-slate-200">
                    En <strong className="font-bold text-slate-900 dark:text-white">InnovaEstudios</strong> valoramos y protegemos la privacidad de tus datos personales conforme a los más altos estándares de seguridad en la nube.
                  </p>
                  <p className="text-slate-800 dark:text-slate-200">
                    <strong className="font-bold text-slate-900 dark:text-white">Uso de la Información:</strong> Los datos de tu cuenta (correo electrónico, progreso de aprendizaje y registro de cursos adquiridos) se utilizan exclusivamente para gestionar tu acceso al aula digital y sincronizar tu avance académico en Supabase.
                  </p>
                  <p className="text-slate-800 dark:text-slate-200">
                    <strong className="font-bold text-slate-900 dark:text-white">Transacciones Seguras:</strong> Todos los pagos se procesan de forma cifrada mediante pasarelas externas seguras (PayPal). En ningún momento InnovaEstudios almacena números de tarjeta ni credenciales bancarias.
                  </p>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-5 flex justify-end">
              <button
                onClick={() => setModalType(null)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
