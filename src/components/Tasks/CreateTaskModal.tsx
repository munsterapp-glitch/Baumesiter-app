import React, { useState } from 'react';
import {
  X,
  MapPin,
  Search,
  Calendar,
  Check,
  Loader2,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';
import { TaskStatus } from '../../types';
import { searchAddressCoordinates } from '../../services/nominatim';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: {
    title: string;
    description: string;
    address: string;
    lat?: number | null;
    lng?: number | null;
    dateTime: string;
    status: TaskStatus;
  }) => Promise<any>;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onCreateTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // Default dateTime: Tomorrow at 08:00
  const getDefaultDateTime = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(8, 0, 0, 0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T08:00`;
  };

  const [dateTime, setDateTime] = useState(getDefaultDateTime);
  const [status, setStatus] = useState<TaskStatus>('Offen');

  const [isSearchingCoords, setIsSearchingCoords] = useState(false);
  const [geocodeNotice, setGeocodeNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearchCoordinates = async () => {
    if (!address.trim()) {
      setGeocodeNotice('Bitte geben Sie zuerst eine Adresse ein.');
      return;
    }

    setIsSearchingCoords(true);
    setGeocodeNotice(null);
    try {
      const result = await searchAddressCoordinates(address);
      if (result) {
        setLat(result.lat);
        setLng(result.lng);
        setGeocodeNotice(`Koordinaten gefunden: ${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}`);
      } else {
        setGeocodeNotice('Keine Koordinaten für diese Adresse gefunden. Bitte präzisieren (z.B. Stadt, PLZ).');
      }
    } catch {
      setGeocodeNotice('Fehler bei der Abfrage der Koordinaten.');
    } finally {
      setIsSearchingCoords(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Bitte geben Sie einen Aufgabentitel ein.');
      return;
    }
    if (!dateTime) {
      setErrorMsg('Bitte wählen Sie Datum und Uhrzeit aus.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onCreateTask({
        title: title.trim(),
        description: description.trim(),
        address: address.trim(),
        lat,
        lng,
        dateTime,
        status,
      });

      // Reset & close
      setTitle('');
      setDescription('');
      setAddress('');
      setLat(null);
      setLng(null);
      setDateTime(getDefaultDateTime());
      setStatus('Offen');
      onClose();
    } catch (err: any) {
      console.error('Error creating task:', err);
      setErrorMsg('Fehler beim Speichern der Aufgabe. Bitte prüfen Sie die Verbindung.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-slate-900 dark:text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Neue Aufgabe erstellen</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Baustelle planen & terminieren</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 my-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Aufgabentitel */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
              Aufgabentitel *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Rohre verlegen / Elektrik verkleiden"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* 2. Beschreibung */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
              Beschreibung
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detaillierte Arbeitsanweisungen, Materialien, Besonderheiten..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* 3. Baustellenadresse + Koordinaten suchen */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
              Baustellenadresse
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Straße, Hausnummer, PLZ Ort"
                  className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                type="button"
                onClick={handleSearchCoordinates}
                disabled={isSearchingCoords}
                className="px-3.5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-400 border border-slate-300 dark:border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition active:scale-95 shrink-0"
                title="Koordinaten via OpenStreetMap Nominatim suchen"
              >
                {isSearchingCoords ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Koordinaten suchen</span>
              </button>
            </div>

            {geocodeNotice && (
              <p className={`text-xs mt-1.5 font-medium ${lat && lng ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {geocodeNotice}
              </p>
            )}
          </div>

          {/* 4. Datum und Uhrzeit */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
              Datum und Uhrzeit *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="datetime-local"
                required
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* 5. Status */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Offen', 'In Bearbeitung', 'Erledigt'] as TaskStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition border ${
                    status === st
                      ? st === 'Offen'
                        ? 'bg-red-600 text-white border-red-500 shadow-md'
                        : st === 'In Bearbeitung'
                        ? 'bg-orange-600 text-white border-orange-500 shadow-md'
                        : 'bg-green-600 text-white border-green-500 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wird erstellt...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  Aufgabe erstellen
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
