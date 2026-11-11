import React, { useState, useEffect } from 'react';
import { Course, Lesson, CourseFaq } from './types';
import LoginView from './components/LoginView';
import Navbar from './components/Navbar';
import CatalogView from './components/CatalogView';
import CourseViewer from './components/CourseViewer';
import AdminView from './components/AdminView';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import {
  fetchCoursesFromSupabase,
  upsertCourseInSupabase,
  deleteCourseFromSupabase,
  upsertLessonInSupabase,
  fetchPurchasesFromSupabase,
  recordPurchaseInSupabase,
  fetchProgressFromSupabase,
  toggleProgressInSupabase,
  upsertFaqInSupabase,
  deleteFaqFromSupabase
} from './services/db';
import { isSessionVerifiedAdmin } from './services/auth';
import { supabase } from './supabaseClient';
import { addNotification } from './services/notifications';

export default function App() {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  
  // Current active view state: 'catalog' | 'viewer' | 'admin'
  const [currentView, setCurrentView] = useState<'catalog' | 'viewer' | 'admin'>('catalog');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  
  // Loaded dynamic courses state from Supabase
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Storage of student progression synced with Supabase
  const [purchasedCourseIds, setPurchasedCourseIds] = useState<string[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

  // Helper to load user-specific records from Supabase
  const loadUserSupabaseData = async (email: string) => {
    if (!email) return;
    try {
      const [purchases, progress] = await Promise.all([
        fetchPurchasesFromSupabase(email),
        fetchProgressFromSupabase(email)
      ]);
      setPurchasedCourseIds(purchases);
      setCompletedLessonIds(progress);
    } catch (e) {
      console.warn('Error cargando datos de usuario desde Supabase:', e);
    }
  };

  // Load courses and login state on initial load
  useEffect(() => {
    // 1. Initial Courses Setup directly from Supabase
    const initCourses = async () => {
      setLoadingCourses(true);
      const { courses } = await fetchCoursesFromSupabase();
      setCoursesList(courses);
      setLoadingCourses(false);
    };
    initCourses();

    // 2. Initial Session Restore from LocalStorage
    const savedToken = localStorage.getItem('courses_student_token');
    const savedEmail = localStorage.getItem('courses_student_email');
    const savedName = localStorage.getItem('courses_student_name');

    if (savedToken && savedEmail) {
      setUserToken(savedToken);
      setUserEmail(savedEmail);
      setUserName(savedName || savedEmail.split('@')[0]);
      loadUserSupabaseData(savedEmail);
    }

    // 3. Setup real global Supabase Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
        const email = session.user.email || '';
        const name = session.user.user_metadata?.display_name || email.split('@')[0];
        const token = session.access_token;

        setUserToken(token);
        setUserEmail(email);
        setUserName(name || email.split('@')[0]);

        // Sync token in localStorage
        localStorage.setItem('courses_student_token', token);
        localStorage.setItem('courses_student_email', email);
        if (name) {
          localStorage.setItem('courses_student_name', name);
        }

        // Fetch user purchases and progress from Supabase
        loadUserSupabaseData(email);
      } else if (_event === 'SIGNED_OUT') {
        // Explicit logout event
        setUserToken(null);
        setUserEmail('');
        setUserName('');
        setPurchasedCourseIds([]);
        setCompletedLessonIds([]);
        
        localStorage.removeItem('courses_student_token');
        localStorage.removeItem('courses_student_email');
        localStorage.removeItem('courses_student_name');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = async (email: string, name: string, token: string) => {
    setUserToken(token);
    setUserEmail(email);
    setUserName(name);
    setCurrentView('catalog');

    // Load purchases & progress from Supabase
    await loadUserSupabaseData(email);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error signing out from Supabase Auth:', e);
    }
    
    localStorage.removeItem('courses_student_token');
    localStorage.removeItem('courses_student_email');
    localStorage.removeItem('courses_student_name');
    
    // Reset React state values
    setUserToken(null);
    setUserEmail('');
    setUserName('');
    setPurchasedCourseIds([]);
    setCompletedLessonIds([]);
    setActiveCourse(null);
    setCurrentView('catalog');
  };

  // 1. PURCHASE: Save directly to Supabase user_purchases
  const handlePurchaseCourse = async (courseId: string) => {
    const updated = [...purchasedCourseIds, courseId];
    setPurchasedCourseIds(updated);
    if (userEmail) {
      await recordPurchaseInSupabase(userEmail, courseId);

      const targetCourse = coursesList.find((c) => c.id === courseId);
      const courseTitle = targetCourse ? targetCourse.title : 'tu curso seleccionado';
      addNotification(userEmail, {
        type: 'purchase',
        title: '¡Pago e Inscripción confirmados!',
        message: `Te has inscrito exitosamente en "${courseTitle}". Ya tienes acceso a todos sus capítulos y contenidos.`,
        courseId
      });
    }
  };

  // 2. PROGRESS: Save directly to Supabase lesson_progress
  const handleToggleLessonCompleted = async (courseId: string, lessonId: string) => {
    const willBeCompleted = !completedLessonIds.includes(lessonId);
    let updated: string[];
    if (willBeCompleted) {
      updated = [...completedLessonIds, lessonId];
    } else {
      updated = completedLessonIds.filter((id) => id !== lessonId);
    }
    setCompletedLessonIds(updated);

    if (userEmail) {
      await toggleProgressInSupabase(userEmail, courseId, lessonId, willBeCompleted);

      if (willBeCompleted) {
        const course = coursesList.find((c) => c.id === courseId);
        const lesson = course?.lessons.find((l) => l.id === lessonId);
        const lessonTitle = lesson ? lesson.title : 'Lección';

        const courseLessons = course?.lessons || [];
        const isCourse100Percent =
          courseLessons.length > 0 &&
          courseLessons.every((l) => updated.includes(l.id));

        if (isCourse100Percent) {
          addNotification(userEmail, {
            type: 'certificate',
            title: '🎓 ¡Curso completado al 100%!',
            message: `¡Enhorabuena! Has completado todas las clases de "${course?.title || 'tu curso'}". Ya puedes emitir y descargar tu Diploma de Acreditación.`,
            courseId
          });
        } else {
          addNotification(userEmail, {
            type: 'lesson',
            title: '¡Clase completada!',
            message: `Completaste satisfactoriamente "${lessonTitle}". ¡Continúa avanzando!`,
            courseId
          });
        }
      }
    }
  };

  const handleViewCourse = (course: Course) => {
    const actualCourse = coursesList.find(c => c.id === course.id) || course;
    setActiveCourse(actualCourse);
    setCurrentView('viewer');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const [catalogCategory, setCatalogCategory] = useState<string>('Todos');

  const handleGoHome = () => {
    setActiveCourse(null);
    setCatalogCategory('Todos');
    setCurrentView('catalog');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleGoToLearning = () => {
    setActiveCourse(null);
    setCatalogCategory('Mis Cursos');
    setCurrentView('catalog');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  // 3. ADMIN: Add new Course directly into Supabase 'courses'
  const handleAddCourse = async (newCourse: Course) => {
    const updated = [...coursesList, newCourse];
    setCoursesList(updated);
    await upsertCourseInSupabase(newCourse);

    if (userEmail) {
      addNotification(userEmail, {
        type: 'system',
        title: 'Nuevo curso publicado',
        message: `Has creado y publicado el curso "${newCourse.title}". Ya está disponible en la plataforma.`,
        courseId: newCourse.id
      });
    }
  };

  // 4. ADMIN: Add Lesson directly into Supabase 'lessons'
  const handleAddLesson = async (courseId: string, newLesson: Lesson) => {
    const targetCourse = coursesList.find((c) => c.id === courseId);
    const orderIndex = targetCourse ? targetCourse.lessons.length : 0;

    const updated = coursesList.map((course) => {
      if (course.id === courseId) {
        return {
          ...course,
          lessons: [...course.lessons, newLesson]
        };
      }
      return course;
    });
    setCoursesList(updated);

    if (activeCourse && activeCourse.id === courseId) {
      setActiveCourse({
        ...activeCourse,
        lessons: [...activeCourse.lessons, newLesson]
      });
    }

    await upsertLessonInSupabase(courseId, newLesson, orderIndex, targetCourse);
  };

  // 5. ADMIN: Delete Course directly from Supabase 'courses'
  const handleDeleteCourse = async (courseId: string) => {
    const updated = coursesList.filter((course) => course.id !== courseId);
    setCoursesList(updated);
    localStorage.setItem('courses_dynamic', JSON.stringify(updated));
    await deleteCourseFromSupabase(courseId);
  };

  // 6. ADMIN: Update Course directly in Supabase 'courses'
  const handleUpdateCourse = async (updatedCourse: Course) => {
    const updated = coursesList.map((course) => {
      if (course.id === updatedCourse.id) {
        return {
          ...updatedCourse,
          lessons: updatedCourse.lessons || course.lessons
        };
      }
      return course;
    });
    setCoursesList(updated);

    if (activeCourse && activeCourse.id === updatedCourse.id) {
      setActiveCourse({
        ...activeCourse,
        ...updatedCourse,
        lessons: updatedCourse.lessons || activeCourse.lessons
      });
    }

    await upsertCourseInSupabase(updatedCourse);
  };

  // 7. ADMIN: Update Lesson directly in Supabase 'lessons'
  const handleUpdateLesson = async (courseId: string, updatedLesson: Lesson) => {
    const targetCourse = coursesList.find((c) => c.id === courseId);
    const updated = coursesList.map((course) => {
      if (course.id === courseId) {
        return {
          ...course,
          lessons: course.lessons.map((lesson) => 
            lesson.id === updatedLesson.id ? updatedLesson : lesson
          )
        };
      }
      return course;
    });
    setCoursesList(updated);

    if (activeCourse && activeCourse.id === courseId) {
      setActiveCourse({
        ...activeCourse,
        lessons: activeCourse.lessons.map((lesson) => 
          lesson.id === updatedLesson.id ? updatedLesson : lesson
        )
      });
    }

    await upsertLessonInSupabase(courseId, updatedLesson, 0, targetCourse);
  };

  // 8. ADMIN: Add or Update FAQ directly in Supabase 'course_faqs'
  const handleUpsertFaq = async (courseId: string, faq: CourseFaq) => {
    const targetCourse = coursesList.find((c) => c.id === courseId);
    if (!targetCourse) return;

    const existingFaqs = targetCourse.faqs || [];
    const idx = existingFaqs.findIndex((f) => f.id === faq.id);
    let updatedFaqs: CourseFaq[];
    if (idx >= 0) {
      updatedFaqs = [...existingFaqs];
      updatedFaqs[idx] = faq;
    } else {
      updatedFaqs = [...existingFaqs, faq];
    }

    const updatedCourses = coursesList.map((course) => {
      if (course.id === courseId) {
        return {
          ...course,
          faqs: updatedFaqs
        };
      }
      return course;
    });
    setCoursesList(updatedCourses);

    if (activeCourse && activeCourse.id === courseId) {
      setActiveCourse({
        ...activeCourse,
        faqs: updatedFaqs
      });
    }

    await upsertFaqInSupabase(courseId, faq, faq.orderIndex || updatedFaqs.length - 1, targetCourse);
  };

  // 9. ADMIN: Delete FAQ directly from Supabase 'course_faqs'
  const handleDeleteFaq = async (courseId: string, faqId: string) => {
    const targetCourse = coursesList.find((c) => c.id === courseId);
    if (!targetCourse) return;

    const updatedFaqs = (targetCourse.faqs || []).filter((f) => f.id !== faqId);

    const updatedCourses = coursesList.map((course) => {
      if (course.id === courseId) {
        return {
          ...course,
          faqs: updatedFaqs
        };
      }
      return course;
    });
    setCoursesList(updatedCourses);

    if (activeCourse && activeCourse.id === courseId) {
      setActiveCourse({
        ...activeCourse,
        faqs: updatedFaqs
      });
    }

    await deleteFaqFromSupabase(faqId, courseId);
  };

  // If there is no simulated session active, render the Authorization form
  if (!userToken) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Admin access validation
  const isUserAdmin = isSessionVerifiedAdmin(userEmail, userToken);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-200">
      <ScrollToTop dependencies={[currentView, activeCourse?.id, catalogCategory]} />
      
      {/* Global Dashboard Navigation Header */}
      <Navbar
        userEmail={userEmail}
        userName={userName}
        purchasedCount={purchasedCourseIds.length}
        completedLessonsCount={completedLessonIds.length}
        currentView={currentView}
        onLogout={handleLogout}
        onGoHome={handleGoHome}
        onGoToLearning={handleGoToLearning}
        showAdminBtn={isUserAdmin}
        onGoToAdmin={() => setCurrentView('admin')}
        onNavigateToCourse={(courseId) => {
          const target = coursesList.find((c) => c.id === courseId);
          if (target) {
            handleViewCourse(target);
          } else {
            handleGoToLearning();
          }
        }}
      />

      {/* Main Container Sandbox Views */}
      <main className="flex-1">
        {currentView === 'catalog' ? (
          <CatalogView
            courses={coursesList}
            purchasedCourseIds={purchasedCourseIds}
            onPurchaseCourse={handlePurchaseCourse}
            onViewCourse={handleViewCourse}
            selectedCategory={catalogCategory}
            onSelectCategory={setCatalogCategory}
          />
        ) : currentView === 'admin' ? (
          <AdminView
            courses={coursesList}
            onAddCourse={handleAddCourse}
            onAddLesson={handleAddLesson}
            onDeleteCourse={handleDeleteCourse}
            onUpdateCourse={handleUpdateCourse}
            onUpdateLesson={handleUpdateLesson}
            onUpsertFaq={handleUpsertFaq}
            onDeleteFaq={handleDeleteFaq}
            onBackToCatalog={handleGoHome}
          />
        ) : (
          activeCourse && (
            <CourseViewer
              course={activeCourse}
              completedLessonIds={completedLessonIds}
              onToggleLessonCompleted={handleToggleLessonCompleted}
              onBackToCatalog={handleGoHome}
              userName={userName}
              userEmail={userEmail}
            />
          )
        )}
      </main>

      {/* Modern SaaS Multi-Column Footer */}
      <Footer
        onGoToCatalog={handleGoHome}
        onGoToLearning={handleGoToLearning}
        onGoToAdmin={isUserAdmin ? () => setCurrentView('admin') : undefined}
      />

    </div>
  );
}
