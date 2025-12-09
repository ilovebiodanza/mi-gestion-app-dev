// src/services/auth.js
import { firebaseService } from "./firebase-cdn.js";
import { encryptionService } from "./encryption/index.js";
import * as keyDerivation from "./encryption/key-derivation.js";
import * as documentEncryption from "./encryption/document-encryption.js";

/**
 * Servicio de autenticación para Mi Gestión
 */
class AuthService {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    this.initAuthListener();
  }

  initAuthListener() {
    firebaseService.onAuthStateChanged(async (user) => {
      this.currentUser = user;
      this.notifyAuthListeners(user);

      if (user) {
        console.log("✅ Usuario autenticado:", user.email);
        await this.initializeNewUser(user);
      } else {
        console.log("🔒 Usuario no autenticado");
      }
    });
  }

  async initializeNewUser(user) {
    try {
      const userMetadata = await user.getIdTokenResult();
      const isNewUser = userMetadata.claims.isNewUser || false;

      // Intentamos cargar el perfil para ver si ya existe en Firestore
      const role = await this.getUserRole();

      if (isNewUser || !role) {
        console.log("🆕 Usuario nuevo o sin perfil, inicializando datos...");
        await this.createUserProfile(user);
      }
    } catch (error) {
      console.error("Error al inicializar usuario:", error);
    }
  }

  async createUserProfile(user) {
    try {
      const userProfile = {
        email: user.email,
        role: "user",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        settings: {
          theme: "auto",
          language: "es",
          autoLock: 30,
        },
      };

      localStorage.setItem(
        `user_profile_${user.uid}`,
        JSON.stringify(userProfile)
      );

      const configRef = firebaseService.doc(
        `artifacts/mi-gestion-v1/users/${user.uid}/metadata/user_config`
      );
      await firebaseService.setDoc(configRef, userProfile, { merge: true });

      console.log("✅ Perfil de usuario creado (Local + Nube)");
      return userProfile;
    } catch (error) {
      console.error("Error al crear perfil:", error);
      throw error;
    }
  }

  async getUserRole() {
    if (!this.currentUser) return null;

    const localProfile = localStorage.getItem(
      `user_profile_${this.currentUser.uid}`
    );
    if (localProfile) {
      const data = JSON.parse(localProfile);
      if (data.role) return data.role;
    }

    try {
      const configRef = firebaseService.doc(
        `artifacts/mi-gestion-v1/users/${this.currentUser.uid}/metadata/user_config`
      );
      const docSnap = await firebaseService.getDoc(configRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        localStorage.setItem(
          `user_profile_${this.currentUser.uid}`,
          JSON.stringify(data)
        );
        return data.role || "user";
      }
    } catch (e) {
      console.error("Error obteniendo rol:", e);
    }

    return "user";
  }

  async register(email, password) {
    try {
      const userCredential = await firebaseService.createUser(email, password);

      try {
        await this.initializeEncryption(password);
      } catch (encryptionError) {
        console.warn(
          "⚠️ Cifrado no pudo inicializarse:",
          encryptionError.message
        );
      }

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

  async login(email, password) {
    try {
      const userCredential = await firebaseService.signIn(email, password);

      try {
        await this.initializeEncryption(password);
      } catch (encryptionError) {
        console.warn(
          "⚠️ Cifrado no pudo inicializarse:",
          encryptionError.message
        );
      }

      this.getUserRole();

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

  async logout() {
    try {
      this.clearEncryption();
      this.clearSensitiveData();
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
   * Cambiar contraseña con MIGRACIÓN DE DATOS (Re-encriptación)
   */
  async changePassword(newPassword, currentPassword) {
    try {
      const user = this.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      if (!currentPassword) {
        throw new Error(
          "Se requiere la contraseña actual para migrar los datos."
        );
      }

      // 👇 EXTRAEMOS LAS FUNCIONES NECESARIAS DE LOS MÓDULOS DE FIREBASE 👇
      const {
        updatePassword,
        reauthenticateWithCredential,
        EmailAuthProvider,
        collection, // <--- Necesario para leer la colección
        getDocs, // <--- Necesario para obtener los documentos
        query, // <--- Necesario para la consulta
      } = firebaseService.modules;

      // PASO 1: MIGRACIÓN DE DATOS (Re-encriptación local)
      console.log("🔄 Iniciando migración de datos a la nueva contraseña...");

      const salt = await encryptionService.getOrCreateSalt(user.uid);
      const oldKey = await keyDerivation.deriveMasterKey(currentPassword, salt);
      const newKey = await keyDerivation.deriveMasterKey(newPassword, salt);

      const vaultPath = `artifacts/mi-gestion-v1/users/${user.uid}/vault`;

      // 👇 CORRECCIÓN: Usamos 'collection' y 'query' extraídos de modules, no de firebaseService directo
      const q = query(collection(firebaseService.db, vaultPath));
      const querySnapshot = await getDocs(q);

      const migrationPromises = [];

      querySnapshot.forEach((docSnap) => {
        const docData = docSnap.data();
        const p = async () => {
          try {
            const decryptedContent = await documentEncryption.decryptDocument(
              {
                content: docData.encryptedContent,
                metadata: docData.encryptionMetadata,
              },
              oldKey
            );
            const reEncrypted = await documentEncryption.encryptDocument(
              decryptedContent,
              newKey,
              docData.id
            );
            const updateData = {
              encryptedContent: reEncrypted.content,
              encryptionMetadata: reEncrypted.metadata,
              "metadata.updatedAt": new Date().toISOString(),
            };
            await firebaseService.setDoc(docSnap.ref, updateData, {
              merge: true,
            });
            console.log(`✅ Documento ${docData.id} migrado correctamente.`);
          } catch (err) {
            console.error(`❌ Falló migración doc ${docData.id}:`, err);
            throw new Error(`Error migrando datos: ${err.message}`);
          }
        };
        migrationPromises.push(p());
      });

      if (migrationPromises.length > 0) {
        await Promise.all(migrationPromises);
        console.log("✨ Todos los documentos han sido re-encriptados.");
      } else {
        console.log("ℹ️ No había documentos para migrar.");
      }

      // PASO 2: CAMBIO DE CONTRASEÑA EN FIREBASE
      try {
        await updatePassword(user, newPassword);
      } catch (error) {
        if (error.code === "auth/requires-recent-login") {
          console.log("🔒 Re-autenticando usuario...");
          const credential = EmailAuthProvider.credential(
            user.email,
            currentPassword
          );
          await reauthenticateWithCredential(user, credential);
          await updatePassword(user, newPassword);
        } else {
          throw error;
        }
      }

      // PASO 3: ACTUALIZAR SESIÓN ACTUAL
      await encryptionService.initialize(newPassword);

      console.log("✅ Proceso completo: Clave cambiada y datos migrados.");

      return {
        success: true,
        message: "Contraseña actualizada y datos migrados exitosamente",
      };
    } catch (error) {
      console.error("Error crítico al cambiar contraseña:", error);
      return {
        success: false,
        error:
          "No se pudo completar el cambio. Tus datos NO se han modificado. Error: " +
          error.message,
        code: error.code,
      };
    }
  }

  getErrorMessage(errorCode) {
    const errorMessages = {
      "auth/email-already-in-use": "Este correo ya está registrado.",
      "auth/invalid-email": "Correo electrónico no válido",
      "auth/weak-password": "La contraseña es demasiado débil",
      "auth/wrong-password": "Contraseña incorrecta.",
      "auth/requires-recent-login":
        "Por seguridad, confirma tu contraseña actual.",
    };
    return errorMessages[errorCode] || `Error: ${errorCode}`;
  }

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

    const user = this.currentUser;
    if (user) localStorage.removeItem(`user_profile_${user.uid}`);
  }

  subscribe(listener) {
    this.authListeners.push(listener);
    listener(this.currentUser);
    return () => {
      this.authListeners = this.authListeners.filter((l) => l !== listener);
    };
  }

  notifyAuthListeners(user) {
    this.authListeners.forEach((listener) => {
      try {
        listener(user);
      } catch (error) {
        console.error(error);
      }
    });
  }

  getCurrentUser() {
    return this.currentUser;
  }
  isAuthenticated() {
    return !!this.currentUser;
  }

  async getAuthToken() {
    if (this.currentUser) return await this.currentUser.getIdToken();
    return null;
  }

  async initializeEncryption(password) {
    try {
      console.log("🔐 Inicializando cifrado E2EE...");
      await encryptionService.initialize(password);
      console.log("✅ Cifrado E2EE inicializado");
      localStorage.setItem("encryption_initialized", "true");
      return true;
    } catch (error) {
      console.error("❌ Error al inicializar cifrado:", error);
      throw new Error("Error al configurar el cifrado seguro");
    }
  }

  clearEncryption() {
    encryptionService.clearKeys();
    localStorage.removeItem("encryption_initialized");
    console.log("🗑️  Cifrado limpiado");
  }

  isEncryptionInitialized() {
    return encryptionService.isReady();
  }
}

export const authService = new AuthService();
