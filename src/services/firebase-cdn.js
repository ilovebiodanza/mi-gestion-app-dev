// src/services/firebase-cdn.js
// Servicio Firebase usando CDN (más confiable para desarrollo)

class FirebaseCDNService {
  constructor() {
    if (!window.firebaseModules) {
      throw new Error("Firebase no está inicializado. Recarga la página.");
    }

    this.modules = window.firebaseModules;
    this.auth = this.modules.auth;
    this.db = this.modules.db;
    this.app = this.modules.app;
  }

  // --- MÉTODOS DE LIMPIEZA DE DATOS ---
  /**
   * Limpia recursivamente un objeto o array, eliminando
   * todas las propiedades con valor 'undefined'.
   * Firestore no acepta 'undefined'.
   */
  _cleanObject(obj) {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      // Limpiar elementos del array
      return obj.map((item) => this._cleanObject(item));
    }

    const cleaned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        // Solo incluir propiedades si no son 'undefined'
        if (value !== undefined) {
          cleaned[key] = this._cleanObject(value);
        }
      }
    }
    return cleaned;
  }
  // ------------------------------------

  // Métodos de autenticación
  getAuth() {
    return this.auth;
  }

  getFirestore() {
    return this.db;
  }

  getApp() {
    return this.app;
  }

  // Funciones helper
  async createUser(email, password) {
    return this.modules.createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );
  }

  async signIn(email, password) {
    return this.modules.signInWithEmailAndPassword(this.auth, email, password);
  }

  async signOut() {
    return this.modules.signOut(this.auth);
  }

  async resetPassword(email) {
    return this.modules.sendPasswordResetEmail(this.auth, email);
  }

  async updatePassword(user, newPassword) {
    return this.modules.updatePassword(user, newPassword);
  }

  onAuthStateChanged(callback) {
    return this.modules.onAuthStateChanged(this.auth, callback);
  }

  // Firestore helpers
  getDoc(ref) {
    return this.modules.getDoc(ref);
  }

  setDoc(ref, data, options) {
    // Añadir 'options' si se usa merge
    // Limpieza automática antes de guardar en Firestore
    const cleanedData = this._cleanObject(data); // <--- CAMBIO CLAVE

    // Pasar el objeto de datos limpio a la función original de Firebase
    return this.modules.setDoc(ref, cleanedData, options);
  }
  deleteDoc(ref) {
    // Llama a la función original de Firebase
    return this.modules.deleteDoc(ref);
  }

  doc(path) {
    return this.modules.doc(this.db, path);
  }
}

// Exportar instancia única
export const firebaseService = new FirebaseCDNService();
