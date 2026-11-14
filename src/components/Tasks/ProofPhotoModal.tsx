import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';

interface ProofPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  onUploadAndComplete: (file: File) => Promise<void>;
}

export const ProofPhotoModal: React.FC<ProofPhotoModalProps> = ({
  isOpen,
  onClose,
  taskTitle,
  onUploadAndComplete,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleConfirm = async () => {
    if (!selectedFile) {
      setErrorMsg('Bitte wählen Sie ein Foto aus oder nehmen Sie eines auf.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    try {
      await onUploadAndComplete(selectedFile);
      onClose();
    } catch (err: any) {
      console.error('Error uploading proof:', err);
      setErrorMsg('Fehler beim Hochladen des Beweisfotos. Bitte versuchen Sie es erneut.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Beweisfoto hochladen</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
                Aufgabe: {taskTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mandatory Note Banner */}
        <div className="my-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Pflichtangabe:</strong> Um diese Aufgabe als <strong>&bdquo;Erledigt&ldquo;</strong> zu markieren, muss ein Foto des fertiggestellten Arbeitsabschnitts zur Dokumentation in Firebase gespeichert werden.
          </span>
        </div>

        {/* Hidden inputs for camera capture & gallery file picker */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Image Preview or Selector buttons */}
        {previewUrl ? (
          <div className="space-y-3 my-2">
            <div className="relative rounded-2xl overflow-hidden border-2 border-green-500 bg-black aspect-video flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Vorschau Beweisfoto"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-[11px] font-bold text-green-400 border border-green-500/40">
                Foto bereit
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Camera className="w-3.5 h-3.5" />
                Neues Foto aufnehmen
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                Aus Galerie wählen
              </button>
            </div>
          </div>
        ) : (
          <div className="my-3 space-y-3">
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center bg-slate-50 dark:bg-slate-800/40">
              <ImageIcon className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Noch kein Beweisfoto ausgewählt
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Nehmen Sie direkt ein Foto mit der Kamera auf oder wählen Sie eine Datei aus.
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95"
                >
                  <Camera className="w-4 h-4 stroke-[2.5]" />
                  Kamera öffnen
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 transition active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  Datei / Galerie
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 mb-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Actions */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedFile || isUploading}
            className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg ${
              !selectedFile || isUploading
                ? 'bg-emerald-950 text-emerald-800 cursor-not-allowed opacity-60'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/30 active:scale-95'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Wird gespeichert...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                Foto hochladen & Erledigt
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
