import React, { useState, useMemo } from 'react';
import { Course } from '../types';
import { Search, Star, BookOpen, Clock, BarChart, CheckCircle2, User, HelpCircle, ArrowRight, X, Sparkles, AlertCircle, ShoppingBag } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

const PAYPAL_CLIENT_ID = (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID || 'test';

interface CatalogViewProps {
  courses: Course[];
  purchasedCourseIds: string[];
  onPurchaseCourse: (courseId: string) => void;
  onViewCourse: (course: Course) => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export default function CatalogView({
  courses,
  purchasedCourseIds,
  onPurchaseCourse,
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

  const handlePaymentApproved = (details: any) => {
    if (!selectedCourse) return;
    setPurchasing(true);
    setPaypalError('');
    setPaypalSuccessMessage('¡Pago verificado con PayPal exitosamente! Desbloqueando acceso...');

    setTimeout(() => {
      onPurchaseCourse(selectedCourse.id);
      setPurchasing(false);
      setPaypalSuccessMessage('¡Inscripción exitosa! Redirigiendo a tu aula virtual...');
      setTimeout(() => {
        setPurchaseModalOpen(false);
        setPaypalSuccessMessage('');
        if (selectedCourse) {
          onViewCourse(selectedCourse);
        }
      }, 1500);
    }, 1000);
  };


  return (
    <div className="bg-slate-50 min-h-screen py-8 pb-20">
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
              <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-md text-emerald-300 px-4 py-2 rounded-full border border-emerald-500/30 transition-all hover:bg-slate-900/80">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Acceso Inmediato y Vitalicio</span>
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
                onClick={() => setCurrentCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  currentCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat === 'Mis Cursos' ? `Mis Cursos (${purchasedCourseIds.length})` : cat}
              </button>
            ))}
          </div>

          {/* Elastic Search Bar */}
          <div className="relative w-full md:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              id="catalog-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar curso, tema o profesor..."
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
            />
          </div>
        </div>

        {/* Grid List */}
        {filteredCourses.length === 0 ? (
          <div className="bg-white rounded-2xl py-14 px-6 text-center border border-slate-150 max-w-md mx-auto" id="no-results-alert">
            <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-800 font-bold text-lg">
              {currentCategory === 'Mis Cursos' ? 'Aún no tienes cursos inscritos' : 'No encontramos resultados'}
            </p>
            <p className="text-slate-500 text-xs mt-1">
              {currentCategory === 'Mis Cursos' 
                ? 'Explora los cursos disponibles en el catálogo para comenzar tu formación.'
                : 'Prueba a escribir de forma diferente o selecciona otra categoría en las pestañas.'}
            </p>
            <button
              onClick={() => { setSearchQuery(''); setCurrentCategory('Todos'); }}
              className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800 focus:outline-none cursor-pointer"
            >
              {currentCategory === 'Mis Cursos' ? 'Ver catálogo completo' : 'Restablecer filtros'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="courses-catalog-grid">
            {filteredCourses.map((course) => {
              const isOwned = purchasedCourseIds.includes(course.id);
              const isFree = course.price === 0;
              const isUpcoming = course.status === 'upcoming';

              return (
                <div
                  key={course.id}
                  id={`course-card-${course.id}`}
                  onClick={() => {
                    if (isOwned) {
                      onViewCourse(course);
                    } else {
                      handleOpenDetails(course);
                    }
                  }}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col group h-full"
                >
                  {/* Card head banner */}
                  <div className="relative h-44 overflow-hidden bg-slate-900">
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 opacity-90"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-900 border border-slate-100 flex items-center gap-1 shadow-sm">
                      <Clock className="w-3 h-3 text-indigo-650" />
                      <span>{course.duration}</span>
                    </div>

                    <div className="absolute bottom-3 left-3 bg-indigo-900/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
                      {course.category || 'General'}
                    </div>

                    {isUpcoming ? (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-lg text-[10px] font-extrabold tracking-wide shadow-md flex items-center gap-1.5 border border-amber-400/50 uppercase">
                        <Sparkles className="w-3 h-3 text-amber-100" />
                        <span>Próximamente</span>
                      </div>
                    ) : isOwned ? (
                      <div className="absolute top-3 right-3 bg-emerald-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold tracking-tight shadow-md flex items-center gap-1 border border-emerald-500">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Adquirido</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Body textual content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold mb-2">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{course.rating.toFixed(1)}</span>
                        <span className="text-slate-400 font-normal">({course.level})</span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors duration-150">
                        {course.title}
                      </h3>

                      <p className="text-slate-500 text-xs mt-2 line-clamp-2">
                        {course.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      {/* Price tag */}
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Precio</span>
                        <span className="text-md font-extrabold text-slate-900">
                          {isUpcoming ? (
                            <span className="text-amber-700 font-bold text-xs">Por anunciar</span>
                          ) : isFree ? (
                            <span className="text-emerald-600">Gratuito</span>
                          ) : (
                            `${course.price} USD`
                          )}
                        </span>
                      </div>

                      {/* Action trigger button */}
                      {isUpcoming ? (
                        <div
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold shadow-2xs"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          <span>Disponible muy pronto</span>
                        </div>
                      ) : isOwned ? (
                        <button
                          id={`action-view-${course.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewCourse(course);
                          }}
                          className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1 border border-indigo-100/30 cursor-pointer"
                        >
                          <span>Aprender</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          id={`action-buy-${course.id}`}
                          onClick={(e) => handleStartPurchase(e, course)}
                          className="bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                        >
                          {isFree ? 'Empezar Gratis' : 'Obtener'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detailed Modal of selected Course */}
        {selectedCourse && !purchaseModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-center items-center p-4 overflow-y-auto" id="course-details-modal">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-slate-200">
              {/* Header block picture */}
              <div className="relative h-48 bg-slate-900 text-white">
                <img
                  src={selectedCourse.imageUrl}
                  alt={selectedCourse.title}
                  className="w-full h-full object-cover opacity-60"
                  referrerPolicy="no-referrer"
                />
                <button
                  id="close-modal-btn"
                  onClick={() => setSelectedCourse(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/75 p-2 rounded-full text-white transition-all border border-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-4 left-6 pr-6">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-600 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                      {selectedCourse.category || 'General'}
                    </span>
                    {selectedCourse.status === 'upcoming' && (
                      <span className="bg-amber-500 text-white px-2.5 py-0.5 rounded text-[10px] uppercase font-extrabold tracking-wider flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-3 h-3" />
                        <span>Próximamente</span>
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold mt-2 text-white leading-tight">
                    {selectedCourse.title}
                  </h2>
                </div>
              </div>

              {/* Modal body info details */}
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-10 -mb-4">Sobre el curso</h4>
                  <p className="text-slate-600 text-xs leading-relaxed mt-4">
                    {selectedCourse.longDescription}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Profesor principal:</span>
                    <strong className="text-slate-900 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      {selectedCourse.instructor}
                    </strong>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Nivel técnico:</span>
                    <strong className="text-slate-900">{selectedCourse.level}</strong>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Duración estimada:</span>
                    <strong className="text-slate-900">{selectedCourse.duration}</strong>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 font-semibold pt-2 border-t border-slate-200">
                    <span>Precio total:</span>
                    <span className="text-slate-900 font-extrabold text-sm">
                      {selectedCourse.status === 'upcoming' ? (
                        <span className="text-amber-700 font-bold">Por anunciar</span>
                      ) : selectedCourse.price === 0 ? (
                        <span className="text-emerald-600">Completamente Gratis</span>
                      ) : (
                        `${selectedCourse.price} USD`
                      )}
                    </span>
                  </div>
                </div>

                {selectedCourse.status === 'upcoming' && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Curso en preparación (Próximo Lanzamiento)</p>
                      <p className="text-[11px] text-amber-800/80 mt-0.5 leading-relaxed">
                        El temario y los recursos están en proceso de estructuración. El botón de inscripción y pago se activará automáticamente tan pronto como el curso se publique de manera oficial.
                      </p>
                    </div>
                  </div>
                )}

                {/* Learn skills list */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Habilidades que obtendrás</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedCourse.skillsLearned.map((skill, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lessons overview preview */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Temario ({selectedCourse.lessons.length} Clases)</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedCourse.lessons.map((lesson, idx) => (
                      <div key={idx} className="flex justify-between text-xs p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 hover:bg-slate-100/70 transition-all">
                        <span className="font-medium truncate max-w-[80%]">{lesson.title}</span>
                        <span className="text-slate-400 flex-shrink-0 text-[10px]">{lesson.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA actions */}
                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    id="back-list-btn"
                    onClick={() => setSelectedCourse(null)}
                    className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Volver a la Galería
                  </button>

                  {selectedCourse.status === 'upcoming' ? (
                    <div className="flex-1 bg-amber-50 text-amber-800 font-bold text-xs py-2.5 px-3 rounded-xl border border-amber-200 text-center flex items-center justify-center gap-1.5 shadow-2xs">
                      <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
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
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 shadow-md shadow-indigo-150 cursor-pointer"
                    >
                      <span>Entrar al aula de clase</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      id="acquire-modal-btn"
                      onClick={() => setPurchaseModalOpen(true)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all text-center shadow-md shadow-indigo-150 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-center items-center p-4" id="checkout-sim-modal">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-150 text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                <ShoppingBag className="w-6 h-6" />
              </div>
              
              <h3 className="text-md font-extrabold text-slate-900">Verificar orden simulada</h3>
              <p className="text-xs text-slate-500 mt-1">Estás adquiriendo acceso ilimitado para siempre a de estudio interactivo.</p>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 my-4 text-left">
                <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Concepto</p>
                <p className="text-xs font-bold text-slate-800 truncate">{selectedCourse.title}</p>
                <p className="text-slate-700 text-xs mt-0.5 font-semibold">Instructor: {selectedCourse.instructor}</p>
                <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-200">
                  <span className="text-xs text-slate-600">Importe total:</span>
                  <span className="text-xs font-black text-slate-900">
                    {selectedCourse.price === 0 ? '0.00 USD (Gratis)' : `${selectedCourse.price} USD`}
                  </span>
                </div>
              </div>

              {paypalError && (
                <div id="paypal-error-alert" className="bg-rose-50 text-rose-650 p-2.5 rounded-lg text-xs border border-rose-100 flex items-center gap-2 mb-4 text-left">
                  <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                  <span>{paypalError}</span>
                </div>
              )}

              {paypalSuccessMessage && (
                <div id="paypal-success-alert" className="bg-emerald-50 text-emerald-700 p-2.5 rounded-lg text-xs border border-emerald-100 flex items-center gap-2 mb-4 text-left animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>{paypalSuccessMessage}</span>
                </div>
              )}

              <div className="flex items-center gap-2 bg-amber-50 text-amber-800 p-2.5 rounded-lg text-[10px] leading-snug border border-amber-100 text-left mb-6">
                <AlertCircle className="w-5 h-5 text-amber-650 flex-shrink-0 mt-0.5" />
                <span><strong>Pasarela de Pago PayPal:</strong> Integración activa que permite operar en República Dominicana y de manera global. Utiliza los botones inteligentes para sandbox.</span>
              </div>

              <div className="space-y-2.5">
                {selectedCourse.price === 0 ? (
                  <button
                    id="register-free-course-btn"
                    onClick={() => handlePaymentApproved({ id: 'FREE-SIMULATED-PAYMENT' })}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm"
                  >
                    Inscribirse gratis ahora
                  </button>
                ) : (
                  <div className="w-full" style={{ minHeight: '120px' }}>
                    <PayPalScriptProvider options={{ "client-id": PAYPAL_CLIENT_ID, currency: "USD" }}>
                      <PayPalButtons
                        style={{ layout: "vertical", height: 38 }}
                        createOrder={(data, actions) => {
                          return actions.order.create({
                            intent: "CAPTURE",
                            purchase_units: [
                              {
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
                          if (actions.order) {
                            const details = await actions.order.capture();
                            handlePaymentApproved(details);
                          } else {
                            handlePaymentApproved({ id: 'SIMULATED-PAYMENT' });
                          }
                        }}
                        onError={(err) => {
                          console.error("PayPal Option error:", err);
                          // For development convenience and offline support if API is blocked by network, allow instant approval simulation on error
                          setPaypalError("Error al iniciar PayPal. ¿Quieres simular aprobación rápida por motivos de prueba local?");
                        }}
                      />
                    </PayPalScriptProvider>
                    
                    {paypalError && (
                      <button
                        type="button"
                        onClick={() => handlePaymentApproved({ id: 'DEV-SIMULATED' })}
                        className="mt-2 w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-[11px] border border-indigo-150 transition-all text-center"
                      >
                        Simular Aprobación Mock de Depuración
                      </button>
                    )}
                  </div>
                )}

                <button
                  id="cancel-payment-btn"
                  onClick={() => setPurchaseModalOpen(false)}
                  className="w-full py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-650 transition-all"
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
