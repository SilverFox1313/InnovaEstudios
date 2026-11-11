import React, { useState, useRef, useEffect } from 'react';
import { 
  LogOut, 
  BookOpen, 
  User, 
  GraduationCap, 
  Award, 
  Sparkles, 
  ChevronDown, 
  Menu, 
  X, 
  Compass, 
  ShieldCheck, 
  BookMarked, 
  CheckCircle2, 
  Shield, 
  Mail,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabaseClient';

interface NavbarProps {
  userEmail: string;
  userName: string;
  purchasedCount: number;
  completedLessonsCount: number;
  currentView?: 'catalog' | 'viewer' | 'admin';
  onLogout: () => void;
  onGoHome: () => void;
  onGoToLearning?: () => void;
  onGoToAdmin?: () => void;
  showAdminBtn?: boolean;
}

export default function Navbar({
  userEmail,
  userName,
  purchasedCount,
  completedLessonsCount,
  currentView = 'catalog',
  onLogout,
  onGoHome,
  onGoToLearning,
  onGoToAdmin,
  showAdminBtn = false
}: NavbarProps) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [memberSince, setMemberSince] = useState<string>('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load real user registration date from Supabase Auth
  useEffect(() => {
    let isMounted = true;
    async function fetchUserRegistrationDate() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.created_at && isMounted) {
          const date = new Date(user.created_at);
          const formatted = date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
          setMemberSince(formatted);
          return;
        }
      } catch (err) {
        console.warn('Error obteniendo fecha de creación del usuario:', err);
      }

      if (isMounted) {
        const now = new Date();
        const fallback = now.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        setMemberSince(fallback);
      }
    }

    fetchUserRegistrationDate();
    return () => {
      isMounted = false;
    };
  }, [userEmail]);

  // Generate initials for the avatar
  const initials = userName 
    ? userName.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : userEmail ? userEmail.substring(0, 2).toUpperCase() : 'US';

  // Handle outside click to close profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfileDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleOpenProfileModal = () => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    setShowProfileModal(true);
  };

  const handleNavClick = (action?: () => void) => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    if (action) action();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-100 shadow-xs" id="main-navigation-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* ================= 1. LEFT BRANDING (ONLY LOGO + INNOVAESTUDIOS TEXT) ================= */}
            <div 
              onClick={() => handleNavClick(onGoHome)}
              className="flex items-center gap-2.5 cursor-pointer group select-none flex-shrink-0"
              id="navbar-brand-logo-btn"
              title="Ir al inicio de InnovaEstudios"
            >
              <div className="bg-indigo-600 text-white p-2 rounded-xl transition-all duration-200 group-hover:scale-105 shadow-sm shadow-indigo-150">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <span className="text-base font-extrabold text-slate-900 tracking-tight block group-hover:text-indigo-600 transition-colors">
                  InnovaEstudios
                </span>
                <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">
                  Aula Digital
                </span>
              </div>
            </div>

            {/* ================= 2. CENTER NAVIGATION & STAT BADGES (DESKTOP) ================= */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Navigation links */}
              <nav className="flex items-center gap-1 bg-slate-50/80 p-1 rounded-xl border border-slate-150 text-xs">
                <button
                  id="nav-link-catalog"
                  onClick={() => handleNavClick(onGoHome)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    currentView === 'catalog'
                      ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Catálogo</span>
                </button>

                <button
                  id="nav-link-learning"
                  onClick={() => handleNavClick(onGoToLearning || onGoHome)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    currentView === 'viewer'
                      ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Mi Aprendizaje</span>
                </button>

                {showAdminBtn && onGoToAdmin && (
                  <button
                    id="nav-link-admin"
                    onClick={() => handleNavClick(onGoToAdmin)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      currentView === 'admin'
                        ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                        : 'text-indigo-700 hover:bg-indigo-50/80 font-bold'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Panel Admin</span>
                  </button>
                )}
              </nav>

              <div className="h-4 w-px bg-slate-200 mx-1" />

              {/* Informative Stats Badges: Subtle and rounded */}
              <div className="flex items-center gap-2">
                <div 
                  className="rounded-full px-3.5 py-1 text-xs bg-slate-50/90 border border-slate-200/90 font-medium text-slate-700 flex items-center gap-1.5 shadow-2xs"
                  title={`${purchasedCount} cursos adquiridos`}
                >
                  <BookMarked className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Mis Cursos: <strong className="font-bold text-slate-900">{purchasedCount}</strong></span>
                </div>

                <div 
                  className="rounded-full px-3.5 py-1 text-xs bg-slate-50/90 border border-slate-200/90 font-medium text-slate-700 flex items-center gap-1.5 shadow-2xs"
                  title={`${completedLessonsCount} clases completadas`}
                >
                  <Award className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Clases Hechas: <strong className="font-bold text-slate-900">{completedLessonsCount}</strong></span>
                </div>
              </div>
            </div>

            {/* ================= 3. RIGHT USER PROFILE DROPDOWN & MOBILE TOGGLE ================= */}
            <div className="flex items-center gap-2">
              
              {/* Profile Dropdown Container (Desktop & Tablet) */}
              <div className="relative" ref={dropdownRef}>
                <button
                  id="user-profile-dropdown-btn"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  aria-expanded={profileDropdownOpen}
                  className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-full hover:bg-slate-100/80 border border-transparent hover:border-slate-200 transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
                    {initials}
                  </div>
                  <div className="text-left leading-tight hidden md:block">
                    <p className="text-xs font-bold text-slate-900 max-w-[120px] truncate">{userName || 'Estudiante'}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{showAdminBtn ? 'Administrador' : 'Estudiante'}</p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-150 p-2 z-50 overflow-hidden"
                      id="profile-dropdown-menu"
                    >
                      {/* Dropdown Header with User Info */}
                      <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 mb-1.5">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate">{userName || 'Estudiante'}</p>
                            <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 text-[10px]">
                          <span className={`px-2 py-0.5 rounded-full font-bold ${
                            showAdminBtn 
                              ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {showAdminBtn ? 'Rol: Administrador' : 'Rol: Estudiante'}
                          </span>
                          <span className="text-slate-400 font-medium">Activo</span>
                        </div>
                      </div>

                      {/* Dropdown Options List */}
                      <div className="space-y-0.5">
                        <button
                          id="dropdown-view-profile-btn"
                          onClick={handleOpenProfileModal}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition-colors text-left cursor-pointer"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>Ver Perfil</span>
                        </button>

                        <button
                          onClick={() => handleNavClick(onGoToLearning || onGoHome)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition-colors text-left cursor-pointer"
                        >
                          <BookOpen className="w-4 h-4 text-slate-400" />
                          <span>Mi Aprendizaje ({purchasedCount})</span>
                        </button>

                        {showAdminBtn && onGoToAdmin && (
                          <button
                            id="dropdown-admin-btn"
                            onClick={() => handleNavClick(onGoToAdmin)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors text-left cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4 text-indigo-600" />
                            <span>Consola de Administración 🛠️</span>
                          </button>
                        )}

                        <div className="h-px bg-slate-100 my-1" />

                        <button
                          id="dropdown-logout-btn"
                          onClick={() => handleNavClick(onLogout)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Hamburger Toggle Button (Mobile) */}
              <button
                id="navbar-mobile-toggle-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Abrir menú"
                className="lg:hidden p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

            </div>

          </div>
        </div>

        {/* ================= 4. MOBILE SLIDE-DOWN SHEET ================= */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden border-t border-slate-150 bg-white/95 backdrop-blur-md overflow-hidden"
              id="navbar-mobile-menu"
            >
              <div className="px-4 py-4 space-y-3.5">
                
                {/* Mobile User Summary Card */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{userName || 'Estudiante'}</p>
                      <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    showAdminBtn 
                      ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {showAdminBtn ? 'Admin' : 'Alumno'}
                  </span>
                </div>

                {/* Mobile Stats Indicators: Collapsed nicely */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl px-3 py-2 text-xs bg-slate-50 border border-slate-150 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-600 text-[11px] font-medium">
                      <BookMarked className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Mis Cursos</span>
                    </div>
                    <strong className="font-extrabold text-slate-900 text-xs">{purchasedCount}</strong>
                  </div>

                  <div className="rounded-xl px-3 py-2 text-xs bg-slate-50 border border-slate-150 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-600 text-[11px] font-medium">
                      <Award className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Clases</span>
                    </div>
                    <strong className="font-extrabold text-slate-900 text-xs">{completedLessonsCount}</strong>
                  </div>
                </div>

                {/* Mobile Navigation Links */}
                <div className="space-y-1 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => handleNavClick(onGoHome)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left"
                  >
                    <Compass className="w-4 h-4 text-indigo-500" />
                    <span>Catálogo de Cursos</span>
                  </button>

                  <button
                    onClick={() => handleNavClick(onGoToLearning || onGoHome)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left"
                  >
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    <span>Mi Aprendizaje</span>
                  </button>

                  {showAdminBtn && onGoToAdmin && (
                    <button
                      onClick={() => handleNavClick(onGoToAdmin)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 transition-colors text-left"
                    >
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Consola de Administración 🛠️</span>
                    </button>
                  )}

                  <button
                    onClick={handleOpenProfileModal}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors text-left"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Ver Mi Perfil</span>
                  </button>
                </div>

                {/* Mobile Logout */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleNavClick(onLogout)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ================= 5. USER PROFILE MODAL ================= */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-center items-center p-4 overflow-y-auto" id="user-profile-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-150 space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-150">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Perfil del Alumno</span>
                </h3>
                <button
                  id="close-profile-modal-btn"
                  onClick={() => setShowProfileModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Avatar + Main info */}
              <div className="flex items-center gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-indigo-150 flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-slate-900 text-sm truncate">{userName || 'Estudiante'}</h4>
                  <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{userEmail}</span>
                  </p>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-2 ${
                    showAdminBtn 
                      ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                  }`}>
                    <Shield className="w-3 h-3" />
                    <span>{showAdminBtn ? 'Administrador Maestro' : 'Estudiante Verificado'}</span>
                  </span>
                </div>
              </div>

              {/* Learning Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100 text-center">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-1.5">
                    <BookMarked className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-black text-indigo-950">{purchasedCount}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Cursos en progreso</p>
                </div>

                <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100 text-center">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-1.5">
                    <Award className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-black text-emerald-950">{completedLessonsCount}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Clases completadas</p>
                </div>
              </div>

              {/* Información Útil del Alumno */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                    <span>Fecha de Registro</span>
                  </span>
                  <span className="font-semibold text-slate-800">
                    {memberSince || 'Cargando fecha...'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pt-2.5 border-t border-slate-200/60">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>Estado de la Cuenta</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Cuenta Activa</span>
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pt-2.5 border-t border-slate-200/60">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <Shield className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                    <span>Tipo de Membresía</span>
                  </span>
                  <span className="font-semibold text-slate-800">
                    {showAdminBtn ? 'Acceso de Administrador' : 'Acceso Vitalicio a Cursos'}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2.5 pt-1">
                {showAdminBtn && onGoToAdmin && (
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      onGoToAdmin();
                    }}
                    className="flex-1 py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Ir a Consola Admin</span>
                  </button>
                )}
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
