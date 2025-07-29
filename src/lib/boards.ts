import { collection, addDoc, getDocs, query, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

interface Board {
  id: string;
  name: string;
  color?: string;
  createdAt?: number;
}

export const addBoard = async (
  userId: string,
  projectId: string,
  name: string,
  color: string
): Promise<string> => {
  const boardsRef = collection(db, 'users', userId, 'projects', projectId, 'boards');
  const docRef = await addDoc(boardsRef, {
    name,
    color,
    createdAt: Date.now(),
  });
  return docRef.id;
};

export async function getBoards(userId: string, projectId: string): Promise<Board[]> {
  if (!userId || !projectId) {
    console.error('userId or projectId missing:', { userId, projectId });
    return [];
  }

  const boardsRef = collection(db, 'users', userId, 'projects', projectId, 'boards');

  const q = query(boardsRef);
  const snapshot = await getDocs(q);

  const boards = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Board, 'id'>) }));

  console.log('Fetched boards:', boards);

  return boards;
}

export async function deleteBoard(userId: string, projectId: string, boardId: string) {
  const boardRef = doc(db, 'users', userId, 'projects', projectId, 'boards', boardId);
  await deleteDoc(boardRef);
}

export async function updateBoard(
  userId: string,
  projectId: string,
  boardId: string,
  updates: Partial<Board>
) {
  const boardRef = doc(db, 'users', userId, 'projects', projectId, 'boards', boardId);
  await updateDoc(boardRef, updates);
}
