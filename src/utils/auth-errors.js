// src/utils/auth-errors.js

// authErrors.js

const errorMessages = {
  // Errores de usuario comunes
  "auth/email-already-exists":
    "Este correo ya está en uso. Intenta iniciar sesión.",
  "auth/user-not-found": "Usuario no encontrado. Verifica el correo.",
  "auth/wrong-password": "La contraseña es incorrecta.", // (Agregado común)
  "auth/invalid-email": "El formato del correo no es válido.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/user-disabled": "Esta cuenta ha sido inhabilitada.",
  "auth/too-many-requests": "Demasiados intentos fallidos. Intenta más tarde.",

  // Errores de sesión/tokens
  "auth/id-token-expired": "Tu sesión ha expirado. Inicia sesión de nuevo.",
  "auth/session-cookie-expired": "La cookie de sesión ha caducado.",

  // Fallbacks para errores técnicos (no mostrar "bytes" o "buffer" al usuario)
  default: "Ocurrió un error inesperado. Por favor intenta nuevamente.",
};

/**
 * Traduce el código de error de Firebase a un mensaje legible.
 * @param {string} errorCode - El código de error (ej: 'auth/invalid-email')
 * @returns {string} Mensaje amigable
 */
export const getFriendlyErrorMessage = (errorCode) => {
  return errorMessages[errorCode] || errorMessages["default"];
};
