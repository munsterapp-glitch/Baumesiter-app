import { useMemo, useEffect, useState } from 'react';
import { TaskItem, ReminderNotification } from '../types';
import { isTaskDueForTomorrowReminder } from '../utils/dateUtils';

export function useReminders(tasks: TaskItem[]) {
  const [dismissedBannerIds, setDismissedBannerIds] = useState<Set<string>>(() => {
    try {
      const saved = sessionStorage.getItem('baumeister_dismissed_banners');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Request notification permission once on mount or user interaction
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((perm) => {
          setNotificationPermission(perm);
        }).catch((err) => {
          console.warn('Could not request Notification permission:', err);
        });
      }
    }
  }, []);

  // Compute active reminders
  const reminders: ReminderNotification[] = useMemo(() => {
    const list: ReminderNotification[] = [];
    const now = new Date();

    tasks.forEach((task) => {
      // Only remind for tasks that are not yet finished
      if (task.status === 'Erledigt') return;

      if (isTaskDueForTomorrowReminder(task.dateTime, now)) {
        list.push({
          id: `reminder_${task.id}`,
          taskId: task.id,
          title: task.title,
          text: `Erinnerung: Morgen steht die Aufgabe '${task.title}' in '${task.address || 'Baustelle'}' an.`,
          address: task.address,
          scheduledTime: task.dateTime,
          createdAt: new Date().toISOString(),
        });
      }
    });

    return list;
  }, [tasks]);

  // Fire native browser notification for new tomorrow reminders if permission granted
  useEffect(() => {
    if (notificationPermission === 'granted' && reminders.length > 0) {
      reminders.forEach((r) => {
        const key = `baumeister_notified_${r.id}`;
        if (!sessionStorage.getItem(key)) {
          try {
            new Notification('Baumeister App Erinnerung', {
              body: r.text,
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
            });
            sessionStorage.setItem(key, 'true');
          } catch (e) {
            console.warn('Native notification failed:', e);
          }
        }
      });
    }
  }, [reminders, notificationPermission]);

  const dismissBanner = (reminderId: string) => {
    setDismissedBannerIds((prev) => {
      const next = new Set(prev);
      next.add(reminderId);
      try {
        sessionStorage.setItem('baumeister_dismissed_banners', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const activeBanners = useMemo(() => {
    return reminders.filter((r) => !dismissedBannerIds.has(r.id));
  }, [reminders, dismissedBannerIds]);

  return {
    reminders,
    activeBanners,
    dismissBanner,
    totalRemindersCount: reminders.length,
    notificationPermission,
  };
}
