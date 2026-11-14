import React from 'react';
import { X, Bell, Calendar, MapPin, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { ReminderNotification, TaskItem } from '../../types';
import { formatGermanDateTime } from '../../utils/dateUtils';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: ReminderNotification[];
  upcomingTasks: TaskItem[];
  onSelectTask?: (task: TaskItem) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  reminders,
  upcomingTasks,
  onSelectTask,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 text-slate-900 dark:text-slate-100">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/95 dark:bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Benachrichtigungen</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {reminders.length + upcomingTasks.length} anstehende Mitteilungen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Day-Before 19:00 Automated Reminders Section */}
          {reminders.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 px-1">
                <ShieldAlert className="w-4 h-4" />
                <span>19:00 Vorab-Erinnerungen (Morgen fällig)</span>
              </div>
              {reminders.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-slate-900 dark:text-slate-100 space-y-2"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0 animate-ping" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                        {r.text}
                      </p>
                      {r.address && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="truncate">{r.address}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming scheduled tasks */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 pt-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Anstehende Baustellen-Aufgaben</span>
            </div>

            {upcomingTasks.length === 0 && reminders.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 dark:text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Keine offenen Erinnerungen</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Alle anstehenden Aufgaben sind auf aktuellem Stand.
                </p>
              </div>
            ) : (
              upcomingTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    if (onSelectTask) {
                      onSelectTask(t);
                      onClose();
                    }
                  }}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {t.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        t.status === 'Offen'
                          ? 'bg-red-600 text-white'
                          : t.status === 'In Bearbeitung'
                          ? 'bg-orange-600 text-white'
                          : 'bg-green-600 text-white'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{formatGermanDateTime(t.dateTime)}</span>
                  </div>

                  {t.address && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">{t.address}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm transition"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
