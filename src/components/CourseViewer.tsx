import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Course, Lesson } from '../types';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  FileText, 
  BookOpen, 
  Award, 
  ExternalLink, 
  MessageCircle, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Video, 
  Sparkles,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Printer
} from 'lucide-react';
import RichLessonContent from './RichLessonContent';
import { getDefaultFaqsForCourse } from '../services/db';

/**
 * Automatically extracts the YouTube Video ID from various YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
export function getYouTubeVideoId(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);

  return match && match[1] ? match[1] : null;
}

interface CourseViewerProps {
  course: Course;
  completedLessonIds: string[];
  onToggleLessonCompleted: (courseId: string, lessonId: string) => void;
  onBackToCatalog: () => void;
  userName: string;
  userEmail?: string;
}

export default function CourseViewer({
  course,
  completedLessonIds,
  onToggleLessonCompleted,
  onBackToCatalog,
  userName,
  userEmail = ''
}: CourseViewerProps) {
  const [activeLesson, setActiveLesson] = useState<Lesson>(course.lessons[0] || null);
  const [activeTab, setActiveTab] = useState<'notes' | 'faq' | 'qa'>('notes');
  const [customNoteInput, setCustomNoteInput] = useState('');
  const [savedNotes, setSavedNotes] = useState<string[]>([]);
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState<string>('');
  const [deletingNoteIndex, setDeletingNoteIndex] = useState<number | null>(null);
  const [openFaqIds, setOpenFaqIds] = useState<string[]>([]);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const effectiveFaqs = course.faqs && course.faqs.length > 0 
    ? course.faqs 
    : getDefaultFaqsForCourse(course.id, course.instructor);

  const toggleFaqAccordion = (faqId: string) => {
    setOpenFaqIds((prev) => 
      prev.includes(faqId) ? prev.filter((id) => id !== faqId) : [...prev, faqId]
    );
  };

  // Build user-scoped local storage key to prevent cross-user collisions
  const userScope = (userEmail || userName || 'guest').toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
  const notesStorageKey = `courses_notes_${userScope}_${course.id}`;

  // Load custom student notes from localStorage for this specific user & course
  useEffect(() => {
    const stored = localStorage.getItem(notesStorageKey);
    if (stored) {
      try {
        setSavedNotes(JSON.parse(stored));
      } catch (e) {
        setSavedNotes([]);
      }
    } else {
      setSavedNotes([]);
    }
    // Set first lesson active when course changes
    if (course.lessons.length > 0) {
      setActiveLesson(course.lessons[0]);
    }
  }, [course, notesStorageKey]);

  // Explicitly scroll window to top upon mounting classroom or changing active lesson
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [course.id, activeLesson?.id]);

  // Handle saving new custom learner notes safely
  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNoteInput.trim()) return;

    const updated = [customNoteInput.trim(), ...savedNotes];
    setSavedNotes(updated);
    setCustomNoteInput('');

    localStorage.setItem(notesStorageKey, JSON.stringify(updated));
  };

  const handleDeleteNote = (index: number) => {
    const updated = savedNotes.filter((_, idx) => idx !== index);
    setSavedNotes(updated);
    localStorage.setItem(notesStorageKey, JSON.stringify(updated));
    if (deletingNoteIndex === index) {
      setDeletingNoteIndex(null);
    }
  };

  const handleStartEditNote = (index: number, text: string) => {
    setEditingNoteIndex(index);
    setEditingNoteText(text);
    setDeletingNoteIndex(null);
  };

  const handleSaveEditedNote = (index: number) => {
    if (!editingNoteText.trim()) return;
    const updated = [...savedNotes];
    updated[index] = editingNoteText.trim();
    setSavedNotes(updated);
    localStorage.setItem(notesStorageKey, JSON.stringify(updated));
    setEditingNoteIndex(null);
    setEditingNoteText('');
  };

  // Calculate progress percent
  const totalLessons = course.lessons.length;
  const completedCount = course.lessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  
  // Publication, Diploma setting & Certificate Protection:
  const isCoursePublished = (course.status ?? 'published') === 'published';
  const isDiplomaEnabled = course.hasDiploma !== false;
  const isFinished = completedCount === totalLessons && totalLessons > 0;
  const canClaimCertificate = isFinished && isCoursePublished && isDiplomaEnabled;

  // Real completion date & dynamic unique verification hash
  const issueDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  const verificationHash = useMemo(() => {
    const userSeed = (userEmail || userName || 'alumno').toLowerCase().trim();
    let hash = 0;
    const combined = `${userSeed}_${course.id}_2026_innova_cert`;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(36).toUpperCase().padStart(6, '0');
    return `INV-${course.id.substring(0, 4).toUpperCase()}-${hex}`;
  }, [userEmail, userName, course.id]);

  // Reading / Video detection & Chapter Navigation
  const hasVideo = Boolean(activeLesson?.videoUrl && activeLesson.videoUrl.trim() !== '');
  const youtubeVideoId = useMemo(() => {
    return getYouTubeVideoId(activeLesson?.videoUrl);
  }, [activeLesson?.videoUrl]);

  const isCompleted = activeLesson ? completedLessonIds.includes(activeLesson.id) : false;
  const currentLessonIndex = course.lessons.findIndex(l => l.id === activeLesson?.id);
  const prevLesson = currentLessonIndex > 0 ? course.lessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex >= 0 && currentLessonIndex < course.lessons.length - 1 ? course.lessons[currentLessonIndex + 1] : null;

  const handleMarkAndNext = () => {
    if (activeLesson) {
      const wasCompleted = completedLessonIds.includes(activeLesson.id);
      onToggleLessonCompleted(course.id, activeLesson.id);
      if (!wasCompleted && nextLesson) {
        setActiveLesson(nextLesson);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Change video source cleanly when active lesson changes (only for HTML5 video files)
  useEffect(() => {
    if (videoRef.current && hasVideo && !youtubeVideoId) {
      videoRef.current.load();
    }
  }, [activeLesson, hasVideo, youtubeVideoId]);

  return (
    <div className="bg-slate-50 dark:bg-slate-800 min-h-screen transition-colors duration-200">
      {!isCoursePublished && (
        <div className="bg-amber-500 text-white text-xs font-semibold px-4 py-2 text-center flex items-center justify-center gap-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-100 flex-shrink-0" />
          <span>Curso en fase «Próximamente» (En desarrollo). La emisión del diploma oficial se habilitará cuando el curso esté publicado oficialmente.</span>
        </div>
      )}

      {/* Subheader Toolbar */}
      <div className="bg-white dark:bg-slate-700/90 border-b border-slate-200 dark:border-slate-600 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <button
            id="back-to-catalog-toolbar-btn"
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold focus:outline-none py-1.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Catálogo</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-slate-400 dark:text-slate-500 text-xs hidden sm:block">Progreso:</span>
            <div className="flex items-center gap-2">
              <div className="w-24 sm:w-36 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-700">
                <div 
                  className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{progressPercent}%</span>
            </div>

            {isFinished && isDiplomaEnabled && !isCoursePublished && (
              <span className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>Diploma disponible al publicarse</span>
              </span>
            )}

            {isFinished && !isDiplomaEnabled && (
              <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold px-2.5 py-1 rounded-lg">
                <span>Curso sin emisión de diploma</span>
              </span>
            )}

            {canClaimCertificate && (
              <button
                id="claim-certificate-header-btn"
                onClick={() => setShowCertificateModal(true)}
                className="bg-amber-500 hover:bg-amber-600 font-bold text-white text-xs px-2.5 sm:px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors animate-bounce cursor-pointer flex-shrink-0"
              >
                <Award className="w-4 h-4 flex-shrink-0" />
                <span className="inline sm:hidden">Certificado</span>
                <span className="hidden sm:inline">Ver Diploma Oficial</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Order 1: Main Player or Ebook Reader */}
          <div className="lg:col-span-2 space-y-6 order-1">
            
            {hasVideo ? (
              /* ================== VIDEO LESSON MODE ================== */
              <div className="space-y-6">
                <div className="relative group">
                  {/* Static subtle and elegant ambient neon gradient background blur */}
                  <div 
                    className="absolute -inset-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-500 rounded-2xl blur-xl opacity-0 dark:opacity-20 pointer-events-none"
                  />

                  <div className="bg-black rounded-2xl overflow-hidden aspect-video relative shadow-lg dark:shadow-[0_0_20px_rgba(168,85,247,0.15)] border border-transparent dark:border-purple-500/30 transition-all duration-300" id="classroom-player-wrapper">
                    {youtubeVideoId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0`}
                        title={activeLesson ? activeLesson.title : 'Reproductor de Video'}
                        className="w-full h-full aspect-video rounded-xl border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : activeLesson ? (
                      <video
                        ref={videoRef}
                        src={activeLesson.videoUrl}
                        controls
                        className="w-full h-full object-contain rounded-xl"
                        poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80"
                      >
                        Tu navegador no soporta reproducción de vídeo HTML5.
                      </video>
                    ) : (
                      <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-6 text-center">
                        <Play className="h-10 w-10 text-slate-400 animate-pulse mb-3" />
                        <p className="font-bold">Selecciona una lección para comenzar</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Lesson Title & Action */}
                <div className="bg-white dark:bg-slate-700/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-600 shadow-xs transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          <span>Video Lección · Clase {currentLessonIndex + 1}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{activeLesson?.duration}</span>
                      </div>
                      <h1 className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl leading-snug">
                        {activeLesson ? activeLesson.title : 'Cargando contenido...'}
                      </h1>
                    </div>

                    {activeLesson && (
                      <button
                        id="toggle-lesson-completed-btn"
                        onClick={handleMarkAndNext}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                          isCompleted
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {isCompleted ? 'Clase completada ✓' : 'Marcar clase como vista'}
                        </span>
                      </button>
                    )}
                  </div>

                  {activeLesson?.content && (
                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <FileText className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                        <span>Apuntes y Notas de la Clase</span>
                      </h3>
                      <RichLessonContent content={activeLesson.content} />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ================== E-BOOK / DIGITAL READING CHAPTER MODE ================== */
              <div className="bg-white dark:bg-slate-700/80 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-600 shadow-sm space-y-6 transition-colors">
                
                {/* Chapter Header Banner */}
                <div className="border-b border-slate-200/80 dark:border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shadow-2xs">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Capítulo {currentLessonIndex + 1} de {course.lessons.length}</span>
                      </span>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span>{activeLesson?.duration || '8 min de lectura'}</span>
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                      {activeLesson ? activeLesson.title : 'Cargando capítulo...'}
                    </h1>
                  </div>

                  {/* Mark as read button */}
                  {activeLesson && (
                    <button
                      id="toggle-lesson-completed-btn"
                      onClick={handleMarkAndNext}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm flex-shrink-0 cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100 dark:shadow-none'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isCompleted ? 'Capítulo leído ✓' : 'Marcar capítulo como leído'}
                      </span>
                    </button>
                  )}
                </div>

                {/* Rich formatted reading body with embedded images & text */}
                <div className="py-2">
                  <RichLessonContent content={activeLesson ? activeLesson.content : ''} />
                </div>

                {/* Bottom chapter reading navigation */}
                <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-800/50 p-4 rounded-2xl">
                  <div>
                    {prevLesson ? (
                      <button
                        onClick={() => {
                          setActiveLesson(prevLesson);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Capítulo Anterior</span>
                      </button>
                    ) : <div />}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isCompleted && nextLesson && (
                      <button
                        onClick={handleMarkAndNext}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Completar y siguiente capítulo</span>
                      </button>
                    )}

                    {nextLesson && (
                      <button
                        onClick={() => {
                          setActiveLesson(nextLesson);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
                      >
                        <span>Siguiente Capítulo</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Order 2: Plan de Estudios / Lecciones del Curso */}
          <div className="order-2 lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-700/80 rounded-2xl border border-slate-200 dark:border-slate-600 shadow-xs overflow-hidden transition-colors">
              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border-b border-slate-200 dark:border-slate-600">
                <span className="text-xs text-indigo-700 dark:text-indigo-400 font-extrabold uppercase tracking-wider">Plan de Estudios</span>
                <h2 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base mt-0.5">Lecciones del Curso</h2>
              </div>

              <div className="divide-y divide-slate-150 dark:divide-slate-600/80 max-h-[480px] overflow-y-auto">
                {course.lessons.map((lesson, idx) => {
                  const isCompleted = completedLessonIds.includes(lesson.id);
                  const isActive = activeLesson?.id === lesson.id;

                  return (
                    <div
                      key={lesson.id}
                      id={`lesson-row-${lesson.id}`}
                      onClick={() => setActiveLesson(lesson)}
                      className={`p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/60 border-l-4 border-indigo-600 pl-3.5'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-600/80 bg-white dark:bg-slate-700'
                      }`}
                    >
                      {/* Check icon */}
                      <button
                        id={`btn-toggle-compl-${lesson.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLessonCompleted(course.id, lesson.id);
                        }}
                        className="mt-0.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none flex-shrink-0 cursor-pointer"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50 dark:fill-emerald-950/40" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                        )}
                      </button>

                      {/* Info lesson */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {lesson.videoUrl && lesson.videoUrl.trim() !== '' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold">
                              <Video className="w-3 h-3" /> Video
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                              <BookOpen className="w-3 h-3" /> Lectura
                            </span>
                          )}
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
                            {lesson.duration || (lesson.videoUrl ? '10 min' : '5 min')}
                          </span>
                        </div>
                        <p className={`text-xs sm:text-sm font-semibold leading-snug ${
                          isActive ? 'text-indigo-900 dark:text-indigo-300 font-extrabold' : 'text-slate-800 dark:text-slate-200'
                        } truncate`}>
                          {lesson.title}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress visual footer */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border-t border-slate-200 dark:border-slate-600 text-center">
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                  Completadas: <strong className="text-slate-900 dark:text-white font-extrabold">{completedCount}</strong> de {totalLessons} lecciones
                </p>
              </div>
            </div>
          </div>

          {/* Order 3: Tabs for extra interaction (Apuntes Locales & FAQs) */}
          <div className="order-3 lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-700/80 rounded-2xl border border-slate-200 dark:border-slate-600 overflow-hidden shadow-2xs transition-colors">
              <div className="border-b border-slate-200/80 dark:border-slate-800 flex bg-slate-50/50 dark:bg-slate-800/40">
                <button
                  id="tab-learner-notes"
                  onClick={() => setActiveTab('notes')}
                  className={`flex-1 py-3.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                    activeTab === 'notes'
                      ? 'border-b-2 border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    Mis Apuntes Locales ({savedNotes.length})
                  </span>
                </button>
                <button
                  id="tab-learner-faq"
                  onClick={() => setActiveTab('faq')}
                  className={`flex-1 py-3.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                    activeTab === 'faq'
                      ? 'border-b-2 border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    Preguntas Frecuentes
                  </span>
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed font-normal">
                      Usa este campo para guardar recordatorios rápidos, comandos importantes o fragmentos de código. Se guardan para siempre en tu navegador asociados a tu cuenta.
                    </p>

                    <form onSubmit={handleSaveNote} className="flex gap-2">
                      <input
                        id="note-text-input"
                        type="text"
                        value={customNoteInput}
                        onChange={(e) => setCustomNoteInput(e.target.value)}
                        placeholder="Añadir una nota rápida de esta lección..."
                        className="flex-1 px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:focus:ring-indigo-500 text-xs sm:text-sm"
                      />
                      <button
                        id="save-note-submit-btn"
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-2xs"
                      >
                        Añadir
                      </button>
                    </form>

                    {savedNotes.length === 0 ? (
                      <div className="py-6 text-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm border border-dashed border-slate-200 dark:border-slate-800 rounded-xl font-medium">
                        Aún no tienes notas escritas para este curso. ¡Escribe una arriba!
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {savedNotes.map((note, index) => {
                          const isEditing = editingNoteIndex === index;
                          const isConfirmingDelete = deletingNoteIndex === index;

                          if (isEditing) {
                            return (
                              <div key={index} className="bg-indigo-50/70 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 space-y-2.5">
                                <textarea
                                  value={editingNoteText}
                                  onChange={(e) => setEditingNoteText(e.target.value)}
                                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:ring-1 focus:ring-indigo-600 dark:focus:ring-indigo-500 focus:outline-none font-medium leading-relaxed"
                                  rows={2}
                                  autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingNoteIndex(null);
                                      setEditingNoteText('');
                                    }}
                                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg flex items-center gap-1 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Cancelar</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditedNote(index)}
                                    className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Guardar</span>
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          if (isConfirmingDelete) {
                            return (
                              <div key={index} className="bg-rose-50 dark:bg-rose-950/40 p-3.5 rounded-xl border border-rose-200 dark:border-rose-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <p className="text-xs sm:text-sm font-semibold text-rose-900 dark:text-rose-200">
                                  ¿Estás seguro de que deseas eliminar este apunte?
                                </p>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setDeletingNoteIndex(null)}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteNote(index)}
                                    className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs cursor-pointer"
                                  >
                                    Sí, eliminar
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={index} className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 flex justify-between items-start gap-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                              <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium break-words whitespace-pre-wrap flex-1">{note}</span>
                              <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                                <button
                                  id={`edit-note-idx-${index}`}
                                  type="button"
                                  onClick={() => handleStartEditNote(index, note)}
                                  title="Editar apunte"
                                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  id={`delete-note-idx-${index}`}
                                  type="button"
                                  onClick={() => {
                                    setDeletingNoteIndex(index);
                                    setEditingNoteIndex(null);
                                  }}
                                  title="Eliminar apunte"
                                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'faq' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Preguntas Frecuentes del Curso</span>
                      </span>
                      <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-150 dark:border-indigo-800/80 px-2.5 py-0.5 rounded-full">
                        {effectiveFaqs.length} resoluciones
                      </span>
                    </div>

                    {effectiveFaqs.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 dark:text-slate-300 text-xs sm:text-sm border border-dashed border-slate-200 dark:border-slate-700 rounded-xl font-medium">
                        No hay preguntas frecuentes registradas para este curso por el momento.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {effectiveFaqs.map((faq) => {
                          const isOpen = openFaqIds.includes(faq.id);

                          return (
                            <div
                              key={faq.id}
                              className={`border rounded-xl transition-all overflow-hidden ${
                                isOpen
                                  ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/40 dark:bg-slate-800 shadow-2xs'
                                  : 'border-slate-200 dark:border-slate-600/80 bg-white dark:bg-slate-800/90 hover:border-slate-300 dark:hover:border-slate-500'
                              }`}
                            >
                              <button
                                type="button"
                                id={`faq-accordion-toggle-${faq.id}`}
                                onClick={() => toggleFaqAccordion(faq.id)}
                                className="w-full text-left p-3.5 flex items-center justify-between gap-3 focus:outline-none cursor-pointer"
                              >
                                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-snug flex items-center gap-2.5">
                                  <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-200 text-xs font-black flex items-center justify-center flex-shrink-0 border border-indigo-200/60 dark:border-indigo-800">
                                    ?
                                  </span>
                                  <span>{faq.question}</span>
                                </span>
                                {isOpen ? (
                                  <ChevronUp className="w-4 h-4 text-indigo-600 dark:text-indigo-300 flex-shrink-0" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-300 flex-shrink-0" />
                                )}
                              </button>

                              {isOpen && (
                                <div className="px-4 pb-4 pt-2 text-slate-700 dark:text-slate-200 text-xs sm:text-sm leading-relaxed border-t border-indigo-150/60 dark:border-slate-700/80 bg-white/90 dark:bg-slate-800/95 font-normal">
                                  {faq.answer}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order 4: Tu Instructor Card */}
          <div className="order-4 lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-700/80 rounded-2xl border border-slate-200 dark:border-slate-600 p-5 shadow-xs transition-colors">
              <span className="text-xs text-indigo-700 dark:text-indigo-400 uppercase font-extrabold tracking-wider">Tu Instructor</span>
              <div className="flex items-center gap-3 mt-3">
                <div className="w-11 h-11 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-extrabold text-base border border-indigo-150 dark:border-indigo-900 shadow-2xs">
                  {course.instructor.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{course.instructor}</p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-400">Asesor Técnico</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-300 font-normal mt-3 leading-relaxed">
                Mentor asignado para evaluar el progreso virtual de tu código y certificar de manera digital la finalización de los objetivos.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Diploma certificate modal layout */}
      {showCertificateModal && canClaimCertificate && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex justify-center items-center p-4 overflow-y-auto" id="certificate-viewer-modal">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-300 dark:border-slate-700 space-y-6 transition-colors">
            
            {/* Real printable digital certificate artwork */}
            <div className="border-[8px] border-double border-indigo-900 p-6 sm:p-10 text-center relative bg-stone-50 text-slate-900 rounded-lg shadow-inner overflow-hidden" id="certificate-print-area">
              
              {/* Background elegant pattern watermark */}
              <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center">
                <Award className="w-80 h-80 text-indigo-900" />
              </div>

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Award className="w-6 h-6 text-indigo-700" />
                  <span className="text-indigo-950 font-serif font-black uppercase tracking-widest text-xs sm:text-sm block">InnovaEstudios · Acreditación Académica</span>
                </div>
                <div className="w-16 h-0.5 bg-amber-500 mx-auto my-2" />

                <h3 className="font-serif italic text-slate-600 text-xs sm:text-sm">Se concede el presente diploma oficial de finalización a:</h3>
                
                <h2 className="text-2xl sm:text-3xl font-serif text-slate-900 tracking-wide font-extrabold underline decoration-amber-500 decoration-2 underline-offset-8 py-1.5">
                  {userName || 'Alumno Registrado'}
                </h2>

                <p className="text-slate-600 text-xs max-w-md mx-auto leading-relaxed font-normal">
                  Por haber cursado y completado satisfactoriamente el 100% de la carga lectiva y las evaluaciones prácticas para el programa:
                </p>

                <h4 className="text-lg sm:text-xl font-bold text-indigo-900 px-4 leading-snug">
                  {course.title}
                </h4>

                <p className="text-[11px] text-slate-500">
                  Otorgado por la institución académica <strong className="text-slate-800">InnovaEstudios</strong> bajo la dirección docente de:
                </p>

                <p className="text-xs font-bold text-slate-800 italic">
                  {course.instructor}
                </p>

                <div className="pt-6 flex justify-between items-end gap-4 max-w-md mx-auto border-t border-slate-200/80">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-mono uppercase">Fecha de Emisión</p>
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1 justify-center mt-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{issueDateFormatted}</span>
                    </p>
                  </div>

                  {/* Stamp emblem */}
                  <div className="relative flex justify-center">
                    <div className="w-14 h-14 rounded-full border-4 border-dashed border-indigo-600 bg-indigo-50 flex items-center justify-center transform rotate-6 hover:rotate-12 transition-transform duration-200 shadow-2xs">
                      <Award className="w-7 h-7 text-indigo-700" />
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-mono uppercase">ID Verificación</p>
                    <p className="text-xs font-mono font-bold text-slate-900 mt-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {verificationHash}
                    </p>
                  </div>
                </div>

              </div>

            </div>

            <div className="flex flex-wrap gap-3 justify-end items-center pt-2">
              <button
                id="close-certificate-modal-btn"
                type="button"
                onClick={() => setShowCertificateModal(false)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
              >
                Cerrar documento
              </button>
              <button
                id="print-certificate-action-btn"
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer border border-indigo-500"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Descargar PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
