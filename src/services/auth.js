// src/services/auth.js - Versión usando CDN
import { firebaseService } from "./firebase-cdn.js";
import { encryptionService } from "./encryption/index.js";

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
    firebaseService.onAuthStateChanged(async (user) => {
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
        await this.createUserProfile(user);
      }
    } catch (error) {
      console.error("Error al inicializar usuario:", error);
    }
  }

  /**
   * Crear perfil de usuario
   */
  async createUserProfile(user) {
    try {
      const userProfile = {
        email: user.email,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        settings: {
          theme: "auto",
          language: "es",
          autoLock: 30,
        },
      };

      // Guardar en localStorage temporalmente
      localStorage.setItem(
        `user_profile_${user.uid}`,
        JSON.stringify(userProfile)
      );

      console.log("✅ Perfil de usuario creado");
      return userProfile;
    } catch (error) {
      console.error("Error al crear perfil:", error);
      throw error;
    }
  }

  /**
   * Registrar nuevo usuario
   */
  async register(email, password) {
    try {
      const userCredential = await firebaseService.createUser(email, password);

      // INICIALIZAR CIFRADO después de registro exitoso
      try {
        await this.initializeEncryption(password);
      } catch (encryptionError) {
        console.warn(
          "⚠️  Cifrado no pudo inicializarse:",
          encryptionError.message
        );
        // Continuamos sin cifrado
      }

      // Crear perfil de usuario
      await this.createUserProfile(userCredential.user);

      return {
        success: true,
        user: userCredential.user,
        message: "Usuario registrado exitosamente",
      };
    } catch (error) {
      console.error("Error en registro:", error);
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
      const userCredential = await firebaseService.signIn(email, password);

      // INICIALIZAR CIFRADO después de login exitoso
      try {
        await this.initializeEncryption(password);
      } catch (encryptionError) {
        console.warn(
          "⚠️  Cifrado no pudo inicializarse:",
          encryptionError.message
        );
        // Continuamos sin cifrado, pero mostramos advertencia
      }

      return {
        success: true,
        user: userCredential.user,
        message: "Sesión iniciada exitosamente",
      };
    } catch (error) {
      console.error("Error en login:", error);
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
  // Modificar el método logout para limpiar cifrado:
  async logout() {
    try {
      // LIMPIAR CIFRADO primero
      this.clearEncryption();

      // Limpiar datos sensibles
      this.clearSensitiveData();

      // Cerrar sesión en Firebase
      await firebaseService.signOut();

      return { success: true, message: "Sesión cerrada exitosamente" };
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
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
      await firebaseService.resetPassword(email);
      return {
        success: true,
        message: "Correo de restablecimiento enviado",
      };
    } catch (error) {
      console.error("Error en reset password:", error);
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
      const user = this.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      await firebaseService.updatePassword(user, newPassword);

      // Aquí deberíamos disparar el proceso de re-encriptación
      console.log(
        "⚠️  Cambio de contraseña detectado - Re-encriptación requerida"
      );

      return {
        success: true,
        message: "Contraseña actualizada exitosamente",
      };
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      };
    }
  }

  /**
   * Obtener mensaje de error amigable
   */
  getErrorMessage(errorCode) {
    const errorMessages = {
      "auth/email-already-in-use":
        "Este correo ya está registrado. ¿Quieres iniciar sesión?",
      "auth/invalid-email": "Correo electrónico no válido",
      "auth/operation-not-allowed": "Operación no permitida",
      "auth/weak-password":
        "La contraseña es demasiado débil (mínimo 8 caracteres)",
      "auth/user-disabled": "Esta cuenta ha sido deshabilitada",
      "auth/user-not-found": "Usuario no encontrado. ¿Quieres registrarte?",
      "auth/wrong-password": "Contraseña incorrecta. ¿Olvidaste tu contraseña?",
      "auth/invalid-login-credentials":
        "Email o contraseña incorrectos. Verifica tus credenciales.",
      "auth/too-many-requests": "Demasiados intentos. Intenta más tarde",
      "auth/network-request-failed": "Error de red. Verifica tu conexión",
      "auth/popup-closed-by-user": "La ventana de autenticación fue cerrada",
      "auth/cancelled-popup-request": "Solicitud de autenticación cancelada",
    };

    return errorMessages[errorCode] || `Error: ${errorCode}`;
  }

  /**
   * Limpiar datos sensibles
   */
  clearSensitiveData() {
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

  /**
   * Inicializar cifrado después de login/registro exitoso
   */
  async initializeEncryption(password) {
    try {
      console.log("🔐 Inicializando cifrado E2EE...");
      await encryptionService.initialize(password);
      console.log("✅ Cifrado E2EE inicializado");

      // Guardar estado en localStorage para persistencia
      localStorage.setItem("encryption_initialized", "true");
      localStorage.setItem("encryption_timestamp", new Date().toISOString());

      return true;
    } catch (error) {
      console.error("❌ Error al inicializar cifrado:", error);

      // Mostrar error amigable
      if (error.toString().includes("QuotaExceededError")) {
        throw new Error(
          "Memoria insuficiente para cifrado. Cierra otras pestañas."
        );
      }

      throw new Error("Error al configurar el cifrado seguro");
    }
  }

  /**
   * Limpiar cifrado al cerrar sesión
   */
  clearEncryption() {
    encryptionService.clearKeys();

    // Limpiar estado de localStorage
    localStorage.removeItem("encryption_initialized");
    localStorage.removeItem("encryption_timestamp");

    console.log("🗑️  Cifrado limpiado");
  }

  /**
   * Verificar si el cifrado está inicializado
   */
  isEncryptionInitialized() {
    return encryptionService.isReady();
  }
}

// Exportar instancia única
export const authService = new AuthService();
