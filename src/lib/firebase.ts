import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

interface RegisterFormData {
  email: string;
  password: string;
  fullName: string;
}

export const registerUser = async (data: RegisterFormData) => {
  const { email, password, fullName } = data;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      fullName,
      email,
      createdAt: new Date(),
      friends: {},
    });

    const token = await user.getIdToken();
    localStorage.setItem('token', token);
    localStorage.setItem('userId', user.uid);

    return { user, token };
  } catch (error) {
    console.error('Firebase registration error:', error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const token = await user.getIdToken();
    localStorage.setItem('token', token);
    localStorage.setItem('userId', user.uid);

    return { user, token };
  } catch (error) {
    throw new Error((error as Error).message || 'Login failed. Please check your credentials.');
  }
};

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
