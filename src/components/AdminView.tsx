import React, { useState, useMemo } from 'react';
import { Course, Lesson, CourseFaq } from '../types';
import { Plus, BookOpen, Video, ArrowLeft, Image, DollarSign, Tag, Award, CheckCircle2, User, Sparkles, Trash2, Pencil, X, Database, Copy, Check, Eye, Edit3, FileText, HelpCircle, Clock, Star } from 'lucide-react';
import { isSessionVerifiedAdmin } from '../services/auth';
import { getDbStatus } from '../services/db';
import RichLessonContent from './RichLessonContent';

interface AdminViewProps {
  courses: Course[];
  onAddCourse: (newCourse: Course) => void;
  onAddLesson: (courseId: string, newLesson: Lesson) => void;
  onDeleteCourse: (courseId: string) => void;
  onUpdateCourse: (updatedCourse: Course) => void;
  onUpdateLesson: (courseId: string, updatedLesson: Lesson) => void;
  onUpsertFaq: (courseId: string, faq: CourseFaq) => void;
  onDeleteFaq: (courseId: string, faqId: string) => void;
  onBackToCatalog: () => void;
}

export default function AdminView({
  courses,
  onAddCourse,
  onAddLesson,
  onDeleteCourse,
  onUpdateCourse,
  onUpdateLesson,
  onUpsertFaq,
  onDeleteFaq,
  onBackToCatalog
}: AdminViewProps) {
  // Robust Session Security Check
  // Check local storage directly to prevent standard state-injection or devtools bypass
  const storedEmail = localStorage.getItem('courses_student_email') || '';
  const storedToken = localStorage.getItem('courses_student_token');
  const isAuthorized = isSessionVerifiedAdmin(storedEmail, storedToken);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-rose-100 p-8 rounded-2xl max-w-md shadow-sm space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-650 rounded-xl flex items-center justify-center mx-auto">
            <Award className="w-6 h-6 text-rose-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Acceso Denegado u No Autorizado</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Esta sección está reservada exclusivamente para administradores verificados. Tu firma de sesión actual es inválida o ha expirado.
          </p>
          <button
            onClick={onBackToCatalog}
            className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            Volver a la vista del alumno
          </button>
        </div>
      </div>
    );
  }

  // Course form state
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [instructor, setInstructor] = useState('Profesor Especialista');
  const [category, setCategory] = useState('Programación');
  const [price, setPrice] = useState('39.99');
  const [level, setLevel] = useState<'Principiante' | 'Intermedio' | 'Avanzado'>('Intermedio');
  const [duration, setDuration] = useState('12 horas');
  const [rating, setRating] = useState('4.9');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<'published' | 'upcoming'>('published');
  const [hasDiploma, setHasDiploma] = useState<boolean>(true);
  const [courseFormSuccess, setCourseFormSuccess] = useState('');

  // Dynamic categories extracted from existing courses + baseline suggestions
  const existingCategories = useMemo(() => {
    const set = new Set<string>();
    ['Programación', 'Diseño UI/UX', 'Inteligencia Artificial', 'Negocios Digitales', 'Ciberseguridad', 'DevOps'].forEach((c) => set.add(c));
    courses.forEach((c) => {
      const cat = c.category?.trim();
      if (cat && cat.toLowerCase() !== 'todos' && cat.toLowerCase() !== 'mis cursos') {
        set.add(cat);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [courses]);

  // Lesson form state
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDuration, setLessonDuration] = useState('8 min lectura');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonFormSuccess, setLessonFormSuccess] = useState('');
  const [lessonContentTab, setLessonContentTab] = useState<'write' | 'preview'>('write');

  const insertSnippet = (snippet: string) => {
    setLessonContent((prev) => (prev ? `${prev}\n\n${snippet}` : snippet));
    setLessonContentTab('write');
  };

  // FAQ form state
  const [faqCourseId, setFaqCourseId] = useState(courses[0]?.id || '');
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqFormSuccess, setFaqFormSuccess] = useState('');

  const handleCreateOrUpdateFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqCourseId || !faqQuestion.trim() || !faqAnswer.trim()) return;

    const targetCourse = courses.find((c) => c.id === faqCourseId);
    const existingFaqs = targetCourse?.faqs || [];

    const faqToSave: CourseFaq = {
      id: editingFaqId || `faq-${Date.now()}`,
      courseId: faqCourseId,
      question: faqQuestion.trim(),
      answer: faqAnswer.trim(),
      orderIndex: editingFaqId
        ? existingFaqs.find((f) => f.id === editingFaqId)?.orderIndex ?? 0
        : existingFaqs.length
    };

    onUpsertFaq(faqCourseId, faqToSave);

    setFaqQuestion('');
    setFaqAnswer('');
    setEditingFaqId(null);
    setFaqFormSuccess('¡Pregunta Frecuente (FAQ) guardada y sincronizada correctamente!');

    setTimeout(() => {
      setFaqFormSuccess('');
    }, 4500);
  };

  const handleStartEditFaq = (faq: CourseFaq) => {
    setEditingFaqId(faq.id);
    setFaqQuestion(faq.question);
    setFaqAnswer(faq.answer);
  };

  const handleCancelEditFaq = () => {
    setEditingFaqId(null);
    setFaqQuestion('');
    setFaqAnswer('');
  };

  const dbStatus = getDbStatus();

  const handleCreateOrUpdateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const sanitizedCategory = category.trim() || 'General';
    const cleanDuration = duration.trim()
      ? (duration.toLowerCase().includes('hora') ? duration.trim() : `${duration.trim()} horas`)
      : '12 horas';
    const parsedRating = Math.min(5, Math.max(1, parseFloat(rating) || 4.9));
    const numericDurationHours = parseFloat(cleanDuration.replace(/[^\d.]/g, '')) || 12;

    if (editingCourseId) {
      // MODE: UPDATE
      const existing = courses.find((c) => c.id === editingCourseId);
      if (!existing) return;

      const updatedCourse: Course = {
        ...existing,
        title: title.trim(),
        description: description.trim(),
        longDescription: longDescription.trim() || description.trim(),
        instructor: instructor.trim(),
        category: sanitizedCategory,
        price: parseFloat(price) || 0,
        level,
        status,
        hasDiploma,
        duration: cleanDuration,
        duration_hours: numericDurationHours,
        rating: Number(parsedRating.toFixed(1)),
        imageUrl: imageUrl.trim() || existing.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      };

      onUpdateCourse(updatedCourse);
      
      // Reset
      setTitle('');
      setDescription('');
      setLongDescription('');
      setImageUrl('');
      setCategory('Programación');
      setPrice('39.99');
      setLevel('Intermedio');
      setDuration('12 horas');
      setRating('4.9');
      setStatus('published');
      setHasDiploma(true);
      setEditingCourseId(null);
      setCourseFormSuccess('¡Curso actualizado con éxito! Los cambios ya son visibles.');
    } else {
      // MODE: CREATE NEW
      const newCourse: Course = {
        id: 'custom-' + Date.now(),
        title: title.trim(),
        description: description.trim(),
        longDescription: longDescription.trim() || description.trim(),
        instructor: instructor.trim(),
        category: sanitizedCategory,
        price: parseFloat(price) || 0,
        rating: Number(parsedRating.toFixed(1)),
        duration: cleanDuration,
        duration_hours: numericDurationHours,
        level,
        status,
        hasDiploma,
        publishedDate: 'Reciente (Admin)',
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
        skillsLearned: ['Competencias prácticas avanzadas', 'Manejo experto de herramientas'],
        lessons: []
      };

      onAddCourse(newCourse);
      setSelectedCourseId(newCourse.id);

      setTitle('');
      setDescription('');
      setLongDescription('');
      setImageUrl('');
      setCategory('Programación');
      setPrice('39.99');
      setLevel('Intermedio');
      setDuration('12 horas');
      setRating('4.9');
      setStatus('published');
      setHasDiploma(true);
      setCourseFormSuccess('¡Curso creado con éxito! Ya puedes añadirle clases o verlo en el catálogo.');
    }

    setTimeout(() => {
      setCourseFormSuccess('');
    }, 4500);
  };

  const handleStartEditCourse = (course: Course) => {
    setEditingCourseId(course.id);
    setTitle(course.title);
    setDescription(course.description);
    setLongDescription(course.longDescription || '');
    setInstructor(course.instructor);
    setCategory(course.category || 'General');
    setPrice(String(course.price));
    setLevel(course.level || 'Intermedio');
    setDuration(course.duration && course.duration !== '0 horas' ? course.duration : '12 horas');
    setRating(String(course.rating || 4.9));
    setImageUrl(course.imageUrl);
    setStatus(course.status || 'published');
    setHasDiploma(course.hasDiploma !== false);
  };

  const handleCancelEditCourse = () => {
    setEditingCourseId(null);
    setTitle('');
    setDescription('');
    setLongDescription('');
    setImageUrl('');
    setCategory('Programación');
    setPrice('39.99');
    setLevel('Intermedio');
    setDuration('12 horas');
    setRating('4.9');
    setStatus('published');
    setHasDiploma(true);
  };

  const handleCreateOrUpdateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !lessonTitle.trim()) return;

    if (editingLessonId) {
      // MODE: UPDATE LESSON
      const updatedLesson: Lesson = {
        id: editingLessonId,
        title: lessonTitle.trim(),
        duration: lessonDuration.trim(),
        videoUrl: lessonVideoUrl.trim(),
        content: lessonContent.trim() || `Apuntes teóricos para la clase: ${lessonTitle}`
      };

      onUpdateLesson(selectedCourseId, updatedLesson);

      setLessonTitle('');
      setLessonVideoUrl('');
      setLessonDuration('8 min lectura');
      setLessonContent('');
      setEditingLessonId(null);
      setLessonFormSuccess('¡Capítulo/lección actualizado correctamente!');
    } else {
      // MODE: CREATE NEW LESSON
      const newLesson: Lesson = {
        id: 'lesson-' + Date.now(),
        title: lessonTitle.trim(),
        duration: lessonDuration.trim() || '8 min lectura',
        videoUrl: lessonVideoUrl.trim(),
        content: lessonContent.trim()
      };

      onAddLesson(selectedCourseId, newLesson);

      setLessonTitle('');
      setLessonVideoUrl('');
      setLessonDuration('8 min lectura');
      setLessonContent('');
      setLessonFormSuccess('¡Capítulo/lección agregado e incorporado correctamente!');
    }

    setTimeout(() => {
      setLessonFormSuccess('');
    }, 4500);
  };

  const handleStartEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setLessonTitle(lesson.title);
    setLessonDuration(lesson.duration);
    setLessonVideoUrl(lesson.videoUrl || '');
    setLessonContent(lesson.content || '');
    setLessonContentTab('write');
  };

  const handleCancelEditLesson = () => {
    setEditingLessonId(null);
    setLessonTitle('');
    setLessonVideoUrl('');
    setLessonDuration('8 min lectura');
    setLessonContent('');
  };

  const prefillDemoCourse = () => {
    setTitle('TypeScript Avanzado con Patrones GoF');
    setDescription('Domina los patrones de diseño clásicos de la banda de los cuatro adaptados a la elegancia de TypeScript moderno.');
    setLongDescription('En este curso práctico desglosaremos los patrones Creacionales, Estructurales y de Comportamiento. Crearás arquitecturas desacopladas listas para testear con jest/vitest, utilizando tipado avanzado, decoradores personalizados y genéricos dinámicos de forma profesional.');
    setInstructor('Daniel Mendoza (Technical Lead)');
    setCategory('Programación');
    setPrice('59.00');
    setLevel('Avanzado');
    setDuration('16 horas');
    setRating('4.9');
    setImageUrl('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80');
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-indigo-650 font-bold uppercase tracking-wider block">Panel de Control Privado</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                dbStatus.isLiveDb 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}>
                <Database className="w-3 h-3" />
                <span>{dbStatus.isLiveDb ? 'Supabase DB Conectada' : 'Supabase Sincronizado'}</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Consola de Administración de Cursos</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="admin-back-to-catalog"
              onClick={onBackToCatalog}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al aula de Alumno</span>
            </button>
          </div>
        </div>

        {/* Bento grid panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Panel 1: Create/Edit courses */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg inline-block mb-2">
                  <BookOpen className="w-5 h-5" />
                </span>
                <h2 className="font-extrabold text-slate-900 text-md">
                  {editingCourseId ? 'Editar Curso Académico' : '1. Crear Nuevo Curso Académico'}
                </h2>
                <p className="text-slate-500 text-[11px]">
                  {editingCourseId 
                    ? 'Modifica los metadatos de tu curso de forma segura y guarda los cambios.' 
                    : 'Rellena los metadatos para publicar un nuevo curso interactivo al instante.'}
                </p>
              </div>
              {!editingCourseId && (
                <button
                  type="button"
                  id="prefill-demo-course-btn"
                  onClick={prefillDemoCourse}
                  className="text-[10px] text-indigo-650 font-bold hover:text-indigo-850 bg-indigo-50/50 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Autocompletar Demo
                </button>
              )}
            </div>

            {courseFormSuccess && (
              <div id="course-success-alert" className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-xs font-semibold border border-emerald-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>{courseFormSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrUpdateCourse} className="space-y-4" id="create-course-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="course-title" className="block text-xs font-bold text-slate-700">Título del Curso</label>
                  <input
                    id="course-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Introducción a Python"
                    className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="course-instructor" className="block text-xs font-bold text-slate-700">Instructor asignado</label>
                  <input
                    id="course-instructor"
                    type="text"
                    required
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    placeholder="Ej. Alex Aranda"
                    className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="course-description" className="block text-xs font-bold text-slate-700">Descripción Corta (Catálogo)</label>
                <input
                  id="course-description"
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Diles a los alumnos qué de qué trata en una línea."
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label htmlFor="course-long-description" className="block text-xs font-bold text-slate-700">Descripción Detallada (Modal de Detalles)</label>
                <textarea
                  id="course-long-description"
                  rows={3}
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  placeholder="Explica detalladamente la metodología de aprendizaje, metas y temario sugerido..."
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="course-category" className="block text-xs font-bold text-slate-700">Categoría</label>
                    <span className="text-[10px] text-slate-400 font-medium">Libre o sugerida</span>
                  </div>
                  <input
                    id="course-category"
                    type="text"
                    list="course-category-suggestions"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ej. Ciberseguridad, DevOps, Programación..."
                    required
                    className="mt-1 block w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                  <datalist id="course-category-suggestions">
                    {existingCategories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                  {/* Quick suggestion chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {existingCategories.slice(0, 5).map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`text-[9px] px-1.5 py-0.5 rounded transition-colors cursor-pointer border ${
                          category.trim().toLowerCase() === cat.toLowerCase()
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="course-price" className="block text-xs font-bold text-slate-700">Precio (USD) o 0 para Gratis</label>
                  <input
                    id="course-price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                </div>

                <div>
                  <label htmlFor="course-level" className="block text-xs font-bold text-slate-700">Nivel de Habilidad</label>
                  <select
                    id="course-level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value as any)}
                    className="mt-1 block w-full px-2 py-2 border border-slate-200 bg-white rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  >
                    <option value="Principiante">Principiante</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="course-duration" className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Duración (en horas)</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Ej. 12 horas</span>
                  </div>
                  <input
                    id="course-duration"
                    type="text"
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Ej. 12 horas o 20 horas"
                    className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Inspeccionable en la tarjeta del catálogo</span>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="course-rating" className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Calificación (Rating)</span>
                    </label>
                    <span className="text-[10px] text-amber-600 font-bold">{Number(rating || 4.9).toFixed(1)} / 5.0</span>
                  </div>
                  <input
                    id="course-rating"
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    required
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    placeholder="Ej. 4.9"
                    className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Escala de 1.0 a 5.0 para las estrellas</span>
                </div>
              </div>

              <div>
                <label htmlFor="course-image" className="block text-xs font-bold text-slate-700">URL Imagen de Portada</label>
                <input
                  id="course-image"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>

              {/* Selector de Estado: Publicado vs Próximamente */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-800">
                    Estado de Publicación del Curso
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    status === 'published' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {status === 'published' ? '● Publicado' : '● Próximamente'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    id="status-toggle-published"
                    onClick={() => setStatus('published')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      status === 'published'
                        ? 'border-emerald-500 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Publicado</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Disponible para inscripción, pagos y generación del diploma al completar las clases.
                    </p>
                  </button>

                  <button
                    type="button"
                    id="status-toggle-upcoming"
                    onClick={() => setStatus('upcoming')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      status === 'upcoming'
                        ? 'border-amber-500 bg-amber-50/60 shadow-xs ring-1 ring-amber-500'
                        : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-amber-700">
                      <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>Próximamente</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Muestra insignia de «Próximo Lanzamiento», desactiva la compra y bloquea diplomas.
                    </p>
                  </button>
                </div>
              </div>

              {/* Selector de Emisión de Diploma */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-800">
                    Emisión de Diploma de Finalización
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    hasDiploma 
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {hasDiploma ? '✓ Diploma Habilitado' : '✕ Sin Diploma'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    id="diploma-toggle-enabled"
                    onClick={() => setHasDiploma(true)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      hasDiploma
                        ? 'border-indigo-500 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-700">
                      <Award className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span>Con Diploma Oficial</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Emite un certificado digital oficial verificado al completar el 100% de las clases del curso.
                    </p>
                  </button>

                  <button
                    type="button"
                    id="diploma-toggle-disabled"
                    onClick={() => setHasDiploma(false)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      !hasDiploma
                        ? 'border-slate-400 bg-slate-100 shadow-xs ring-1 ring-slate-400'
                        : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-700">
                      <X className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <span>Sin Diploma</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Curso de consulta libre o taller informativo sin otorgar acreditación digital.
                    </p>
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  id="submit-new-course"
                  type="submit"
                  className="flex-1 py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {editingCourseId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingCourseId ? 'Guardar Cambios del Curso' : 'Publicar Curso en el Catálogo'}</span>
                </button>
                {editingCourseId && (
                  <button
                    type="button"
                    onClick={handleCancelEditCourse}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors shadow-sm"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Panel 2: Create classes/lessons & View Course overview */}
          <div className="space-y-8">
            
            {/* Adding/Editing Lessons directly */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div>
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg inline-block mb-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </span>
                <h2 className="font-extrabold text-slate-900 text-md">
                  {editingLessonId ? 'Editar Capítulo o Lección' : '2. Agregar Capítulo o Lección'}
                </h2>
                <p className="text-slate-500 text-[11px]">
                  {editingLessonId 
                    ? 'Modifica el contenido, imágenes o enlace y guarda los cambios.' 
                    : 'Crea capítulos de lectura tipo e-book con texto e imágenes, o agrega lecciones con video.'}
                </p>
              </div>

              {lessonFormSuccess && (
                <div id="lesson-success-alert" className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-xs font-semibold border border-emerald-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{lessonFormSuccess}</span>
                </div>
              )}

              {courses.length === 0 ? (
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 text-center text-xs text-slate-500">
                  Debes dar de alta al menos un curso para poder añadirle clases.
                </div>
              ) : (
                <form onSubmit={handleCreateOrUpdateLesson} className="space-y-4" id="create-lesson-form">
                  <div>
                    <label htmlFor="target-course-select" className="block text-xs font-bold text-slate-700">Seleccionar Curso Destino</label>
                    <select
                      id="target-course-select"
                      value={selectedCourseId}
                      onChange={(e) => {
                        setSelectedCourseId(e.target.value);
                        setEditingLessonId(null);
                      }}
                      className="mt-1 block w-full px-2 py-2 border border-slate-200 bg-white rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label htmlFor="lesson-title" className="block text-xs font-bold text-slate-700">Título del Capítulo o Lección</label>
                      <input
                        id="lesson-title"
                        type="text"
                        required
                        value={lessonTitle}
                        onChange={(e) => setLessonTitle(e.target.value)}
                        placeholder="Ej. Capítulo 1: Arquitectura Limpia y Modular"
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                      />
                    </div>
                    <div>
                      <label htmlFor="lesson-duration" className="block text-xs font-bold text-slate-700">Tiempo Estimado</label>
                      <input
                        id="lesson-duration"
                        type="text"
                        value={lessonDuration}
                        onChange={(e) => setLessonDuration(e.target.value)}
                        placeholder="Ej. 8 min lectura o 15:00"
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                      />
                    </div>
                  </div>

                  {/* Video URL is now COMPLETELY OPTIONAL */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="lesson-video-url" className="block text-xs font-bold text-slate-700">
                        Enlace de Video MP4 <span className="font-normal text-slate-400">(Opcional)</span>
                      </label>
                      <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                        Vacío = Curso tipo Lectura / E-book
                      </span>
                    </div>
                    <input
                      id="lesson-video-url"
                      type="url"
                      value={lessonVideoUrl}
                      onChange={(e) => setLessonVideoUrl(e.target.value)}
                      placeholder="https://... (déjalo vacío si el capítulo es solo lectura e imágenes)"
                      className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  {/* Enhanced Content & Reading Editor with Formatting Toolbar & Preview */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-700 mr-2 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>Contenido y Lectura</span>
                        </span>

                        {/* Quick formatting buttons */}
                        <button
                          type="button"
                          onClick={() => insertSnippet('![Pie de foto de la imagen](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&auto=format&fit=crop&q=80)')}
                          className="px-2 py-1 text-[11px] bg-white hover:bg-blue-50 text-blue-700 font-semibold rounded border border-slate-200 shadow-2xs transition-colors"
                          title="Insertar imagen con URL"
                        >
                          🖼️ Imagen
                        </button>
                        <button
                          type="button"
                          onClick={() => insertSnippet('## Subtítulo del Capítulo')}
                          className="px-2 py-1 text-[11px] bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded border border-slate-200 shadow-2xs transition-colors"
                          title="Insertar título"
                        >
                          📌 Título
                        </button>
                        <button
                          type="button"
                          onClick={() => insertSnippet('> 💡 **Punto clave:** Escribe aquí una explicación destacada para el lector.')}
                          className="px-2 py-1 text-[11px] bg-white hover:bg-amber-50 text-amber-700 font-semibold rounded border border-slate-200 shadow-2xs transition-colors"
                          title="Insertar nota destacada"
                        >
                          💡 Nota
                        </button>
                        <button
                          type="button"
                          onClick={() => insertSnippet('- Primer concepto clave\n- Segundo concepto clave\n- Conclusión importante')}
                          className="px-2 py-1 text-[11px] bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded border border-slate-200 shadow-2xs transition-colors"
                          title="Insertar viñetas"
                        >
                          • Lista
                        </button>
                        <button
                          type="button"
                          onClick={() => insertSnippet('```typescript\n// Fragmento de código o ejemplo\nconst ejemplo = "lectura interactiva";\nconsole.log(ejemplo);\n```')}
                          className="px-2 py-1 text-[11px] bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded border border-slate-200 shadow-2xs transition-colors"
                          title="Insertar bloque de código"
                        >
                          💻 Código
                        </button>
                      </div>

                      {/* Tab switch between Editor and Preview */}
                      <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setLessonContentTab('write')}
                          className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                            lessonContentTab === 'write' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Redactar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLessonContentTab('preview')}
                          className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                            lessonContentTab === 'preview' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                          <span>Vista Previa</span>
                        </button>
                      </div>
                    </div>

                    {lessonContentTab === 'write' ? (
                      <textarea
                        id="lesson-notes-content"
                        rows={8}
                        value={lessonContent}
                        onChange={(e) => setLessonContent(e.target.value)}
                        placeholder="Redacta los párrafos, explicaciones detalladas e inserta imágenes con ![Descripción](https://url-de-la-imagen.jpg)..."
                        className="block w-full p-3 text-slate-900 placeholder-slate-400 focus:outline-none text-xs sm:text-sm font-sans leading-relaxed"
                      />
                    ) : (
                      <div className="p-4 max-h-72 overflow-y-auto bg-slate-50/50">
                        <RichLessonContent content={lessonContent} />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      id="submit-new-lesson"
                      type="submit"
                      className="flex-1 py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {editingLessonId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      <span>{editingLessonId ? 'Guardar Cambios de Capítulo' : 'Agregar Capítulo / Lección'}</span>
                    </button>
                    {editingLessonId && (
                      <button
                        type="button"
                        onClick={handleCancelEditLesson}
                        className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors shadow-sm"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* Course-Specific Lessons Lister & Quick Editor */}
              {selectedCourseId && courses.length > 0 && (
                <div className="pt-4 border-t border-slate-150 space-y-2">
                  <p className="text-xs font-bold text-slate-700">
                    Clases registradas en este curso (Selecciona para Editar):
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {courses.find((c) => c.id === selectedCourseId)?.lessons.map((les) => (
                      <div
                        key={les.id}
                        className={`p-2 bg-slate-50 hover:bg-indigo-50/40 rounded-lg flex items-center justify-between text-xs border transition-all ${
                          editingLessonId === les.id ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-150'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-800 truncate">{les.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Duración: {les.duration} | Video: {les.videoUrl.slice(0, 45)}...
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleStartEditLesson(les)}
                          title="Seleccionar para editar clase"
                          className="p-1 px-2 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors flex items-center gap-1 font-semibold text-[10px]"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                      </div>
                    ))}
                    {(!courses.find((c) => c.id === selectedCourseId)?.lessons || courses.find((c) => c.id === selectedCourseId)?.lessons.length === 0) && (
                      <p className="text-[11px] text-slate-400 italic">No hay clases asociadas a este curso académico.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Panel 3: Manage Course Frequently Asked Questions (FAQs) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div>
                <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg inline-block mb-2">
                  <HelpCircle className="w-5 h-5 text-purple-600" />
                </span>
                <h2 className="font-extrabold text-slate-900 text-md">
                  {editingFaqId ? 'Editar Pregunta Frecuente (FAQ)' : '3. Gestor de Preguntas Frecuentes (FAQs)'}
                </h2>
                <p className="text-slate-500 text-[11px]">
                  Configura las preguntas y respuestas dinámicas para cada curso. Se sincronizan automáticamente con el aula virtual.
                </p>
              </div>

              {faqFormSuccess && (
                <div id="faq-success-alert" className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-xs font-semibold border border-emerald-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{faqFormSuccess}</span>
                </div>
              )}

              {courses.length === 0 ? (
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 text-center text-xs text-slate-500">
                  Crea al menos un curso para administrar sus preguntas frecuentes.
                </div>
              ) : (
                <form onSubmit={handleCreateOrUpdateFaq} className="space-y-4" id="create-faq-form">
                  <div>
                    <label htmlFor="faq-course-select" className="block text-xs font-bold text-slate-700">Seleccionar Curso Destino</label>
                    <select
                      id="faq-course-select"
                      value={faqCourseId}
                      onChange={(e) => {
                        setFaqCourseId(e.target.value);
                        setEditingFaqId(null);
                        setFaqQuestion('');
                        setFaqAnswer('');
                      }}
                      className="mt-1 block w-full px-2 py-2 border border-slate-200 bg-white rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="faq-question-input" className="block text-xs font-bold text-slate-700">Pregunta Frecuente</label>
                    <input
                      id="faq-question-input"
                      type="text"
                      required
                      value={faqQuestion}
                      onChange={(e) => setFaqQuestion(e.target.value)}
                      placeholder="Ej. ¿Qué prerrequisitos necesito para empezar?"
                      className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
                    />
                  </div>

                  <div>
                    <label htmlFor="faq-answer-input" className="block text-xs font-bold text-slate-700">Respuesta Explicativa</label>
                    <textarea
                      id="faq-answer-input"
                      rows={3}
                      required
                      value={faqAnswer}
                      onChange={(e) => setFaqAnswer(e.target.value)}
                      placeholder="Escribe aquí la respuesta detallada que verán los alumnos..."
                      className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs sm:text-sm font-sans leading-relaxed"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      id="submit-faq-btn"
                      type="submit"
                      className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {editingFaqId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      <span>{editingFaqId ? 'Guardar Cambios de FAQ' : 'Añadir Pregunta Frecuente'}</span>
                    </button>
                    {editingFaqId && (
                      <button
                        type="button"
                        onClick={handleCancelEditFaq}
                        className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* List of current FAQs for the selected course */}
              {faqCourseId && (
                <div className="pt-4 border-t border-slate-150 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800">
                      Preguntas Frecuentes de este curso ({courses.find((c) => c.id === faqCourseId)?.faqs?.length || 0}):
                    </h4>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {(courses.find((c) => c.id === faqCourseId)?.faqs || []).map((faq) => (
                      <div
                        key={faq.id}
                        className={`p-3 bg-slate-50 hover:bg-purple-50/30 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                          editingFaqId === faq.id ? 'border-purple-300 bg-purple-50/40' : 'border-slate-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-xs font-bold text-slate-900 leading-snug flex items-center gap-1.5">
                            <span className="text-purple-600 font-black">Q:</span> {faq.question}
                          </p>
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-normal">
                            {faq.answer}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditFaq(faq)}
                            title="Editar FAQ"
                            className="p-1.5 text-slate-500 hover:text-purple-650 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteFaq(faqCourseId, faq.id)}
                            title="Eliminar FAQ"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {(!courses.find((c) => c.id === faqCourseId)?.faqs || courses.find((c) => c.id === faqCourseId)?.faqs?.length === 0) && (
                      <p className="text-xs text-slate-400 italic py-2 text-center">
                        No hay preguntas frecuentes registradas para este curso. ¡Escribe una arriba!
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* List and manage courses overview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Cursos de la Plataforma ({courses.length})</h3>
              
              <div className="divide-y divide-slate-150 max-h-60 overflow-y-auto pr-1">
                {courses.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 truncate">{c.title}</p>
                        {c.status === 'upcoming' ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
                            Próximamente
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                            Publicado
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-[10px] mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span>Categoría: <strong className="text-slate-700">{c.category || 'General'}</strong></span>
                        <span>•</span>
                        <span>Nivel: <strong className="text-slate-700">{c.level || 'Intermedio'}</strong></span>
                        <span>•</span>
                        <span>Duración: <strong className="text-slate-700">{c.duration || '12 horas'}</strong></span>
                        <span>•</span>
                        <span className="text-amber-600 font-bold">★ {(Number(c.rating) || 4.9).toFixed(1)}</span>
                        <span>•</span>
                        <span>Clases: <strong className="text-slate-700">{c.lessons.length}</strong></span>
                        <span>•</span>
                        <span>Precio: <strong className="text-slate-700">{c.price === 0 ? 'Gratis' : `${c.price} USD`}</strong></span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const newStatus = c.status === 'upcoming' ? 'published' : 'upcoming';
                          onUpdateCourse({ ...c, status: newStatus });
                        }}
                        title={`Cambiar estado a ${c.status === 'upcoming' ? 'Publicado' : 'Próximamente'}`}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                          c.status === 'upcoming'
                            ? 'bg-amber-100/70 text-amber-800 hover:bg-emerald-100 hover:text-emerald-800'
                            : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800'
                        }`}
                      >
                        {c.status === 'upcoming' ? 'Publicar' : 'A Próximamente'}
                      </button>

                      <button
                        onClick={() => handleStartEditCourse(c)}
                        title="Editar curso"
                        className="p-1.5 text-slate-500 hover:text-indigo-650 hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        id={`delete-course-btn-${c.id}`}
                        onClick={() => onDeleteCourse(c.id)}
                        title="Eliminar curso"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
