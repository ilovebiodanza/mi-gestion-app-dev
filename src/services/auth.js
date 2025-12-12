import { encryptionService } from "./encryption/index.js";
// NOTA: Ya no necesitamos importar getAuthErrorMessage aquí porque el error
// debe viajar "crudo" hasta app.js para que el Toast decida qué mensaje mostrar.

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

      console.log("🔍 AuthService: Firebase detectado. Iniciando listener...");
      const { onAuthStateChanged } = window.firebaseModules;

      onAuthStateChanged(this.auth, (user) => {
        console.log(
          "🔍 AuthService (Listener): Estado ->",
          user ? user.email : "Sin sesión"
        );
        this.updateState(user);
      });
    } else {
      console.error("❌ AuthService: Timeout esperando a Firebase CDN.");
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

  // --- AUTENTICACIÓN ---

  async login(email, password) {
    if (!this.auth) throw new Error("Servicio no inicializado");

    try {
      console.log("🔍 AuthService: Intentando login...");
      const { signInWithEmailAndPassword } = window.firebaseModules;

      // 1. Llamada a Firebase
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      console.log("🔍 AuthService: Login exitoso.");
      this.updateState(userCredential.user);

      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error("Error Login:", error.code);
      // --- CORRECCIÓN CRÍTICA ---
      // Antes retornabas un objeto, lo que el sistema interpretaba como "éxito".
      // Ahora lanzamos el error para que AuthForms lo capture y active el Toast.
      throw error;
    }
  }

  async register(email, password) {
    if (!this.auth) throw new Error("Servicio no inicializado");
    try {
      const { createUserWithEmailAndPassword } = window.firebaseModules;
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      await this.initializeEncryption(password);
      this.updateState(userCredential.user);

      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error("Error Registro:", error);
      throw error; // Esto ya estaba bien
    }
  }

  async logout() {
    try {
      if (
        encryptionService &&
        typeof encryptionService.clearKey === "function"
      ) {
        encryptionService.clearKey();
      }
      const { signOut } = window.firebaseModules;
      await signOut(this.auth);
      this.updateState(null);
      return { success: true };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async resetPassword(email) {
    if (!this.auth) throw new Error("Servicio no inicializado");
    try {
      const { sendPasswordResetEmail } = window.firebaseModules;
      await sendPasswordResetEmail(this.auth, email);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // --- BÓVEDA ---

  async initializeEncryption(password) {
    const user = this.user || this.auth?.currentUser;
    if (!user) throw new Error("Usuario no autenticado (AuthService)");
    return await encryptionService.initialize(password, user.uid);
  }
}

export const authService = new AuthService();
