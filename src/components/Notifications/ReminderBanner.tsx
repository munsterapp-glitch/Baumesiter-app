import React from 'react';
import { AlertTriangle, X, MapPin, ArrowRight } from 'lucide-react';
import { ReminderNotification } from '../../types';

interface ReminderBannerProps {
  banners: ReminderNotification[];
  onDismiss: (id: string) => void;
  onNavigateToTask?: (taskId: string) => void;
}

export const ReminderBanner: React.FC<ReminderBannerProps> = ({
  banners,
  onDismiss,
  onNavigateToTask,
}) => {
  if (!banners || banners.length === 0) return null;

  return (
    <div className="space-y-2 mb-4 px-4 pt-2">
      {banners.map((item) => (
        <div
          key={item.id}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/60 border border-amber-500/50 p-4 shadow-lg shadow-amber-950/40 text-slate-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 border border-amber-500/30">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                19:00 Vorab-Erinnerung
              </span>
            </div>
            <p className="text-sm font-semibold text-white leading-snug break-words">
              {item.text}
            </p>
            {item.address && (
              <p className="text-xs text-amber-300/80 flex items-center gap-1 mt-1 truncate">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{item.address}</span>
              </p>
            )}
          </div>

          <button
            onClick={() => onDismiss(item.id)}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition"
            title="Schließen"
            aria-label="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
