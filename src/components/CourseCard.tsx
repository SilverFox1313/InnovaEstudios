import React, { useState } from 'react';
import { Clock, Star, Sparkles, CheckCircle2, ArrowRight, BookOpen } from 'lucide-react';
import { Course } from '../types';

export const DEFAULT_COURSE_IMAGE = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80';

interface CourseCardProps {
  key?: React.Key;
  course: Course;
  isOwned: boolean;
  onViewCourse: (course: Course) => void;
  onOpenDetails: (course: Course) => void;
  onStartPurchase: (e: React.MouseEvent, course: Course) => void;
}

export default function CourseCard({
  course,
  isOwned,
  onViewCourse,
  onOpenDetails,
  onStartPurchase
}: CourseCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imgSrc, setImgSrc] = useState(course.imageUrl || DEFAULT_COURSE_IMAGE);

  const isFree = course.price === 0;
  const isUpcoming = course.status === 'upcoming';

  const displayDuration = course.duration && course.duration.trim() !== '' && course.duration !== '0 horas'
    ? course.duration
    : (course.lessons?.length ? `${Math.max(1, Math.round(course.lessons.length * 0.75))} horas` : '12 horas');

  const displayRating = (typeof course.rating === 'number' && !isNaN(course.rating) && course.rating > 0)
    ? course.rating.toFixed(1)
    : '4.9';

  const displayLevel = course.level || 'Intermedio';

  const handleImageError = () => {
    if (imgSrc !== DEFAULT_COURSE_IMAGE) {
      setImgSrc(DEFAULT_COURSE_IMAGE);
    } else {
      setImageError(true);
    }
  };

  return (
    <div
      id={`course-card-${course.id}`}
      onClick={() => {
        if (isOwned) {
          onViewCourse(course);
        } else {
          onOpenDetails(course);
        }
      }}
      className="bg-white dark:bg-slate-700/80 rounded-2xl border border-slate-200 dark:border-slate-600 overflow-hidden hover:shadow-xl dark:hover:border-indigo-400/60 dark:hover:bg-slate-700 transition-all duration-200 cursor-pointer flex flex-col group h-full"
    >
      {/* Card head banner with resilient fallback gradient & icon */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-indigo-900/40 to-slate-900/80">
        {/* Fallback decorative background icon behind the image in case it fails or is transparent */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-400/50 dark:text-indigo-400/40 select-none z-0">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-inner">
            <BookOpen className="w-8 h-8 text-indigo-400 dark:text-indigo-400" />
          </div>
          <span className="text-[10px] font-bold tracking-wider uppercase mt-1.5 text-indigo-300/70 dark:text-indigo-300/50">
            {course.category || 'InnovaEstudios'}
          </span>
        </div>

        {!imageError && imgSrc && (
          <img
            src={imgSrc}
            alt={course.title}
            onError={handleImageError}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 opacity-90 relative z-1"
            referrerPolicy="no-referrer"
          />
        )}

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-900 dark:text-slate-100 border border-slate-100 dark:border-slate-600 flex items-center gap-1 shadow-xs z-10">
          <Clock className="w-3 h-3 text-indigo-600 dark:text-indigo-300" />
          <span>{displayDuration}</span>
        </div>

        <div className="absolute bottom-3 left-3 bg-indigo-900/90 dark:bg-indigo-950/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider border border-indigo-700/40 z-10">
          {course.category || 'General'}
        </div>

        {isUpcoming ? (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-lg text-[10px] font-extrabold tracking-wide shadow-md flex items-center gap-1.5 border border-amber-400/50 uppercase z-10">
            <Sparkles className="w-3 h-3 text-amber-100" />
            <span>Próximamente</span>
          </div>
        ) : isOwned ? (
          <div className="absolute top-3 right-3 bg-emerald-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold tracking-tight shadow-md flex items-center gap-1 border border-emerald-500 z-10">
            <CheckCircle2 className="w-3 h-3" />
            <span>Adquirido</span>
          </div>
        ) : null}
      </div>

      {/* Body textual content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-amber-500 dark:text-amber-400 font-bold mb-2">
            <Star className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
            <span>{displayRating}</span>
            <span className="text-slate-500 dark:text-slate-300 font-semibold">({displayLevel})</span>
          </div>

          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors duration-150">
            {course.title}
          </h3>

          <p className="text-slate-500 dark:text-slate-200 text-xs mt-2 line-clamp-2">
            {course.description}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-600/70 flex items-center justify-between">
          {/* Price tag */}
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-300 uppercase tracking-wider block font-semibold">Precio</span>
            <span className="text-md font-extrabold text-slate-900 dark:text-white">
              {isUpcoming ? (
                <span className="text-amber-700 dark:text-amber-300 font-bold text-xs">Por anunciar</span>
              ) : isFree ? (
                <span className="text-emerald-600 dark:text-emerald-300">Gratuito</span>
              ) : (
                `${course.price} USD`
              )}
            </span>
          </div>

          {/* Action trigger button */}
          {isUpcoming ? (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-[11px] font-bold shadow-2xs"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300 flex-shrink-0" />
              <span>Disponible muy pronto</span>
            </div>
          ) : isOwned ? (
            <button
              id={`action-view-${course.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onViewCourse(course);
              }}
              className="bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1 border border-indigo-100/30 dark:border-indigo-700/60 cursor-pointer"
            >
              <span>Aprender</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              id={`action-buy-${course.id}`}
              onClick={(e) => onStartPurchase(e, course)}
              className="bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              {isFree ? 'Empezar Gratis' : 'Obtener'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
