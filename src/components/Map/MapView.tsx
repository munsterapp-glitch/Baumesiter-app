import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Navigation,
  MapPin,
  Clock,
  X,
} from 'lucide-react';
import { TaskItem, TaskStatus } from '../../types';
import { formatGermanDateTime } from '../../utils/dateUtils';

interface MapViewProps {
  tasks: TaskItem[];
  onOpenTaskDetails?: (task: TaskItem) => void;
}

// Generate colored SVG marker pins
function createStatusIcon(status: TaskStatus) {
  let color = '#DC2626'; // Red = Offen
  if (status === 'In Bearbeitung') {
    color = '#EA580C'; // Orange = In Bearbeitung
  } else if (status === 'Erledigt') {
    color = '#16A34A'; // Green = Erledigt
  }

  const svgHtml = `
    <div style="
      position: relative;
      width: 38px;
      height: 48px;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
      cursor: pointer;
      transform: translate(-19px, -48px);
    ">
      <svg width="38" height="48" viewBox="0 0 38 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 0C8.50659 0 0 8.50659 0 19C0 31.5 19 48 19 48C19 48 38 31.5 38 19C38 8.50659 29.4934 0 19 0Z" fill="${color}"/>
        <circle cx="19" cy="19" r="8" fill="#FFFFFF"/>
        <circle cx="19" cy="19" r="4.5" fill="${color}"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-pin',
    iconSize: [38, 48],
    iconAnchor: [19, 48],
  });
}

function MapBoundsAdjuster({ tasksWithCoords }: { tasksWithCoords: TaskItem[] }) {
  const map = useMap();

  useEffect(() => {
    if (tasksWithCoords.length === 0) return;

    if (tasksWithCoords.length === 1 && tasksWithCoords[0].lat && tasksWithCoords[0].lng) {
      map.setView([tasksWithCoords[0].lat, tasksWithCoords[0].lng], 14);
    } else {
      const bounds = L.latLngBounds(
        tasksWithCoords.map((t) => [t.lat!, t.lng!] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [tasksWithCoords, map]);

  return null;
}

export const MapView: React.FC<MapViewProps> = ({ tasks, onOpenTaskDetails }) => {
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Filter tasks that have valid coordinates
  const tasksWithCoords = useMemo(() => {
    return tasks.filter(
      (t) => typeof t.lat === 'number' && typeof t.lng === 'number' && !isNaN(t.lat) && !isNaN(t.lng)
    );
  }, [tasks]);

  // Center on Germany / default coordinates
  const defaultCenter: [number, number] = useMemo(() => {
    if (tasksWithCoords.length > 0) {
      return [tasksWithCoords[0].lat!, tasksWithCoords[0].lng!];
    }
    return [51.1657, 10.4515];
  }, [tasksWithCoords]);

  // Navigation action
  const handleStartNavigation = (task: TaskItem) => {
    let url = 'https://google.com';
    if (task.lat && task.lng) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${task.lat},${task.lng}`;
    } else if (task.address) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(task.address)}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative w-full h-[calc(100vh-8rem)] min-h-[500px] flex flex-col bg-slate-100 dark:bg-slate-950 transition-colors">
      {/* Top Map Floating Badge */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2">
        <div className="px-3.5 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-slate-300 dark:border-slate-700/80 shadow-md text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-500" />
          <span>{tasksWithCoords.length} Baustellen mit GPS erfasst</span>
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute top-3 right-3 z-[1000] hidden sm:flex items-center gap-2.5 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-slate-300 dark:border-slate-700/80 px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-md">
        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Offen
        </span>
        <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-600" /> In Bearbeitung
        </span>
        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <span className="w-2.5 h-2.5 rounded-full bg-green-600" /> Erledigt
        </span>
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={defaultCenter}
        zoom={6}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ background: '#e2e8f0' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBoundsAdjuster tasksWithCoords={tasksWithCoords} />

        {tasksWithCoords.map((task) => (
          <Marker
            key={task.id}
            position={[task.lat!, task.lng!]}
            icon={createStatusIcon(task.status)}
            eventHandlers={{
              click: () => {
                setSelectedTask(task);
              },
            }}
          />
        ))}
      </MapContainer>

      {/* Bottom Sheet / Card for Selected Task */}
      {selectedTask && (
        <div className="absolute bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 z-[1000] bg-white/98 dark:bg-slate-900/95 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-3xl p-4 sm:p-5 shadow-2xl text-slate-900 dark:text-slate-100 animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="min-w-0">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block mb-1 ${
                  selectedTask.status === 'Offen'
                    ? 'bg-red-600 text-white'
                    : selectedTask.status === 'In Bearbeitung'
                    ? 'bg-orange-600 text-white'
                    : 'bg-green-600 text-white'
                }`}
              >
                {selectedTask.status}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {selectedTask.title}
              </h3>
            </div>
            <button
              onClick={() => setSelectedTask(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Details */}
          <div className="space-y-2 my-3 text-xs">
            {selectedTask.address && (
              <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">
                  {selectedTask.address}
                </span>
              </div>
            )}

            {selectedTask.description && (
              <p className="text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {selectedTask.description}
              </p>
            )}

            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{formatGermanDateTime(selectedTask.dateTime)}</span>
            </div>
          </div>

          {/* Action: Prominent Navigation Starten Button */}
          <div className="pt-2 flex gap-2">
            <button
              onClick={() => handleStartNavigation(selectedTask)}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition"
            >
              <Navigation className="w-4 h-4 fill-current stroke-[2]" />
              <span>Navigation starten</span>
            </button>

            {onOpenTaskDetails && (
              <button
                onClick={() => {
                  onOpenTaskDetails(selectedTask);
                  setSelectedTask(null);
                }}
                className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                title="Details ansehen"
              >
                Details
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
