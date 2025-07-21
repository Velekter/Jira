import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

interface Board {
  id: string;
  name: string;
  color?: string;
  createdAt?: number;
}

export const addBoard = async (userId: string, name: string, color: string): Promise<string> => {
  const boardsRef = collection(db, 'users', userId, 'boards');
  const docRef = await addDoc(boardsRef, {
    name,
    color,
    createdAt: Date.now(),
  });
  return docRef.id;
};

export async function getBoards(userId: string): Promise<Board[]> {
  const boardsRef = collection(db, 'users', userId, 'boards');
  const q = query(boardsRef, orderBy('createdAt'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Board, 'id'>) }));
}

export async function deleteBoard(userId: string, boardId: string) {
  const boardRef = doc(db, 'users', userId, 'boards', boardId);
  await deleteDoc(boardRef);
}

export async function updateBoard(userId: string, boardId: string, updates: Partial<Board>) {
  const boardRef = doc(db, 'users', userId, 'boards', boardId);
  await updateDoc(boardRef, updates);
}
