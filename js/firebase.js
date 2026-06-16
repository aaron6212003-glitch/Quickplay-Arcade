import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  sendEmailVerification, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, doc, setDoc, getDoc, updateDoc, increment, where, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCPWREUZ3iag9SFvyOywXcwLw1CD9XCFhU",
  authDomain: "quick-play-arcade.firebaseapp.com",
  projectId: "quick-play-arcade",
  storageBucket: "quick-play-arcade.firebasestorage.app",
  messagingSenderId: "359630822608",
  appId: "1:359630822608:web:f9a897b2f4ecb988f452d5",
  measurementId: "G-WKZSD1B640"
};

// Initialize Firebase
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Re-export specific auth and firestore functions so other files can use them easily
export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  where,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
};
