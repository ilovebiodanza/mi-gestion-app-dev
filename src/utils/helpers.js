// src/utils/helpers.js
// Importar el nuevo archivo de configuración
import { getFieldTypeMetadata } from "./field-types-config.js"; // NUEVO IMPORT

/**
 * Mapa de configuración regional para monedas
 */
export const idiomasYMonedas = {
  "es-VE": { moneda: "Bolívar", codigo: "VES" },
  "es-ES": { moneda: "Euro", codigo: "EUR" },
  "en-US": { moneda: "Dólar estadounidense", codigo: "USD" },
  "en-GB": { moneda: "Libra esterlina", codigo: "GBP" },
  "fr-FR": { moneda: "Euro", codigo: "EUR" },
  "pt-BR": { moneda: "Real brasileño", codigo: "BRL" },
};

/**
 * Obtiene la configuración de moneda basada en el navegador del usuario
 */
export const getLocalCurrency = () => {
  // 1. Detectar idioma del navegador (ej: "es-ES", "en-US")
  const browserLang = navigator.language;
  console.log(`🧏 Lenguaje del navegador: ${browserLang}`);

  // 2. Buscar en el mapa
  const config = idiomasYMonedas[browserLang];

  // 3. Retornar configuración encontrada o Default (USD)
  if (config) {
    return { locale: browserLang, ...config };
  } else {
    // Fallback: Si el idioma no está en la lista (ej: es-MX), usamos USD por defecto
    return { locale: "en-US", ...idiomasYMonedas["en-US"] };
  }
};

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
 * Obtiene la etiqueta legible para un tipo de campo (MODIFICADO)
 */
export const getFieldTypeLabel = (type) => {
  const metadata = getFieldTypeMetadata(type);
  return metadata ? metadata.label : type;
};
