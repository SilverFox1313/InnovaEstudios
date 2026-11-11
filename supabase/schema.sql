-- ==============================================================================
-- INNOVAESTUDIOS - SCHEMA DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de tu panel de Supabase:
-- https://supabase.com/dashboard/project/ojxusrctvsqkmacnmlwa/sql
-- ==============================================================================

-- 1. TABLA DE CURSOS (courses)
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

-- Asegurar que la columna status exista en instalaciones existentes
DO $$ BEGIN
  ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. TABLA DE LECCIONES (lessons)
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

-- Asegurar que video_url sea opcional en instalaciones existentes
DO $$ BEGIN
  ALTER TABLE public.lessons ALTER COLUMN video_url DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. TABLA DE COMPRAS DE ALUMNOS (user_purchases)
CREATE TABLE IF NOT EXISTS public.user_purchases (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_email TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  payment_method TEXT DEFAULT 'paypal',
  amount_paid NUMERIC(10, 2) DEFAULT 0,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_course UNIQUE (user_email, course_id)
);

-- 4. TABLA DE PROGRESO DE LECCIONES (lesson_progress)
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_email TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_lesson UNIQUE (user_email, lesson_id)
);

-- 5. TABLA DE APUNTES DEL ALUMNO (user_notes - opcional)
CREATE TABLE IF NOT EXISTS public.user_notes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_email TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de alto rendimiento para consultas por usuario y curso
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON public.lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_email ON public.user_purchases(user_email);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON public.lesson_progress(user_email);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course ON public.lesson_progress(course_id);

-- HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACCESO PÚBLICO / ANÓNIMO PARA CLIENTE SPA
-- Permite lectura y escritura de cursos y lecciones para la plataforma
DO $$ BEGIN
  CREATE POLICY "Public full access to courses" ON public.courses FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public full access to lessons" ON public.lessons FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public full access to user_purchases" ON public.user_purchases FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public full access to lesson_progress" ON public.lesson_progress FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public full access to user_notes" ON public.user_notes FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
