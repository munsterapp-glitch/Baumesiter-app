import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  FileDown,
  Clock,
  Coffee,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { WorkerUser } from '../../types';
import { useTimeTracker } from '../../hooks/useTimeTracker';
import {
  formatGermanGreetingDate,
  formatSecondsToHMS,
  formatMinutesToHours,
} from '../../utils/dateUtils';
import { generateMonthlyTimesheetPDF } from '../../services/pdfReport';

interface TimeTrackingViewProps {
  worker: WorkerUser;
}

export const TimeTrackingView: React.FC<TimeTrackingViewProps> = ({ worker }) => {
  const {
    todayLog,
    status,
    liveSeconds,
    livePauseSeconds,
    historyRows,
    totalMonthlyMinutes,
    handleStartShift,
    handleTogglePause,
    handleEndShift,
  } = useTimeTracker(worker);

  const [isExporting, setIsExporting] = useState(false);

  // Today formatted greeting date
  const greetingDate = formatGermanGreetingDate(new Date());

  // Current month name in German
  const currentMonthName = new Intl.DateTimeFormat('de-DE', { month: 'long' }).format(new Date());
  const currentYear = new Date().getFullYear();

  // Export PDF Monatsbericht
  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      generateMonthlyTimesheetPDF({
        workerName: worker.name,
        workerId: worker.workerId,
        workerEmail: worker.email,
        monthName: currentMonthName,
        year: currentYear,
        historyRows,
        totalWorkedMinutes: totalMonthlyMinutes,
      });
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Status visual label
  const getStatusBadge = () => {
    switch (status) {
      case 'working':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Schicht aktiv
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Pause läuft
          </span>
        );
      case 'finished':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/30 text-xs font-bold uppercase tracking-wider">
            <CheckCircle className="w-3.5 h-3.5" />
            Feierabend erfasst
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 text-xs font-bold uppercase tracking-wider">
            Nicht begonnen
          </span>
        );
    }
  };

  // Today worked hours formatted
  const todayNetMinutes = status === 'finished'
    ? (todayLog?.netWorkedMinutes || 0)
    : Math.floor(liveSeconds / 60);

  return (
    <div className="space-y-5 pb-24 max-w-xl mx-auto px-4 pt-3">
      {/* 1. Top Greeting Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative">
          <p className="text-xs font-bold tracking-wider uppercase text-amber-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {greetingDate}
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
            Willkommen, {worker.name}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Mitarbeiter-ID: <span className="font-mono text-amber-300 font-bold">{worker.workerId}</span>
          </p>
        </div>
      </div>

      {/* 2. Live Working Timer & Big Action Buttons */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg text-center relative overflow-hidden transition-colors">
        <div className="flex justify-center mb-3">
          {getStatusBadge()}
        </div>

        {/* Big Digital Timer Display */}
        <div className="my-2">
          <div className="font-mono text-5xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white select-none drop-shadow-sm">
            {formatSecondsToHMS(liveSeconds)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mt-1">
            Aktive Arbeitszeit
          </p>
        </div>

        {/* Live Pause indicator if paused */}
        {status === 'paused' && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-400 text-xs font-mono font-bold">
            <Coffee className="w-3.5 h-3.5 animate-bounce" />
            Pause: {formatSecondsToHMS(livePauseSeconds)}
          </div>
        )}

        {/* 3 Large Easy-to-Tap Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          {/* Button 1: Arbeitsbeginn (Green) */}
          <button
            onClick={handleStartShift}
            disabled={status === 'working'}
            className={`h-16 px-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-base transition-all shadow-lg active:scale-95 ${
              status === 'working'
                ? 'bg-slate-100 dark:bg-emerald-950/40 text-slate-400 dark:text-emerald-600 border border-slate-200 dark:border-emerald-900/50 cursor-not-allowed opacity-60'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/30 dark:shadow-emerald-900/40'
            }`}
          >
            <Play className="w-6 h-6 fill-current" />
            <span>Arbeitsbeginn</span>
          </button>

          {/* Button 2: Pause / Pause beenden (Amber) */}
          <button
            onClick={handleTogglePause}
            disabled={status === 'idle' || status === 'finished'}
            className={`h-16 px-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-base transition-all shadow-lg active:scale-95 ${
              status === 'idle' || status === 'finished'
                ? 'bg-slate-100 dark:bg-amber-950/30 text-slate-400 dark:text-amber-600/50 border border-slate-200 dark:border-amber-900/30 cursor-not-allowed opacity-50'
                : status === 'paused'
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-600/30 font-extrabold ring-2 ring-amber-400'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-700/30'
            }`}
          >
            {status === 'paused' ? (
              <>
                <Play className="w-6 h-6 fill-current" />
                <span>Pause beenden</span>
              </>
            ) : (
              <>
                <Pause className="w-6 h-6 fill-current" />
                <span>Pause</span>
              </>
            )}
          </button>

          {/* Button 3: Feierabend (Red) */}
          <button
            onClick={handleEndShift}
            disabled={status === 'idle' || status === 'finished'}
            className={`h-16 px-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-base transition-all shadow-lg active:scale-95 ${
              status === 'idle' || status === 'finished'
                ? 'bg-slate-100 dark:bg-red-950/30 text-slate-400 dark:text-red-600/50 border border-slate-200 dark:border-red-900/30 cursor-not-allowed opacity-50'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-700/30 dark:shadow-red-900/40'
            }`}
          >
            <Square className="w-6 h-6 fill-current" />
            <span>Feierabend</span>
          </button>
        </div>

        {/* Timestamps row if logged today */}
        {todayLog && (todayLog.startTime || todayLog.endTime) && (
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around text-xs text-slate-600 dark:text-slate-400 font-medium">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block">Beginn</span>
              <span className="text-slate-900 dark:text-slate-200 font-mono text-sm font-semibold">
                {todayLog.startTime ? `${todayLog.startTime} Uhr` : '--:--'}
              </span>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-slate-400 dark:text-slate-500 block">Pause Gesamt</span>
              <span className="text-slate-900 dark:text-slate-200 font-mono text-sm font-semibold">
                {Math.round(todayLog.totalPauseMinutes || (livePauseSeconds / 60))} Min.
              </span>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-slate-400 dark:text-slate-500 block">Feierabend</span>
              <span className="text-slate-900 dark:text-slate-200 font-mono text-sm font-semibold">
                {todayLog.endTime ? `${todayLog.endTime} Uhr` : '--:--'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Daily Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
              Tagesübersicht
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Heute gearbeitet: <span className="text-amber-600 dark:text-amber-400">{formatMinutesToHours(todayNetMinutes)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Monthly History & PDF Export Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-lg space-y-4 transition-colors">
        {/* Header & Prominent PDF Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Monatsübersicht ({currentMonthName} {currentYear})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gesamtstunden Monat: <strong className="text-amber-600 dark:text-amber-400">{formatMinutesToHours(totalMonthlyMinutes)}</strong>
            </p>
          </div>

          {/* Prominent PDF Export Button */}
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 active:scale-95 transition"
            title="Monatsbericht als PDF generieren und herunterladen"
          >
            <FileDown className="w-4 h-4 stroke-[2.5]" />
            <span>{isExporting ? 'Generiere PDF...' : 'Monatsbericht als PDF'}</span>
          </button>
        </div>

        {/* Scrollable Monthly History List: 1st of month to today */}
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {historyRows.map((row) => (
            <div
              key={row.date}
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2 transition ${
                row.isToday
                  ? 'bg-amber-50/70 border-amber-400/60 dark:bg-slate-800/90 dark:border-amber-500/40 ring-1 ring-amber-500/30'
                  : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 dark:bg-slate-800/40 dark:border-slate-700/60 dark:hover:bg-slate-800/60'
              }`}
            >
              {/* Date & Tag */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {row.dayLabel}
                  </span>
                  {row.isToday && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 uppercase">
                      Heute
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                  <span>{row.startTime} - {row.endTime}</span>
                  <span className="text-slate-400 dark:text-slate-600">•</span>
                  <span>Pause: {row.pauseFormatted}</span>
                </div>
              </div>

              {/* Total Hours Badge */}
              <div className="text-right shrink-0">
                <span
                  className={`inline-block font-mono text-sm font-extrabold px-2.5 py-1 rounded-xl ${
                    row.rawWorkedMinutes > 0
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                      : 'bg-slate-200/70 text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700/60'
                  }`}
                >
                  {row.totalWorkedFormatted}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
