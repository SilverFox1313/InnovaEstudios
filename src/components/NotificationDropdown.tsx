import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  CreditCard, 
  Award, 
  BookOpen, 
  Sparkles, 
  X, 
  Clock, 
  ExternalLink,
  CheckCircle2,
  BellOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppNotification, NotificationType } from '../types';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification, 
  clearAllNotifications, 
  formatRelativeTimeSpanish,
  NOTIFICATION_EVENT 
} from '../services/notifications';

interface NotificationDropdownProps {
  userEmail: string;
  onNavigateToCourse?: (courseId: string) => void;
  onNavigateToLearning?: () => void;
}

export default function NotificationDropdown({
  userEmail,
  onNavigateToCourse,
  onNavigateToLearning
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load and subscribe to notification updates
  useEffect(() => {
    if (!userEmail) {
      setNotifications([]);
      return;
    }

    const load = () => {
      setNotifications(getNotifications(userEmail));
    };

    load();

    const handleUpdate = () => {
      load();
    };

    window.addEventListener(NOTIFICATION_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [userEmail]);

  // Click outside and ESC key handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter((n) => !n.read)
    : notifications;

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    markNotificationAsRead(userEmail, id);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(userEmail);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(userEmail, id);
  };

  const handleClearAll = () => {
    clearAllNotifications(userEmail);
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.read) {
      markNotificationAsRead(userEmail, notif.id);
    }
    if (notif.courseId && onNavigateToCourse) {
      onNavigateToCourse(notif.courseId);
      setIsOpen(false);
    } else if (notif.type === 'purchase' || notif.type === 'certificate' || notif.type === 'lesson') {
      if (onNavigateToLearning) {
        onNavigateToLearning();
        setIsOpen(false);
      }
    }
  };

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'purchase':
        return {
          icon: <CreditCard className="w-4 h-4 text-emerald-600" />,
          bg: 'bg-emerald-50 border-emerald-100 text-emerald-600'
        };
      case 'certificate':
        return {
          icon: <Award className="w-4 h-4 text-amber-600" />,
          bg: 'bg-amber-50 border-amber-100 text-amber-600'
        };
      case 'lesson':
        return {
          icon: <BookOpen className="w-4 h-4 text-indigo-600" />,
          bg: 'bg-indigo-50 border-indigo-100 text-indigo-600'
        };
      case 'welcome':
        return {
          icon: <Sparkles className="w-4 h-4 text-purple-600" />,
          bg: 'bg-purple-50 border-purple-100 text-purple-600'
        };
      case 'system':
      default:
        return {
          icon: <Bell className="w-4 h-4 text-blue-600" />,
          bg: 'bg-blue-50 border-blue-100 text-blue-600'
        };
    }
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        id="navbar-notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir panel de notificaciones"
        aria-expanded={isOpen}
        title={unreadCount > 0 ? `Notificaciones (${unreadCount} sin leer)` : 'Notificaciones'}
        className={`relative p-2 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-indigo-100 text-indigo-700 shadow-inner'
            : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100/90 active:scale-95'
        }`}
      >
        <Bell className="w-5 h-5 transition-transform group-hover:rotate-6" />

        {/* Unread Badge & Pulse Ping */}
        {unreadCount > 0 && (
          <>
            <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            </span>
            <span 
              id="notification-unread-count-badge"
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs ring-2 ring-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        )}
      </button>

      {/* Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            id="notification-dropdown-menu"
            className="fixed sm:absolute top-16 sm:top-auto left-3 right-3 sm:left-auto sm:right-0 sm:mt-2 sm:w-[390px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-3.5 sm:p-4 bg-slate-50/80 border-b border-slate-150 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Notificaciones</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                        {unreadCount} nuevas
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">Alertas de tus cursos y acreditaciones</p>
                </div>
              </div>

              {/* Actions Header */}
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    title="Marcar todas como leídas"
                    className="p-1.5 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Leídas</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    title="Borrar todas las notificaciones"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Selector */}
            {notifications.length > 0 && (
              <div className="px-3.5 py-2 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setFilter('all')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      filter === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Todas ({notifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('unread')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      filter === 'unread'
                        ? 'bg-white text-indigo-600 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    No leídas ({unreadCount})
                  </button>
                </div>

                <span className="text-[10px] text-slate-400 font-medium">
                  {unreadCount === 0 ? 'Al día' : `${unreadCount} pendientes`}
                </span>
              </div>
            )}

            {/* Notification Items List */}
            <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    {filter === 'unread' ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <BellOff className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {filter === 'unread' ? '¡Estás al día!' : 'No tienes notificaciones'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
                      {filter === 'unread'
                        ? 'No tienes notificaciones pendientes por leer.'
                        : 'Tus compras, lecciones completadas y certificados aparecerán aquí en tiempo real.'}
                    </p>
                  </div>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const style = getIconForType(notif.type);
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 sm:p-4 transition-all duration-150 flex items-start gap-3 cursor-pointer group relative ${
                        !notif.read
                          ? 'bg-indigo-50/40 hover:bg-indigo-50/70'
                          : 'bg-white hover:bg-slate-50/90'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${style.bg} mt-0.5 shadow-2xs`}>
                        {style.icon}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          {!notif.read && (
                            <span 
                              className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" 
                              title="No leída"
                            />
                          )}
                          <h4 className={`text-xs leading-snug truncate ${
                            !notif.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'
                          }`}>
                            {notif.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>
                        
                        <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTimeSpanish(notif.timestamp)}
                          </span>

                          {(notif.courseId || notif.type === 'purchase' || notif.type === 'certificate') && (
                            <span className="text-indigo-600 font-semibold group-hover:underline flex items-center gap-0.5">
                              <span>Ver</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Individual Actions */}
                      <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.read && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                            title="Marcar como leída"
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(notif.id, e)}
                          title="Eliminar notificación"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-150 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onNavigateToLearning) onNavigateToLearning();
                }}
                className="text-[11px] font-bold text-indigo-650 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                Ir a Mi Aprendizaje →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
