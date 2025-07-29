import { collection, addDoc, getDocs, query, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

interface Board {
  id: string;
  name: string;
  color?: string;
  createdAt?: number;
  order?: number;
}

export const addBoard = async (
  projectId: string,
  name: string,
  color: string
): Promise<string> => {
  // Використовуємо колекцію projects для дошок
  const boardsRef = collection(db, 'projects', projectId, 'boards');
  
  // Отримуємо поточний порядок дошок
  const existingBoards = await getBoards(projectId);
  const maxOrder = existingBoards.length > 0 ? Math.max(...existingBoards.map(b => b.order || 0)) : -1;
  
  console.log('Adding new board with order:', maxOrder + 1, 'for project:', projectId);
  
  const docRef = await addDoc(boardsRef, {
    name,
    color,
    createdAt: Date.now(),
    order: maxOrder + 1,
  });
  return docRef.id;
};

export async function getBoards(projectId: string): Promise<Board[]> {
  if (!projectId) {
    console.error('projectId missing:', { projectId });
    return [];
  }

  // Використовуємо колекцію projects для отримання дошок
  const boardsRef = collection(db, 'projects', projectId, 'boards');

  const q = query(boardsRef);
  const snapshot = await getDocs(q);

  const boards = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Board, 'id'>) }));

  // Сортуємо дошки за порядком
  boards.sort((a, b) => (a.order || 0) - (b.order || 0));

  console.log('Fetched boards for project:', projectId, boards);

  return boards;
}

export async function deleteBoard(projectId: string, boardId: string) {
  // Використовуємо колекцію projects для видалення дошок
  const boardRef = doc(db, 'projects', projectId, 'boards', boardId);
  await deleteDoc(boardRef);
}

export async function updateBoard(
  projectId: string,
  boardId: string,
  updates: Partial<Board>
) {
  // Використовуємо колекцію projects для оновлення дошок
  const boardRef = doc(db, 'projects', projectId, 'boards', boardId);
  await updateDoc(boardRef, updates);
}

export async function updateBoardOrder(projectId: string, boardIds: string[]) {
  console.log('Updating board order for project:', projectId, 'with order:', boardIds);
  
  const batch = writeBatch(db);
  
  boardIds.forEach((boardId, index) => {
    const boardRef = doc(db, 'projects', projectId, 'boards', boardId);
    batch.update(boardRef, { order: index });
  });
  
  await batch.commit();
  console.log('Board order updated successfully');
}
