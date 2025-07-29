import { db } from '../lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export interface Project {
  id: string;
  name: string;
}

const DEFAULT_BOARDS = [
  { name: 'todo', color: '#f8d471ff' },
  { name: 'inProgress', color: '#5224fbff' },
  { name: 'done', color: '#4ADE80' },
];

export const fetchProjects = async (userId: string): Promise<Project[]> => {
  const snapshot = await getDocs(collection(db, `users/${userId}/projects`));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as { name: string }),
  }));
};

export const createProjectHooks = async (userId: string, name: string, friends: string[] = []) => {
  const docRef = await addDoc(collection(db, `users/${userId}/projects`), {
    name,
    friends,
    createdAt: Date.now(),
  });

  const boardsCollection = collection(db, `users/${userId}/projects/${docRef.id}/boards`);
  for (const board of DEFAULT_BOARDS) {
    await addDoc(boardsCollection, board);
  }

  return docRef.id;
};
