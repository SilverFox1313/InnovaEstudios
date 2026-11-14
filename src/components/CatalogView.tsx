import React, { useState, useMemo } from 'react';
import { Course } from '../types';
import { Search, Star, BookOpen, Clock, BarChart, CheckCircle2, User, HelpCircle, ArrowRight, X, Sparkles, AlertCircle, ShoppingBag } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import CourseCard, { DEFAULT_COURSE_IMAGE } from './CourseCard';
import { normalizeImageUrl, handleImageLoadError } from '../utils/imageUrl';

const PAYPAL_CLIENT_ID = (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID || 'test';

interface CatalogViewProps {
  courses: Course[];
  purchasedCourseIds: string[];
  onVerifyPayPalPurchase: (courseId: string, orderId: string) => Promise<{ success: boolean; error?: string }>;
  onEnrollFreeCourse: (courseId: string) => Promise<{ success: boolean; error?: string }>;
  onViewCourse: (course: Course) => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export default function CatalogView({
  courses,
  purchasedCourseIds,
  onVerifyPayPalPurchase,
  onEnrollFreeCourse,
  onViewCourse,
  selectedCategory: externalCategory,
  onSelectCategory
}: CatalogViewProps) {
  const [internalCategory, setInternalCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [paypalError, setPaypalError] = useState('');
  const [paypalSuccessMessage, setPaypalSuccessMessage] = useState('');

  const currentCategory = externalCategory ?? internalCategory;
  const setCurrentCategory = onSelectCategory ?? setInternalCategory;

  // Extract unique categories dynamically from the loaded courses
  const dynamicCategories = useMemo(() => {
    const categorySet = new Set<string>();
    courses.forEach((course) => {
      const cat = course.category?.trim();
      if (cat) {
        if (cat.toLowerCase() !== 'todos' && cat.toLowerCase() !== 'mis cursos') {
          categorySet.add(cat);
        }
      }
    });
    return Array.from(categorySet).sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );
  }, [courses]);

  // Dynamic filter tabs: 'Todos', 'Mis Cursos', followed by real course categories
  const categoryTabs = useMemo(() => {
    return ['Todos', 'Mis Cursos', ...dynamicCategories];
  }, [dynamicCategories]);

  // Filter courses with resilient fallback
  const filteredCourses = courses.filter((course) => {
    const courseCat = course.category?.trim() || 'General';
    const matchesCategory =
      currentCategory.toLowerCase() === 'todos'
        ? true
        : currentCategory.toLowerCase() === 'mis cursos'
        ? purchasedCourseIds.includes(course.id)
        : courseCat.toLowerCase() === currentCategory.toLowerCase();

    const title = course.title || '';
    const description = course.description || '';
    const instructor = course.instructor || '';

    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenDetails = (course: Course) => {
    setSelectedCourse(course);
  };

  const handleStartPurchase = (e: React.MouseEvent, course: Course) => {
    e.stopPropagation();
    if (course.status === 'upcoming') {
      handleOpenDetails(course);
      return;
    }
    setSelectedCourse(course);
    setPaypalError('');
    setPaypalSuccessMessage('');
    setPurchaseModalOpen(true);
  };

  const handleFreeEnrollment = async () => {
    if (!selectedCourse || purchasing) return;
    setPurchasing(true);
    setPaypalError('');
    setPaypalSuccessMessage('');

    const result = await onEnrollFreeCourse(selectedCourse.id);
    if (!result.success) {
      setPurchasing(false);
      setPaypalError(result.error || 'No se pudo completar la inscripción gratuita.');
      return;
    }

    setPurchasing(false);
    setPaypalSuccessMessage('¡Inscripción exitosa! Redirigiendo a tu aula virtual...');
    const targetCourse = selectedCourse;
    setTimeout(() => {
      setPurchaseModalOpen(false);
      setPaypalSuccessMessage('');
      onViewCourse(targetCourse);
    }, 1000);
  };

  const handleVerifiedPayPalOrder = async (orderId: string) => {
    if (!selectedCourse || !orderId) {
      setPaypalError('No se recibió un identificador de orden válido de PayPal.');
      return;
    }

    setPurchasing(true);
    setPaypalError('');
    setPaypalSuccessMessage('Validando pago con PayPal en el servidor...');

    const result = await onVerifyPayPalPurchase(selectedCourse.id, orderId);
    if (!result.success) {
      setPurchasing(false);
      setPaypalSuccessMessage('');
      setPaypalError(result.error || 'No se pudo verificar el pago con el servidor.');
      return;
    }

    setPurchasing(false);
    setPaypalSuccessMessage('¡Pago verificado exitosamente! Redirigiendo a tu aula virtual...');
    const targetCourse = selectedCourse;
    setTimeout(() => {
      setPurchaseModalOpen(false);
      setPaypalSuccessMessage('');
      onViewCourse(targetCourse);
    }, 1200);
  };


  return (
    <div className="bg-slate-50 dark:bg-slate-800 min-h-screen py-8 pb-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner with vivid elegant gradient and clean, flat typography */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-[2rem] p-8 sm:p-10 md:p-14 text-white relative overflow-hidden shadow-2xl border border-indigo-500/20 mb-10">
          <div className="relative z-10 max-w-2xl">
            {/* Premium upper pill */}
            <div className="bg-white/10 backdrop-blur-md inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-indigo-200 mb-5 border border-indigo-400/20">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              <span>Plataforma de Aprendizaje Tecnológico</span>
            </div>
            
            {/* Crisp, sharp headline - 100% clean, flat, no shadows, filters or layered pseudo-elements */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
              Impulsa tu carrera con cursos interactivos
            </h1>

            {/* Commercial persuasion copywriting */}
            <p className="text-slate-200/90 text-sm sm:text-base leading-relaxed mb-8 max-w-xl">
              Adquiere competencias técnicas de vanguardia, aprende a tu propio ritmo con contenido estructurado y obtén certificaciones verificables.
            </p>
            
            {/* Value proposition badges */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
              {/* Badge 1: Acceso Inmediato y Vitalicio */}
              <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-md text-emerald-200 dark:text-emerald-200 px-4 py-2 rounded-full border border-emerald-400/40 transition-all hover:bg-slate-900/80 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400"></span>
                <span className="font-bold tracking-wide">Acceso Inmediato y Vitalicio</span>
              </div>
              
              {/* Badge 2: Contenido Teórico y Práctico */}
              <div className="flex items-center gap-2 bg-violet-950/60 backdrop-blur-md text-violet-200 px-4 py-2 rounded-full border border-violet-500/30 transition-all hover:bg-violet-900/60">
                <span className="w-2 h-2 rounded-full bg-violet-400"></span>
                <span>Contenido Teórico y Práctico</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and search area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8" id="filters-container">
          {/* Quick tabs categories */}
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {categoryTabs.map((cat) => (
              <button
                key={cat}
                id={`cat-tab-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => {
                  setCurrentCategory(cat);
                  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  currentCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                }`}
              >
                {cat === 'Mis Cursos' ? `Mis Cursos (${purchasedCourseIds.length})` : cat}
              </button>
            ))}
          </div>

          {/* Elastic Search Bar */}
          <div className="relative w-full md:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 dark:text-slate-300" />
            </div>
            <input
              id="catalog-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar curso, tema o profesor..."
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs transition-colors"
            />
          </div>
        </div>

        {/* Grid List */}
        {filteredCourses.length === 0 ? (
          <div className="bg-white dark:bg-slate-700/80 rounded-2xl py-14 px-6 text-center border border-slate-150 dark:border-slate-600 max-w-md mx-auto transition-colors" id="no-results-alert">
            <AlertCircle className="h-10 w-10 text-slate-400 dark:text-slate-300 mx-auto mb-3" />
            <p className="text-slate-800 dark:text-slate-100 font-bold text-lg">
              {currentCategory === 'Mis Cursos' ? 'Aún no tienes cursos inscritos' : 'No encontramos resultados'}
            </p>
            <p className="text-slate-500 dark:text-slate-300 text-xs mt-1">
              {currentCategory === 'Mis Cursos' 
                ? 'Explora los cursos disponibles en el catálogo para comenzar tu formación.'
                : 'Prueba a escribir de forma diferente o selecciona otra categoría en las pestañas.'}
            </p>
            <button
              onClick={() => { setSearchQuery(''); setCurrentCategory('Todos'); }}
              className="mt-4 text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 focus:outline-none cursor-pointer"
            >
              {currentCategory === 'Mis Cursos' ? 'Ver catálogo completo' : 'Restablecer filtros'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="courses-catalog-grid">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                isOwned={purchasedCourseIds.includes(course.id)}
                onViewCourse={onViewCourse}
                onOpenDetails={handleOpenDetails}
                onStartPurchase={handleStartPurchase}
              />
            ))}
          </div>
        )}

        {/* Detailed Modal of selected Course */}
        {selectedCourse && !purchaseModalOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs z-50 flex justify-center items-center p-4 sm:p-6 overflow-y-auto cursor-pointer" 
            id="course-details-modal"
            onClick={() => setSelectedCourse(null)}
          >
            <div 
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white transition-colors cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header block picture with fallback gradient & icon */}
              <div className="relative h-52 sm:h-60 bg-gradient-to-br from-indigo-900/40 to-slate-900/80 overflow-hidden text-white">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-400/40 select-none z-0">
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                    <BookOpen className="w-10 h-10 text-indigo-400" />
                  </div>
                  <span className="text-[11px] font-bold tracking-wider uppercase mt-2 text-indigo-300/60">
                    {selectedCourse.category || 'InnovaEstudios'}
                  </span>
                </div>
                <img
                  key={selectedCourse.id}
                  src={normalizeImageUrl(selectedCourse.imageUrl, DEFAULT_COURSE_IMAGE)}
                  alt={selectedCourse.title}
                  onError={(e) => handleImageLoadError(e, DEFAULT_COURSE_IMAGE)}
                  className="w-full h-full object-cover opacity-60 relative z-1"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  id="close-modal-btn"
                  aria-label="Cerrar detalles del curso"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCourse(null);
                  }}
                  className="absolute top-4 right-4 z-50 bg-black/55 hover:bg-black/80 p-2 rounded-full text-white transition-all border border-white/15 cursor-pointer shadow-md"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 sm:bottom-6 left-6 sm:left-8 pr-6 sm:pr-8">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-600 px-3 py-0.5 rounded text-[11px] uppercase font-bold tracking-wider">
                      {selectedCourse.category || 'General'}
                    </span>
                    {selectedCourse.status === 'upcoming' && (
                      <span className="bg-amber-500/15 backdrop-blur-md text-amber-300 px-3 py-1 rounded-xl text-[11px] font-medium tracking-wide flex items-center gap-1.5 border border-amber-400/30">
                        <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Próximamente</span>
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 text-white leading-tight">
                    {selectedCourse.title}
                  </h2>
                </div>
              </div>

              {/* Modal body info details */}
              <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-3">Sobre el curso</h4>
                  <p className="text-slate-700 dark:text-slate-200 text-sm sm:text-base leading-relaxed mt-2 font-normal">
                    {selectedCourse.longDescription}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3.5">
                  <div className="flex justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                    <span>Profesor principal:</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-bold flex items-center gap-1.5">
                      <User className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                      {selectedCourse.instructor}
                    </strong>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                    <span>Nivel técnico:</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-bold">{selectedCourse.level || 'Intermedio'}</strong>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                    <span>Duración estimada:</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-bold">
                      {selectedCourse.duration && selectedCourse.duration !== '0 horas' 
                        ? selectedCourse.duration 
                        : (selectedCourse.lessons?.length ? `${Math.max(1, Math.round(selectedCourse.lessons.length * 0.75))} horas` : '12 horas')}
                    </strong>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                    <span>Calificación de los alumnos:</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-bold flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      {(typeof selectedCourse.rating === 'number' && !isNaN(selectedCourse.rating) && selectedCourse.rating > 0 ? selectedCourse.rating : 4.9).toFixed(1)} / 5.0
                    </strong>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-semibold pt-3 border-t border-slate-200 dark:border-slate-700">
                    <span>Precio total:</span>
                    <span className="text-slate-900 dark:text-white font-extrabold text-sm sm:text-base">
                      {selectedCourse.status === 'upcoming' ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">Por anunciar</span>
                      ) : selectedCourse.price === 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">Completamente Gratis</span>
                      ) : (
                        `${selectedCourse.price} USD`
                      )}
                    </span>
                  </div>
                </div>

                {selectedCourse.status === 'upcoming' && (
                  <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 border-l-4 border-l-amber-500 dark:border-l-amber-400 text-amber-900 dark:text-amber-200 shadow-sm">
                    <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 flex-shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-sm sm:text-base text-amber-950 dark:text-amber-100">
                        Curso en Preparación
                      </p>
                      <p className="text-sm leading-relaxed opacity-90">
                        El temario y los recursos están en proceso de estructuración. El botón de inscripción y pago se activará automáticamente tan pronto como el curso se publique de manera oficial.
                      </p>
                    </div>
                  </div>
                )}

                {/* Learn skills list */}
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-3">Habilidades que obtendrás</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedCourse.skillsLearned.map((skill, index) => (
                      <div key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium">
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lessons overview preview */}
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-3">Temario ({selectedCourse.lessons.length} Clases)</h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedCourse.lessons.map((lesson, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs sm:text-sm p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-all rounded-xl">
                        <span className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[80%]">{lesson.title}</span>
                        <span className="text-slate-500 dark:text-slate-300 font-mono flex-shrink-0 text-xs font-semibold">{lesson.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA actions */}
                <div className="pt-5 border-t border-slate-200 dark:border-slate-800 flex gap-3 sm:gap-4">
                  <button
                    id="back-list-btn"
                    onClick={() => setSelectedCourse(null)}
                    className="flex-1 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm py-3 rounded-xl transition-all cursor-pointer"
                  >
                    Volver a la Galería
                  </button>

                  {selectedCourse.status === 'upcoming' ? (
                    <div className="flex-1 bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 font-medium text-xs sm:text-sm py-3 px-4 rounded-xl border border-amber-500/20 dark:border-amber-400/20 text-center flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>Disponible muy pronto</span>
                    </div>
                  ) : purchasedCourseIds.includes(selectedCourse.id) ? (
                    <button
                      id="enter-lessons-modal-btn"
                      onClick={() => {
                        const target = selectedCourse;
                        setSelectedCourse(null);
                        onViewCourse(target);
                      }}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm py-3 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 shadow-md shadow-indigo-150 cursor-pointer"
                    >
                      <span>Entrar al aula de clase</span>
                      <ArrowRight className="w-4.5 h-4.5" />
                    </button>
                  ) : (
                    <button
                      id="acquire-modal-btn"
                      onClick={() => setPurchaseModalOpen(true)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm py-3 rounded-xl transition-all text-center shadow-md shadow-indigo-150 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-4.5 h-4.5" />
                      <span>{selectedCourse.price === 0 ? 'Adquirir Gratis' : 'Comprar ahora'}</span>
                    </button>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Dynamic Simulated Purchase Checkout Step */}
        {purchaseModalOpen && selectedCourse && (
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs z-50 flex justify-center items-center p-4" id="checkout-sim-modal">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-150 dark:border-slate-800 text-center text-slate-900 dark:text-white transition-colors">
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-900">
                <ShoppingBag className="w-6 h-6" />
              </div>
              
              <h3 className="text-md font-extrabold text-slate-900 dark:text-white">
                {selectedCourse.price === 0 ? 'Confirmar inscripción gratuita' : 'Checkout seguro con PayPal'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {selectedCourse.price === 0
                  ? 'Acceso completo al contenido de este curso sin costo.'
                  : 'El pago se valida directamente en el servidor antes de habilitar tu acceso.'}
              </p>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-700 my-4 text-left">
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">Concepto</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{selectedCourse.title}</p>
                <p className="text-slate-700 dark:text-slate-300 text-xs mt-0.5 font-semibold">Instructor: {selectedCourse.instructor}</p>
                <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-slate-600 dark:text-slate-400">Importe total:</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {selectedCourse.price === 0 ? '0.00 USD (Gratis)' : `${selectedCourse.price} USD`}
                  </span>
                </div>
              </div>

              {paypalError && (
                <div id="paypal-error-alert" className="bg-rose-50 dark:bg-rose-950/40 text-rose-650 dark:text-rose-300 p-2.5 rounded-lg text-xs border border-rose-100 dark:border-rose-900 flex items-center gap-2 mb-4 text-left">
                  <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                  <span>{paypalError}</span>
                </div>
              )}

              {paypalSuccessMessage && (
                <div id="paypal-success-alert" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 p-2.5 rounded-lg text-xs border border-emerald-100 dark:border-emerald-900 flex items-center gap-2 mb-4 text-left animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>{paypalSuccessMessage}</span>
                </div>
              )}

              <div className="space-y-2.5">
                {selectedCourse.price === 0 ? (
                  <button
                    id="register-free-course-btn"
                    disabled={purchasing}
                    onClick={handleFreeEnrollment}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    {purchasing ? 'Registrando inscripción...' : 'Inscribirse gratis ahora'}
                  </button>
                ) : (
                  <div className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 paypal-dark-safe flex flex-col gap-3 w-full">
                    <PayPalScriptProvider options={{ "client-id": PAYPAL_CLIENT_ID, currency: "USD" }}>
                      <PayPalButtons
                        disabled={purchasing}
                        style={{ layout: "vertical", height: 40, shape: "rect" }}
                        createOrder={(_data, actions) => {
                          return actions.order.create({
                            intent: "CAPTURE",
                            purchase_units: [
                              {
                                custom_id: selectedCourse.id,
                                amount: {
                                  currency_code: "USD",
                                  value: selectedCourse.price.toFixed(2),
                                },
                                description: selectedCourse.title,
                              },
                            ],
                          });
                        }}
                        onApprove={async (data, actions) => {
                          if (!actions.order) {
                            setPaypalError('No se pudo capturar la orden de PayPal de forma segura.');
                            return;
                          }
                          try {
                            const details = await actions.order.capture();
                            const orderId = details?.id || data.orderID;
                            if (!orderId) {
                              setPaypalError('PayPal no devolvió un identificador de orden válido.');
                              return;
                            }
                            await handleVerifiedPayPalOrder(orderId);
                          } catch (err: any) {
                            console.error('Error al capturar orden de PayPal:', err);
                            setPaypalError(err?.message || 'Error al capturar el pago en PayPal.');
                          }
                        }}
                        onError={(err) => {
                          console.error("PayPal Option error:", err);
                          setPaypalError("No se pudo procesar el pago con PayPal. Verifica la configuración o intenta más tarde.");
                        }}
                      />
                    </PayPalScriptProvider>
                  </div>
                )}

                <button
                  id="cancel-payment-btn"
                  disabled={purchasing}
                  onClick={() => setPurchaseModalOpen(false)}
                  className="w-full py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-650 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-60"
                >
                  Cancelar y volver
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
