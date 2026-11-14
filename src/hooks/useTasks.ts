import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { TaskItem, TaskStatus, WorkerUser } from '../types';

export function useTasks(worker: WorkerUser | null) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to all tasks in real-time
    const tasksCol = collection(db, 'tasks');
    // We order in memory or query
    const q = query(tasksCol);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: TaskItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          title: data.title || '',
          description: data.description || '',
          address: data.address || '',
          lat: data.lat ?? null,
          lng: data.lng ?? null,
          dateTime: data.dateTime || '',
          status: (data.status as TaskStatus) || 'Offen',
          createdBy: data.createdBy || '',
          createdByName: data.createdByName || '',
          proofImageUrl: data.proofImageUrl || '',
          completedAt: data.completedAt || '',
          createdAt: data.createdAt || '',
        });
      });

      // Sort by dateTime descending or created date
      list.sort((a, b) => (b.dateTime || '').localeCompare(a.dateTime || ''));
      setTasks(list);
      setLoading(false);
    }, (error) => {
      console.warn('Error listening to tasks:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Create a new task
  const createTask = async (taskData: Omit<TaskItem, 'id' | 'createdAt' | 'createdBy' | 'createdByName'>) => {
    if (!worker) throw new Error('Nicht angemeldet');
    const docData = {
      ...taskData,
      createdBy: worker.workerId,
      createdByName: worker.name,
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, 'tasks'), docData);
    return docRef.id;
  };

  // Change status between Offen and In Bearbeitung
  const updateStatus = async (taskId: string, newStatus: 'Offen' | 'In Bearbeitung') => {
    const docRef = doc(db, 'tasks', taskId);
    await updateDoc(docRef, {
      status: newStatus,
    });
  };

  // Upload proof photo and mark as Erledigt
  const completeTaskWithProof = async (taskId: string, file: File): Promise<string> => {
    let proofImageUrl = '';

    try {
      // 1. Attempt upload to Firebase Storage
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const storagePath = `task_proofs/${taskId}_${Date.now()}_${cleanFileName}`;
      const storageRef = ref(storage, storagePath);

      const snapshot = await uploadBytes(storageRef, file);
      proofImageUrl = await getDownloadURL(snapshot.ref);
    } catch (storageError) {
      console.warn('Firebase Storage upload failed or restricted, falling back to local data URL:', storageError);
      // Fallback: convert to base64 Data URL so the proof is never lost
      proofImageUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    }

    // 2. Update Firestore task document
    const docRef = doc(db, 'tasks', taskId);
    await updateDoc(docRef, {
      status: 'Erledigt' as TaskStatus,
      proofImageUrl,
      completedAt: new Date().toISOString(),
    });

    return proofImageUrl;
  };

  const deleteTask = async (taskId: string) => {
    await deleteDoc(doc(db, 'tasks', taskId));
  };

  // Seed sample tasks if empty to give user immediate rich data
  const seedSampleTasks = async () => {
    if (!worker) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 30, 0, 0);

    const todayAfternoon = new Date();
    todayAfternoon.setHours(14, 0, 0, 0);

    const sampleList = [
      {
        title: 'Bewehrung & Schalung gießen',
        description: 'Fundamentabschnitt B fertigstellen und Betonlieferung um 10:00 Uhr abnehmen.',
        address: 'Alexanderplatz 1, 10178 Berlin',
        lat: 52.5219,
        lng: 13.4132,
        dateTime: tomorrow.toISOString().substring(0, 16),
        status: 'Offen' as TaskStatus,
      },
      {
        title: 'Trockenbauwände montieren',
        description: 'Dämmung einbringen und Gipskartonplatten im 2. Obergeschoss anbringen.',
        address: 'Marienplatz 8, 80331 München',
        lat: 48.1371,
        lng: 11.5754,
        dateTime: todayAfternoon.toISOString().substring(0, 16),
        status: 'In Bearbeitung' as TaskStatus,
      },
      {
        title: 'Estrichprüfung & Feuchtemessung',
        description: 'CM-Messung im Erdgeschoss durchführen und Protokoll erstellen.',
        address: 'Jungfernstieg 14, 20354 Hamburg',
        lat: 53.5532,
        lng: 9.9916,
        dateTime: new Date(Date.now() - 86400000).toISOString().substring(0, 16),
        status: 'Erledigt' as TaskStatus,
        proofImageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=600&q=80',
        completedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    for (const sample of sampleList) {
      await addDoc(collection(db, 'tasks'), {
        ...sample,
        createdBy: worker.workerId,
        createdByName: worker.name,
        createdAt: new Date().toISOString(),
      });
    }
  };

  return {
    tasks,
    loading,
    createTask,
    updateStatus,
    completeTaskWithProof,
    deleteTask,
    seedSampleTasks,
  };
}
