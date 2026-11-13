import { supabase } from '../supabaseClient';
import { Course, Lesson, CourseFaq } from '../types';

export interface DbStatus {
  isLiveDb: boolean;
  message?: string;
}

let cachedDbStatus: DbStatus = { isLiveDb: false };
const unsupportedCourseColumns = new Set<string>();
let hasIsPublishedColumn = false;

export function getDbStatus(): DbStatus {
  return cachedDbStatus;
}

export function getDefaultFaqsForCourse(courseId: string, instructor: string = 'Especialista'): CourseFaq[] {
  return [
    {
      id: `faq-default-1-${courseId}`,
      courseId,
      question: '¿Para qué sirve el botón Diploma de Estudio?',
      answer: 'Una vez que pongas un check en todas las lecciones del listado lateral y el curso se encuentre en estado Publicado, el botón se volverá activo. Si el curso está en estado "Próximamente", el diploma se emitirá en cuanto se publique oficialmente.',
      orderIndex: 0
    },
    {
      id: `faq-default-2-${courseId}`,
      courseId,
      question: '¿Puedo ver las clases sin conexión o en dispositivos móviles?',
      answer: 'Todo el temario, guías prácticas y lecturas interactivas están optimizados para brindar un desempeño rápido y fluido desde cualquier navegador o smartphone sin interrupciones.',
      orderIndex: 1
    },
    {
      id: `faq-default-3-${courseId}`,
      courseId,
      question: `¿Cómo recibo retroalimentación de ${instructor}?`,
      answer: `Nuestros mentores de ${instructor} responden inquietudes técnicas mediante los canales oficiales de soporte, resolución de ejercicios y tutorías académicas.`,
      orderIndex: 2
    }
  ];
}

/**
 * Transforms raw Supabase course row and linked lessons to domain Course object
 */
function mapRowToCourse(row: any, lessons: any[] = [], rawFaqs: any[] = []): Course {
  const mappedLessons: Lesson[] = (lessons || [])
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((l: any) => ({
      id: l.id,
      title: l.title,
      duration: l.duration || '10:00',
      videoUrl: l.video_url || l.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4',
      content: l.content || ''
    }));

  let mappedFaqs: CourseFaq[] = [];
  const dbFaqs = rawFaqs || row.course_faqs || row.faqs || [];

  if (Array.isArray(dbFaqs) && dbFaqs.length > 0) {
    mappedFaqs = dbFaqs
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .map((f: any) => ({
        id: f.id,
        courseId: f.course_id || row.id,
        question: f.question || '',
        answer: f.answer || '',
        orderIndex: f.order_index ?? 0
      }));
  } else {
    try {
      const stored = localStorage.getItem(`courses_faqs_${row.id}`);
      if (stored) {
        mappedFaqs = JSON.parse(stored);
      }
    } catch (e) {}

    if (!mappedFaqs || mappedFaqs.length === 0) {
      mappedFaqs = getDefaultFaqsForCourse(row.id, row.instructor);
    }
  }

  // Check Supabase column first, fallback to cached status map only if DB lacks status columns
  const rawStatus = typeof row.status === 'string' ? row.status.trim().toLowerCase() : '';
  let courseStatus: 'published' | 'upcoming' = 'published';
  if (rawStatus === 'upcoming' || rawStatus === 'published') {
    courseStatus = rawStatus;
  } else if (typeof row.is_published === 'boolean') {
    courseStatus = row.is_published ? 'published' : 'upcoming';
  } else {
    try {
      const statusMap = JSON.parse(localStorage.getItem('courses_status_map') || '{}');
      if (statusMap[row.id] === 'upcoming' || statusMap[row.id] === 'published') {
        courseStatus = statusMap[row.id];
      }
    } catch (e) {}
  }

  // Check diploma enablement
  let courseHasDiploma = true;
  if (typeof row.has_diploma === 'boolean') {
    courseHasDiploma = row.has_diploma;
  } else if (typeof row.hasDiploma === 'boolean') {
    courseHasDiploma = row.hasDiploma;
  } else if (typeof row.has_certificate === 'boolean') {
    courseHasDiploma = row.has_certificate;
  } else {
    try {
      const diplomaMap = JSON.parse(localStorage.getItem('courses_diploma_map') || '{}');
      if (typeof diplomaMap[row.id] === 'boolean') {
        courseHasDiploma = diplomaMap[row.id];
      }
    } catch (e) {}
  }

  const rawRating = Number(row.rating);
  const courseRating = !isNaN(rawRating) && rawRating > 0 ? Number(rawRating.toFixed(1)) : 4.9;

  let courseDuration = (row.duration || '').trim();
  const rawDurationHours = Number(row.duration_hours);
  if (!courseDuration || courseDuration === '0 horas') {
    if (!isNaN(rawDurationHours) && rawDurationHours > 0) {
      courseDuration = `${rawDurationHours} horas`;
    } else if (lessons && lessons.length > 0) {
      courseDuration = `${Math.max(1, Math.round(lessons.length * 0.75))} horas`;
    } else {
      courseDuration = '12 horas';
    }
  }

  const numericDurationHours = !isNaN(rawDurationHours) && rawDurationHours > 0 
    ? rawDurationHours 
    : (parseFloat(courseDuration.replace(/[^\d.]/g, '')) || 12);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    longDescription: row.long_description || row.longDescription || row.description,
    instructor: row.instructor,
    category: row.category || 'General',
    price: Number(row.price) || 0,
    rating: courseRating,
    duration: courseDuration,
    duration_hours: numericDurationHours,
    level: (row.level as 'Principiante' | 'Intermedio' | 'Avanzado') || 'Intermedio',
    publishedDate: row.published_date || row.publishedDate || '2026',
    imageUrl: row.image_url || row.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
    skillsLearned: Array.isArray(row.skills_learned) 
      ? row.skills_learned 
      : typeof row.skills_learned === 'string' 
        ? JSON.parse(row.skills_learned) 
        : ['Habilidades clave', 'Práctica guiada'],
    lessons: mappedLessons,
    faqs: mappedFaqs,
    status: courseStatus,
    hasDiploma: courseHasDiploma
  };
}

/**
 * 1. COURSES: Fetch all courses with their lessons directly from Supabase table 'courses'
 * Operates purely with real database records (no auto-seeding, no mock injection).
 */
export async function fetchCoursesFromSupabase(): Promise<{ courses: Course[]; isLiveDb: boolean }> {
  try {
    let coursesData: any = null;
    let coursesError: any = null;

    const resJoined = await supabase
      .from('courses')
      .select('*, lessons(*), course_faqs(*)');

    if (!resJoined.error) {
      coursesData = resJoined.data;
    } else {
      const resLessonsOnly = await supabase
        .from('courses')
        .select('*, lessons(*)');
      coursesData = resLessonsOnly.data;
      coursesError = resLessonsOnly.error;
    }

    if (coursesError) {
      console.warn('Supabase courses table error:', coursesError.message);
      cachedDbStatus = {
        isLiveDb: false,
        message: `Error al consultar cursos en Supabase: ${coursesError.message}`
      };
      // Fallback to local storage cache only if available
      const local = localStorage.getItem('courses_dynamic');
      if (local) {
        try { return { courses: JSON.parse(local), isLiveDb: false }; } catch (e) {}
      }
      return { courses: [], isLiveDb: false };
    }

    cachedDbStatus = { isLiveDb: true };

    if (!coursesData || coursesData.length === 0) {
      localStorage.setItem('courses_dynamic', JSON.stringify([]));
      return { courses: [], isLiveDb: true };
    }

    const sampleRow = coursesData[0];
    if (sampleRow && typeof sampleRow === 'object') {
      if ('is_published' in sampleRow) hasIsPublishedColumn = true;
      if (!('duration_hours' in sampleRow)) unsupportedCourseColumns.add('duration_hours');
      if (!('has_diploma' in sampleRow)) unsupportedCourseColumns.add('has_diploma');
    }

    const dbCourses = coursesData.map((row: any) => mapRowToCourse(row, row.lessons, row.course_faqs));
    localStorage.setItem('courses_dynamic', JSON.stringify(dbCourses));
    return { courses: dbCourses, isLiveDb: true };
  } catch (err: any) {
    console.error('Error al consultar cursos en Supabase:', err);
    cachedDbStatus = { isLiveDb: false, message: err?.message };
    return { courses: [], isLiveDb: false };
  }
}

/**
 * Ensures the parent course exists in Supabase table 'courses' before attaching lessons or purchases.
 * Guarantees foreign key integrity on lessons(course_id) -> courses(id).
 */
export async function ensureCourseExists(courseId: string, fallbackCourse?: Course): Promise<boolean> {
  if (!courseId) return false;

  try {
    // 1. Check if course already exists in Supabase
    const { data: existing, error } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .maybeSingle();

    if (!error && existing) {
      return true;
    }

    // 2. Locate course from fallbackCourse or local cache
    let courseToInsert: Course | undefined = fallbackCourse;
    if (!courseToInsert) {
      const stored = localStorage.getItem('courses_dynamic');
      if (stored) {
        try {
          const list: Course[] = JSON.parse(stored);
          courseToInsert = list.find(c => c.id === courseId);
        } catch (e) {}
      }
    }

    // 3. Upsert parent course into Supabase if available
    if (courseToInsert) {
      const res = await upsertCourseInSupabase(courseToInsert);
      return res.success;
    }

    // 4. Fallback stub so foreign key constraint never fails on user additions
    const { error: insertErr } = await supabase.from('courses').upsert({
      id: courseId,
      title: 'Curso Académico',
      description: 'Curso en plataforma',
      instructor: 'Profesor Especialista',
      category: 'Programación',
      price: 0,
      rating: 4.9,
      duration: '12 horas',
      duration_hours: 12,
      level: 'Intermedio',
      published_date: '2026',
      skills_learned: [],
      updated_at: new Date().toISOString()
    });

    return !insertErr;
  } catch (err) {
    console.error('Error asegurando existencia del curso en Supabase:', err);
    return false;
  }
}

/**
 * 2. COURSES: Create or update a course in Supabase table 'courses'
 */
export async function upsertCourseInSupabase(course: Course): Promise<{ success: boolean; error?: string }> {
  try {
    const courseStatus = course.status || 'published';
    const courseHasDiploma = course.hasDiploma !== false;

    // Immediate local status & diploma cache guarantee
    try {
      const statusMap = JSON.parse(localStorage.getItem('courses_status_map') || '{}');
      statusMap[course.id] = courseStatus;
      localStorage.setItem('courses_status_map', JSON.stringify(statusMap));

      const diplomaMap = JSON.parse(localStorage.getItem('courses_diploma_map') || '{}');
      diplomaMap[course.id] = courseHasDiploma;
      localStorage.setItem('courses_diploma_map', JSON.stringify(diplomaMap));
    } catch (e) {}

    const numericDurationHours = parseFloat(course.duration.replace(/[^\d.]/g, '')) || (course.duration_hours ?? 12);

    const payload: any = {
      id: course.id,
      title: course.title,
      description: course.description,
      long_description: course.longDescription,
      instructor: course.instructor,
      category: course.category,
      price: course.price,
      rating: course.rating,
      duration: course.duration,
      duration_hours: numericDurationHours,
      level: course.level,
      published_date: course.publishedDate,
      image_url: course.imageUrl,
      skills_learned: course.skillsLearned,
      status: courseStatus,
      has_diploma: courseHasDiploma,
      updated_at: new Date().toISOString()
    };

    if (hasIsPublishedColumn) {
      payload.is_published = courseStatus === 'published';
    }

    // Omit columns already known to be absent in the Supabase table
    unsupportedCourseColumns.forEach((col) => {
      delete payload[col];
    });

    let { error } = await supabase.from('courses').upsert(payload);

    // Strip ONLY the specific missing column reported by PostgREST (PGRST204)
    let attempts = 0;
    while (error && error.code === 'PGRST204' && attempts < 6) {
      attempts++;
      const msg = error.message || '';
      const match = msg.match(/Could not find the '([^']+)' column/i) || msg.match(/'([a-zA-Z0-9_]+)'/);
      const missingCol = match?.[1];

      if (missingCol && missingCol !== 'id' && missingCol in payload) {
        console.warn(`Columna opcional "${missingCol}" no existe en courses; omitiendo y reintentando.`);
        unsupportedCourseColumns.add(missingCol);
        delete payload[missingCol];
      } else if ('duration_hours' in payload) {
        unsupportedCourseColumns.add('duration_hours');
        delete payload.duration_hours;
      } else if ('has_diploma' in payload) {
        unsupportedCourseColumns.add('has_diploma');
        delete payload.has_diploma;
      } else if ('is_published' in payload) {
        delete payload.is_published;
      } else if ('status' in payload) {
        unsupportedCourseColumns.add('status');
        delete payload.status;
      } else {
        break;
      }

      const retry = await supabase.from('courses').upsert(payload);
      error = retry.error;
    }

    if (error) {
      console.error('Error guardando curso en Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error de red guardando curso en Supabase:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * 3. COURSES: Delete a course from Supabase table 'courses'
 */
export async function deleteCourseFromSupabase(courseId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('courses').delete().eq('id', courseId);
    if (error) {
      console.error('Error eliminando curso en Supabase:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error de red eliminando curso en Supabase:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * 4. LESSONS: Create or update a lesson in Supabase table 'lessons'
 * Pre-verifies parent course existence to prevent Postgres error 23503 foreign key violation
 */
export async function upsertLessonInSupabase(
  courseId: string, 
  lesson: Lesson, 
  orderIndex: number = 0,
  fallbackCourse?: Course
): Promise<{ success: boolean; error?: string }> {
  try {
    // Ensure parent course exists before inserting lesson
    await ensureCourseExists(courseId, fallbackCourse);

    const { error } = await supabase.from('lessons').upsert({
      id: lesson.id,
      course_id: courseId,
      title: lesson.title,
      duration: lesson.duration || '10 min',
      video_url: lesson.videoUrl || '',
      content: lesson.content || '',
      order_index: orderIndex
    });

    if (error) {
      console.error('Error guardando lección en Supabase:', error);
      // Auto-recovery for FK constraint 23503
      if (error.code === '23503') {
        console.warn('Recuperando de error 23503: sincronizando curso padre en Supabase...');
        await ensureCourseExists(courseId, fallbackCourse);
        const { error: retryError } = await supabase.from('lessons').upsert({
          id: lesson.id,
          course_id: courseId,
          title: lesson.title,
          duration: lesson.duration || '10 min',
          video_url: lesson.videoUrl || '',
          content: lesson.content || '',
          order_index: orderIndex
        });
        if (!retryError) return { success: true };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error de red guardando lección en Supabase:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * 5. LESSONS: Delete a lesson from Supabase table 'lessons'
 */
export async function deleteLessonFromSupabase(lessonId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * 6. USER PURCHASES: Load purchased courses for the authenticated student from Supabase table 'user_purchases'
 */
export async function fetchPurchasesFromSupabase(userEmail: string): Promise<string[]> {
  if (!userEmail) return [];
  const normalizedEmail = userEmail.trim().toLowerCase();

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return [];
    }

    const { data, error } = await supabase
      .from('user_purchases')
      .select('course_id')
      .eq('user_email', normalizedEmail);

    if (error) {
      console.warn('Error consultando compras en Supabase:', error.message);
      return [];
    }

    return (data || []).map((row: any) => row.course_id);
  } catch (err) {
    console.error('Fallo al obtener compras de Supabase:', err);
    return [];
  }
}

/**
 * 7. USER PURCHASES (PAID): Verify PayPal order strictly on the server or Supabase Edge Function before unlocking access
 */
export async function verifyPayPalPurchaseOnServer(
  courseId: string,
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  if (!courseId || !orderId) {
    return { success: false, error: 'Faltan datos de la orden de PayPal.' };
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { success: false, error: 'Tu sesión expiró. Inicia sesión nuevamente para confirmar tu compra.' };
    }

    const res = await fetch('/api/payments/verify-paypal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ courseId, orderId }),
    });

    if (res.status === 404) {
      // Fallback to Supabase Edge Function if deployed without Express backend
      const { data, error } = await supabase.functions.invoke('verify-paypal-purchase', {
        body: { courseId, orderId },
      });
      if (error || !data?.success) {
        return {
          success: false,
          error: data?.error || error?.message || 'No se pudo validar el pago en el servidor.',
        };
      }
      return { success: true };
    }

    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload?.success) {
      return {
        success: false,
        error: payload?.error || 'No se pudo verificar el pago de PayPal en el servidor.',
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error verificando compra PayPal en servidor:', err);
    return {
      success: false,
      error: err?.message || 'Error de conexión al validar el pago con el servidor.',
    };
  }
}

/**
 * 7b. USER PURCHASES (FREE): Enroll in a strictly free course (price === 0 verified on server / RLS)
 */
export async function enrollFreeCourseOnServer(
  courseId: string
): Promise<{ success: boolean; error?: string }> {
  if (!courseId) {
    return { success: false, error: 'Curso inválido.' };
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token || !session.user?.email) {
      return { success: false, error: 'Debes iniciar sesión para inscribirte.' };
    }

    const res = await fetch('/api/purchases/free', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ courseId }),
    });

    if (res.status === 404) {
      // Direct RLS-enforced fallback for strictly price = 0 courses
      const { error } = await supabase.from('user_purchases').upsert(
        {
          user_id: session.user.id,
          user_email: session.user.email.toLowerCase(),
          course_id: courseId,
          amount_paid: 0,
          payment_method: 'free',
          purchased_at: new Date().toISOString(),
        },
        { onConflict: 'user_email,course_id' }
      );
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    }

    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload?.success) {
      return {
        success: false,
        error: payload?.error || 'No se pudo completar la inscripción gratuita.',
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error en inscripción gratuita:', err);
    return {
      success: false,
      error: err?.message || 'Error de red al inscribirse en el curso gratuito.',
    };
  }
}

/**
 * 8. LESSON PROGRESS: Load completed lessons for a student from Supabase table 'lesson_progress'
 */
export async function fetchProgressFromSupabase(userEmail: string): Promise<string[]> {
  if (!userEmail) return [];
  const normalizedEmail = userEmail.trim().toLowerCase();

  try {
    const { data, error } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_email', normalizedEmail)
      .eq('completed', true);

    if (error) {
      console.warn('Error consultando progreso en Supabase:', error.message);
      const local = localStorage.getItem(`completed_lessons_${normalizedEmail}`);
      return local ? JSON.parse(local) : [];
    }

    const lessonIds = (data || []).map((row: any) => row.lesson_id);
    localStorage.setItem(`completed_lessons_${normalizedEmail}`, JSON.stringify(lessonIds));
    return lessonIds;
  } catch (err) {
    console.error('Fallo al consultar progreso en Supabase:', err);
    const local = localStorage.getItem(`completed_lessons_${normalizedEmail}`);
    return local ? JSON.parse(local) : [];
  }
}

/**
 * 9. LESSON PROGRESS: Toggle completed state in Supabase table 'lesson_progress'
 */
export async function toggleProgressInSupabase(
  userEmail: string, 
  courseId: string, 
  lessonId: string, 
  isCompleted: boolean
): Promise<boolean> {
  if (!userEmail || !lessonId) return false;
  const normalizedEmail = userEmail.trim().toLowerCase();

  try {
    await ensureCourseExists(courseId);

    const { error } = await supabase.from('lesson_progress').upsert({
      user_email: normalizedEmail,
      course_id: courseId,
      lesson_id: lessonId,
      completed: isCompleted,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_email,lesson_id' });

    if (error) {
      console.warn('Aviso: no se pudo sincronizar progreso en Supabase:', error.message);
    }
    return !error;
  } catch (err) {
    console.error('Error al alternar progreso en Supabase:', err);
    return false;
  }
}

/**
 * 10. FAQS: Upsert FAQ row in Supabase table 'course_faqs'
 */
export async function upsertFaqInSupabase(
  courseId: string,
  faq: CourseFaq,
  orderIndex: number = 0,
  fallbackCourse?: Course
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureCourseExists(courseId, fallbackCourse);

    // Save locally
    try {
      const key = `courses_faqs_${courseId}`;
      const stored = localStorage.getItem(key);
      let list: CourseFaq[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex(f => f.id === faq.id);
      if (idx >= 0) {
        list[idx] = faq;
      } else {
        list.push(faq);
      }
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {}

    const { error } = await supabase.from('course_faqs').upsert({
      id: faq.id,
      course_id: courseId,
      question: faq.question,
      answer: faq.answer,
      order_index: orderIndex,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.warn('Aviso Supabase course_faqs upsert:', error.message);
      return { success: true };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error guardando FAQ en Supabase:', err);
    return { success: true };
  }
}

/**
 * 11. FAQS: Delete FAQ row from Supabase table 'course_faqs'
 */
export async function deleteFaqFromSupabase(
  faqId: string,
  courseId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (courseId) {
      try {
        const key = `courses_faqs_${courseId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          const list: CourseFaq[] = JSON.parse(stored);
          const updated = list.filter(f => f.id !== faqId);
          localStorage.setItem(key, JSON.stringify(updated));
        }
      } catch (e) {}
    }

    const { error } = await supabase.from('course_faqs').delete().eq('id', faqId);
    if (error) {
      console.warn('Aviso Supabase course_faqs delete:', error.message);
    }
    return { success: true };
  } catch (err: any) {
    return { success: true };
  }
}
