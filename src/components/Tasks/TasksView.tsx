import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { TaskItem, TaskStatus, WorkerUser } from '../../types';
import { useTasks } from '../../hooks/useTasks';
import { formatGermanDateTime } from '../../utils/dateUtils';
import { CreateTaskModal } from './CreateTaskModal';
import { TaskDetailModal } from './TaskDetailModal';

interface TasksViewProps {
  worker: WorkerUser;
  selectedTaskFromExternal?: TaskItem | null;
  onClearSelectedTask?: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  worker,
  selectedTaskFromExternal,
  onClearSelectedTask,
}) => {
  const {
    tasks,
    loading,
    createTask,
    updateStatus,
    completeTaskWithProof,
    deleteTask,
    seedSampleTasks,
  } = useTasks(worker);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Alle' | TaskStatus>('Alle');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // If navigated from reminder or calendar
  React.useEffect(() => {
    if (selectedTaskFromExternal) {
      setSelectedTask(selectedTaskFromExternal);
      if (onClearSelectedTask) onClearSelectedTask();
    }
  }, [selectedTaskFromExternal, onClearSelectedTask]);

  // Sync selected task with real-time updates
  const activeDetailTask = useMemo(() => {
    if (!selectedTask) return null;
    return tasks.find((t) => t.id === selectedTask.id) || selectedTask;
  }, [selectedTask, tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus =
        statusFilter === 'Alle' ? true : task.status === statusFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.address.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [tasks, statusFilter, searchQuery]);

  // Status counts for tabs
  const counts = useMemo(() => {
    return {
      alle: tasks.length,
      offen: tasks.filter((t) => t.status === 'Offen').length,
      inBearbeitung: tasks.filter((t) => t.status === 'In Bearbeitung').length,
      erledigt: tasks.filter((t) => t.status === 'Erledigt').length,
    };
  }, [tasks]);

  return (
    <div className="space-y-4 pb-24 max-w-xl mx-auto px-4 pt-3">
      {/* Top Header & New Task Button */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Baustellen-Aufgaben
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tasks.length} Aufgaben insgesamt erfasst
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 active:scale-95 transition"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span className="hidden sm:inline">Neue Aufgabe</span>
          <span className="sm:hidden">Neu</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Aufgabe, Beschreibung oder Adresse suchen..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
        />
      </div>

      {/* Status Filter Badges / Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setStatusFilter('Alle')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            statusFilter === 'Alle'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow'
              : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Alle ({counts.alle})
        </button>
        <button
          onClick={() => setStatusFilter('Offen')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            statusFilter === 'Offen'
              ? 'bg-red-600 text-white shadow'
              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-slate-800 dark:border-transparent dark:text-red-400'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Offen ({counts.offen})
        </button>
        <button
          onClick={() => setStatusFilter('In Bearbeitung')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            statusFilter === 'In Bearbeitung'
              ? 'bg-orange-600 text-white shadow'
              : 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-slate-800 dark:border-transparent dark:text-orange-400'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          In Bearbeitung ({counts.inBearbeitung})
        </button>
        <button
          onClick={() => setStatusFilter('Erledigt')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            statusFilter === 'Erledigt'
              ? 'bg-green-600 text-white shadow'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-slate-800 dark:border-transparent dark:text-green-400'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Erledigt ({counts.erledigt})
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
            Aufgaben werden geladen...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <AlertCircle className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Keine Aufgaben gefunden</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Es gibt momentan keine Aufgaben mit diesem Filter. Erstellen Sie eine neue Aufgabe oder laden Sie Musteraufgaben.
            </p>
            {tasks.length === 0 && (
              <button
                onClick={seedSampleTasks}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 text-xs font-bold border border-slate-300 dark:border-slate-700 transition"
              >
                <Sparkles className="w-4 h-4" />
                Musteraufgaben laden
              </button>
            )}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition active:scale-[0.99] cursor-pointer space-y-2.5 relative group"
            >
              {/* Header with Title and Strict Status Badge */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition leading-snug">
                  {task.title}
                </h3>
                {/* Strict color-coded status badges */}
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 shadow-sm ${
                    task.status === 'Offen'
                      ? 'bg-red-600 text-white'
                      : task.status === 'In Bearbeitung'
                      ? 'bg-orange-600 text-white'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  {task.status}
                </span>
              </div>

              {/* Description preview */}
              {task.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {task.description}
                </p>
              )}

              {/* Bottom details: Address & DateTime */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                {task.address ? (
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate text-slate-700 dark:text-slate-300">{task.address}</span>
                  </div>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatGermanDateTime(task.dateTime)}</span>
                </div>
              </div>

              {/* Has Proof indicator */}
              {task.proofImageUrl && (
                <div className="pt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Beweisfoto vorhanden</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateTask={createTask}
      />

      {/* Task Details Modal */}
      <TaskDetailModal
        task={activeDetailTask}
        isOpen={!!activeDetailTask}
        onClose={() => setSelectedTask(null)}
        onUpdateStatus={updateStatus}
        onCompleteWithProof={completeTaskWithProof}
        onDeleteTask={deleteTask}
      />
    </div>
  );
};
