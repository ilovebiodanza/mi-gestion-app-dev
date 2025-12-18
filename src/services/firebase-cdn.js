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
  _cleanObject(obj) {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this._cleanObject(item));
    }
    const cleaned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (value !== undefined) {
          cleaned[key] = this._cleanObject(value);
        }
      }
    }
    return cleaned;
  }

  // --- MÉTODOS DE AUTENTICACIÓN ---
  getAuth() {
    return this.auth;
  }
  getFirestore() {
    return this.db;
  }
  getApp() {
    return this.app;
  }

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

  // --- MÉTODOS DE DOCUMENTOS UNICOS ---
  doc(path, ...pathSegments) {
    // Mejora: Permite llamar a doc(db, "coll", "id") o doc(db, "coll/id")
    if (pathSegments.length > 0) {
      return this.modules.doc(this.db, path, ...pathSegments);
    }
    return this.modules.doc(this.db, path);
  }

  getDoc(ref) {
    return this.modules.getDoc(ref);
  }

  setDoc(ref, data, options) {
    const cleanedData = this._cleanObject(data);
    return this.modules.setDoc(ref, cleanedData, options);
  }

  deleteDoc(ref) {
    return this.modules.deleteDoc(ref);
  }

  // --- [NUEVO] MÉTODOS DE CONSULTA (Collections & Queries) ---
  // Necesarios para listar documentos en el Dashboard

  collection(path) {
    return this.modules.collection(this.db, path);
  }

  query(collectionRef, ...queryConstraints) {
    return this.modules.query(collectionRef, ...queryConstraints);
  }

  async getDocs(querySnapshot) {
    return this.modules.getDocs(querySnapshot);
  }

  where(field, op, value) {
    return this.modules.where(field, op, value);
  }

  orderBy(field, direction) {
    return this.modules.orderBy(field, direction);
  }
}

// Exportar instancia única
export const firebaseService = new FirebaseCDNService();
