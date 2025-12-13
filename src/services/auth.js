// src/services/auth.js
import { encryptionService } from "./encryption/index.js";
import { generateSalt } from "./encryption/key-derivation.js";

class AuthService {
  constructor() {
    this.auth = null;
    this.db = null;
    this.user = null;
    this.observers = [];
    this.waitForFirebase();
  }

  async waitForFirebase() {
    let attempts = 0;
    while (!window.firebaseModules && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (window.firebaseModules) {
      this.auth = window.firebaseModules.auth;
      this.db = window.firebaseModules.db;

      const { onAuthStateChanged } = window.firebaseModules;
      onAuthStateChanged(this.auth, (user) => this.updateState(user));
    }
  }

  updateState(user) {
    this.user = user;
    this.notifyObservers(user);
  }

  subscribe(observer) {
    this.observers.push(observer);
    if (this.user !== null) observer(this.user);
  }

  notifyObservers(user) {
    this.observers.forEach((obs) => obs(user));
  }

  getCurrentUser() {
    return this.user;
  }

  bufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  base64ToBuffer(base64) {
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  }

  // Recupera Salt y Verifier
  async _getSecurityData(uid) {
    const { getDoc, doc } = window.firebaseModules;
    try {
      const docRef = doc(this.db, "users", uid, "system", "security");
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        return {
          salt: this.base64ToBuffer(data.salt),
          verifier: data.verifier ? this.base64ToBuffer(data.verifier) : null,
        };
      }
      return null;
    } catch (error) {
      console.warn("Error seguridad:", error);
      return null;
    }
  }

  // --- Auth Methods ---

  async login(email, password) {
    if (!this.auth) throw new Error("Firebase no inicializado");
    try {
      const { signInWithEmailAndPassword } = window.firebaseModules;
      const cred = await signInWithEmailAndPassword(this.auth, email, password);
      this.updateState(cred.user);
      return { success: true, user: cred.user };
    } catch (error) {
      console.error("Error Login:", error.code);
      await this.logout();
      throw error;
    }
  }

  async register(email, password) {
    if (!this.auth) throw new Error("Firebase no inicializado");
    try {
      const { createUserWithEmailAndPassword, setDoc, doc } =
        window.firebaseModules;
      const cred = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      // Init Lazy
      await setDoc(doc(this.db, "users", cred.user.uid, "system", "metadata"), {
        vaultConfigured: false,
        createdAt: new Date().toISOString(),
      });

      this.updateState(cred.user);
      return { success: true, user: cred.user };
    } catch (error) {
      console.error("Error Registro:", error);
      throw error;
    }
  }

  async logout() {
    try {
      // ✅ PASO CRÍTICO: Limpiar la memoria criptográfica
      if (
        encryptionService &&
        typeof encryptionService.clearKey === "function"
      ) {
        encryptionService.clearKey();
      }

      const { signOut } = window.firebaseModules;
      if (this.auth) await signOut(this.auth);

      this.updateState(null);
      return { success: true };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async resetPassword(email) {
    const { sendPasswordResetEmail } = window.firebaseModules;
    await sendPasswordResetEmail(this.auth, email);
    return { success: true };
  }

  // --- Bóveda ---

  async initializeEncryption(password) {
    const user = this.user || this.auth?.currentUser;
    if (!user) throw new Error("Usuario no autenticado");

    // Obtenemos Salt y Verificador
    const secData = await this._getSecurityData(user.uid);

    if (!secData || !secData.salt) {
      // Fallback para no crash (usuario legacy sin setup)
      const dummySalt = new TextEncoder().encode(user.uid);
      return await encryptionService.initialize(password, dummySalt, user.uid);
    }

    // Inicializamos con verificación
    return await encryptionService.initialize(
      password,
      secData.salt,
      user.uid,
      secData.verifier
    );
  }

  async isVaultConfigured() {
    const user = this.getCurrentUser();
    if (!user) return false;
    const { getDoc, doc } = window.firebaseModules;
    try {
      const snap = await getDoc(
        doc(this.db, "users", user.uid, "system", "metadata")
      );
      return snap.exists() && snap.data().vaultConfigured === true;
    } catch (e) {
      return false;
    }
  }

  async markVaultAsConfigured() {
    const user = this.getCurrentUser();
    if (!user) return;
    const { setDoc, doc } = window.firebaseModules;
    await setDoc(
      doc(this.db, "users", user.uid, "system", "metadata"),
      {
        vaultConfigured: true,
        vaultConfiguredAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  async checkPasswordConflict(candidatePassword) {
    const user = this.getCurrentUser();
    if (!user || !user.email) return false;
    try {
      const { EmailAuthProvider, reauthenticateWithCredential } =
        window.firebaseModules;
      const credential = EmailAuthProvider.credential(
        user.email,
        candidatePassword
      );
      await reauthenticateWithCredential(user, credential);
      return true; // Si pasa, hay conflicto
    } catch (error) {
      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        return false; // No hay conflicto
      }
      return false;
    }
  }
}

export const authService = new AuthService();
