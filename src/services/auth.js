// src/services/auth.js
import { encryptionService } from "./encryption/index.js";
import { getAuthErrorMessage } from "../utils/auth-errors.js"; // <--- IMPORTAR

class AuthService {
  constructor() {
    this.auth = null;
    this.db = null;
    this.user = null;
    this.observers = [];

    // Iniciamos la espera activa de Firebase
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

      // Listener oficial de Firebase
      const { onAuthStateChanged } = window.firebaseModules;
      onAuthStateChanged(this.auth, (user) => {
        console.log(
          "🔍 AuthService (Listener): Cambio de estado detectado ->",
          user ? user.email : "Sin sesión"
        );
        this.updateState(user);
      });

      console.log("✅ AuthService: Conectado exitosamente a Firebase");
    } else {
      console.error("❌ AuthService: Timeout esperando a Firebase CDN.");
      alert("Error crítico: No se pudieron cargar los servicios de Google.");
    }
  }

  /**
   * Método centralizado para actualizar estado y avisar a la app
   */
  updateState(user) {
    this.user = user;
    this.notifyObservers(user);
  }

  subscribe(observer) {
    this.observers.push(observer);
    // Si ya sabemos quién es el usuario, avisar al nuevo suscriptor de inmediato
    if (this.user !== null) {
      observer(this.user);
    }
  }

  notifyObservers(user) {
    // console.log(`🔍 AuthService: Notificando a ${this.observers.length} observadores.`);
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
      console.log("🔍 AuthService: Login exitoso en nube.");

      // 2. ACTUALIZACIÓN MANUAL (Opcional, pero segura)
      this.updateState(userCredential.user);

      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error("Error Registro:", error);
      // Si decides devolver objeto en lugar de throw, usas el mapper compartido:
      return { success: false, error: getAuthErrorMessage(error.code) };
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

      // Inicializar cifrado para usuario nuevo
      await this.initializeEncryption(password);

      // Notificación manual por si acaso
      this.updateState(userCredential.user);

      return { success: true, user: userCredential.user };
    } catch (error) {
      // Nota: En registro sí solemos devolver objeto success/error porque
      // a veces queremos manejarlo distinto, pero si tu UI espera throw,
      // deberías usar throw error aquí también.
      // Por ahora mantengo tu estructura original para registro si te funciona bien.
      console.error("Error Registro:", error);
      throw error; // Recomendado unificar comportamiento con Login
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

      // Notificación manual de salida
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
      return { success: true, message: "Correo enviado" };
    } catch (error) {
      throw error;
    }
  }

  async changeAccessPassword(newPassword, currentPassword) {
    try {
      const user = this.auth.currentUser;
      if (!user) throw new Error("No sesión");
      const {
        updatePassword,
        reauthenticateWithCredential,
        EmailAuthProvider,
      } = window.firebaseModules;
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // --- BÓVEDA ---

  async initializeEncryption(password) {
    // Si la llamada viene antes de que Firebase detecte el usuario, usamos this.auth.currentUser
    const user = this.user || this.auth?.currentUser;
    if (!user) throw new Error("Usuario no autenticado (AuthService)");

    return await encryptionService.initialize(password, user.uid);
  }
}

export const authService = new AuthService();
