import React from 'react';
import { Bell, LogOut, HardHat, WifiOff, Download, Sun, Moon } from 'lucide-react';
import { WorkerUser } from '../types';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  worker: WorkerUser | null;
  remindersCount: number;
  onOpenNotifications: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  worker,
  remindersCount,
  onOpenNotifications,
  onLogout,
}) => {
  const isOnline = useOnlineStatus();
  const { isInstallable, install } = usePWAInstall();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-sm transition-colors">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 shrink-0">
            <HardHat className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 truncate">
              Baumeister App
              <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 dark:bg-slate-800 dark:border-slate-700 dark:text-amber-400">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {worker ? worker.name : 'Bauhandwerk & Zeiterfassung'}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2 shrink-0">
          {!isOnline && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-medium"
              title="Offline-Modus aktiv"
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Offline</span>
            </div>
          )}

          {isInstallable && (
            <button
              onClick={install}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-semibold shadow-sm transition active:scale-95"
              title="Als App installieren"
            >
              <Download className="w-3.5 h-3.5" />
              <span>App installieren</span>
            </button>
          )}

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:text-amber-400 transition active:scale-95 shadow-sm"
            title={theme === 'dark' ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren'}
            aria-label="Design umschalten"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400 animate-in spin-in-180 duration-300" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700 animate-in spin-in-180 duration-300" />
            )}
          </button>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:text-slate-200 transition active:scale-95 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            title="Benachrichtigungen öffnen"
            aria-label="Benachrichtigungen"
          >
            <Bell className="w-5 h-5" />
            {remindersCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {remindersCount}
              </span>
            )}
          </button>

          {/* Worker Info / Logout button */}
          {worker && (
            <div className="flex items-center pl-1 border-l border-slate-200 dark:border-slate-800 gap-1.5">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                  {worker.name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  ID: {worker.workerId.slice(0, 6)}...
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-300 dark:bg-slate-800/80 dark:border-slate-700 dark:hover:bg-red-500/10 dark:hover:border-red-500/30 dark:text-slate-400 dark:hover:text-red-400 transition active:scale-95"
                title="Abmelden"
                aria-label="Abmelden"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
