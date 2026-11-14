import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { TimeTrackingView } from './components/TimeTracking/TimeTrackingView';
import { TasksView } from './components/Tasks/TasksView';
import { MapView } from './components/Map/MapView';
import { CalendarView } from './components/Calendar/CalendarView';
import { AuthScreen } from './components/Auth/AuthScreen';
import { NotificationDrawer } from './components/Notifications/NotificationDrawer';
import { ReminderBanner } from './components/Notifications/ReminderBanner';
import { TaskDetailModal } from './components/Tasks/TaskDetailModal';
import { CreateTaskModal } from './components/Tasks/CreateTaskModal';
import { useTasks } from './hooks/useTasks';
import { useReminders } from './hooks/useReminders';
import { TaskItem } from './types';
import { HardHat, Loader2 } from 'lucide-react';

function BaumeisterMainApp() {
  const { currentUser, workerProfile, loading: authLoading, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabType>('zeiterfassung');
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Modal states for cross-screen tasks
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<TaskItem | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [taskToHighlightInTasksView, setTaskToHighlightInTasksView] = useState<TaskItem | null>(null);

  // Real-time tasks & reminders
  const {
    tasks,
    createTask,
    updateStatus,
    completeTaskWithProof,
    deleteTask,
  } = useTasks(workerProfile);

  const {
    reminders,
    activeBanners,
    dismissBanner,
    totalRemindersCount,
  } = useReminders(tasks);

  // Loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-800 dark:text-slate-100 transition-colors">
        <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/20 mb-4 animate-bounce">
          <HardHat className="w-9 h-9 stroke-[2.2]" />
        </div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          <span>Baumeister App wird initialisiert...</span>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Authentication
  if (!currentUser || !workerProfile) {
    return <AuthScreen />;
  }

  // Upcoming open tasks count
  const openTasksCount = tasks.filter((t) => t.status === 'Offen').length;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors">
      {/* 1. Header with Logo, Greeting, Theme Toggle, Notification Bell & Logout */}
      <Header
        worker={workerProfile}
        remindersCount={totalRemindersCount + openTasksCount}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        onLogout={logout}
      />

      {/* 2. Automated 19:00 Day-Before In-App Reminder Banners */}
      <ReminderBanner
        banners={activeBanners}
        onDismiss={dismissBanner}
      />

      {/* 3. Main Screen View based on Bottom Navigation */}
      <main className="flex-1 overflow-x-hidden">
        {currentTab === 'zeiterfassung' && (
          <TimeTrackingView worker={workerProfile} />
        )}

        {currentTab === 'aufgaben' && (
          <TasksView
            worker={workerProfile}
            selectedTaskFromExternal={taskToHighlightInTasksView}
            onClearSelectedTask={() => setTaskToHighlightInTasksView(null)}
          />
        )}

        {currentTab === 'karte' && (
          <MapView
            tasks={tasks}
            onOpenTaskDetails={(task) => setSelectedTaskForModal(task)}
          />
        )}

        {currentTab === 'kalender' && (
          <CalendarView
            tasks={tasks}
            onSelectTask={(task) => setSelectedTaskForModal(task)}
            onOpenCreateTask={() => setIsCreateTaskOpen(true)}
          />
        )}
      </main>

      {/* 4. Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        openTasksCount={openTasksCount}
      />

      {/* 5. Notification Bell Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        reminders={reminders}
        upcomingTasks={tasks.filter((t) => t.status !== 'Erledigt')}
        onSelectTask={(task) => {
          setSelectedTaskForModal(task);
        }}
      />

      {/* 6. Universal Task Details Modal (from Map or Calendar) */}
      <TaskDetailModal
        task={selectedTaskForModal}
        isOpen={!!selectedTaskForModal}
        onClose={() => setSelectedTaskForModal(null)}
        onUpdateStatus={updateStatus}
        onCompleteWithProof={completeTaskWithProof}
        onDeleteTask={deleteTask}
      />

      {/* 7. Quick Create Task Modal (e.g. from Calendar) */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onCreateTask={async (newTask) => {
          await createTask(newTask);
          setIsCreateTaskOpen(false);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BaumeisterMainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
