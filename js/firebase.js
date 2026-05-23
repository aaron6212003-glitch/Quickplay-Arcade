// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, doc, setDoc, getDoc, updateDoc, increment, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Re-export specific auth and firestore functions so other files can use them easily
export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  where
};
