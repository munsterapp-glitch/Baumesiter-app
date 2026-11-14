export interface WorkerUser {
  workerId: string;
  name: string;
  email: string;
  createdAt: string;
}

export type ShiftStatus = 'idle' | 'working' | 'paused' | 'finished';

export interface TimeLog {
  id: string; // e.g. `${workerId}_YYYY-MM-DD`
  workerId: string;
  workerName: string;
  date: string; // YYYY-MM-DD
  status: ShiftStatus;
  startTime: string | null; // e.g. "07:30"
  endTime: string | null;   // e.g. "16:45"
  totalPauseMinutes: number;
  netWorkedMinutes: number;
  // Live tracking fields
  shiftStartTimestamp: number | null;
  lastResumeTimestamp: number | null;
  lastPauseTimestamp: number | null;
  accumulatedWorkedSeconds: number;
  accumulatedPauseSeconds: number;
  updatedAt?: string;
}

export type TaskStatus = 'Offen' | 'In Bearbeitung' | 'Erledigt';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  dateTime: string; // e.g. 2026-11-12T08:00
  status: TaskStatus;
  createdBy: string;
  createdByName?: string;
  proofImageUrl?: string;
  completedAt?: string;
  createdAt: string;
}

export interface DayHistoryRow {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "Mi, 11. Nov"
  startTime: string; // "--:--"
  endTime: string;   // "--:--"
  pauseFormatted: string; // "00:00 Std." or "30 Min."
  totalWorkedFormatted: string; // "08:15 Std." or "00:00 Std."
  rawWorkedMinutes: number;
  isToday: boolean;
  status: ShiftStatus;
}

export interface ReminderNotification {
  id: string;
  taskId: string;
  title: string;
  text: string;
  address: string;
  scheduledTime: string;
  createdAt: string;
}
