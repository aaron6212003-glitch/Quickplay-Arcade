// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, sendEmailVerification, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, doc, setDoc, getDoc, updateDoc, increment, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// Determine the appropriate authDomain dynamically to enable a same-origin Vercel proxy.
// Fallback to standard domain when running on localhost to support local dev server auth.
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const dynamicAuthDomain = isLocal ? "quick-play-arcade.firebaseapp.com" : window.location.hostname;

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCPWREUZ3iag9SFvyOywXcwLw1CD9XCFhU",
  authDomain: dynamicAuthDomain,
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
  where,
  ref,
  uploadBytes,
  getDownloadURL
};
