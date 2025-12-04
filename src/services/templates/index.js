/**
 * Servicio de gestión de plantillas personalizadas
 */

import { firebaseService } from "../firebase-cdn.js";
import { encryptionService } from "../encryption/index.js";

/**
 * Servicio de plantillas
 */
class TemplateService {
  constructor() {
    this.userId = null;
    this.appId = "mi-gestion-v1";
    this.systemTemplates = this.getSystemTemplates();
    this.userTemplates = []; // Almacenamiento en memoria
    this.isInitialized = false;
  }

  /**
   * Inicializar servicio con usuario
   */
  async initialize(userId) {
    this.userId = userId;
    this.isInitialized = true;

    // Cargar plantillas del usuario desde localStorage (temporal)
    await this.loadUserTemplates();

    console.log("📋 Servicio de plantillas inicializado para:", userId);
    console.log(
      `📊 Plantillas cargadas: ${this.userTemplates.length} personalizadas + ${this.systemTemplates.length} del sistema`
    );
  }

  /**
   * Cargar plantillas del usuario desde localStorage (temporal)
   */
  async loadUserTemplates() {
    try {
      if (!this.userId) return;

      const storageKey = `user_templates_${this.userId}`;
      const storedTemplates = localStorage.getItem(storageKey);

      if (storedTemplates) {
        this.userTemplates = JSON.parse(storedTemplates);
        console.log(
          `📂 ${this.userTemplates.length} plantillas cargadas de localStorage`
        );
      } else {
        this.userTemplates = [];
        console.log("📂 No hay plantillas guardadas anteriormente");
      }
    } catch (error) {
      console.error("❌ Error al cargar plantillas:", error);
      this.userTemplates = [];
    }
  }

  /**
   * Guardar plantillas del usuario en localStorage (temporal)
   */
  async saveUserTemplates() {
    try {
      if (!this.userId) return;

      const storageKey = `user_templates_${this.userId}`;
      localStorage.setItem(storageKey, JSON.stringify(this.userTemplates));
      console.log(
        `💾 ${this.userTemplates.length} plantillas guardadas en localStorage`
      );
    } catch (error) {
      console.error("❌ Error al guardar plantillas:", error);
    }
  }

  /**
   * Obtener todas las plantillas del usuario
   */
  async getUserTemplates() {
    if (!this.isInitialized) {
      throw new Error("Servicio de plantillas no inicializado");
    }

    // Combinar plantillas del sistema y personalizadas
    const allTemplates = [...this.systemTemplates, ...this.userTemplates];

    console.log(
      `📋 Total plantillas disponibles: ${allTemplates.length} (${this.systemTemplates.length} sistema + ${this.userTemplates.length} personalizadas)`
    );

    return allTemplates;
  }

  /**
   * Obtener plantillas del sistema
   */
  getSystemTemplates() {
    return [
      {
        id: "template_basic_info",
        name: "Información Básica",
        description: "Datos personales básicos",
        icon: "👤",
        color: "#3B82F6",
        fields: [
          {
            // ID se generará automáticamente
            type: "string",
            label: "Nombre Completo",
            placeholder: "Juan Pérez",
            required: true,
            sensitive: false,
            validation: {
              minLength: 2,
              maxLength: 100,
            },
            order: 1,
          },
          {
            type: "string",
            label: "Correo Electrónico",
            placeholder: "ejemplo@email.com",
            required: false,
            sensitive: false,
            validation: {
              pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
            },
            order: 2,
          },
          {
            type: "string",
            label: "Teléfono",
            placeholder: "+1234567890",
            required: false,
            sensitive: false,
            order: 3,
          },
        ],
        settings: {
          allowDuplicates: false,
          maxEntries: 0,
          category: "personal",
          isSystemTemplate: true,
          version: "1.0",
        },
      },
      {
        id: "template_access",
        name: "Accesos a Aplicaciones",
        description: "Credenciales de acceso a sistemas",
        icon: "🔐",
        color: "#10B981",
        fields: [
          {
            type: "string",
            label: "Nombre del Sistema",
            placeholder: "Google, Facebook, etc.",
            required: true,
            sensitive: false,
            order: 1,
          },
          {
            type: "url",
            label: "URL de Acceso",
            placeholder: "https://ejemplo.com/login",
            required: false,
            sensitive: false,
            order: 2,
          },
          {
            type: "string",
            label: "Usuario/Email",
            placeholder: "usuario@ejemplo.com",
            required: true,
            sensitive: false,
            order: 3,
          },
          {
            type: "text",
            label: "Contraseña",
            placeholder: "••••••••",
            required: true,
            sensitive: true,
            encryptionLevel: "high",
            order: 4,
          },
          {
            type: "text",
            label: "Método de Recuperación",
            placeholder: "Email alternativo, teléfono, etc.",
            required: false,
            sensitive: false,
            order: 5,
          },
        ],
        settings: {
          allowDuplicates: true,
          maxEntries: 0,
          category: "access",
          isSystemTemplate: true,
          version: "1.0",
        },
      },
    ];
  }

  /**
   * Obtener plantilla por ID
   */
  async getTemplateById(templateId) {
    // Buscar en plantillas del sistema
    const systemTemplate = this.systemTemplates.find(
      (t) => t.id === templateId
    );
    if (systemTemplate) return systemTemplate;

    // Buscar en plantillas personales
    const userTemplate = this.userTemplates.find((t) => t.id === templateId);
    if (userTemplate) return userTemplate;

    return null;
  }

  /**
   * Crear nueva plantilla personalizada
   */
  async createTemplate(templateData) {
    if (!this.userId) {
      throw new Error("Usuario no autenticado");
    }

    // Validar datos básicos
    this.validateTemplateData(templateData);

    // Generar ID y datos completos
    const newTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...templateData,
      settings: {
        allowDuplicates: false,
        maxEntries: 0,
        category: templateData.settings?.category || "custom",
        isSystemTemplate: false,
        version: "1.0",
        ...templateData.settings,
      },
    };
    // Validar plantilla completa
    this.validateTemplate(newTemplate);

    // Agregar a la lista de plantillas del usuario
    this.userTemplates.push(newTemplate);

    // Guardar en almacenamiento persistente
    await this.saveUserTemplates();

    console.log("📝 Plantilla creada:", newTemplate.name);
    console.log("🆔 ID generado:", newTemplate.id);
    console.log("📊 Total plantillas personales:", this.userTemplates.length);

    return newTemplate;
  }

  /**
   * Validar campo individual
   */
  validateField(field, index) {
    const requiredFieldProps = ["label", "type"];
    const missingProps = requiredFieldProps.filter((prop) => !field[prop]);

    if (missingProps.length > 0) {
      throw new Error(
        `Campo ${index + 1} inválido. Faltan: ${missingProps.join(", ")}`
      );
    }

    // Generar ID automático si no existe
    if (!field.id) {
      field.id = this.generateFieldId(field.label, index);
    }

    // Validar tipo
    const validTypes = [
      "string",
      "number",
      "boolean",
      "text",
      "date",
      "url",
      "email",
    ];
    if (!validTypes.includes(field.type)) {
      throw new Error(
        `Tipo de campo inválido: "${
          field.type
        }". Tipos válidos: ${validTypes.join(", ")}`
      );
    }

    return true;
  }

  /**
   * Generar ID automático a partir de la etiqueta
   */
  generateFieldId(label, index) {
    if (!label || typeof label !== "string") {
      return `campo_${index + 1}`;
    }

    // Convertir etiqueta a ID válido
    const id = label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
      .replace(/[^a-z0-9_$]/g, "_") // Reemplazar caracteres no válidos
      .replace(/_{2,}/g, "_") // Eliminar múltiples guiones bajos
      .replace(/^_|_$/g, ""); // Eliminar guiones al inicio/final

    // Asegurar que comience con letra o _
    if (!id || !/^[a-zA-Z_$]/.test(id)) {
      return `campo_${index + 1}`;
    }

    return id;
  }

  /**
   * Validar estructura de datos de plantilla (sin id)
   */
  validateTemplateData(templateData) {
    const requiredProps = ["name", "fields"];
    const missingProps = requiredProps.filter((prop) => !templateData[prop]);

    if (missingProps.length > 0) {
      throw new Error(
        `Datos de plantilla inválidos. Faltan: ${missingProps.join(", ")}`
      );
    }

    if (
      !Array.isArray(templateData.fields) ||
      templateData.fields.length === 0
    ) {
      throw new Error("La plantilla debe tener al menos un campo");
    }

    // Validar cada campo
    templateData.fields.forEach((field, index) => {
      this.validateField(field, index);
    });

    return true;
  }

  /**
   * Validar plantilla completa (con id)
   */
  validateTemplate(template) {
    const requiredProps = ["id", "name", "fields"];
    const missingProps = requiredProps.filter((prop) => !template[prop]);

    if (missingProps.length > 0) {
      throw new Error(`Plantilla inválida. Faltan: ${missingProps.join(", ")}`);
    }

    if (!Array.isArray(template.fields) || template.fields.length === 0) {
      throw new Error("La plantilla debe tener al menos un campo");
    }

    // Validar cada campo
    template.fields.forEach((field, index) => {
      this.validateField(field, index);
    });

    return true;
  }

  /**
   * Actualizar plantilla existente
   */
  async updateTemplate(templateId, updates) {
    if (!this.userId) {
      throw new Error("Usuario no autenticado");
    }

    console.log("✏️  Actualizando plantilla:", templateId);

    // Buscar plantilla
    const templateIndex = this.userTemplates.findIndex(
      (t) => t.id === templateId
    );

    if (templateIndex === -1) {
      throw new Error("Plantilla no encontrada");
    }

    // Actualizar plantilla
    this.userTemplates[templateIndex] = {
      ...this.userTemplates[templateIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Guardar cambios
    await this.saveUserTemplates();

    console.log("✅ Plantilla actualizada");

    return this.userTemplates[templateIndex];
  }

  /**
   * Eliminar plantilla
   */
  async deleteTemplate(templateId) {
    if (!this.userId) {
      throw new Error("Usuario no autenticado");
    }

    console.log("🗑️  Eliminando plantilla:", templateId);

    // Verificar que no sea plantilla del sistema
    const template = await this.getTemplateById(templateId);
    if (template?.settings?.isSystemTemplate) {
      throw new Error("No se pueden eliminar plantillas del sistema");
    }

    // Eliminar de la lista
    const initialLength = this.userTemplates.length;
    this.userTemplates = this.userTemplates.filter((t) => t.id !== templateId);

    if (this.userTemplates.length === initialLength) {
      throw new Error("Plantilla no encontrada");
    }

    // Guardar cambios
    await this.saveUserTemplates();

    console.log(
      `✅ Plantilla eliminada. Quedan ${this.userTemplates.length} plantillas personales`
    );

    return { success: true, message: "Plantilla eliminada" };
  }

  /**
   * Obtener plantillas por categoría
   */
  async getTemplatesByCategory(category) {
    const allTemplates = await this.getUserTemplates();
    return allTemplates.filter((t) => t.settings.category === category);
  }

  /**
   * Obtener categorías disponibles
   */
  async getCategories() {
    const templates = await this.getUserTemplates();
    const categories = [...new Set(templates.map((t) => t.settings.category))];

    return categories.map((category) => ({
      id: category,
      name: this.getCategoryName(category),
      icon: this.getCategoryIcon(category),
      count: templates.filter((t) => t.settings.category === category).length,
    }));
  }

  /**
   * Obtener nombre amigable de categoría
   */
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

  /**
   * Obtener icono de categoría
   */
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

// Exportar instancia única
export const templateService = new TemplateService();
