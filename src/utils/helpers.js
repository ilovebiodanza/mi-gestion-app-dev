// src/utils/helpers.js

/**
 * Convierte una etiqueta de texto (ej: "Nombre Completo") en un ID válido (ej: "nombre_completo")
 */
export const generateFieldId = (label, index) => {
  if (!label || typeof label !== "string") {
    return `campo_${index + 1}`;
  }

  const id = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
    .replace(/[^a-z0-9_$]/g, "_") // Solo caracteres válidos
    .replace(/_{2,}/g, "_") // Eliminar guiones dobles
    .replace(/^_|_$/g, ""); // Trimming de guiones

  if (!id || !/^[a-zA-Z_$]/.test(id)) {
    return `campo_${index + 1}`;
  }

  return id;
};

/**
 * Obtiene el nombre legible de una categoría
 */
export const getCategoryName = (category) => {
  const names = {
    personal: "Personal",
    access: "Accesos",
    financial: "Financiero",
    health: "Salud",
    home: "Hogar",
    car: "Vehículo",
    job: "Trabajo",
    education: "Formación",
    custom: "Personalizado",
    all: "Todas",
  };
  return names[category] || category;
};

/**
 * Obtiene el icono asociado a una categoría
 */
export const getCategoryIcon = (category) => {
  const icons = {
    personal: "👤",
    access: "🔐",
    financial: "💰",
    health: "🏥",
    home: "🏠",
    car: "🚗",
    job: "💼",
    education: "🎓",
    custom: "📋",
  };
  return icons[category] || "📄";
};

/**
 * Obtiene la etiqueta legible para un tipo de campo
 */
export const getFieldTypeLabel = (type) => {
  const labels = {
    string: "Texto corto",
    text: "Texto largo",
    number: "Número",
    boolean: "Sí/No",
    date: "Fecha",
    url: "URL",
    email: "Email",
  };
  return labels[type] || type;
};
