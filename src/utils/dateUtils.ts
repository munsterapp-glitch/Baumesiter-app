/**
 * German date and time formatting utilities for Baumeister App
 */

export function getTodayDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatGermanGreetingDate(d: Date = new Date()): string {
  const weekday = new Intl.DateTimeFormat('de-DE', { weekday: 'long' }).format(d);
  const day = d.getDate();
  const month = new Intl.DateTimeFormat('de-DE', { month: 'long' }).format(d);
  const year = d.getFullYear();
  return `${weekday}, ${day}. ${month} ${year}`;
}

export function formatTimeString(d: Date = new Date()): string {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatSecondsToHMS(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatMinutesToHours(minutes: number): string {
  if (!minutes || minutes < 0) return '00:00 Std.';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')} Std.`;
}

export function formatMinutesToPause(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 Min.';
  if (minutes < 60) return `${Math.round(minutes)} Min.`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hrs}h ${mins}m`;
}

/**
 * Returns an array of every single day from the 1st of the current month up to today
 */
export function getDaysFromMonthStartToToday(now: Date = new Date()): string[] {
  const days: string[] = [];
  const currentDay = now.getDate();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  for (let i = currentDay; i >= 1; i--) {
    const d = new Date(year, month, i);
    days.push(getTodayDateString(d));
  }
  return days;
}

export function formatDayDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const weekday = new Intl.DateTimeFormat('de-DE', { weekday: 'short' }).format(d);
  const monthShort = new Intl.DateTimeFormat('de-DE', { month: 'short' }).format(d);
  return `${weekday}, ${day}. ${monthShort}`;
}

export function formatGermanDateTime(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d) + ' Uhr';
  } catch {
    return dateString;
  }
}

/**
 * Checks whether a task scheduled date triggers the "Automated 19:00 Day-Before Reminder"
 * Rule: For any task scheduled for tomorrow (or within the next 24 hours, especially from 19:00 the day before)
 */
export function isTaskDueForTomorrowReminder(taskDateTimeStr: string, referenceTime: Date = new Date()): boolean {
  if (!taskDateTimeStr) return false;
  const taskDate = new Date(taskDateTimeStr);
  if (isNaN(taskDate.getTime())) return false;

  // Tomorrow calculation in local date
  const tomorrow = new Date(referenceTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getTodayDateString(tomorrow);
  const taskDateOnlyStr = getTodayDateString(taskDate);

  const diffMs = taskDate.getTime() - referenceTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // If the task is scheduled for tomorrow and reference time is in the late afternoon/evening (>= 16:00 or 19:00),
  // OR if the task is within 24 hours in the future
  if (taskDateOnlyStr === tomorrowStr) {
    return true;
  }

  // Also if it's within the next 24 hours and in future
  if (diffHours > 0 && diffHours <= 28) {
    return true;
  }

  return false;
}
