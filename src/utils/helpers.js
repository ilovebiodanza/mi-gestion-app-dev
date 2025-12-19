// src/utils/helpers.js
import { ElementRegistry } from "../components/elements/ElementRegistry.js";

// --- Configuración Regional ---
export const idiomasYMonedas = {
  "es-VE": { moneda: "Bolívar", codigo: "VES" },
  "es-ES": { moneda: "Euro", codigo: "EUR" },
  "en-US": { moneda: "Dólar USD", codigo: "USD" },
  "en-GB": { moneda: "Libra", codigo: "GBP" },
  "fr-FR": { moneda: "Euro", codigo: "EUR" },
  "es-AR": { moneda: "Peso Arg", codigo: "ARS" },
  "es-CO": { moneda: "Peso Col", codigo: "COP" },
  "es-MX": { moneda: "Peso Mex", codigo: "MXN" },
  // Defaults
  es: { moneda: "Dólar USD", codigo: "USD" },
  "es-419": { moneda: "Dólar USD", codigo: "USD" },
};

export const getLocalCurrency = () => {
  const browserLang = navigator.language;

  if (idiomasYMonedas[browserLang]) {
    return { locale: browserLang, ...idiomasYMonedas[browserLang] };
  }

  const langPrefix = browserLang.split("-")[0];
  if (idiomasYMonedas[langPrefix]) {
    return { locale: langPrefix, ...idiomasYMonedas[langPrefix] };
  }

  return { locale: "en-US", ...idiomasYMonedas["en-US"] };
};

// --- Formateadores (Nuevos) ---

export const formatCurrency = (value) => {
  if (value === "" || value === null || isNaN(value)) return value;
  const config = getLocalCurrency();
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.codigo,
  }).format(Number(value));
};

export const formatDate = (value) => {
  if (!value) return "";
  try {
    const [y, m, d] = String(value).split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const config = getLocalCurrency();
    return new Intl.DateTimeFormat(config.locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch (e) {
    return value;
  }
};

// --- Generadores de ID ---

export const generateFieldId = (label, index) => {
  if (!label || typeof label !== "string") return `campo_${index + 1}`;

  const id = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Sin acentos
    .replace(/[^a-z0-9]/g, "_") // Solo alfanuméricos y guion bajo
    .replace(/_+/g, "_") // Sin guiones repetidos
    .replace(/^_|_$/g, ""); // Trim guiones

  // Asegurar que no empiece con número y tenga longitud
  return id.length < 2 || /^\d/.test(id) ? `campo_${index + 1}_${id}` : id;
};

// --- Metadatos de Categorías ---

export const getCategoryName = (category) => {
  const names = {
    personal: "Personal",
    access: "Accesos / Claves",
    financial: "Financiero",
    health: "Salud",
    home: "Hogar",
    car: "Vehículo",
    job: "Laboral",
    education: "Educación",
    custom: "Personalizado",
    all: "Todas",
  };
  return names[category] || "Otros";
};

export const getCategoryIcon = (category) => {
  // Usamos Emojis porque son editables por el usuario en el input de texto
  const icons = {
    personal: "👤",
    access: "🔐",
    financial: "💳",
    health: "⚕️",
    home: "🏠",
    car: "🚗",
    job: "💼",
    education: "🎓",
    custom: "⚡",
    all: "📂",
  };
  return icons[category] || "📋";
};

export const getFieldTypeLabel = (type) => {
  // ANTES: const metadata = getFieldTypeMetadata(type); return metadata ? metadata.label : type;
  // AHORA:
  return ElementRegistry.get(type).getLabel();
};

export const detectMediaType = (url) => {
  if (!url || typeof url !== "string") return "link";

  // Limpiamos query params para detectar extensión limpia
  let cleanUrl = url.split("?")[0].toLowerCase();

  const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"];
  const audioExts = [".mp3", ".wav", ".ogg", ".m4a", ".aac"];

  if (imageExts.some((ext) => cleanUrl.endsWith(ext))) return "image";
  if (audioExts.some((ext) => cleanUrl.endsWith(ext))) return "audio";

  return "link";
};

/**
 * Convierte bytes a formato legible (KB, MB, GB)
 */
export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
