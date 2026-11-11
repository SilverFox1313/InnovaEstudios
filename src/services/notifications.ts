import { AppNotification } from '../types';

const STORAGE_PREFIX = 'innova_notifications_';

export const NOTIFICATION_EVENT = 'innova_notifications_updated';

function getStorageKey(email: string): string {
  const sanitized = (email || 'guest').toLowerCase().trim();
  return `${STORAGE_PREFIX}${sanitized}`;
}

export function getDefaultNotifications(): AppNotification[] {
  const now = Date.now();
  return [
    {
      id: 'notif-welcome-1',
      type: 'welcome',
      title: '¡Bienvenido a InnovaEstudios!',
      message: 'Explora nuestro catálogo de cursos certificados y da inicio a tu ruta de formación tecnológica.',
      timestamp: new Date(now - 1000 * 60 * 35).toISOString(), // 35 min ago
      read: false
    },
    {
      id: 'notif-cert-2',
      type: 'certificate',
      title: 'Acreditación y Diplomas Digitales',
      message: 'Al culminar al 100% las lecciones de tus cursos, podrás descargar e imprimir tu diploma oficial con código de verificación único.',
      timestamp: new Date(now - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
      read: false
    },
    {
      id: 'notif-system-3',
      type: 'system',
      title: 'Nueva versión del Aula Virtual',
      message: 'Hemos optimizado la gestión de apuntes locales seguros y preguntas frecuentes dinámicas.',
      timestamp: new Date(now - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      read: true
    }
  ];
}

export function getNotifications(userEmail: string): AppNotification[] {
  if (!userEmail) return [];
  const key = getStorageKey(userEmail);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initial = getDefaultNotifications();
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error cargando notificaciones:', e);
    return [];
  }
}

export function addNotification(
  userEmail: string,
  notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { read?: boolean }
): AppNotification {
  if (!userEmail) {
    return {
      id: 'tmp-' + Date.now(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      timestamp: new Date().toISOString(),
      read: false,
      courseId: notification.courseId
    };
  }

  const current = getNotifications(userEmail);
  const newNotification: AppNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    timestamp: new Date().toISOString(),
    read: notification.read ?? false,
    courseId: notification.courseId
  };

  // Prepend and limit to 40 max
  const updated = [newNotification, ...current].slice(0, 40);
  try {
    localStorage.setItem(getStorageKey(userEmail), JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail: { userEmail } }));
  } catch (e) {
    console.error('Error guardando nueva notificación:', e);
  }

  return newNotification;
}

export function markNotificationAsRead(userEmail: string, notificationId: string): void {
  if (!userEmail) return;
  const current = getNotifications(userEmail);
  const updated = current.map((item) =>
    item.id === notificationId ? { ...item, read: true } : item
  );
  try {
    localStorage.setItem(getStorageKey(userEmail), JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail: { userEmail } }));
  } catch (e) {
    console.error('Error actualizando notificación:', e);
  }
}

export function markAllNotificationsAsRead(userEmail: string): void {
  if (!userEmail) return;
  const current = getNotifications(userEmail);
  const updated = current.map((item) => ({ ...item, read: true }));
  try {
    localStorage.setItem(getStorageKey(userEmail), JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail: { userEmail } }));
  } catch (e) {
    console.error('Error marcando todas como leídas:', e);
  }
}

export function deleteNotification(userEmail: string, notificationId: string): void {
  if (!userEmail) return;
  const current = getNotifications(userEmail);
  const updated = current.filter((item) => item.id !== notificationId);
  try {
    localStorage.setItem(getStorageKey(userEmail), JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail: { userEmail } }));
  } catch (e) {
    console.error('Error eliminando notificación:', e);
  }
}

export function clearAllNotifications(userEmail: string): void {
  if (!userEmail) return;
  try {
    localStorage.setItem(getStorageKey(userEmail), JSON.stringify([]));
    window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail: { userEmail } }));
  } catch (e) {
    console.error('Error vaciando notificaciones:', e);
  }
}

export function formatRelativeTimeSpanish(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 45) return 'Hace un momento';
    if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `Hace ${minutes} min`;
    }
    if (diffSeconds < 86400) {
      const hours = Math.floor(diffSeconds / 3600);
      return `Hace ${hours} h`;
    }
    const days = Math.floor(diffSeconds / 86400);
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  } catch {
    return 'Reciente';
  }
}
