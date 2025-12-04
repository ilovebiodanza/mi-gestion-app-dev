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

  setDoc(ref, data) {
    return this.modules.setDoc(ref, data);
  }

  doc(path) {
    return this.modules.doc(this.db, path);
  }
}

// Exportar instancia única
export const firebaseService = new FirebaseCDNService();
