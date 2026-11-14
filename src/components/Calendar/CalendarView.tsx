import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { TaskItem } from '../../types';
import { getTodayDateString, formatGermanDateTime } from '../../utils/dateUtils';

interface CalendarViewProps {
  tasks: TaskItem[];
  onSelectTask: (task: TaskItem) => void;
  onOpenCreateTask?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onSelectTask,
  onOpenCreateTask,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => getTodayDateString());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthLabel = new Intl.DateTimeFormat('de-DE', {
    month: 'long',
    year: 'numeric',
  }).format(currentDate);

  // Group tasks by date string (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskItem[]>();
    tasks.forEach((t) => {
      if (t.dateTime) {
        const dateKey = t.dateTime.substring(0, 10);
        const existing = map.get(dateKey) || [];
        existing.push(t);
        map.set(dateKey, existing);
      }
    });
    return map;
  }, [tasks]);

  // Calendar matrix calculation (Monday-first)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startingDay = firstDayOfMonth.getDay() - 1;
    if (startingDay === -1) startingDay = 6;

    const totalDays = lastDayOfMonth.getDate();
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Prev month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        dateStr: getTodayDateString(prevDate),
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({
        dateStr: getTodayDateString(d),
        dayNum: i,
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        dateStr: getTodayDateString(nextDate),
        dayNum: i,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  // Tasks for the currently selected date
  const selectedDayTasks = useMemo(() => {
    return tasksByDate.get(selectedDateStr) || [];
  }, [tasksByDate, selectedDateStr]);

  const todayStr = getTodayDateString();

  const formattedSelectedDate = useMemo(() => {
    if (!selectedDateStr) return '';
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(dateObj);
  }, [selectedDateStr]);

  const weekdayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div className="space-y-4 pb-24 max-w-xl mx-auto px-4 pt-3">
      {/* Month Navigation Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">{monthLabel}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Termine & Baustellentage</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition active:scale-95"
              title="Vorheriger Monat"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setCurrentDate(new Date());
                setSelectedDateStr(todayStr);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-amber-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-amber-400 text-xs font-bold transition"
            >
              Heute
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition active:scale-95"
              title="Nächster Monat"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Weekday Header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {weekdayNames.map((wd) => (
            <div key={wd} className="text-xs font-bold text-slate-400 dark:text-slate-500 py-1">
              {wd}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {calendarDays.map((cell, idx) => {
            const isSelected = cell.dateStr === selectedDateStr;
            const isToday = cell.dateStr === todayStr;
            const dayTasks = tasksByDate.get(cell.dateStr) || [];
            const hasTasks = dayTasks.length > 0;

            return (
              <button
                key={`${cell.dateStr}_${idx}`}
                onClick={() => setSelectedDateStr(cell.dateStr)}
                className={`min-h-[44px] sm:min-h-[50px] p-1 rounded-2xl flex flex-col items-center justify-between transition-all select-none relative ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30 scale-105 z-10'
                    : isToday
                    ? 'bg-amber-50/80 border border-amber-400 text-amber-700 font-bold dark:bg-slate-800 dark:border-amber-500/50 dark:text-amber-400'
                    : cell.isCurrentMonth
                    ? 'bg-slate-100/70 text-slate-800 hover:bg-slate-200 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-slate-800'
                    : 'bg-transparent text-slate-300 dark:text-slate-600 hover:text-slate-500'
                }`}
              >
                <span className="text-xs">{cell.dayNum}</span>

                {/* Colored dots highlighting scheduled tasks on this day */}
                {hasTasks && (
                  <div className="flex items-center justify-center gap-0.5 mt-0.5 max-w-full overflow-hidden">
                    {dayTasks.slice(0, 3).map((t) => (
                      <span
                        key={t.id}
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected
                            ? 'bg-slate-950 ring-1 ring-white/50'
                            : t.status === 'Offen'
                            ? 'bg-red-500 ring-1 ring-red-400/40'
                            : t.status === 'In Bearbeitung'
                            ? 'bg-orange-500 ring-1 ring-orange-400/40'
                            : 'bg-green-500 ring-1 ring-green-400/40'
                        }`}
                      />
                    ))}
                    {dayTasks.length > 3 && (
                      <span className={`text-[8px] font-bold ${isSelected ? 'text-slate-950' : 'text-slate-400'}`}>
                        +
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtered tasks for the selected day */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Aufgaben am {formattedSelectedDate}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'Aufgabe geplant' : 'Aufgaben geplant'}
            </p>
          </div>

          {onOpenCreateTask && (
            <button
              onClick={onOpenCreateTask}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-amber-700 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-amber-400 dark:border-slate-700 text-xs font-bold flex items-center gap-1 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Aufgabe hinzufügen
            </button>
          )}
        </div>

        {selectedDayTasks.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 space-y-1 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Keine Aufgaben für dieses Datum eingetragen.
            </p>
            <p className="text-xs text-slate-500">
              Wählen Sie einen anderen Tag mit Farbmarkierungen oder erstellen Sie einen neuen Auftrag.
            </p>
          </div>
        ) : (
          selectedDayTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onSelectTask(task)}
              className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer shadow-sm hover:shadow-md transition space-y-2 group"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                  {task.title}
                </h4>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    task.status === 'Offen'
                      ? 'bg-red-600 text-white'
                      : task.status === 'In Bearbeitung'
                      ? 'bg-orange-600 text-white'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  {task.status}
                </span>
              </div>

              {task.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  {task.description}
                </p>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                {task.address && (
                  <div className="flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate text-slate-700 dark:text-slate-300">{task.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatGermanDateTime(task.dateTime)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
