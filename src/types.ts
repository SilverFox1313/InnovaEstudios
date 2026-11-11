export interface Lesson {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  content: string; // Brief lesson notes
}

export interface CourseFaq {
  id: string;
  courseId?: string;
  question: string;
  answer: string;
  orderIndex?: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  instructor: string;
  category: string;
  price: number;
  rating: number;
  duration: string;
  duration_hours?: number;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  publishedDate: string;
  imageUrl: string;
  lessons: Lesson[];
  skillsLearned: string[];
  status?: 'published' | 'upcoming';
  hasDiploma?: boolean;
  faqs?: CourseFaq[];
}

export interface User {
  email: string;
  name: string;
  token: string;
  purchasedCourseIds: string[];
  completedLessonIds: { [courseId: string]: string[] };
}

export type NotificationType = 'purchase' | 'lesson' | 'certificate' | 'system' | 'welcome';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string; // ISO date string
  read: boolean;
  courseId?: string;
}

