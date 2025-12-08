// src/utils/helpers.js
// Importar el nuevo archivo de configuración
import { getFieldTypeMetadata } from "./field-types-config.js"; // NUEVO IMPORT

/**
 * Mapa de configuración regional para monedas
 */
// ... (El mapa idiomasYMonedas se queda igual, o puedes agregar más si quieres)
export const idiomasYMonedas = {
  "es-VE": { moneda: "Bolívar", codigo: "VES" },
  "es-ES": { moneda: "Euro", codigo: "EUR" },
  "en-US": { moneda: "Dólar estadounidense", codigo: "USD" },
  "en-GB": { moneda: "Libra esterlina", codigo: "GBP" },
  "fr-FR": { moneda: "Euro", codigo: "EUR" },
  "pt-BR": { moneda: "Real brasileño", codigo: "BRL" },
  // Agregamos genéricos y Latam
  es: { moneda: "Dólar estadounidense", codigo: "USD" }, // Default español genérico
  "es-419": { moneda: "Dólar estadounidense", codigo: "USD" }, // Latinoamérica (generalmente usa USD en web)
  "es-AR": { moneda: "Peso argentino", codigo: "ARS" },
  "es-CO": { moneda: "Peso colombiano", codigo: "COP" },
  "es-MX": { moneda: "Peso mexicano", codigo: "MXN" },
};

/**
 * Obtiene la configuración de moneda de forma robusta
 */
export const getLocalCurrency = () => {
  const browserLang = navigator.language; // Ej: "es-VE", "es", "en-US"
  console.log("🌎 Idioma detectado:", browserLang);

  // 1. Busqueda exacta (Ej: "es-VE")
  if (idiomasYMonedas[browserLang]) {
    return { locale: browserLang, ...idiomasYMonedas[browserLang] };
  }

  // 2. Busqueda parcial (Ej: Si el navegador dice "es-VE" pero solo tenemos "es")
  // O viceversa, si dice "es-XY" y queremos caer en un default de español
  const langPrefix = browserLang.split("-")[0]; // "es"
  if (idiomasYMonedas[langPrefix]) {
    return { locale: langPrefix, ...idiomasYMonedas[langPrefix] };
  }

  // 3. Fallback final (Inglés/USD)
  return { locale: "en-US", ...idiomasYMonedas["en-US"] };
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
