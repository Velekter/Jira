import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAcj3Fy9J5k6YnmDfzuJW1QkPE65asCL7M",
  authDomain: "jira-b9c7e.firebaseapp.com",
  projectId: "jira-b9c7e",
  storageBucket: "jira-b9c7e.firebasestorage.app",
  messagingSenderId: "712105294323",
  appId: "1:712105294323:web:6543c882069e97d829ba86",
  measurementId: "G-V9H9QJF136",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const registerUser = async (
  email: string,
  password: string,
  fullName: string
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    const usersCollectionRef = collection(db, "users");
    await addDoc(usersCollectionRef, {
      fullName,
      email,
      uid: user.uid,
      createdAt: new Date(),
    });
  } catch (error) {
    throw new Error("Registration failed. Please try again later.");
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    const token = await user.getIdToken();

    localStorage.setItem("token", token);

    return user;
  } catch (error) {
    throw new Error("Login failed. Please check your credentials.");
  }
};
