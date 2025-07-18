import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from '../firebase';
import type { Task } from "./tasks";

export async function addTask(userId: string, taskData: Task) {
  const tasksRef = collection(db, 'users', userId, 'tasks');
  const docRef = await addDoc(tasksRef, {
    ...taskData,
    createdAt: Date.now()
  });
  return docRef.id;
}

export async function getTasksByBoard(userId: string, boardId: string) {
  const tasksRef = collection(db, 'users', userId, 'tasks');
  const q = query(tasksRef, where('boardId', '==', boardId), orderBy('createdAt'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
