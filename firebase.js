// Firebase config & initialization
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDFD0ilbHx70I-1Z1vtMVmnx6mLt30Pf44",
  authDomain: "student-portal-6c104.firebaseapp.com",
  projectId: "student-portal-6c104",
  storageBucket: "student-portal-6c104.firebasestorage.app",
  messagingSenderId: "386568197727",
  appId: "1:386568197727:web:4007afb1df2df05ce52dea",
  measurementId: "G-VR4YZLTG72"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
