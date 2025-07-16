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
  status: 'todo' | 'inProgress' | 'done';
  createdAt: number;
  userId: string;
}

const tasksRef = collection(db, 'tasks');

export const getTasksByUser = async (userId: string): Promise<Task[]> => {
  const q = query(tasksRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Task) }));
};

export const createTask = async (task: Omit<Task, 'id'>): Promise<string> => {
  const docRef = await addDoc(tasksRef, task);
  return docRef.id;
};

export const updateTask = async (id: string, updates: Partial<Task>) => {
  const taskRef = doc(db, 'tasks', id);
  await updateDoc(taskRef, updates);
};

export const deleteTask = async (id: string) => {
  const taskRef = doc(db, 'tasks', id);
  await deleteDoc(taskRef);
};
