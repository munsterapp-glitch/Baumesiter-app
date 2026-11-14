import { useState, useEffect, useRef } from 'react';
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { WorkerUser, TimeLog, ShiftStatus, DayHistoryRow } from '../types';
import {
  getTodayDateString,
  formatTimeString,
  formatDayDisplay,
  formatMinutesToHours,
  formatMinutesToPause,
  getDaysFromMonthStartToToday,
} from '../utils/dateUtils';

export function useTimeTracker(worker: WorkerUser | null) {
  const [todayLog, setTodayLog] = useState<TimeLog | null>(null);
  const [monthlyLogs, setMonthlyLogs] = useState<Map<string, TimeLog>>(new Map());
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [livePauseSeconds, setLivePauseSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const todayStr = getTodayDateString();
  const timerIntervalRef = useRef<any>(null);

  // Firestore doc ID for today
  const docId = worker ? `${worker.workerId}_${todayStr}` : '';

  // Listen to today's log in real-time
  useEffect(() => {
    if (!worker || !docId) {
      setIsLoading(false);
      return;
    }

    const docRef = doc(db, 'time_logs', docId);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as TimeLog;
        setTodayLog(data);
      } else {
        setTodayLog({
          id: docId,
          workerId: worker.workerId,
          workerName: worker.name,
          date: todayStr,
          status: 'idle',
          startTime: null,
          endTime: null,
          totalPauseMinutes: 0,
          netWorkedMinutes: 0,
          shiftStartTimestamp: null,
          lastResumeTimestamp: null,
          lastPauseTimestamp: null,
          accumulatedWorkedSeconds: 0,
          accumulatedPauseSeconds: 0,
        });
      }
      setIsLoading(false);
    }, (error) => {
      console.warn('Error subscribing to today log:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [worker, docId, todayStr]);

  // Listen to all logs of this worker for the current month
  useEffect(() => {
    if (!worker) return;

    const currentYearMonth = todayStr.substring(0, 7); // e.g. "2026-11"
    const q = query(
      collection(db, 'time_logs'),
      where('workerId', '==', worker.workerId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsMap = new Map<string, TimeLog>();
      snapshot.forEach((docSnap) => {
        const item = docSnap.data() as TimeLog;
        if (item.date && item.date.startsWith(currentYearMonth)) {
          logsMap.set(item.date, item);
        }
      });
      setMonthlyLogs(logsMap);
    }, (error) => {
      console.warn('Error querying monthly logs:', error);
    });

    return () => unsubscribe();
  }, [worker, todayStr]);

  // Live timer tick calculation
  useEffect(() => {
    if (!todayLog) {
      setLiveSeconds(0);
      setLivePauseSeconds(0);
      return;
    }

    const calculateCurrentSeconds = () => {
      const now = Date.now();
      let currentWorked = todayLog.accumulatedWorkedSeconds || 0;
      let currentPause = todayLog.accumulatedPauseSeconds || 0;

      if (todayLog.status === 'working' && todayLog.lastResumeTimestamp) {
        const delta = Math.floor((now - todayLog.lastResumeTimestamp) / 1000);
        currentWorked += Math.max(0, delta);
      } else if (todayLog.status === 'paused' && todayLog.lastPauseTimestamp) {
        const deltaPause = Math.floor((now - todayLog.lastPauseTimestamp) / 1000);
        currentPause += Math.max(0, deltaPause);
      }

      setLiveSeconds(currentWorked);
      setLivePauseSeconds(currentPause);
    };

    calculateCurrentSeconds();

    if (todayLog.status === 'working' || todayLog.status === 'paused') {
      timerIntervalRef.current = setInterval(calculateCurrentSeconds, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [todayLog]);

  // 1. Arbeitsbeginn (Green Button)
  const handleStartShift = async () => {
    if (!worker || !docId) return;
    const now = Date.now();
    const startTimeStr = todayLog?.startTime || formatTimeString(new Date(now));

    const updated: TimeLog = {
      id: docId,
      workerId: worker.workerId,
      workerName: worker.name,
      date: todayStr,
      status: 'working',
      startTime: startTimeStr,
      endTime: null,
      totalPauseMinutes: todayLog?.totalPauseMinutes || 0,
      netWorkedMinutes: todayLog?.netWorkedMinutes || 0,
      shiftStartTimestamp: todayLog?.shiftStartTimestamp || now,
      lastResumeTimestamp: now,
      lastPauseTimestamp: null,
      accumulatedWorkedSeconds: todayLog?.accumulatedWorkedSeconds || 0,
      accumulatedPauseSeconds: todayLog?.accumulatedPauseSeconds || 0,
      updatedAt: new Date().toISOString(),
    };

    setTodayLog(updated);
    try {
      await setDoc(doc(db, 'time_logs', docId), updated);
    } catch (err) {
      console.error('Error saving shift start:', err);
    }
  };

  // 2. Pause / Pause beenden (Amber Button)
  const handleTogglePause = async () => {
    if (!worker || !docId || !todayLog) return;
    const now = Date.now();

    if (todayLog.status === 'working') {
      // Transition to PAUSED
      const workedSinceResume = todayLog.lastResumeTimestamp
        ? Math.floor((now - todayLog.lastResumeTimestamp) / 1000)
        : 0;
      const newAccumulatedWorked = (todayLog.accumulatedWorkedSeconds || 0) + workedSinceResume;

      const updated: TimeLog = {
        ...todayLog,
        status: 'paused',
        lastResumeTimestamp: null,
        lastPauseTimestamp: now,
        accumulatedWorkedSeconds: newAccumulatedWorked,
        netWorkedMinutes: Math.round(newAccumulatedWorked / 60),
        updatedAt: new Date().toISOString(),
      };

      setTodayLog(updated);
      try {
        await setDoc(doc(db, 'time_logs', docId), updated);
      } catch (err) {
        console.error('Error pausing shift:', err);
      }
    } else if (todayLog.status === 'paused') {
      // Transition back to WORKING (Pause beenden)
      const pausedSincePauseStart = todayLog.lastPauseTimestamp
        ? Math.floor((now - todayLog.lastPauseTimestamp) / 1000)
        : 0;
      const newAccumulatedPause = (todayLog.accumulatedPauseSeconds || 0) + pausedSincePauseStart;

      const updated: TimeLog = {
        ...todayLog,
        status: 'working',
        lastResumeTimestamp: now,
        lastPauseTimestamp: null,
        accumulatedPauseSeconds: newAccumulatedPause,
        totalPauseMinutes: Math.round(newAccumulatedPause / 60),
        updatedAt: new Date().toISOString(),
      };

      setTodayLog(updated);
      try {
        await setDoc(doc(db, 'time_logs', docId), updated);
      } catch (err) {
        console.error('Error resuming shift:', err);
      }
    }
  };

  // 3. Feierabend (Red Button)
  const handleEndShift = async () => {
    if (!worker || !docId || !todayLog) return;
    const now = Date.now();
    const endTimeStr = formatTimeString(new Date(now));

    let finalWorkedSeconds = todayLog.accumulatedWorkedSeconds || 0;
    let finalPauseSeconds = todayLog.accumulatedPauseSeconds || 0;

    if (todayLog.status === 'working' && todayLog.lastResumeTimestamp) {
      finalWorkedSeconds += Math.floor((now - todayLog.lastResumeTimestamp) / 1000);
    } else if (todayLog.status === 'paused' && todayLog.lastPauseTimestamp) {
      finalPauseSeconds += Math.floor((now - todayLog.lastPauseTimestamp) / 1000);
    }

    const netWorkedMinutes = Math.round(finalWorkedSeconds / 60);
    const totalPauseMinutes = Math.round(finalPauseSeconds / 60);

    const updated: TimeLog = {
      ...todayLog,
      status: 'finished',
      endTime: endTimeStr,
      totalPauseMinutes,
      netWorkedMinutes,
      lastResumeTimestamp: null,
      lastPauseTimestamp: null,
      accumulatedWorkedSeconds: finalWorkedSeconds,
      accumulatedPauseSeconds: finalPauseSeconds,
      updatedAt: new Date().toISOString(),
    };

    setTodayLog(updated);
    try {
      await setDoc(doc(db, 'time_logs', docId), updated);
    } catch (err) {
      console.error('Error saving shift end:', err);
    }
  };

  // Build the complete Monthly History List (1st of month to today)
  const daysList = getDaysFromMonthStartToToday();
  const historyRows: DayHistoryRow[] = daysList.map((dayDateStr) => {
    const isToday = dayDateStr === todayStr;
    const logged = isToday && todayLog ? todayLog : monthlyLogs.get(dayDateStr);

    let workedMinutes = 0;
    let pauseMinutes = 0;
    let startTime = '--:--';
    let endTime = '--:--';
    let status: ShiftStatus = 'idle';

    if (logged) {
      status = logged.status;
      startTime = logged.startTime || '--:--';
      endTime = logged.endTime || '--:--';

      if (isToday && (logged.status === 'working' || logged.status === 'paused')) {
        workedMinutes = Math.round(liveSeconds / 60);
        pauseMinutes = Math.round(livePauseSeconds / 60);
      } else {
        workedMinutes = logged.netWorkedMinutes || 0;
        pauseMinutes = logged.totalPauseMinutes || 0;
      }
    }

    return {
      date: dayDateStr,
      dayLabel: formatDayDisplay(dayDateStr),
      startTime,
      endTime,
      pauseFormatted: formatMinutesToPause(pauseMinutes),
      totalWorkedFormatted: formatMinutesToHours(workedMinutes),
      rawWorkedMinutes: workedMinutes,
      isToday,
      status,
    };
  });

  // Calculate monthly total worked minutes
  const totalMonthlyMinutes = historyRows.reduce((acc, row) => acc + row.rawWorkedMinutes, 0);

  return {
    todayLog,
    status: todayLog?.status || 'idle',
    liveSeconds,
    livePauseSeconds,
    isLoading,
    historyRows,
    totalMonthlyMinutes,
    handleStartShift,
    handleTogglePause,
    handleEndShift,
  };
}
