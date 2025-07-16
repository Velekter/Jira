import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { DocumentData } from 'firebase/firestore';

export const fetchUserData = async (uid: string) => {
  if (!uid) throw new Error('UID is missing');

  const userDocRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userDocRef);

  if (!docSnap.exists()) {
    throw new Error('User not found');
  }

  return docSnap.data();
};

export const fetchUserById = async (uid: string): Promise<DocumentData> => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) throw new Error('User not found');
  return userDoc.data();
};
