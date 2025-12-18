// src/config/firebase-config.js

// 1. Importaciones (Movemos los imports del HTML aquí)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  writeBatch,
  where,
} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";

// 2. Tu objeto de configuración
const firebaseConfig = {
  apiKey: "AIzaSyBJgDqHiHD8mncuRNlw8eA1ismr_fcvj2E",
  authDomain: "mi-gestion-e2ee.firebaseapp.com",
  projectId: "mi-gestion-e2ee",
  storageBucket: "mi-gestion-e2ee.firebasestorage.app",
  messagingSenderId: "97671435614",
  appId: "1:97671435614:web:e0f35d92692ca1e63b2bcf",
  measurementId: "G-GLYJSXBC8E",
};

// 3. Inicialización
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 4. Restauramos el puente (window.firebaseModules)
// Esto es vital para que el resto de tu app siga funcionando igual
window.firebaseModules = {
  app,
  auth,
  db,
  // Funciones de Auth
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
  // Funciones de Firestore
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  writeBatch,
  where,
};

console.log("🔥 Firebase modules loaded from config/firebase-config.js");

// Opcional: Exportamos también por defecto por si quieres importar de forma moderna en el futuro
export default firebaseConfig;
export { app, auth, db };
