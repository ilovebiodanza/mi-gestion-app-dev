import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./firebase.js";
import { initializeUserData } from "./firestore-init.js";

/**
 * Servicio de autenticación para Mi Gestión
 */
class AuthService {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    this.initAuthListener();
  }

  /**
   * Inicializar listener de autenticación
   */
  initAuthListener() {
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      this.notifyAuthListeners(user);

      if (user) {
        console.log("✅ Usuario autenticado:", user.email);
        // Inicializar datos del usuario si es nuevo
        await this.initializeNewUser(user);
      } else {
        console.log("🔒 Usuario no autenticado");
      }
    });
  }

  /**
   * Inicializar datos para nuevo usuario
   */
  async initializeNewUser(user) {
    try {
      // Verificar si es un usuario recién creado
      const userMetadata = await user.getIdTokenResult();
      const isNewUser = userMetadata.claims.isNewUser || false;

      if (isNewUser) {
        console.log("🆕 Usuario nuevo, inicializando datos...");
        await initializeUserData(user.uid);
      }
    } catch (error) {
      console.error("Error al inicializar usuario:", error);
    }
  }

  /**
   * Registrar nuevo usuario
   */
  async register(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Crear perfil de usuario
      await this.createUserProfile(userCredential.user, email);

      return {
        success: true,
        user: userCredential.user,
        message: "Usuario registrado exitosamente",
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      };
    }
  }

  /**
   * Iniciar sesión
   */
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Verificar que el usuario tiene datos inicializados
      setTimeout(async () => {
        await this.verifyUserData(userCredential.user.uid);
      }, 1000);

      return {
        success: true,
        user: userCredential.user,
        message: "Sesión iniciada exitosamente",
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      };
    }
  }

  /**
   * Cerrar sesión
   */
  async logout() {
    try {
      // Limpiar datos sensibles en localStorage/sessionStorage
      this.clearSensitiveData();

      await signOut(auth);
      return { success: true, message: "Sesión cerrada exitosamente" };
    } catch (error) {
      return {
        success: false,
        error: "Error al cerrar sesión",
        code: error.code,
      };
    }
  }

  /**
   * Restablecer contraseña
   */
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: "Correo de restablecimiento enviado",
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      };
    }
  }

  /**
   * Cambiar contraseña (requiere re-autenticación)
   */
  async changePassword(newPassword) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      await updatePassword(user, newPassword);

      // Aquí deberíamos disparar el proceso de re-encriptación
      // de datos con la nueva contraseña
      this.triggerReencryption(newPassword);

      return {
        success: true,
        message: "Contraseña actualizada exitosamente",
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      };
    }
  }

  /**
   * Verificar datos del usuario
   */
  async verifyUserData(userId) {
    // Implementar verificación de datos inicializados
    console.log("Verificando datos del usuario:", userId);
    return true;
  }

  /**
   * Crear perfil de usuario
   */
  async createUserProfile(user, email) {
    // Aquí se pueden agregar más datos al perfil del usuario
    const profile = {
      email: email,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      settings: {
        theme: "auto",
        language: "es",
      },
    };

    // Guardar en localStorage temporalmente
    localStorage.setItem(`user_profile_${user.uid}`, JSON.stringify(profile));
  }

  /**
   * Limpiar datos sensibles
   */
  clearSensitiveData() {
    // Eliminar claves de cifrado del almacenamiento local
    const keysToRemove = [
      "master_key",
      "encryption_keys",
      "user_session_data",
      "temp_encryption_data",
    ];

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }

  /**
   * Disparar re-encriptación (placeholder)
   */
  triggerReencryption(newPassword) {
    console.log("⚠️  Cambio de contraseña detectado");
    console.log(
      "⚠️  Se requiere re-encriptación de datos con nueva contraseña"
    );
    // Esto se implementará en la fase de cifrado E2EE
  }

  /**
   * Obtener mensaje de error amigable
   */
  getErrorMessage(errorCode) {
    const errorMessages = {
      "auth/email-already-in-use": "Este correo ya está registrado",
      "auth/invalid-email": "Correo electrónico no válido",
      "auth/operation-not-allowed": "Operación no permitida",
      "auth/weak-password": "La contraseña es demasiado débil",
      "auth/user-disabled": "Esta cuenta ha sido deshabilitada",
      "auth/user-not-found": "Usuario no encontrado",
      "auth/wrong-password": "Contraseña incorrecta",
      "auth/too-many-requests": "Demasiados intentos. Intenta más tarde",
      "auth/network-request-failed": "Error de red. Verifica tu conexión",
    };

    return errorMessages[errorCode] || "Error desconocido. Intenta nuevamente";
  }

  /**
   * Suscribir listeners para cambios de autenticación
   */
  subscribe(listener) {
    this.authListeners.push(listener);
    // Notificar inmediatamente con el estado actual
    listener(this.currentUser);

    // Devolver función para desuscribir
    return () => {
      this.authListeners = this.authListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notificar a todos los listeners
   */
  notifyAuthListeners(user) {
    this.authListeners.forEach((listener) => {
      try {
        listener(user);
      } catch (error) {
        console.error("Error en auth listener:", error);
      }
    });
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Verificar si hay sesión activa
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Obtener token de autenticación
   */
  async getAuthToken() {
    if (this.currentUser) {
      return await this.currentUser.getIdToken();
    }
    return null;
  }
}

// Exportar instancia única
export const authService = new AuthService();
