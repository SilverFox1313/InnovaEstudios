-- ==============================================================================
-- INNOVAESTUDIOS - SCHEMA Y POLÍTICAS DE SEGURIDAD SUPABASE (POSTGRESQL + RLS)
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de tu panel de Supabase:
-- https://supabase.com/dashboard/project/ojxusrctvsqkmacnmlwa/sql
-- ==============================================================================

-- 1. TABLA DE PERFILES Y ROLES DE USUARIO (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger automático para crear perfil de estudiante al registrarse en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    LOWER(NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    'student'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Función segura para validar rol de administrador en políticas RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  )
  OR (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );
$$;

-- 2. TABLA DE CURSOS (courses)
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  instructor TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.0,
  duration TEXT NOT NULL DEFAULT '0 horas',
  level TEXT NOT NULL DEFAULT 'Intermedio',
  published_date TEXT NOT NULL DEFAULT '2026',
  image_url TEXT,
  skills_learned JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. TABLA DE LECCIONES (lessons)
CREATE TABLE IF NOT EXISTS public.lessons (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration TEXT NOT NULL DEFAULT '10:00',
  video_url TEXT DEFAULT '',
  content TEXT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.lessons ALTER COLUMN video_url DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. TABLA DE PREGUNTAS FRECUENTES DE CURSOS (course_faqs)
CREATE TABLE IF NOT EXISTS public.course_faqs (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA DE COMPRAS DE ALUMNOS (user_purchases)
CREATE TABLE IF NOT EXISTS public.user_purchases (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  payment_method TEXT DEFAULT 'paypal',
  amount_paid NUMERIC(10, 2) DEFAULT 0,
  paypal_order_id TEXT,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_course UNIQUE (user_email, course_id)
);

DO $$ BEGIN
  ALTER TABLE public.user_purchases ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  ALTER TABLE public.user_purchases ADD COLUMN IF NOT EXISTS paypal_order_id TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_purchases_paypal_order_id
  ON public.user_purchases(paypal_order_id)
  WHERE paypal_order_id IS NOT NULL;

-- 6. TABLA DE PROGRESO DE LECCIONES (lesson_progress)
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_email TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_lesson UNIQUE (user_email, lesson_id)
);

-- 7. TABLA DE APUNTES DEL ALUMNO (user_notes)
CREATE TABLE IF NOT EXISTS public.user_notes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_email TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON public.lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_faqs_course_id ON public.course_faqs(course_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_email ON public.user_purchases(user_email);
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON public.user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON public.lesson_progress(user_email);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course ON public.lesson_progress(course_id);

-- ==============================================================================
-- ACTIVAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas heredadas inseguras ("Public full access...")
DROP POLICY IF EXISTS "Public full access to courses" ON public.courses;
DROP POLICY IF EXISTS "Public full access to lessons" ON public.lessons;
DROP POLICY IF EXISTS "Public full access to course_faqs" ON public.course_faqs;
DROP POLICY IF EXISTS "Public full access to user_purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Public full access to lesson_progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Public full access to user_notes" ON public.user_notes;

-- ==============================================================================
-- POLÍTICAS RLS ESTRICTAS POR TABLA
-- ==============================================================================

-- A) PROFILES: Solo el dueño lee su perfil (o admin); nadie puede auto-asignarse rol admin
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_student_only" ON public.profiles;
CREATE POLICY "profiles_insert_student_only" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id AND role = 'student');

DROP POLICY IF EXISTS "profiles_update_own_no_role_change" ON public.profiles;
CREATE POLICY "profiles_update_own_no_role_change" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (
    public.is_admin()
    OR (
      auth.uid() = id
      AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "profiles_delete_admin_only" ON public.profiles;
CREATE POLICY "profiles_delete_admin_only" ON public.profiles
  FOR DELETE
  USING (public.is_admin());

-- B) COURSES: Lectura pública del catálogo; escritura exclusiva para administradores
DROP POLICY IF EXISTS "courses_select_public" ON public.courses;
CREATE POLICY "courses_select_public" ON public.courses
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "courses_insert_admin_only" ON public.courses;
CREATE POLICY "courses_insert_admin_only" ON public.courses
  FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "courses_update_admin_only" ON public.courses;
CREATE POLICY "courses_update_admin_only" ON public.courses
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "courses_delete_admin_only" ON public.courses;
CREATE POLICY "courses_delete_admin_only" ON public.courses
  FOR DELETE
  USING (public.is_admin());

-- C) LESSONS: Lectura pública de temario; escritura exclusiva para administradores
DROP POLICY IF EXISTS "lessons_select_public" ON public.lessons;
CREATE POLICY "lessons_select_public" ON public.lessons
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "lessons_insert_admin_only" ON public.lessons;
CREATE POLICY "lessons_insert_admin_only" ON public.lessons
  FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "lessons_update_admin_only" ON public.lessons;
CREATE POLICY "lessons_update_admin_only" ON public.lessons
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "lessons_delete_admin_only" ON public.lessons;
CREATE POLICY "lessons_delete_admin_only" ON public.lessons
  FOR DELETE
  USING (public.is_admin());

-- D) COURSE_FAQS: Lectura pública; escritura exclusiva para administradores
DROP POLICY IF EXISTS "course_faqs_select_public" ON public.course_faqs;
CREATE POLICY "course_faqs_select_public" ON public.course_faqs
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "course_faqs_insert_admin_only" ON public.course_faqs;
CREATE POLICY "course_faqs_insert_admin_only" ON public.course_faqs
  FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "course_faqs_update_admin_only" ON public.course_faqs;
CREATE POLICY "course_faqs_update_admin_only" ON public.course_faqs
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "course_faqs_delete_admin_only" ON public.course_faqs;
CREATE POLICY "course_faqs_delete_admin_only" ON public.course_faqs
  FOR DELETE
  USING (public.is_admin());

-- E) USER_PURCHASES:
--    - SELECT: únicamente el dueño autenticado de la compra (o admin)
--    - INSERT desde cliente: bloqueado para cursos de pago (solo servidor/Edge Function con service_role tras validar PayPal)
--      y permitido al dueño autenticado únicamente si el curso es realmente gratuito (price = 0) y publicado
--    - UPDATE/DELETE: exclusivo de admin o service_role
DROP POLICY IF EXISTS "user_purchases_select_owner" ON public.user_purchases;
CREATE POLICY "user_purchases_select_owner" ON public.user_purchases
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      auth.uid() = user_id
      OR LOWER(COALESCE(auth.jwt() ->> 'email', '')) = LOWER(user_email)
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "user_purchases_insert_free_owner_only" ON public.user_purchases;
CREATE POLICY "user_purchases_insert_free_owner_only" ON public.user_purchases
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (user_id IS NULL OR auth.uid() = user_id)
    AND LOWER(COALESCE(auth.jwt() ->> 'email', '')) = LOWER(user_email)
    AND COALESCE(amount_paid, 0) = 0
    AND EXISTS (
      SELECT 1
      FROM public.courses c
      WHERE c.id = course_id
        AND c.price = 0
        AND c.status = 'published'
    )
  );

DROP POLICY IF EXISTS "user_purchases_update_admin_only" ON public.user_purchases;
CREATE POLICY "user_purchases_update_admin_only" ON public.user_purchases
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "user_purchases_delete_admin_only" ON public.user_purchases;
CREATE POLICY "user_purchases_delete_admin_only" ON public.user_purchases
  FOR DELETE
  USING (public.is_admin());

-- F) LESSON_PROGRESS: Lectura y escritura exclusiva del propio usuario autenticado
DROP POLICY IF EXISTS "lesson_progress_owner_select" ON public.lesson_progress;
CREATE POLICY "lesson_progress_owner_select" ON public.lesson_progress
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND LOWER(COALESCE(auth.jwt() ->> 'email', '')) = LOWER(user_email)
  );

DROP POLICY IF EXISTS "lesson_progress_owner_insert" ON public.lesson_progress;
CREATE POLICY "lesson_progress_owner_insert" ON public.lesson_progress
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND LOWER(COALESCE(auth.jwt() ->> 'email', '')) = LOWER(user_email)
  );

DROP POLICY IF EXISTS "lesson_progress_owner_update" ON public.lesson_progress;
CREATE POLICY "lesson_progress_owner_update" ON public.lesson_progress
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND LOWER(COALESCE(auth.jwt() ->> 'email', '')) = LOWER(user_email)
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND LOWER(COALESCE(auth.jwt() ->> 'email', '')) = LOWER(user_email)
  );

DROP POLICY IF EXISTS "lesson_progress_owner_delete" ON public.lesson_progress;
CREATE POLICY "lesson_progress_owner_delete" ON public.lesson_progress
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND LOWER(COALESCE(auth.jwt() ->> 'email', '')) = LOWER(user_email)
  );

-- G) USER_NOTES: Lectura y escritura exclusiva del propio usuario autenticado
DROP POLICY IF EXISTS "user_notes_owner_all" ON public.user_notes;
CREATE POLICY "user_notes_owner_all" ON public.user_notes
  FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND LOWER(COALESCE(auth.jwt() ->> 'email', '')) = LOWER(user_email)
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND LOWER(COALESCE(auth.jwt() ->> 'email', '')) = LOWER(user_email)
  );

-- ==============================================================================
-- ASIGNAR ROL DE ADMINISTRADOR
-- ==============================================================================
update public.profiles set role = 'admin' where email = 'hildevert13@gmail.com';
