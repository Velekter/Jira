import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { redirect } from 'react-router-dom';

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

export function getAuthToken(): string | null {
  const token = localStorage.getItem('token');
  return token ?? null;
}

export function checkAuthLoader() {
  const token = getAuthToken();

  if (!token) {
    return redirect('/login');
  }
  return null;
}

export function logoutUser() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  window.location.href = '/login';
}
