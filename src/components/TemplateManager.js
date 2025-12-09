// src/components/TemplateManager.js

import { templateService } from "../services/templates/index.js";
import {
  generateFieldId,
  getCategoryName,
  getCategoryIcon,
  getFieldTypeLabel,
} from "../utils/helpers.js";
import { getFieldTypesConfig } from "../utils/field-types-config.js";

export class TemplateManager {
  constructor(onTemplateSelect) {
    this.onTemplateSelect = onTemplateSelect;
    this.currentView = "list";
    this.editingTemplate = null;
    this.tempFormData = null;
    this.allTemplates = [];
    this.currentCategory = "all";
  }

  render() {
    return `
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="border-b border-gray-200 px-6 py-4">
          <div class="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h2 class="text-xl font-bold text-gray-800">
                <i class="fas fa-layer-group mr-2"></i>
                Plantillas de Datos
              </h2>
              <p class="text-gray-600 text-sm mt-1">
                Crea y gestiona plantillas para organizar tu información
              </p>
            </div>
            
            <div class="flex space-x-2">
              <input type="file" id="importTemplateInput" accept=".json" class="hidden" />
              
              <button id="btnImportTemplate" class="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg transition flex items-center shadow-sm">
                <i class="fas fa-file-import mr-2"></i>
                Importar
              </button>
              
              <button id="btnNewTemplate" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center shadow-sm">
                <i class="fas fa-plus mr-2"></i>
                Nueva
              </button>
            </div>
          </div>
        </div>

        <div id="templateContent" class="p-6">
          ${this.renderLoading()}
        </div>
      </div>
    `;
  }

  renderLoading() {
    return `
      <div class="flex justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p class="mt-4 text-gray-600">Cargando plantillas...</p>
        </div>
      </div>
    `;
  }

  renderTemplateList(templates, categories) {
    const customTemplates = templates.filter(
      (t) => !t.settings?.isSystemTemplate
    );

    return `
      <div class="space-y-6">
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div class="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 cursor-pointer transition category-filter ${
            this.currentCategory === "all"
              ? "border-2 border-blue-500 bg-blue-100"
              : ""
          }" data-category="all">
            <div class="flex items-center">
              <span class="text-lg mr-2">⭐</span>
              <div>
                <p class="font-medium text-gray-800">Todas</p>
                <p class="text-xs text-gray-500">${
                  this.allTemplates.length
                } plantilla${this.allTemplates.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>
          ${categories
            .map(
              (cat) => `
            <div class="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 cursor-pointer transition category-filter ${
              cat.id === this.currentCategory
                ? "border-2 border-blue-500 bg-blue-100"
                : ""
            }" data-category="${cat.id}">
              <div class="flex items-center">
                <span class="text-lg mr-2">${getCategoryIcon(cat.id)}</span>
                <div>
                  <p class="font-medium text-gray-800">${getCategoryName(
                    cat.id
                  )}</p>
                  <p class="text-xs text-gray-500">${cat.count} plantilla${
                cat.count !== 1 ? "s" : ""
              }</p>
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>

        <div id="customTemplatesSection">
          <div id="customTemplatesList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${
              customTemplates.length > 0
                ? customTemplates
                    .map((t) => this.renderTemplateCard(t))
                    .join("")
                : ""
            }
          </div>
          
          <div id="noCustomTemplates" class="${
            customTemplates.length > 0 ? "hidden" : ""
          } text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <p class="text-gray-600 font-medium">No hay plantillas${
              this.currentCategory !== "all"
                ? ` en ${getCategoryName(this.currentCategory)}`
                : ""
            }</p>
            <p class="text-gray-500 text-sm mt-1">Crea tu primera plantilla para organizar tus datos</p>
          </div>
        </div>
      </div>
    `;
  }

  renderTemplateCard(template) {
    const fieldCount = template.fields.length;

    if (!template.id) {
      console.error("Template sin ID:", template);
      template.id = "temp_" + Math.random();
    }

    return `
    <div class="template-card border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-white" 
         data-template-id="${template.id}"
         data-template-name="${template.name || ""}">
      <div class="p-4">
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style="background-color: ${
              template.color
            }20; color: ${template.color}">
              ${template.icon || "📋"}
            </div>
            <div class="ml-3">
              <h4 class="font-bold text-gray-800">${
                template.name || "Sin nombre"
              }</h4>
              <p class="text-xs text-gray-500 truncate max-w-[150px]">${
                template.description || "Sin descripción"
              }</p>
            </div>
          </div>
          <div class="flex space-x-1">
              <button type="button" class="export-template text-gray-400 hover:text-green-600 p-1 rounded hover:bg-green-50 transition" 
                      data-template-id="${template.id}"
                      title="Exportar plantilla (JSON)">
                <i class="fas fa-file-export"></i>
              </button>

              <button type="button" class="edit-template text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition" 
                      data-template-id="${template.id}"
                      title="Editar plantilla">
                <i class="fas fa-edit"></i>
              </button>
              <button type="button" class="delete-template text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition" 
                      data-template-id="${template.id}"
                      title="Eliminar plantilla">
                <i class="fas fa-trash"></i>
              </button>
          </div>
        </div>
        
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">
              <i class="fas fa-list-ul mr-1"></i>
              ${fieldCount} campo${fieldCount !== 1 ? "s" : ""}
            </span>
          </div>
          
          <div class="flex flex-wrap gap-1">
            ${template.fields
              .slice(0, 3)
              .map(
                (field) => `
              <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200">
                ${field.label || "Sin etiqueta"}
              </span>
            `
              )
              .join("")}
            ${
              template.fields.length > 3
                ? `
              <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200">
                +${template.fields.length - 3} más
              </span>
            `
                : ""
            }
          </div>
        </div>
        
        <button type="button" class="use-template-btn w-full mt-4 bg-gray-50 hover:bg-blue-50 text-blue-600 hover:text-blue-700 font-medium py-2 px-4 rounded-lg transition flex items-center justify-center border border-gray-200 hover:border-blue-200"
                data-template-id="${template.id}">
          <i class="fas fa-plus-circle mr-2"></i>
          Usar esta plantilla
        </button>
      </div>
    </div>
  `;
  }

  async loadTemplates() {
    try {
      const content = document.getElementById("templateContent");
      if (!content) return;
      content.innerHTML = this.renderLoading();

      const syncStatus = await templateService.checkSyncStatus();
      if (syncStatus.needsSync && syncStatus.cloudCount > 0) {
        this.showMessage(
          `Hay ${syncStatus.cloudCount} plantillas en la nube. <button type="button" class="underline font-medium" id="quickSync">Sincronizar</button>`,
          "info",
          10000
        );
        setTimeout(() => {
          document
            .getElementById("quickSync")
            ?.addEventListener("click", async () => {
              const result = await templateService.syncTemplates();
              if (result.synced) {
                this.showSuccess(result.message);
                this.loadTemplates();
              }
            });
        }, 100);
      }

      this.allTemplates = await templateService.getUserTemplates();
      const categories = await templateService.getCategories();
      this.currentCategory = "all";

      content.innerHTML = this.renderTemplateList(
        this.allTemplates,
        categories
      );
      this.setupTemplateListListeners();
    } catch (error) {
      console.error("Error al cargar plantillas:", error);
      this.showError("Error al cargar plantillas: " + error.message);
    }
  }

  setupTemplateListListeners() {
    const newTemplateBtn = document.getElementById("btnNewTemplate");
    if (newTemplateBtn)
      newTemplateBtn.addEventListener("click", () => this.showTemplateForm());

    const importInput = document.getElementById("importTemplateInput");
    const importBtn = document.getElementById("btnImportTemplate");

    if (importBtn && importInput) {
      importBtn.addEventListener("click", () => importInput.click());
      importInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
          this.handleImportTemplate(e.target.files[0]);
          e.target.value = "";
        }
      });
    }

    document.querySelectorAll(".category-filter").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        this.filterTemplatesByCategory(e.currentTarget.dataset.category)
      );
    });

    const templateContent = document.getElementById("templateContent");
    if (templateContent) {
      templateContent.addEventListener("click", (e) => {
        const target = e.target.closest("button, .template-card");
        if (!target) return;

        const templateCard = e.target.closest(".template-card");
        const id = templateCard?.dataset.templateId;

        if (e.target.closest(".use-template-btn")) {
          if (id && this.onTemplateSelect) this.onTemplateSelect(id);
          e.stopPropagation();
        } else if (e.target.closest(".edit-template")) {
          if (id) this.editTemplate(id);
          e.stopPropagation();
        } else if (e.target.closest(".delete-template")) {
          if (id) this.deleteTemplate(id);
          e.stopPropagation();
        } else if (e.target.closest(".export-template")) {
          if (id) this.handleExportTemplate(id);
          e.stopPropagation();
        } else if (
          templateCard &&
          !e.target.closest("button") &&
          !e.target.closest("a")
        ) {
          if (id) this.showTemplatePreview(id);
        }
      });
    }
  }

  async handleExportTemplate(id) {
    try {
      const data = await templateService.exportTemplate(id);
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      const safeName = (data.name || "plantilla")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      link.download = `${safeName}.template.json`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.showSuccess("✅ Plantilla exportada con éxito");
    } catch (e) {
      this.showError("Error al exportar: " + e.message);
    }
  }

  async handleImportTemplate(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = JSON.parse(e.target.result);
        if (!content.name || !content.fields) {
          throw new Error("El archivo no parece ser una plantilla válida.");
        }

        await templateService.importTemplate(content);
        this.showSuccess(
          `✅ Plantilla "${content.name}" importada correctamente`
        );
        this.loadTemplates();
      } catch (err) {
        console.error(err);
        this.showError("Error al importar: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  renderTemplateForm(template = null) {
    const isEditing = !!template;
    const fieldsHtml = template?.fields
      ? template.fields
          .map((field, index) => this.renderFieldForm(field, index))
          .join("")
      : "";

    const currentCategory = template?.settings?.category || "custom";
    const initialIcon = template?.icon || getCategoryIcon(currentCategory);

    const categoryOptions = [
      { value: "custom", label: "Personalizado" },
      { value: "personal", label: "Personal" },
      { value: "access", label: "Accesos" },
      { value: "financial", label: "Financiero" },
      { value: "health", label: "Salud" },
      { value: "home", label: "Hogar" },
      { value: "car", label: "Vehículo" },
      { value: "job", label: "Trabajo" },
      { value: "education", label: "Formación" },
    ];

    return `
      <div class="max-w-4xl mx-auto">
        <div class="mb-6">
          <h3 class="text-xl font-bold text-gray-800">
            <i class="fas fa-${isEditing ? "edit" : "plus-circle"} mr-2"></i>
            ${isEditing ? "Editar Plantilla" : "Nueva Plantilla"}
          </h3>
          <p class="text-gray-600 mt-1">
            ${
              isEditing
                ? "Modifica los detalles de tu plantilla"
                : "Crea una plantilla personalizada para organizar tus datos"
            }
          </p>
        </div>

        <form id="templateForm" class="space-y-6">
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h4 class="font-semibold text-gray-800 mb-4">
              <i class="fas fa-info-circle mr-2 text-blue-500"></i>
              Información Básica
            </h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="templateName" class="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Plantilla *
                </label>
                <input type="text" id="templateName" value="${
                  template?.name || ""
                }" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Ej: Datos Médicos, Credenciales, etc." />
              </div>
              
              <div>
                <label for="templateCategory" class="block text-sm font-medium text-gray-700 mb-1">
                  Categoría *
                </label>
                <select id="templateCategory" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                  ${categoryOptions
                    .map(
                      (opt) => `
                    <option value="${opt.value}" ${
                        opt.value === currentCategory ? "selected" : ""
                      }>
                      ${getCategoryIcon(opt.value)} ${opt.label}
                    </option>
                  `
                    )
                    .join("")}
                </select>
              </div>
              
              <div>
                <label for="templateIcon" class="block text-sm font-medium text-gray-700 mb-1">Icono</label>
                <input type="text" id="templateIcon" value="${initialIcon}" 
                       maxlength="2" class="w-16 text-center px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="📋" />
              </div>
              
              <div>
                <label for="templateColor" class="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input type="color" id="templateColor" value="${
                  template?.color || "#3B82F6"
                }" class="w-full h-10 px-1 border border-gray-300 rounded-lg cursor-pointer" />
              </div>

            </div>

            <div class="mt-4">
                <label for="templateDescription" class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input type="text" id="templateDescription" value="${
                  template?.description || ""
                }" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Breve descripción de la plantilla" />
            </div>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <div class="flex justify-between items-center mb-4">
              <h4 class="font-semibold text-gray-800">
                <i class="fas fa-list-alt mr-2 text-green-500"></i>
                Campos de la Plantilla
              </h4>
              <button type="button" id="addFieldBtn" class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center">
                <i class="fas fa-plus mr-2"></i>
                Agregar Campo
              </button>
            </div>
            
            <div id="fieldsContainer" class="space-y-4">
              ${fieldsHtml}
            </div>
            
            <div id="noFieldsMessage" class="${
              template?.fields?.length
                ? "hidden"
                : "text-center py-8 border-2 border-dashed border-gray-300 rounded-lg"
            }">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-list-ul text-gray-400 text-2xl"></i>
              </div>
              <p class="text-gray-600 font-medium">No hay campos definidos</p>
              <p class="text-gray-500 text-sm mt-1">Agrega campos para capturar información</p>
            </div>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h4 class="font-semibold text-gray-800 mb-4">
              <i class="fas fa-cogs mr-2 text-purple-500"></i>
              Configuración Adicional
            </h4>
            
            <div class="space-y-4">
              <div class="flex items-center">
                <input type="checkbox" id="allowDuplicates" ${
                  template?.settings?.allowDuplicates ? "checked" : ""
                } class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                <label for="allowDuplicates" class="ml-2 text-gray-700">Permitir múltiples entradas con esta plantilla</label>
              </div>
              
              <div>
                <label for="maxEntries" class="block text-sm font-medium text-gray-700 mb-1">Límite de entradas (0 = ilimitado)</label>
                <input type="number" id="maxEntries" value="${
                  template?.settings?.maxEntries || 0
                }" min="0" class="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
              </div>
              
              </div>
          </div>

          <div class="flex justify-between pt-4 border-t border-gray-200">
            <button type="button" id="cancelTemplate" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-lg transition">Cancelar</button>
            <div class="space-x-3">
              <button type="button" id="previewTemplate" class="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition"><i class="fas fa-eye mr-2"></i>Vista Previa</button>
              <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"><i class="fas fa-save mr-2"></i>${
                isEditing ? "Actualizar Plantilla" : "Crear Plantilla"
              }</button>
            </div>
          </div>
        </form>
      </div>
    `;
  }

  renderFieldForm(field = null, index = 0) {
    const fieldId =
      field?.id || generateFieldId(field?.label || `campo_${index + 1}`, index);

    const fieldTypes = getFieldTypesConfig();

    return `
    <div class="field-item border border-gray-200 rounded-lg p-4 cursor-move" data-field-id="${fieldId}">
      <div class="flex justify-between items-start mb-4">
        <span class="drag-handle text-gray-400 hover:text-gray-600 mr-3 p-1"><i class="fas fa-grip-lines"></i></span>
        <h5 class="font-medium text-gray-800"><i class="fas fa-columns mr-2"></i>Campo ${
          index + 1
        }</h5>
        <button type="button" class="remove-field text-red-600 hover:text-red-800"><i class="fas fa-times"></i></button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4"> 
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Campo *</label>
          <input type="text" class="field-label w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm" value="${
            field?.label || ""
          }" placeholder="Ej: Nombre Completo" required />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Dato *</label>
          <select class="field-type w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm">
            ${fieldTypes
              .map(
                (type) => `
              <option value="${type.value}" ${
                  field?.type === type.value ? "selected" : ""
                }>
                ${type.label}
              </option>
            `
              )
              .join("")}
          </select>
        </div>
      </div>
        
      <div class="options-input-group ${
        field?.type === "select" ? "" : "hidden"
      } mt-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Opciones (separadas por coma) *</label>
        <textarea
          class="field-options w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
          placeholder="Ej: Banco, Tarjeta de Crédito, Inversión"
        >${(field?.options || []).join(", ")}</textarea>
      </div>

      <div class="columns-builder-group ${
        field?.type === "table" ? "" : "hidden"
      } mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label class="block text-sm font-medium text-gray-700 mb-2">Columnas de la Tabla</label>
        <div class="columns-container space-y-2">
          ${(field?.columns || [])
            .map(
              (col, i) => `
            <div class="column-item flex space-x-2">
              <input type="text" placeholder="Nombre Columna" value="${
                col.name
              }" class="col-name w-1/2 px-2 py-1 text-sm border border-gray-300 rounded">
              <select class="col-type w-1/3 px-2 py-1 text-sm border border-gray-300 rounded">
                <option value="string" ${
                  col.type === "string" ? "selected" : ""
                }>Texto</option>
                <option value="number" ${
                  col.type === "number" ? "selected" : ""
                }>Número</option>
                <option value="currency" ${
                  col.type === "currency" ? "selected" : ""
                }>Moneda</option>
                <option value="date" ${
                  col.type === "date" ? "selected" : ""
                }>Fecha</option>
              </select>
              <button type="button" class="remove-column text-red-500 hover:text-red-700 px-2"><i class="fas fa-times"></i></button>
            </div>
          `
            )
            .join("")}
        </div>
        <button type="button" class="add-column-btn mt-2 text-xs text-blue-600 font-medium hover:underline">
          <i class="fas fa-plus mr-1"></i> Agregar Columna
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Texto de ayuda</label>
          <input type="text" class="field-placeholder w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm" value="${
            field?.placeholder || ""
          }" placeholder="Placeholder..." />
        </div>
        <div class="space-y-2">
          <div class="flex items-center">
            <input type="checkbox" class="field-required h-4 w-4 text-blue-600 border-gray-300 rounded" ${
              field?.required ? "checked" : ""
            } />
            <label class="ml-2 text-sm text-gray-700">Obligatorio</label>
          </div>
        </div>
      </div>
    </div>
      `;
  }

  async showTemplateForm(templateId = null) {
    const content = document.getElementById("templateContent");
    if (!content) return;

    if (templateId) {
      this.editingTemplate = await templateService.getTemplateById(templateId);
      this.tempFormData = null;
      content.innerHTML = this.renderTemplateForm(this.editingTemplate);
    } else if (this.tempFormData) {
      this.editingTemplate = null;
      content.innerHTML = this.renderTemplateForm(this.tempFormData);
    } else {
      this.editingTemplate = null;
      this.tempFormData = null;
      content.innerHTML = this.renderTemplateForm();
    }
    this.setupTemplateFormListeners();
  }

  setupTemplateFormListeners() {
    const categorySelect = document.getElementById("templateCategory");
    const iconInput = document.getElementById("templateIcon");
    if (categorySelect && iconInput) {
      categorySelect.addEventListener("change", (e) => {
        iconInput.value = getCategoryIcon(e.target.value);
      });
    }

    document
      .getElementById("addFieldBtn")
      ?.addEventListener("click", () => this.addField());

    const fieldsContainer = document.getElementById("fieldsContainer");
    if (fieldsContainer) {
      fieldsContainer.addEventListener("click", (e) => {
        if (e.target.closest(".remove-field")) {
          e.target.closest(".field-item").remove();
          this.updateNoFieldsMessage();
        }

        // Agregar Columna Tabla
        if (e.target.closest(".add-column-btn")) {
          const container = e.target
            .closest(".columns-builder-group")
            .querySelector(".columns-container");
          const colHtml = `
            <div class="column-item flex space-x-2">
              <input type="text" placeholder="Nombre Columna" class="col-name w-1/2 px-2 py-1 text-sm border border-gray-300 rounded">
              <select class="col-type w-1/3 px-2 py-1 text-sm border border-gray-300 rounded">
                <option value="string">Texto</option>
                <option value="number">Número</option>
                <option value="currency">Moneda</option>
                <option value="date">Fecha</option>
              </select>
              <button type="button" class="remove-column text-red-500 hover:text-red-700 px-2"><i class="fas fa-times"></i></button>
            </div>`;
          container.insertAdjacentHTML("beforeend", colHtml);
        }

        // Quitar Columna Tabla
        if (e.target.closest(".remove-column")) {
          e.target.closest(".column-item").remove();
        }
      });

      fieldsContainer.addEventListener("change", (e) => {
        if (e.target.classList.contains("field-type")) {
          const fieldItem = e.target.closest(".field-item");
          const tableGroup = fieldItem.querySelector(".columns-builder-group");
          const selectGroup = fieldItem.querySelector(".options-input-group");

          tableGroup.classList.add("hidden");
          selectGroup.classList.add("hidden");

          if (e.target.value === "table") {
            tableGroup.classList.remove("hidden");
          } else if (e.target.value === "select") {
            selectGroup.classList.remove("hidden");
          }
        }
      });
    }

    document
      .getElementById("cancelTemplate")
      ?.addEventListener("click", () => this.loadTemplates());
    document
      .getElementById("previewTemplate")
      ?.addEventListener("click", () => this.previewTemplate());
    document.getElementById("templateForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveTemplate();
    });

    this.setupFieldValidation();
    this.initializeSortable();
  }

  addField() {
    const container = document.getElementById("fieldsContainer");
    if (container) {
      const count = container.querySelectorAll(".field-item").length;
      container.insertAdjacentHTML(
        "beforeend",
        this.renderFieldForm(null, count)
      );
      document.getElementById("noFieldsMessage")?.classList.add("hidden");
    }
  }

  updateNoFieldsMessage() {
    const container = document.getElementById("fieldsContainer");
    if (container && container.querySelectorAll(".field-item").length === 0) {
      document.getElementById("noFieldsMessage")?.classList.remove("hidden");
    }
  }

  collectFormData() {
    const name = document.getElementById("templateName")?.value || "";
    const description =
      document.getElementById("templateDescription")?.value || "";
    const icon = document.getElementById("templateIcon")?.value || "📋";
    const color = document.getElementById("templateColor")?.value || "#3B82F6";
    const allowDuplicates =
      document.getElementById("allowDuplicates")?.checked || false;
    const maxEntries =
      parseInt(document.getElementById("maxEntries")?.value) || 0;
    const category =
      document.getElementById("templateCategory")?.value || "custom";

    if (!name.trim())
      throw new Error("El nombre de la plantilla es requerido.");

    const fields = [];
    const fieldElements = document.querySelectorAll(
      "#fieldsContainer .field-item"
    );
    if (fieldElements.length === 0)
      throw new Error("La plantilla debe tener al menos un campo.");

    fieldElements.forEach((fieldItem, index) => {
      const label = fieldItem.querySelector(".field-label")?.value || "";

      // FIX CRÍTICO: Asegurar que el tipo nunca sea undefined
      let type = fieldItem.querySelector(".field-type")?.value;
      if (!type || type === "undefined") {
        type = "string";
      }

      if (!label.trim())
        throw new Error(`Campo ${index + 1}: Nombre requerido`);

      const fieldId = generateFieldId(label, index);

      let options = [];
      if (type === "select") {
        const optionsText = fieldItem.querySelector(".field-options").value;
        if (!optionsText) {
          throw new Error(
            `El campo '${label}' de tipo Selección Simple requiere opciones.`
          );
        }
        options = optionsText
          .split(",")
          .map((o) => o.trim())
          .filter((o) => o.length > 0);
      }

      let columns = [];
      if (type === "table") {
        const colItems = fieldItem.querySelectorAll(".column-item");
        if (colItems.length === 0) {
          throw new Error(
            `La tabla '${label}' debe tener al menos una columna.`
          );
        }
        colItems.forEach((col) => {
          const cName = col.querySelector(".col-name").value.trim();
          const cType = col.querySelector(".col-type").value;
          if (cName)
            columns.push({
              name: cName,
              type: cType,
              id: generateFieldId(cName),
            });
        });
      }

      fields.push({
        id: fieldId,
        label: label.trim(),
        type: type,
        order: index + 1,
        placeholder: fieldItem.querySelector(".field-placeholder")?.value || "",
        required: fieldItem.querySelector(".field-required")?.checked || false,
        ...(options.length > 0 && { options }),
        ...(columns.length > 0 && { columns }),
      });
    });

    return {
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
      fields,
      settings: {
        allowDuplicates,
        maxEntries,
        category,
        isSystemTemplate: false,
      },
    };
  }

  async saveTemplate() {
    try {
      const submitBtn = document.querySelector(
        '#templateForm button[type="submit"]'
      );
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML =
          '<i class="fas fa-spinner fa-spin mr-2"></i> Procesando...';
      }

      const templateData = this.collectFormData();

      if (this.editingTemplate) {
        await templateService.updateTemplate(
          this.editingTemplate.id,
          templateData
        );
        this.showSuccess("✅ Plantilla actualizada correctamente");
      } else {
        await templateService.createTemplate(templateData);
        this.showSuccess("✅ Plantilla creada correctamente");
      }

      setTimeout(() => this.loadTemplates(), 1500);
    } catch (error) {
      console.error("Error al guardar:", error);
      this.showError(error.message);

      const submitBtn = document.querySelector(
        '#templateForm button[type="submit"]'
      );
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML =
          '<i class="fas fa-save mr-2"></i> ' +
          (this.editingTemplate ? "Actualizar Plantilla" : "Crear Plantilla");
      }
    }
  }

  async editTemplate(id) {
    await this.showTemplateForm(id);
  }

  async deleteTemplate(id) {
    if (
      !confirm(
        "¿Estás seguro de que deseas eliminar esta plantilla? Esta acción es irreversible."
      )
    )
      return;
    try {
      await templateService.deleteTemplate(id);
      this.showSuccess("✅ Plantilla eliminada correctamente");
      this.loadTemplates();
    } catch (e) {
      this.showError("Error al eliminar: " + e.message);
    }
  }

  async previewTemplate() {
    try {
      this.tempFormData = this.collectFormData();
      this.showTemplatePreviewData(this.tempFormData);
    } catch (e) {
      this.showError(e.message);
    }
  }

  async showTemplatePreview(id) {
    try {
      const template = await templateService.getTemplateById(id);
      if (!template)
        throw new Error("Plantilla no encontrada para previsualizar.");
      this.showTemplatePreviewData(template);
    } catch (e) {
      this.showError("Error al cargar vista previa: " + e.message);
    }
  }

  showTemplatePreviewData(data) {
    const content = document.getElementById("templateContent");
    if (!content) return;

    content.innerHTML = `
        <div class="max-w-4xl mx-auto">
             <div class="mb-6"><h3 class="text-xl font-bold text-gray-800"><i class="fas fa-eye mr-2"></i>Vista Previa de Plantilla</h3></div>
             <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <div class="flex items-center"><div class="w-12 h-12 rounded-lg flex items-center justify-center text-xl mr-4" style="background-color:${
                  data.color
                }20;color:${data.color}">${data.icon}</div>
                <div><h4 class="font-bold text-gray-800">${
                  data.name
                }</h4><p class="text-gray-600">${
      data.description
    }</p></div></div>
             </div>
             <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h4 class="font-semibold text-gray-800 mb-4">Formulario Ejemplo</h4>
                <div class="space-y-4">${data.fields
                  .map((f) => this.renderFieldPreview(f))
                  .join("")}</div>
             </div>
             <div class="flex justify-between pt-4">
               <button id="backToForm" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-lg transition">
                  <i class="fas fa-arrow-left mr-2"></i> Volver a Editar
               </button>
               <button id="saveFromPreview" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition">
                  <i class="fas fa-save mr-2"></i> Guardar Plantilla
               </button>
             </div>
        </div>
      `;

    document
      .getElementById("backToForm")
      ?.addEventListener("click", () =>
        this.showTemplateForm(this.editingTemplate?.id)
      );

    document
      .getElementById("saveFromPreview")
      ?.addEventListener("click", () => {
        this.showTemplateForm(this.editingTemplate?.id);
        setTimeout(
          () => document.getElementById("templateForm")?.requestSubmit(),
          50
        );
      });
  }

  renderFieldPreview(field) {
    const typeLabel = getFieldTypeLabel(field.type);

    const isSelect = field.type === "select";
    let fieldDisplay;

    if (isSelect) {
      const optionsList = (field.options || [])
        .map(
          (opt) =>
            `<span class="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">${opt}</span>`
        )
        .join(" ");

      fieldDisplay = `<div class="p-3 bg-gray-100 border border-gray-200 rounded-lg">${optionsList}</div>`;
    } else {
      fieldDisplay = `
            <input disabled class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700" 
                   placeholder="${
                     field.placeholder || "Campo de tipo: " + typeLabel
                   }" 
                   value="">
        `;
    }

    return `
        <div class="mb-4">
           <label class="block text-sm font-medium text-gray-700">
             ${field.label} 
             ${
               field.required
                 ? '<span class="text-red-600 ml-1 font-bold" title="Campo Obligatorio">*</span>'
                 : ""
             }
           </label>
           ${fieldDisplay} 
        </div>
      `;
  }

  async filterTemplatesByCategory(category) {
    if (this.currentCategory === category) {
      return;
    }

    this.currentCategory = category;
    const categories = await templateService.getCategories();

    const filteredTemplates =
      category === "all"
        ? this.allTemplates
        : this.allTemplates.filter((t) => t.settings.category === category);

    const content = document.getElementById("templateContent");
    if (content) {
      content.innerHTML = this.renderTemplateList(
        filteredTemplates,
        categories
      );
      this.setupTemplateListListeners();
    }

    const catName = getCategoryName(category);
    this.showMessage(
      `Mostrando ${filteredTemplates.length} plantilla${
        filteredTemplates.length !== 1 ? "s" : ""
      } en categoría: ${catName}`,
      "info",
      3000
    );
  }

  showMessage(msg, type = "info", dur = 3000) {
    const t = document.createElement("div");
    t.className = `fixed bottom-4 right-4 z-50 px-4 py-3 rounded text-white shadow-lg ${
      type === "error"
        ? "bg-red-500"
        : type === "success"
        ? "bg-green-500"
        : "bg-blue-500"
    }`;
    t.innerHTML = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), dur);
  }

  showSuccess(m) {
    this.showMessage(m, "success");
  }
  showError(m) {
    this.showMessage(m, "error", 5000);
  }

  setupFieldValidation() {
    document.querySelectorAll(".field-label").forEach((input) => {
      input.addEventListener("blur", () => {
        this.validateFieldLabel(input);
      });

      input.addEventListener("input", () => {
        this.clearFieldError(input);
      });
    });
  }

  validateFieldLabel(input) {
    const value = input.value.trim();

    if (!value) {
      this.showFieldError(input, "El nombre del campo es requerido");
      return false;
    }

    if (value.length < 2) {
      this.showFieldError(input, "El nombre debe tener al menos 2 caracteres");
      return false;
    }

    this.clearFieldError(input);
    return true;
  }

  showFieldError(input, message) {
    this.clearFieldError(input);

    input.classList.add("border-red-500", "bg-red-50");

    const errorDiv = document.createElement("div");
    errorDiv.className = "text-red-600 text-xs mt-1";
    errorDiv.textContent = message;
    errorDiv.id = `error-${input.id || input.name || input.classList[0]}`;

    input.parentNode.appendChild(errorDiv);
  }

  clearFieldError(input) {
    input.classList.remove("border-red-500", "bg-red-50");
    const errorId = `error-${input.id || input.name || input.classList[0]}`;
    const existingError = document.getElementById(errorId);
    if (existingError) {
      existingError.remove();
    }
  }

  initializeSortable() {
    const container = document.getElementById("fieldsContainer");

    if (container && typeof Sortable !== "undefined") {
      new Sortable(container, {
        animation: 150,
        handle: ".drag-handle",
        ghostClass: "sortable-ghost",
        onEnd: (evt) => {
          console.log(
            `Campo movido de la posición ${evt.oldIndex} a ${evt.newIndex}`
          );
        },
      });
    }
  }
}
