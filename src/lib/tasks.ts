import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

export interface Task {
  id?: string;
  title: string;
  status: string;
  createdAt?: number;
  projectId: string;
  description?: string;
  deadline?: number | null;
  priority?: 'low' | 'medium' | 'high';
  color?: string;
}

const tasksRef = collection(db, 'tasks');

const cleanTaskData = (task: any) => {
  const cleaned: any = {};
  Object.keys(task).forEach(key => {
    if (task[key] !== undefined) {
      cleaned[key] = task[key];
    }
  });
  return cleaned;
};

export const getTasksByUser = async (userId: string): Promise<Task[]> => {
  const q = query(tasksRef, where('projectId', 'in', []));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Task) }));
};

export const getTasksByProject = async (projectId: string): Promise<Task[]> => {
  console.log('Getting tasks for project:', projectId);
  const q = query(tasksRef, where('projectId', '==', projectId));
  const snapshot = await getDocs(q);
  const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Task) }));
  console.log('Retrieved tasks:', tasks);
  return tasks;
};

export const createTask = async (task: Omit<Task, 'id'>): Promise<string> => {
  console.log('Creating task with data:', task);
  const cleanedTask = cleanTaskData(task);
  console.log('Cleaned task data:', cleanedTask);
  const docRef = await addDoc(tasksRef, cleanedTask);
  return docRef.id;
};

export const updateTask = async (id: string, updates: Partial<Task>) => {
  console.log('Updating task:', id, 'with updates:', updates);
  try {
    const taskRef = doc(db, 'tasks', id);
    const cleanedUpdates = cleanTaskData(updates);
    console.log('Cleaned updates:', cleanedUpdates);
    await updateDoc(taskRef, cleanedUpdates);
    console.log('Task updated successfully');
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (id: string) => {
  const taskRef = doc(db, 'tasks', id);
  await deleteDoc(taskRef);
};

export const moveTaskToCurrent = async (taskId: string, newStatus: string) => {
  const taskRef = doc(db, 'tasks', taskId);
  await updateDoc(taskRef, {
    status: newStatus,
    deadline: null,
  });
};
