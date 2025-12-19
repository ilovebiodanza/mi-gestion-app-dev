import { ElementRegistry } from "../../components/elements/ElementRegistry.js";

/**
 * Servicio para construir, definir y validar la estructura de plantillas y campos.
 */
class TemplateBuilder {
  /**
   * Obtener tipos de campo válidos dinámicamente desde la configuración.
   */
  getValidFieldTypes() {
    return ElementRegistry.getAvailableTypes().map((t) => t.type);
  }

  /**
   * Generar ID automático a partir de la etiqueta
   */
  generateFieldId(label, index) {
    if (!label || typeof label !== "string") {
      return `campo_${index + 1}`;
    }

    const id = label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_$]/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^_|_$/g, "");

    if (!id || !/^[a-zA-Z_$]/.test(id)) {
      return `campo_${index + 1}`;
    }

    return id;
  }

  /**
   * Validar un campo individual de la plantilla
   */
  validateField(field, index) {
    const validTypes = this.getValidFieldTypes();

    // Validación principal de tipo
    if (!validTypes.includes(field.type)) {
      throw new Error(
        `Tipo de campo inválido: "${
          field.type
        }". Tipos válidos: ${validTypes.join(", ")}`
      );
    }

    // Generar ID si falta
    if (!field.id) {
      field.id = this.generateFieldId(field.label, index);
    }

    // Validación específica para Tablas
    if (field.type === "table") {
      if (
        !field.columns ||
        !Array.isArray(field.columns) ||
        field.columns.length === 0
      ) {
        // Opcional: Podrías permitir tablas vacías, pero es mejor avisar
        // console.warn(`La tabla '${field.label}' no tiene columnas definidas.`);
      } else {
        // Validar las columnas recursivamente (son campos simplificados)
        field.columns.forEach((col, i) => {
          // 👇 CORRECCIÓN AQUÍ: Validamos 'label' en lugar de 'name'
          if (!col.label)
            throw new Error(
              `La columna ${i + 1} de la tabla '${
                field.label
              }' no tiene nombre (etiqueta).`
            );

          if (!validTypes.includes(col.type))
            throw new Error(`Tipo inválido en columna '${col.label}'`);

          // Asegurar ID de columna usando la etiqueta
          if (!col.id) col.id = this.generateFieldId(col.label, i);
        });
      }
    }

    // Asegurar propiedad sensitive
    if (field.sensitive === undefined) {
      field.sensitive = false;
    }

    return true;
  }

  /**
   * Validar estructura de datos de plantilla
   */
  validateTemplateData(templateData) {
    if (!templateData.name) {
      throw new Error("La plantilla debe tener un nombre");
    }

    if (
      !templateData.fields ||
      !Array.isArray(templateData.fields) ||
      templateData.fields.length === 0
    ) {
      throw new Error("La plantilla debe tener al menos un campo");
    }

    templateData.fields.forEach((field, index) => {
      this.validateField(field, index);
    });

    return true;
  }

  // Métodos auxiliares de UI
  getCategoryName(category) {
    const names = {
      personal: "Personal",
      access: "Accesos",
      financial: "Financiero",
      health: "Salud",
      custom: "Personalizado",
    };
    return names[category] || category;
  }

  getCategoryIcon(category) {
    const icons = {
      personal: "👤",
      access: "🔐",
      financial: "💰",
      health: "🏥",
      custom: "📋",
    };
    return icons[category] || "📄";
  }
}

export const templateBuilder = new TemplateBuilder();
