// src/services/templates/index.js

import { TemplateStorage } from "./template-storage.js";
import { templateBuilder } from "./template-builder.js";

class TemplateService {
  constructor() {
    this.userId = null;
    this.appId = "mi-gestion-v1";
    this.userTemplates = [];
    this.isInitialized = false;
    this.storage = null;
  }

  async initialize(userId) {
    if (this.isInitialized && this.userId === userId) return;
    this.userId = userId;
    this.storage = new TemplateStorage(userId, this.appId);
    await this.loadUserTemplates();
    this.isInitialized = true;
  }

  async loadUserTemplates() {
    try {
      if (!this.userId) {
        this.userTemplates = [];
        return;
      }

      let templates = await this.storage.loadFromFirestore();

      if (templates === null) {
        templates = await this.storage.loadFromLocalStorage();
      }

      if (!templates || templates.length === 0) {
        console.log(
          "⚠️ No hay plantillas. Inicializando con valores por defecto..."
        );
        templates = this.getDefaultTemplates();
        await this.storage.saveToFirestore(templates);
      }

      this.userTemplates = templates;
    } catch (error) {
      console.error("❌ Error al cargar plantillas:", error);
      this.userTemplates = this.getDefaultTemplates();
    }
  }

  async createTemplate(templateData) {
    if (!this.userId) throw new Error("Usuario no autenticado");

    templateBuilder.validateTemplateData(templateData);

    const newTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...templateData,
      settings: {
        allowDuplicates: false,
        maxEntries: 0,
        category: "custom",
        ...templateData.settings,
        isSystemTemplate: false,
      },
    };

    this.userTemplates.push(newTemplate);
    await this.storage.saveToFirestore(this.userTemplates);
    return newTemplate;
  }

  async updateTemplate(templateId, updates) {
    const index = this.userTemplates.findIndex((t) => t.id === templateId);
    if (index === -1) throw new Error("Plantilla no encontrada");

    const mergedTemplate = {
      ...this.userTemplates[index],
      ...updates,
    };

    templateBuilder.validateTemplateData(mergedTemplate);

    this.userTemplates[index] = {
      ...mergedTemplate,
      updatedAt: new Date().toISOString(),
    };

    await this.storage.saveToFirestore(this.userTemplates);
    return this.userTemplates[index];
  }

  async deleteTemplate(templateId) {
    const initialLength = this.userTemplates.length;
    this.userTemplates = this.userTemplates.filter((t) => t.id !== templateId);

    if (this.userTemplates.length === initialLength) {
      throw new Error("Plantilla no encontrada");
    }

    await this.storage.saveToFirestore(this.userTemplates);
    return { success: true, message: "Plantilla eliminada" };
  }

  // --- NUEVOS MÉTODOS DE EXPORTACIÓN/IMPORTACIÓN ---

  async exportTemplate(templateId) {
    const template = await this.getTemplateById(templateId);
    if (!template) throw new Error("Plantilla no encontrada");

    // Crear copia limpia (sin datos de sistema)
    // Eliminamos ID, userId y fechas para que sea un JSON puro de estructura
    const { id, userId, createdAt, updatedAt, ...cleanTemplate } = template;

    return cleanTemplate;
  }

  async importTemplate(templateData) {
    // Reutilizamos createTemplate, que ya se encarga de asignar
    // un nuevo ID, el usuario actual y las fechas nuevas.
    // Además, createTemplate valida la estructura automáticamente.
    return await this.createTemplate(templateData);
  }

  // --------------------------------------------------

  async getUserTemplates() {
    if (!this.isInitialized) throw new Error("Servicio no inicializado");
    if (this.userTemplates.length === 0) {
      return this.getDefaultTemplates();
    }
    return this.userTemplates;
  }

  async getTemplateById(templateId) {
    return this.userTemplates.find((t) => t.id === templateId) || null;
  }

  async getCategories() {
    const templates = await this.getUserTemplates();
    const categoriesSet = [
      ...new Set(templates.map((t) => t.settings.category)),
    ];

    return categoriesSet.map((cat) => ({
      id: cat,
      count: templates.filter((t) => t.settings.category === cat).length,
    }));
  }

  getDefaultTemplates() {
    return [
      {
        id: "tpl_default_access",
        name: "Accesos y Contraseñas",
        description: "Gestión segura de credenciales",
        icon: "🔐",
        color: "#F59E0B",
        settings: { category: "access", allowDuplicates: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fields: [
          {
            id: "f_site",
            label: "Sitio / Aplicación",
            type: "string",
            order: 1,
            required: true,
          },
          {
            id: "f_user",
            label: "Usuario / Email",
            type: "string",
            order: 2,
            required: false,
          },
          {
            id: "f_pass",
            label: "Contraseña",
            type: "secret",
            order: 3,
            required: true,
          },
          {
            id: "f_url",
            label: "URL de acceso",
            type: "url",
            order: 4,
            required: false,
          },
          {
            id: "f_notes",
            label: "Notas adicionales",
            type: "text",
            order: 5,
            required: false,
          },
        ],
      },
      {
        id: "tpl_default_health",
        name: "Historial Médico",
        description: "Registro básico de salud",
        icon: "⚕️",
        color: "#EF4444",
        settings: { category: "health", allowDuplicates: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fields: [
          {
            id: "f_blood",
            label: "Tipo de Sangre",
            type: "string",
            order: 1,
            required: false,
          },
          {
            id: "f_allergies",
            label: "Alergias",
            type: "text",
            order: 2,
            required: false,
          },
          {
            id: "f_meds",
            label: "Medicación Actual",
            type: "text",
            order: 3,
            required: false,
          },
          {
            id: "f_contact",
            label: "Contacto Emergencia",
            type: "string",
            order: 4,
            required: true,
          },
        ],
      },
      {
        id: "tpl_default_finance",
        name: "Tarjeta de Crédito",
        description: "Datos de tarjetas bancarias",
        icon: "💳",
        color: "#10B981",
        settings: { category: "financial", allowDuplicates: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fields: [
          {
            id: "f_bank",
            label: "Banco / Emisor",
            type: "string",
            order: 1,
            required: true,
          },
          {
            id: "f_number",
            label: "Número de Tarjeta",
            type: "secret",
            order: 2,
            required: true,
          },
          {
            id: "f_exp",
            label: "Vencimiento (MM/AA)",
            type: "string",
            order: 3,
            required: true,
          },
          {
            id: "f_cvv",
            label: "CVV",
            type: "secret",
            order: 4,
            required: true,
          },
          {
            id: "f_pin",
            label: "PIN Cajero",
            type: "secret",
            order: 5,
            required: false,
          },
        ],
      },
    ];
  }

  async checkSyncStatus() {
    return this.storage.checkSyncStatus(this.userTemplates);
  }

  async syncTemplates() {
    const status = await this.storage.checkSyncStatus(this.userTemplates);
    if (status.needsSync) {
      if (status.cloudCount > status.localCount) {
        this.userTemplates = status.cloudTemplates;
        await this.storage.saveToLocalStorage(this.userTemplates);
        return {
          synced: true,
          message: `Descargadas ${status.cloudCount} plantillas.`,
        };
      } else if (status.localCount > status.cloudCount) {
        await this.storage.saveToFirestore(this.userTemplates);
        return {
          synced: true,
          message: `Subidas ${status.localCount} plantillas.`,
        };
      }
    }
    return { synced: true, message: "Sincronizado." };
  }
}

export const templateService = new TemplateService();
