import React, { useState } from 'react';
import {
  X,
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Camera,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { TaskItem, TaskStatus } from '../../types';
import { formatGermanDateTime } from '../../utils/dateUtils';
import { ProofPhotoModal } from './ProofPhotoModal';

interface TaskDetailModalProps {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (taskId: string, newStatus: 'Offen' | 'In Bearbeitung') => Promise<void>;
  onCompleteWithProof: (taskId: string, file: File) => Promise<string>;
  onDeleteTask?: (taskId: string) => Promise<void>;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdateStatus,
  onCompleteWithProof,
  onDeleteTask,
}) => {
  const [showProofModal, setShowProofModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !task) return null;

  const handleStatusChange = async (targetStatus: TaskStatus) => {
    if (targetStatus === 'Erledigt') {
      setShowProofModal(true);
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdateStatus(task.id, targetStatus as 'Offen' | 'In Bearbeitung');
    } catch (err) {
      console.error('Failed to change status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProofUploaded = async (file: File) => {
    await onCompleteWithProof(task.id, file);
    setShowProofModal(false);
  };

  const openNavigation = () => {
    let url = 'https://google.com';
    if (task.lat && task.lng) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${task.lat},${task.lng}`;
    } else if (task.address) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(task.address)}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
          {/* Top Bar */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    task.status === 'Offen'
                      ? 'bg-red-600 text-white'
                      : task.status === 'In Bearbeitung'
                      ? 'bg-orange-600 text-white'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  {task.status}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {formatGermanDateTime(task.dateTime)}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white break-words">
                {task.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="space-y-4 my-4 flex-1">
            {/* Description */}
            {task.description && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Beschreibung
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {task.description}
                </p>
              </div>
            )}

            {/* Address & Navigation */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  Baustellenadresse
                </h4>
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {task.address || 'Keine Adresse hinterlegt'}
                </p>
                {task.lat && task.lng && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    GPS: {task.lat.toFixed(4)}, {task.lng.toFixed(4)}
                  </p>
                )}
              </div>

              <button
                onClick={openNavigation}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 shrink-0"
              >
                <Navigation className="w-4 h-4 fill-current" />
                <span>Navigation starten</span>
              </button>
            </div>

            {/* Proof Image if completed */}
            {task.proofImageUrl && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Erledigt-Beweisfoto (Dokumentation)
                  </h4>
                  {task.completedAt && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {formatGermanDateTime(task.completedAt)}
                    </span>
                  )}
                </div>
                <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 aspect-video bg-black flex items-center justify-center group">
                  <img
                    src={task.proofImageUrl}
                    alt="Beweisfoto Abschluss"
                    className="w-full h-full object-cover"
                  />
                  <a
                    href={task.proofImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-2 right-2 p-2 rounded-lg bg-slate-900/80 text-white hover:bg-slate-900 transition flex items-center gap-1 text-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Großansicht
                  </a>
                </div>
              </div>
            )}

            {/* Status Switcher section */}
            <div className="pt-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Status ändern
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* 1. Offen */}
                <button
                  type="button"
                  onClick={() => handleStatusChange('Offen')}
                  disabled={isUpdating || task.status === 'Offen'}
                  className={`py-3 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 border ${
                    task.status === 'Offen'
                      ? 'bg-red-600 text-white border-red-500 shadow-md ring-2 ring-red-400/50'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Offen</span>
                </button>

                {/* 2. In Bearbeitung */}
                <button
                  type="button"
                  onClick={() => handleStatusChange('In Bearbeitung')}
                  disabled={isUpdating || task.status === 'In Bearbeitung'}
                  className={`py-3 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 border ${
                    task.status === 'In Bearbeitung'
                      ? 'bg-orange-600 text-white border-orange-500 shadow-md ring-2 ring-orange-400/50'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Clock3 className="w-4 h-4" />
                  <span>In Bearbeitung</span>
                </button>

                {/* 3. Erledigt */}
                <button
                  type="button"
                  onClick={() => handleStatusChange('Erledigt')}
                  disabled={isUpdating}
                  className={`py-3 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 border ${
                    task.status === 'Erledigt'
                      ? 'bg-green-600 text-white border-green-500 shadow-md ring-2 ring-green-400/50'
                      : 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/60 hover:bg-emerald-100 dark:hover:bg-emerald-800/40'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Erledigt (Foto)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            {onDeleteTask && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Möchten Sie diese Aufgabe wirklich löschen?')) {
                    await onDeleteTask(task.id);
                    onClose();
                  }
                }}
                className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition"
                title="Aufgabe löschen"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="ml-auto px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm transition"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>

      {/* Proof Photo Upload Modal */}
      <ProofPhotoModal
        isOpen={showProofModal}
        onClose={() => setShowProofModal(false)}
        taskTitle={task.title}
        onUploadAndComplete={handleProofUploaded}
      />
    </>
  );
};
