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
  reorderLessonsInSupabase,
  syncLinuxCourseLessonsToSupabase,
  fetchPurchasesFromSupabase,
  verifyPayPalPurchaseOnServer,
  enrollFreeCourseOnServer,
  fetchProgressFromSupabase,
  toggleProgressInSupabase,
  upsertFaqInSupabase,
  deleteFaqFromSupabase
} from './services/db';
import { ensureUserProfile, resolveUserRole } from './services/auth';
import { supabase } from './supabaseClient';
import { addNotification } from './services/notifications';

export default function App() {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isUserAdmin, setIsUserAdmin] = useState<boolean>(false);
  
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
    // Clean up any legacy synthetic token keys
    localStorage.removeItem('courses_student_token');

    // 1. Initial Courses Setup directly from Supabase
    const initCourses = async () => {
      setLoadingCourses(true);
      const { courses } = await fetchCoursesFromSupabase();
      setCoursesList(courses);
      setLoadingCourses(false);
    };
    initCourses();

    const applyAuthenticatedSession = async (session: any) => {
      if (!session?.user) return;
      const email = session.user.email || '';
      const name =
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        session.user.user_metadata?.display_name ||
        email.split('@')[0];
      const token = session.access_token;

      setUserToken(token);
      setUserEmail(email);
      setUserName(name || email.split('@')[0]);

      await ensureUserProfile(session.user);
      const role = await resolveUserRole(session.user);
      const adminFlag = role === 'admin';
      setIsUserAdmin(adminFlag);
      if (adminFlag) {
        syncLinuxCourseLessonsToSupabase();
      }
      loadUserSupabaseData(email);
    };

    // 2. Initial Session Restore strictly from Supabase Auth
    const restoreSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          await applyAuthenticatedSession(session);
        }
      } catch (err) {
        console.warn('Error verificando sesión activa con Supabase:', err);
      }
    };
    restoreSession();

    // 3. Setup real global Supabase Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
        applyAuthenticatedSession(session);
      } else if (_event === 'SIGNED_OUT') {
        setUserToken(null);
        setUserEmail('');
        setUserName('');
        setIsUserAdmin(false);
        setPurchasedCourseIds([]);
        setCompletedLessonIds([]);
        setCurrentView('catalog');

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

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await ensureUserProfile(session.user);
      const role = await resolveUserRole(session.user);
      setIsUserAdmin(role === 'admin');
    } else {
      setIsUserAdmin(false);
    }

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
    
    setUserToken(null);
    setUserEmail('');
    setUserName('');
    setIsUserAdmin(false);
    setPurchasedCourseIds([]);
    setCompletedLessonIds([]);
    setActiveCourse(null);
    setCurrentView('catalog');
  };

  // 1a. PAID PURCHASE: Verified on server with PayPal API before granting access
  const handleVerifyPayPalPurchase = async (
    courseId: string,
    orderId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await verifyPayPalPurchaseOnServer(courseId, orderId);
    if (!res.success) {
      return res;
    }

    setPurchasedCourseIds((prev) => (prev.includes(courseId) ? prev : [...prev, courseId]));
    if (userEmail) {
      const targetCourse = coursesList.find((c) => c.id === courseId);
      const courseTitle = targetCourse ? targetCourse.title : 'tu curso seleccionado';
      addNotification(userEmail, {
        type: 'purchase',
        title: '¡Pago e Inscripción confirmados!',
        message: `Te has inscrito exitosamente en "${courseTitle}". Ya tienes acceso a todos sus capítulos y contenidos.`,
        courseId
      });
    }
    return { success: true };
  };

  // 1b. FREE ENROLLMENT: Verified price === 0 on server / RLS before granting access
  const handleEnrollFreeCourse = async (
    courseId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await enrollFreeCourseOnServer(courseId);
    if (!res.success) {
      return res;
    }

    setPurchasedCourseIds((prev) => (prev.includes(courseId) ? prev : [...prev, courseId]));
    if (userEmail) {
      const targetCourse = coursesList.find((c) => c.id === courseId);
      const courseTitle = targetCourse ? targetCourse.title : 'tu curso seleccionado';
      addNotification(userEmail, {
        type: 'purchase',
        title: '¡Inscripción confirmada!',
        message: `Te has inscrito gratuitamente en "${courseTitle}". Ya tienes acceso a todos sus capítulos y contenidos.`,
        courseId
      });
    }
    return { success: true };
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
    localStorage.setItem('courses_dynamic', JSON.stringify(updated));
    const res = await upsertCourseInSupabase(newCourse);
    if (!res.success) {
      console.error('No se pudo guardar el nuevo curso en Supabase:', res.error);
    }

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
    const lessonWithOrder: Lesson = { ...newLesson, orderIndex };

    const updated = coursesList.map((course) => {
      if (course.id === courseId) {
        return {
          ...course,
          lessons: [...course.lessons, lessonWithOrder]
        };
      }
      return course;
    });
    setCoursesList(updated);
    localStorage.setItem('courses_dynamic', JSON.stringify(updated));

    if (activeCourse && activeCourse.id === courseId) {
      setActiveCourse({
        ...activeCourse,
        lessons: [...activeCourse.lessons, lessonWithOrder]
      });
    }

    await upsertLessonInSupabase(courseId, lessonWithOrder, orderIndex, targetCourse);
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
    localStorage.setItem('courses_dynamic', JSON.stringify(updated));

    if (activeCourse && activeCourse.id === updatedCourse.id) {
      setActiveCourse({
        ...activeCourse,
        ...updatedCourse,
        lessons: updatedCourse.lessons || activeCourse.lessons
      });
    }

    const res = await upsertCourseInSupabase(updatedCourse);
    if (!res.success) {
      console.error('No se pudo actualizar el curso en Supabase:', res.error);
    }
  };

  // 7. ADMIN: Update Lesson directly in Supabase 'lessons' preserving exact position
  const handleUpdateLesson = async (courseId: string, updatedLesson: Lesson) => {
    const targetCourse = coursesList.find((c) => c.id === courseId);
    const existingIndex = targetCourse
      ? targetCourse.lessons.findIndex((lesson) => lesson.id === updatedLesson.id)
      : -1;
    const existingLesson = existingIndex >= 0 ? targetCourse?.lessons[existingIndex] : undefined;
    const preservedOrderIndex =
      typeof updatedLesson.orderIndex === 'number'
        ? updatedLesson.orderIndex
        : typeof existingLesson?.orderIndex === 'number'
          ? existingLesson.orderIndex
          : existingIndex >= 0
            ? existingIndex
            : 0;

    const lessonWithOrder: Lesson = {
      ...updatedLesson,
      orderIndex: preservedOrderIndex
    };

    const updated = coursesList.map((course) => {
      if (course.id === courseId) {
        return {
          ...course,
          lessons: course.lessons.map((lesson) =>
            lesson.id === updatedLesson.id ? lessonWithOrder : lesson
          )
        };
      }
      return course;
    });
    setCoursesList(updated);
    localStorage.setItem('courses_dynamic', JSON.stringify(updated));

    if (activeCourse && activeCourse.id === courseId) {
      setActiveCourse({
        ...activeCourse,
        lessons: activeCourse.lessons.map((lesson) =>
          lesson.id === updatedLesson.id ? lessonWithOrder : lesson
        )
      });
    }

    await upsertLessonInSupabase(courseId, lessonWithOrder, preservedOrderIndex, targetCourse);
  };

  // 7b. ADMIN: Reorder Lessons via Drag & Drop and persist order_index in Supabase
  const handleReorderLessons = async (courseId: string, reorderedLessons: Lesson[]) => {
    const targetCourse = coursesList.find((c) => c.id === courseId);
    const normalizedLessons: Lesson[] = reorderedLessons.map((lesson, idx) => ({
      ...lesson,
      orderIndex: idx
    }));

    const updated = coursesList.map((course) => {
      if (course.id === courseId) {
        return {
          ...course,
          lessons: normalizedLessons
        };
      }
      return course;
    });
    setCoursesList(updated);
    localStorage.setItem('courses_dynamic', JSON.stringify(updated));

    if (activeCourse && activeCourse.id === courseId) {
      setActiveCourse({
        ...activeCourse,
        lessons: normalizedLessons
      });
    }

    await reorderLessonsInSupabase(courseId, normalizedLessons, targetCourse);
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

  // If there is no active Supabase session, render the Authorization form
  if (!userToken) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-200">
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
        onGoToAdmin={() => {
          if (isUserAdmin) {
            setCurrentView('admin');
          }
        }}
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
        {currentView === 'admin' && isUserAdmin ? (
          <AdminView
            isAdmin={isUserAdmin}
            courses={coursesList}
            onAddCourse={handleAddCourse}
            onAddLesson={handleAddLesson}
            onDeleteCourse={handleDeleteCourse}
            onUpdateCourse={handleUpdateCourse}
            onUpdateLesson={handleUpdateLesson}
            onReorderLessons={handleReorderLessons}
            onUpsertFaq={handleUpsertFaq}
            onDeleteFaq={handleDeleteFaq}
            onBackToCatalog={handleGoHome}
          />
        ) : currentView === 'viewer' && activeCourse ? (
          <CourseViewer
            course={activeCourse}
            completedLessonIds={completedLessonIds}
            onToggleLessonCompleted={handleToggleLessonCompleted}
            onBackToCatalog={handleGoHome}
            userName={userName}
            userEmail={userEmail}
          />
        ) : (
          <CatalogView
            courses={coursesList}
            purchasedCourseIds={purchasedCourseIds}
            onVerifyPayPalPurchase={handleVerifyPayPalPurchase}
            onEnrollFreeCourse={handleEnrollFreeCourse}
            onViewCourse={handleViewCourse}
            selectedCategory={catalogCategory}
            onSelectCategory={setCatalogCategory}
          />
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
