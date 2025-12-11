// src/utils/field-types-config.js

/**
 * Definición centralizada de tipos de campo.
 * Incluye metadatos para renderizado, iconos y validación.
 */
const FIELD_TYPES = [
  // --- Textos ---
  {
    value: "string",
    label: "Texto Breve",
    inputType: "text",
    icon: "fas fa-font",
    description: "Nombres, títulos o datos cortos.",
  },
  {
    value: "text",
    label: "Texto Largo / Notas",
    inputType: "textarea",
    icon: "fas fa-align-left",
    description: "Descripciones detalladas o párrafos.",
  },

  // --- Numéricos (Permiten fórmulas) ---
  {
    value: "currency",
    label: "Moneda / Dinero",
    inputType: "text",
    icon: "fas fa-dollar-sign",
    description: "Importes financieros.",
  },
  {
    value: "number",
    label: "Número",
    inputType: "text",
    icon: "fas fa-hashtag",
    description: "Cantidades, edades, unidades.",
  },
  {
    value: "percentage",
    label: "Porcentaje",
    inputType: "text",
    icon: "fas fa-percent",
    description: "Valores porcentuales (0-100).",
  },

  // --- Selección y Lógica ---
  {
    value: "boolean",
    label: "Sí / No (Interruptor)",
    inputType: "checkbox",
    icon: "fas fa-check-square",
    description: "Opción binaria verdadero/falso.",
  },
  {
    value: "select",
    label: "Lista de Opciones",
    inputType: "select",
    icon: "fas fa-list-ul",
    description: "Menú desplegable con opciones predefinidas.",
  },
  {
    value: "date",
    label: "Fecha",
    inputType: "date",
    icon: "far fa-calendar-alt",
    description: "Selector de calendario.",
  },

  // --- Contacto y Web ---
  {
    value: "email",
    label: "Correo Electrónico",
    inputType: "email",
    icon: "fas fa-envelope",
    description: "Validación de formato email.",
  },
  {
    value: "url",
    label: "Enlace Web (URL)",
    inputType: "url",
    icon: "fas fa-link",
    description: "Link a sitio web con etiqueta opcional.",
  },

  // --- Especiales ---
  {
    value: "secret",
    label: "Dato Sensible (Oculto)",
    inputType: "password",
    icon: "fas fa-key",
    description: "Se visualiza con desenfoque/asteriscos.",
  },
  {
    value: "table",
    label: "Tabla Dinámica",
    inputType: "table",
    icon: "fas fa-table",
    description: "Lista de ítems con columnas personalizadas.",
  },
  // --- Estructurales ---
  {
    value: "separator",
    label: "--- SEPARADOR / TÍTULO ---",
    inputType: "separator",
    icon: "fas fa-heading",
    description: "Divisor visual para organizar secciones.",
  },
];

export const getFieldTypesConfig = () => FIELD_TYPES;

export const getFieldTypeMetadata = (value) => {
  return FIELD_TYPES.find((type) => type.value === value) || FIELD_TYPES[0];
};
