/**
 * Componente para gestionar plantillas personalizadas
 */

import { templateService } from "../services/templates/index.js";

export class TemplateManager {
  constructor(onTemplateSelect) {
    this.onTemplateSelect = onTemplateSelect;
    this.currentView = "list"; // 'list', 'create', 'edit', 'preview'
    this.editingTemplate = null;
    this.tempFormData = null; // <-- NUEVO: Guardar datos del formulario temporalmente
  }

  /**
   * Renderizar componente
   */
  render() {
    return `
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <!-- Header -->
        <div class="border-b border-gray-200 px-6 py-4">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-bold text-gray-800">
                <i class="fas fa-layer-group mr-2"></i>
                Plantillas de Datos
              </h2>
              <p class="text-gray-600 text-sm mt-1">
                Crea y gestiona plantillas para organizar tu información
              </p>
            </div>
            <button id="btnNewTemplate" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center">
              <i class="fas fa-plus mr-2"></i>
              Nueva Plantilla
            </button>
          </div>
        </div>

        <!-- Contenido dinámico -->
        <div id="templateContent" class="p-6">
          ${this.renderLoading()}
        </div>
      </div>
    `;
  }

  /**
   * Renderizar estado de carga
   */
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

  /**
   * Renderizar lista de plantillas
   */
  renderTemplateList(templates, categories) {
    return `
      <div class="space-y-6">
        <!-- Categorías -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
          ${categories
            .map(
              (cat) => `
            <div class="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 cursor-pointer transition category-filter" data-category="${cat.id}">
              <div class="flex items-center">
                <span class="text-lg mr-2">${cat.icon}</span>
                <div>
                  <p class="font-medium text-gray-800">${cat.name}</p>
                  <p class="text-xs text-gray-500">${cat.count} plantillas</p>
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>

        <!-- Plantillas del sistema -->
        <div>
          <h3 class="text-lg font-semibold text-gray-800 mb-3">
            <i class="fas fa-shield-alt mr-2 text-blue-500"></i>
            Plantillas del Sistema
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${templates
              .filter((t) => t.settings.isSystemTemplate)
              .map((template) => this.renderTemplateCard(template))
              .join("")}
          </div>
        </div>

        <!-- Plantillas personalizadas -->
        <div id="customTemplatesSection">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-lg font-semibold text-gray-800">
              <i class="fas fa-user-edit mr-2 text-green-500"></i>
              Mis Plantillas Personalizadas
            </h3>
            <span id="customTemplatesCount" class="bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
              0 plantillas
            </span>
          </div>
          <div class="flex space-x-2">
            <span id="customTemplatesCount" class="bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
              0 plantillas
            </span>
            <button id="debugTemplates" class="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 px-2 py-1 rounded" title="Debug">
              <i class="fas fa-bug"></i>
            </button>
            <button id="debugEvents" class="text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 px-2 py-1 rounded" title="Debug Event Listeners">
              <i class="fas fa-play-circle"></i> Debug Events
            </button>
            <button id="syncTemplates" class="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded" title="Sincronizar con la nube">
              <i class="fas fa-sync-alt"></i> Sincronizar
            </button>
          </div>
          <div id="customTemplatesList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Se llenará dinámicamente -->
          </div>
          <div id="noCustomTemplates" class="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-layer-group text-gray-400 text-2xl"></i>
            </div>
            <p class="text-gray-600 font-medium">No tienes plantillas personalizadas aún</p>
            <p class="text-gray-500 text-sm mt-1">Crea tu primera plantilla para organizar tus datos</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar tarjeta de plantilla
   */
  renderTemplateCard(template) {
    const fieldCount = template.fields.length;
    const sensitiveCount = template.fields.filter((f) => f.sensitive).length;

    // Asegurar que el template tenga ID
    if (!template.id) {
      console.error("Template sin ID:", template);
      template.id = `template_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
    }

    return `
    <div class="template-card border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer" 
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
              <p class="text-xs text-gray-500">${
                template.description || "Sin descripción"
              }</p>
            </div>
          </div>
          ${
            template.settings?.isSystemTemplate
              ? `
            <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
              Sistema
            </span>
          `
              : `
            <div class="flex space-x-1">
              <button class="edit-template text-gray-400 hover:text-blue-600 p-1" 
                      data-template-id="${template.id}"
                      title="Editar plantilla">
                <i class="fas fa-edit"></i>
              </button>
              <button class="delete-template text-gray-400 hover:text-red-600 p-1" 
                      data-template-id="${template.id}"
                      title="Eliminar plantilla">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          `
          }
        </div>
        
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">
              <i class="fas fa-list-ul mr-1"></i>
              ${fieldCount} campo${fieldCount !== 1 ? "s" : ""}
            </span>
            ${
              sensitiveCount > 0
                ? `
              <span class="text-red-600">
                <i class="fas fa-lock mr-1"></i>
                ${sensitiveCount} sensible${sensitiveCount !== 1 ? "s" : ""}
              </span>
            `
                : ""
            }
          </div>
          
          <div class="flex flex-wrap gap-1">
            ${template.fields
              .slice(0, 3)
              .map(
                (field) => `
              <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                ${field.label || "Sin etiqueta"}
              </span>
            `
              )
              .join("")}
            ${
              template.fields.length > 3
                ? `
              <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                +${template.fields.length - 3} más
              </span>
            `
                : ""
            }
          </div>
        </div>
        
        <button class="use-template-btn w-full mt-4 bg-gray-100 hover:bg-blue-50 text-blue-600 font-medium py-2 px-4 rounded-lg transition flex items-center justify-center"
                data-template-id="${template.id}">
          <i class="fas fa-plus-circle mr-2"></i>
          Usar esta plantilla
        </button>
      </div>
    </div>
  `;
  }

  /**
   * Función de debug para event listeners
   */
  debugEventListeners() {
    console.group("🔍 DEBUG - Event Listeners");

    // Contar botones
    const editButtons = document.querySelectorAll(".edit-template");
    const deleteButtons = document.querySelectorAll(".delete-template");
    const useButtons = document.querySelectorAll(".use-template-btn");
    const cards = document.querySelectorAll(".template-card");

    console.log("📊 Botones encontrados:");
    console.log(`  ✏️  Editar: ${editButtons.length}`);
    console.log(`  🗑️  Eliminar: ${deleteButtons.length}`);
    console.log(`  🎯 Usar: ${useButtons.length}`);
    console.log(`  🃏 Tarjetas: ${cards.length}`);

    // Verificar data attributes
    editButtons.forEach((btn, i) => {
      const templateId = btn.dataset.templateId;
      console.log(`  Botón editar ${i + 1}:`, templateId || "SIN TEMPLATE ID");
    });

    // Verificar si los elementos tienen listeners
    console.log("🎧 Verificando event listeners...");

    // Esta es una función helper para ver listeners (puede no funcionar en todos los navegadores)
    const hasEventListener = (element, eventType) => {
      const events = getEventListeners ? getEventListeners(element) : null;
      return events && events[eventType] && events[eventType].length > 0;
    };

    if (typeof getEventListeners !== "undefined") {
      editButtons.forEach((btn, i) => {
        const hasClick = hasEventListener(btn, "click");
        console.log(`  Botón editar ${i + 1} tiene listener:`, hasClick);
      });
    } else {
      console.log("ℹ️  getEventListeners no disponible en este navegador");
    }

    console.groupEnd();
  }

  /**
   * Renderizar formulario de creación/edición
   */
  renderTemplateForm(template = null) {
    const isEditing = !!template;

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
          <!-- Información básica -->
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h4 class="font-semibold text-gray-800 mb-4">
              <i class="fas fa-info-circle mr-2 text-blue-500"></i>
              Información Básica
            </h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Plantilla *
                </label>
                <input
                  type="text"
                  id="templateName"
                  value="${template?.name || ""}"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Ej: Datos Médicos, Credenciales, etc."
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  id="templateDescription"
                  value="${template?.description || ""}"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Breve descripción de la plantilla"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Icono
                </label>
                <div class="flex items-center space-x-2">
                  <input
                    type="text"
                    id="templateIcon"
                    value="${template?.icon || "📋"}"
                    class="w-16 text-center px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="📋"
                  />
                  <select id="iconPicker" class="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                    <option value="📋">📋 Plantilla</option>
                    <option value="👤">👤 Personal</option>
                    <option value="🔐">🔐 Accesos</option>
                    <option value="💰">💰 Financiero</option>
                    <option value="🏥">🏥 Salud</option>
                    <option value="🏠">🏠 Hogar</option>
                    <option value="🚗">🚗 Vehículo</option>
                    <option value="💼">💼 Trabajo</option>
                    <option value="🎓">🎓 Educación</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  id="templateColor"
                  value="${template?.color || "#3B82F6"}"
                  class="w-full h-10 px-1 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          <!-- Campos de la plantilla -->
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
              ${
                template?.fields
                  ? template.fields
                      .map((field, index) => this.renderFieldForm(field, index))
                      .join("")
                  : ""
              }
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

          <!-- Configuración -->
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h4 class="font-semibold text-gray-800 mb-4">
              <i class="fas fa-cogs mr-2 text-purple-500"></i>
              Configuración
            </h4>
            
            <div class="space-y-4">
              <div class="flex items-center">
                <input
                  type="checkbox"
                  id="allowDuplicates"
                  ${template?.settings?.allowDuplicates ? "checked" : ""}
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label for="allowDuplicates" class="ml-2 text-gray-700">
                  Permitir múltiples entradas con esta plantilla
                </label>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Límite de entradas (0 = ilimitado)
                </label>
                <input
                  type="number"
                  id="maxEntries"
                  value="${template?.settings?.maxEntries || 0}"
                  min="0"
                  class="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select id="templateCategory" class="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                  <option value="custom" ${
                    template?.settings?.category === "custom" ? "selected" : ""
                  }>Personalizado</option>
                  <option value="personal" ${
                    template?.settings?.category === "personal"
                      ? "selected"
                      : ""
                  }>Personal</option>
                  <option value="access" ${
                    template?.settings?.category === "access" ? "selected" : ""
                  }>Accesos</option>
                  <option value="financial" ${
                    template?.settings?.category === "financial"
                      ? "selected"
                      : ""
                  }>Financiero</option>
                  <option value="health" ${
                    template?.settings?.category === "health" ? "selected" : ""
                  }>Salud</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Botones de acción -->
          <div class="flex justify-between pt-4 border-t border-gray-200">
            <button type="button" id="cancelTemplate" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-lg transition">
              Cancelar
            </button>
            <div class="space-x-3">
              <button type="button" id="previewTemplate" class="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition">
                <i class="fas fa-eye mr-2"></i>
                Vista Previa
              </button>
              <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition">
                <i class="fas fa-save mr-2"></i>
                ${isEditing ? "Actualizar Plantilla" : "Crear Plantilla"}
              </button>
            </div>
          </div>
        </form>
      </div>
    `;
  }

  /**
   * Renderizar formulario de campo
   */
  renderFieldForm(field = null, index = 0) {
    const fieldId = field?.id || `campo_${Date.now()}_${index}`;

    return `
    <div class="field-item border border-gray-200 rounded-lg p-4" data-field-id="${fieldId}">
      <div class="flex justify-between items-start mb-4">
        <h5 class="font-medium text-gray-800">
          <i class="fas fa-columns mr-2"></i>
          Campo ${index + 1}
          ${
            field?.id
              ? `<span class="text-xs font-normal text-gray-500 ml-2">(ID: ${field.id})</span>`
              : ""
          }
        </h5>
        <button type="button" class="remove-field text-red-600 hover:text-red-800">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Etiqueta (solo esto ve el usuario) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Campo *
            <span class="text-xs text-gray-500">(como aparecerá en el formulario)</span>
          </label>
          <input
            type="text"
            class="field-label w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
            value="${field?.label || ""}"
            placeholder="Ej: Nombre Completo, Teléfono, etc."
            required
          />
          <p class="text-xs text-gray-500 mt-1">Los usuarios verán este nombre</p>
        </div>
        
        <!-- Tipo -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Dato *
          </label>
          <select class="field-type w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm">
            <option value="string" ${
              field?.type === "string" ? "selected" : ""
            }>Texto corto</option>
            <option value="text" ${
              field?.type === "text" ? "selected" : ""
            }>Texto largo</option>
            <option value="number" ${
              field?.type === "number" ? "selected" : ""
            }>Número</option>
            <option value="boolean" ${
              field?.type === "boolean" ? "selected" : ""
            }>Sí/No</option>
            <option value="date" ${
              field?.type === "date" ? "selected" : ""
            }>Fecha</option>
            <option value="url" ${
              field?.type === "url" ? "selected" : ""
            }>URL</option>
            <option value="email" ${
              field?.type === "email" ? "selected" : ""
            }>Email</option>
          </select>
        </div>
        
        <!-- Orden -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Orden
          </label>
          <input
            type="number"
            class="field-order w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
            value="${field?.order || index + 1}"
            min="1"
          />
        </div>
      </div>
      
      <!-- Configuraciones adicionales -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <!-- Placeholder -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Texto de ayuda
          </label>
          <input
            type="text"
            class="field-placeholder w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
            value="${field?.placeholder || ""}"
            placeholder="Texto que aparecerá en el campo vacío"
          />
        </div>
        
        <!-- Opciones -->
        <div class="space-y-2">
          <div class="flex items-center">
            <input
              type="checkbox"
              class="field-required h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              ${field?.required ? "checked" : ""}
            />
            <label class="ml-2 text-sm text-gray-700">Campo obligatorio</label>
          </div>
          
          <div class="flex items-center">
            <input
              type="checkbox"
              class="field-sensitive h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              ${field?.sensitive ? "checked" : ""}
            />
            <label class="ml-2 text-sm text-gray-700">Información sensible</label>
          </div>
        </div>
        
        <!-- Nivel de cifrado (si es sensible) -->
        <div id="encryptionLevelContainer" class="${
          field?.sensitive ? "" : "hidden"
        }">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Nivel de cifrado
          </label>
          <select class="field-encryption-level w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm">
            <option value="medium" ${
              field?.encryptionLevel === "medium" ? "selected" : ""
            }>Medio</option>
            <option value="high" ${
              field?.encryptionLevel === "high" ? "selected" : ""
            }>Alto</option>
          </select>
        </div>
      </div>
    </div>
  `;
  }

  /**
   * Cargar y mostrar plantillas
   */
  async loadTemplates() {
    try {
      const content = document.getElementById("templateContent");
      if (!content) return;

      content.innerHTML = this.renderLoading();

      // Verificar estado de sincronización
      const syncStatus = await templateService.checkSyncStatus();
      console.log("📡 Estado de sincronización:", syncStatus);

      if (syncStatus.needsSync && syncStatus.cloudCount > 0) {
        // Mostrar notificación de sincronización disponible
        this.showMessage(
          `Hay ${syncStatus.cloudCount} plantillas en la nube. <button class="underline font-medium" id="quickSync">Sincronizar ahora</button>`,
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

      // Obtener plantillas y categorías
      const templates = await templateService.getUserTemplates();
      const categories = await templateService.getCategories();

      // Renderizar lista
      content.innerHTML = this.renderTemplateList(templates, categories);

      // Configurar event listeners (delegación)
      this.setupTemplateListListeners();

      // También agregar listeners directos
      setTimeout(() => {
        this.addDirectEventListeners();
      }, 100); // Pequeño delay para asegurar que el DOM esté listo

      // Actualizar contador de plantillas personalizadas
      const customTemplates = templates.filter(
        (t) => !t.settings?.isSystemTemplate
      );
      const countElement = document.getElementById("customTemplatesCount");
      const listElement = document.getElementById("customTemplatesList");
      const noTemplatesElement = document.getElementById("noCustomTemplates");

      if (countElement) {
        countElement.textContent = `${customTemplates.length} plantilla${
          customTemplates.length !== 1 ? "s" : ""
        }`;
      }

      if (listElement && noTemplatesElement) {
        if (customTemplates.length > 0) {
          listElement.innerHTML = customTemplates
            .map((t) => this.renderTemplateCard(t))
            .join("");
          noTemplatesElement.classList.add("hidden");
        } else {
          listElement.innerHTML = "";
          noTemplatesElement.classList.remove("hidden");
        }
      }
    } catch (error) {
      console.error("Error al cargar plantillas:", error);
      this.showError("Error al cargar plantillas: " + error.message);
    }
  }

  /**
   * Configurar event listeners para lista de plantillas
   */
  setupTemplateListListeners() {
    // Botón nueva plantilla
    const newTemplateBtn = document.getElementById("btnNewTemplate");
    if (newTemplateBtn) {
      newTemplateBtn.addEventListener("click", () => {
        this.showTemplateForm();
      });
    }

    // Filtros por categoría
    document.querySelectorAll(".category-filter").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const category = e.currentTarget.dataset.category;
        this.filterTemplatesByCategory(category);
      });
    });

    // USAR DELEGACIÓN DE EVENTOS para elementos dinámicos

    // Contenedor principal para delegación
    const templateContent = document.getElementById("templateContent");
    if (!templateContent) return;

    // Delegar evento de clic en "Usar plantilla"
    templateContent.addEventListener("click", (e) => {
      // Botón "Usar esta plantilla"
      if (e.target.closest(".use-template-btn")) {
        const templateCard = e.target.closest(".template-card");
        const templateId = templateCard?.dataset.templateId;
        if (templateId && this.onTemplateSelect) {
          this.onTemplateSelect(templateId);
        }
        e.stopPropagation();
      }

      // Botón de editar
      if (e.target.closest(".edit-template")) {
        const templateId =
          e.target.closest(".edit-template").dataset.templateId;
        if (templateId) {
          this.editTemplate(templateId);
        }
        e.stopPropagation();
      }

      // Botón de eliminar
      if (e.target.closest(".delete-template")) {
        const templateId =
          e.target.closest(".delete-template").dataset.templateId;
        if (templateId) {
          this.deleteTemplate(templateId);
        }
        e.stopPropagation();
      }

      // Clic en tarjeta completa (para vista previa)
      if (
        e.target.closest(".template-card") &&
        !e.target.closest("button") &&
        !e.target.closest("a")
      ) {
        const templateCard = e.target.closest(".template-card");
        const templateId = templateCard?.dataset.templateId;
        if (templateId) {
          this.showTemplatePreview(templateId);
        }
      }
      // En setupTemplateListListeners, agregar:
      document.getElementById("debugEvents")?.addEventListener("click", () => {
        this.debugEventListeners();
      });
      document
        .getElementById("syncTemplates")
        ?.addEventListener("click", async () => {
          const result = await templateService.syncTemplates();
          if (result.synced) {
            this.showSuccess(result.message);
            // Recargar la lista
            setTimeout(() => this.loadTemplates(), 1000);
          } else {
            this.showError(
              "Error de sincronización: " + (result.error || "Desconocido")
            );
          }
        });
    });

    // También agregar listeners directos como respaldo
    this.addDirectEventListeners();
  }

  /**
   * Agregar event listeners directos como respaldo
   */
  addDirectEventListeners() {
    // Botones de edición
    document.querySelectorAll(".edit-template").forEach((btn) => {
      btn.removeEventListener("click", this.handleEditClick);
      btn.addEventListener("click", this.handleEditClick.bind(this));
    });

    // Botones de eliminación
    document.querySelectorAll(".delete-template").forEach((btn) => {
      btn.removeEventListener("click", this.handleDeleteClick);
      btn.addEventListener("click", this.handleDeleteClick.bind(this));
    });

    // Botones de usar plantilla
    document.querySelectorAll(".use-template-btn").forEach((btn) => {
      btn.removeEventListener("click", this.handleUseTemplateClick);
      btn.addEventListener("click", this.handleUseTemplateClick.bind(this));
    });

    // Tarjetas de plantilla
    document.querySelectorAll(".template-card").forEach((card) => {
      card.removeEventListener("click", this.handleCardClick);
      card.addEventListener("click", this.handleCardClick.bind(this));
    });
  }

  /**
   * Manejador para editar plantilla
   */
  handleEditClick(event) {
    event.stopPropagation();
    const templateId = event.currentTarget.dataset.templateId;
    console.log("📝 Editando plantilla:", templateId);
    if (templateId) {
      this.editTemplate(templateId);
    }
  }

  /**
   * Manejador para eliminar plantilla
   */
  handleDeleteClick(event) {
    event.stopPropagation();
    const templateId = event.currentTarget.dataset.templateId;
    console.log("🗑️  Eliminando plantilla:", templateId);
    if (templateId) {
      this.deleteTemplate(templateId);
    }
  }

  /**
   * Manejador para usar plantilla
   */
  handleUseTemplateClick(event) {
    event.stopPropagation();
    const templateCard = event.target.closest(".template-card");
    const templateId = templateCard?.dataset.templateId;
    console.log("🎯 Usando plantilla:", templateId);
    if (templateId && this.onTemplateSelect) {
      this.onTemplateSelect(templateId);
    }
  }

  /**
   * Manejador para clic en tarjeta
   */
  handleCardClick(event) {
    // Solo procesar si no se hizo clic en un botón
    if (!event.target.closest("button") && !event.target.closest("a")) {
      const templateId = event.currentTarget.dataset.templateId;
      console.log("👁️  Vista previa de plantilla:", templateId);
      if (templateId) {
        this.showTemplatePreview(templateId);
      }
    }
  }

  /**
   * Función de debug para plantillas
   */
  async debugTemplates() {
    try {
      const templates = await templateService.getUserTemplates();
      const systemCount = templates.filter(
        (t) => t.settings?.isSystemTemplate
      ).length;
      const personalCount = templates.filter(
        (t) => !t.settings?.isSystemTemplate
      ).length;

      console.group("🔍 DEBUG - Plantillas");
      console.log("📊 Totales:", templates.length);
      console.log("🏢 Sistema:", systemCount);
      console.log("👤 Personales:", personalCount);
      console.log("📋 Lista completa:", templates);

      // Verificar localStorage
      if (templateService.userId) {
        const storageKey = `user_templates_${templateService.userId}`;
        const stored = localStorage.getItem(storageKey);
        console.log(
          "💾 En localStorage:",
          stored ? JSON.parse(stored) : "Nada"
        );
      }

      console.groupEnd();

      alert(
        `Plantillas: ${templates.length} totales\nSistema: ${systemCount}\nPersonales: ${personalCount}\nRevisa la consola para más detalles.`
      );
    } catch (error) {
      console.error("Error en debug:", error);
    }
  }

  /**
   * Mostrar formulario de plantilla
   */
  async showTemplateForm(templateId = null) {
    try {
      const content = document.getElementById("templateContent");
      if (!content) return;

      if (templateId) {
        // Cargar plantilla existente para editar
        const template = await templateService.getTemplateById(templateId);
        this.editingTemplate = template;
        this.tempFormData = null; // Limpiar datos temporales
        content.innerHTML = this.renderTemplateForm(template);
      } else if (this.tempFormData) {
        // Recuperar datos temporales del preview
        content.innerHTML = this.renderTemplateForm(this.tempFormData);
      } else {
        // Nueva plantilla
        this.editingTemplate = null;
        this.tempFormData = null;
        content.innerHTML = this.renderTemplateForm();
      }

      this.setupTemplateFormListeners();
    } catch (error) {
      console.error("Error al cargar formulario:", error);
      this.showError("Error: " + error.message);
    }
  }

  /**
   * Configurar event listeners para formulario
   */
  setupTemplateFormListeners() {
    // Selector de iconos
    const iconPicker = document.getElementById("iconPicker");
    const iconInput = document.getElementById("templateIcon");

    if (iconPicker && iconInput) {
      iconPicker.addEventListener("change", (e) => {
        iconInput.value = e.target.value;
      });

      iconInput.addEventListener("input", (e) => {
        // Buscar el icono en el select
        const option = Array.from(iconPicker.options).find(
          (opt) => opt.value === e.target.value
        );
        if (option) {
          iconPicker.value = e.target.value;
        }
      });
    }

    // Agregar campo
    document.getElementById("addFieldBtn")?.addEventListener("click", () => {
      this.addField();
    });

    // Eliminar campo
    document.querySelectorAll(".remove-field").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const fieldItem = e.target.closest(".field-item");
        if (fieldItem) {
          fieldItem.remove();
          this.updateNoFieldsMessage();
        }
      });
    });

    // Sensitive field toggle
    document.querySelectorAll(".field-sensitive").forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        const fieldItem = e.target.closest(".field-item");
        const encryptionContainer = fieldItem.querySelector(
          "#encryptionLevelContainer"
        );
        if (encryptionContainer) {
          encryptionContainer.classList.toggle("hidden", !e.target.checked);
        }
      });
    });

    // Cancelar
    document.getElementById("cancelTemplate")?.addEventListener("click", () => {
      this.loadTemplates();
    });

    // Vista previa
    document
      .getElementById("previewTemplate")
      ?.addEventListener("click", () => {
        this.previewTemplate();
      });

    // Enviar formulario
    document.getElementById("templateForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveTemplate();
    });

    // Agregar validación en tiempo real
    this.setupFieldValidation();
  }

  /**
   * Agregar nuevo campo
   */
  addField() {
    const container = document.getElementById("fieldsContainer");
    const noFieldsMessage = document.getElementById("noFieldsMessage");

    if (container && noFieldsMessage) {
      const fieldCount = container.querySelectorAll(".field-item").length;

      const newFieldHtml = this.renderFieldForm(null, fieldCount);

      container.insertAdjacentHTML("beforeend", newFieldHtml);
      noFieldsMessage.classList.add("hidden");

      // Configurar event listeners para el nuevo campo
      const newField = container.lastElementChild;
      newField.querySelector(".remove-field").addEventListener("click", (e) => {
        e.target.closest(".field-item").remove();
        this.updateNoFieldsMessage();
      });

      newField
        .querySelector(".field-sensitive")
        .addEventListener("change", (e) => {
          const encryptionContainer = newField.querySelector(
            "#encryptionLevelContainer"
          );
          if (encryptionContainer) {
            encryptionContainer.classList.toggle("hidden", !e.target.checked);
          }
        });

      // Auto-completar placeholder según tipo
      const typeSelect = newField.querySelector(".field-type");
      const placeholderInput = newField.querySelector(".field-placeholder");

      if (typeSelect && placeholderInput) {
        typeSelect.addEventListener("change", (e) => {
          if (!placeholderInput.value) {
            const placeholders = {
              string: "Ingresa el texto",
              text: "Escribe aquí...",
              number: "Ingresa el número",
              boolean: "",
              date: "Selecciona la fecha",
              url: "https://ejemplo.com",
              email: "usuario@ejemplo.com",
            };
            placeholderInput.value = placeholders[e.target.value] || "";
          }
        });
      }
    }
  }

  /**
   * Actualizar mensaje de "sin campos"
   */
  updateNoFieldsMessage() {
    const container = document.getElementById("fieldsContainer");
    const noFieldsMessage = document.getElementById("noFieldsMessage");

    if (container && noFieldsMessage) {
      const fieldCount = container.querySelectorAll(".field-item").length;
      if (fieldCount === 0) {
        noFieldsMessage.classList.remove("hidden");
      }
    }
  }

  /**
   * Guardar plantilla
   */
  async saveTemplate() {
    try {
      // Deshabilitar botón para evitar doble envío
      const submitBtn = document.querySelector(
        '#templateForm button[type="submit"]'
      );
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML =
          '<i class="fas fa-spinner fa-spin mr-2"></i> Guardando...';
      }

      // Recopilar datos del formulario
      const templateData = this.collectFormData();

      // Validar datos básicos primero
      try {
        templateService.validateTemplateData(templateData);
      } catch (validationError) {
        this.showError("Error de validación: " + validationError.message);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML =
            '<i class="fas fa-save mr-2"></i> ' +
            (this.editingTemplate ? "Actualizar Plantilla" : "Crear Plantilla");
        }
        return;
      }

      // Guardar
      let savedTemplate;
      if (this.editingTemplate) {
        // Para edición, usar el ID existente
        templateData.id = this.editingTemplate.id;
        savedTemplate = await templateService.updateTemplate(
          this.editingTemplate.id,
          templateData
        );
      } else {
        // Para creación, el servicio generará el ID
        savedTemplate = await templateService.createTemplate(templateData);
      }

      // Limpiar datos temporales después de guardar
      this.tempFormData = null;
      this.editingTemplate = null;

      // Mostrar éxito
      this.showSuccess(
        this.editingTemplate
          ? "✅ Plantilla actualizada correctamente"
          : "✅ Plantilla creada correctamente"
      );

      // Volver a la lista después de un breve delay
      setTimeout(() => {
        this.loadTemplates();
      }, 1500);
    } catch (error) {
      console.error("Error al guardar plantilla:", error);

      // Mostrar error específico
      let errorMessage = "Error al guardar: " + error.message;

      if (error.message.includes("Campo inválido")) {
        errorMessage = "Error en los campos: " + error.message;
      } else if (error.message.includes("JavaScript válido")) {
        errorMessage =
          "Error en el nombre del campo. Debe comenzar con letra y no contener espacios.";
      }

      this.showError(errorMessage);

      // Rehabilitar botón
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

  /**
   * Guardar plantilla
   */
  async saveTemplate() {
    try {
      // Deshabilitar botón para evitar doble envío
      const submitBtn = document.querySelector(
        '#templateForm button[type="submit"]'
      );
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML =
          '<i class="fas fa-spinner fa-spin mr-2"></i> Guardando...';
      }

      // Recopilar datos del formulario
      const templateData = this.collectFormData();

      // Validar datos básicos primero (sin id)
      try {
        templateService.validateTemplateData(templateData);
      } catch (validationError) {
        this.showError("Error de validación: " + validationError.message);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML =
            '<i class="fas fa-save mr-2"></i> ' +
            (this.editingTemplate ? "Actualizar Plantilla" : "Crear Plantilla");
        }
        return;
      }

      // Guardar
      let savedTemplate;
      if (this.editingTemplate) {
        // Para edición, usar el ID existente
        templateData.id = this.editingTemplate.id;
        savedTemplate = await templateService.updateTemplate(
          this.editingTemplate.id,
          templateData
        );
      } else {
        // Para creación, el servicio generará el ID
        savedTemplate = await templateService.createTemplate(templateData);
      }

      // Mostrar éxito
      this.showSuccess(
        this.editingTemplate
          ? "✅ Plantilla actualizada correctamente"
          : "✅ Plantilla creada correctamente"
      );

      // Volver a la lista después de un breve delay
      setTimeout(() => {
        this.loadTemplates();
      }, 1500);
    } catch (error) {
      console.error("Error al guardar plantilla:", error);

      // Mostrar error específico
      let errorMessage = "Error al guardar: " + error.message;

      if (error.message.includes("Campo inválido")) {
        errorMessage = "Error en los campos: " + error.message;
      } else if (error.message.includes("JavaScript válido")) {
        errorMessage =
          "Nombre de campo inválido. Debe comenzar con letra y no contener espacios.";
      }

      this.showError(errorMessage);

      // Rehabilitar botón
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

  /**
   * Recopilar datos del formulario
   */
  collectFormData() {
    try {
      const name = document.getElementById("templateName")?.value || "";
      const description =
        document.getElementById("templateDescription")?.value || "";
      const icon = document.getElementById("templateIcon")?.value || "📋";
      const color =
        document.getElementById("templateColor")?.value || "#3B82F6";
      const allowDuplicates =
        document.getElementById("allowDuplicates")?.checked || false;
      const maxEntries =
        parseInt(document.getElementById("maxEntries")?.value) || 0;
      const category =
        document.getElementById("templateCategory")?.value || "custom";

      // Validar nombre de plantilla
      if (!name.trim()) {
        throw new Error("El nombre de la plantilla es requerido");
      }

      // Recopilar campos
      const fields = [];
      const fieldElements = document.querySelectorAll(".field-item");

      if (fieldElements.length === 0) {
        throw new Error("La plantilla debe tener al menos un campo");
      }

      fieldElements.forEach((fieldItem, index) => {
        const label = fieldItem.querySelector(".field-label")?.value || "";
        const type = fieldItem.querySelector(".field-type")?.value || "string";

        // Validar campo básico
        if (!label.trim()) {
          throw new Error(
            `Campo ${index + 1}: El nombre del campo es requerido`
          );
        }

        if (!type) {
          throw new Error(`Campo ${index + 1}: El tipo de dato es requerido`);
        }

        // Generar ID automático basado en la etiqueta
        const fieldId = this.generateFieldIdFromLabel(label, index);

        const field = {
          id: fieldId,
          label: label.trim(),
          type: type,
          order:
            parseInt(fieldItem.querySelector(".field-order")?.value) ||
            index + 1,
          placeholder:
            fieldItem.querySelector(".field-placeholder")?.value || "",
          required:
            fieldItem.querySelector(".field-required")?.checked || false,
          sensitive:
            fieldItem.querySelector(".field-sensitive")?.checked || false,
          encryptionLevel: fieldItem.querySelector(".field-sensitive")?.checked
            ? fieldItem.querySelector(".field-encryption-level")?.value ||
              "medium"
            : undefined,
        };

        fields.push(field);
      });

      // Ordenar campos por orden
      fields.sort((a, b) => a.order - b.order);

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
    } catch (error) {
      console.error("Error al recopilar datos:", error);
      throw error;
    }
  }

  /**
   * Generar ID de campo a partir de la etiqueta
   */
  generateFieldIdFromLabel(label, index) {
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
   * Mostrar vista previa de plantilla
   */
  async previewTemplate() {
    try {
      // Guardar datos del formulario temporalmente antes de ir al preview
      this.tempFormData = this.collectFormData();
      this.showTemplatePreviewData(this.tempFormData);
    } catch (error) {
      this.showError("Error en vista previa: " + error.message);
    }
  }

  /**
   * Mostrar vista previa de datos de plantilla
   */
  showTemplatePreviewData(templateData) {
    const content = document.getElementById("templateContent");
    if (!content) return;

    content.innerHTML = `
    <div class="max-w-4xl mx-auto">
      <div class="mb-6">
        <h3 class="text-xl font-bold text-gray-800">
          <i class="fas fa-eye mr-2"></i>
          Vista Previa de Plantilla
        </h3>
        <p class="text-gray-600 mt-1">
          Así se verá tu plantilla y formulario
        </p>
      </div>
      
      <div class="space-y-6">
        <!-- Información de la plantilla -->
        <div class="bg-white border border-gray-200 rounded-lg p-6">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center text-xl mr-4" style="background-color: ${
              templateData.color
            }20; color: ${templateData.color}">
              ${templateData.icon}
            </div>
            <div>
              <h4 class="font-bold text-gray-800 text-lg">${
                templateData.name
              }</h4>
              <p class="text-gray-600">${
                templateData.description || "Sin descripción"
              }</p>
            </div>
          </div>
        </div>
        
        <!-- Vista previa del formulario -->
        <div class="bg-white border border-gray-200 rounded-lg p-6">
          <h4 class="font-semibold text-gray-800 mb-4">
            <i class="fas fa-window-restore mr-2"></i>
            Vista previa del formulario
          </h4>
          
          <div class="space-y-4">
            ${templateData.fields
              .map(
                (field) => `
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      ${field.label} ${
                  field.required ? '<span class="text-red-500">*</span>' : ""
                }
                      ${
                        field.sensitive
                          ? '<i class="fas fa-lock text-red-500 ml-2 text-xs"></i>'
                          : ""
                      }
                    </label>
                    <p class="text-xs text-gray-500">
                      ${this.getFieldTypeLabel(field.type)} • ${
                  field.sensitive
                    ? "Cifrado: " + (field.encryptionLevel || "medio")
                    : "No sensible"
                }
                    </p>
                  </div>
                </div>
                
                <div class="mt-2">
                  ${this.renderFieldPreview(field)}
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        
        <!-- Botones -->
        <div class="flex justify-between pt-4 border-t border-gray-200">
          <button id="backToForm" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-lg transition">
            <i class="fas fa-arrow-left mr-2"></i>
            Volver al editor
          </button>
          <button id="saveFromPreview" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition">
            <i class="fas fa-save mr-2"></i>
            Guardar Plantilla
          </button>
        </div>
      </div>
    </div>
  `;

    // Configurar listeners
    document.getElementById("backToForm")?.addEventListener("click", () => {
      // Si hay datos temporales, volver al formulario con ellos
      if (this.tempFormData) {
        this.showTemplateForm(); // Esto ahora usará tempFormData automáticamente
      } else if (this.editingTemplate) {
        this.showTemplateForm(this.editingTemplate.id);
      } else {
        this.showTemplateForm();
      }
    });

    document
      .getElementById("saveFromPreview")
      ?.addEventListener("click", () => {
        document.getElementById("templateForm")?.requestSubmit();
      });
  }

  /**
   * Obtener etiqueta para tipo de campo
   */
  getFieldTypeLabel(type) {
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
  }

  /**
   * Renderizar vista previa de campo
   */
  renderFieldPreview(field) {
    const id = field.id || "campo";
    const isRequired = field.required
      ? '<span class="text-red-500 ml-1">*</span>'
      : "";
    const isSensitive = field.sensitive
      ? '<i class="fas fa-lock text-red-500 ml-2 text-xs"></i>'
      : "";

    const baseInput = `
    <input
      type="text"
      id="preview_${id}"
      placeholder="${field.placeholder || "Ingresa el valor"}"
      class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
      disabled
    />
  `;

    const textarea = `
    <textarea
      id="preview_${id}"
      placeholder="${field.placeholder || "Texto largo..."}"
      class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
      rows="3"
      disabled
    ></textarea>
  `;

    const numberInput = `
    <input
      type="number"
      id="preview_${id}"
      placeholder="123"
      class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
      disabled
    />
  `;

    const checkbox = `
    <div class="flex items-center">
      <input
        type="checkbox"
        id="preview_${id}"
        class="h-4 w-4 text-blue-600 border-gray-300 rounded bg-gray-100"
        disabled
      />
      <label for="preview_${id}" class="ml-2 text-gray-500">Seleccionar</label>
    </div>
  `;

    const dateInput = `
    <input
      type="date"
      id="preview_${id}"
      class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
      disabled
    />
  `;

    const urlInput = `
    <input
      type="url"
      id="preview_${id}"
      placeholder="${field.placeholder || "https://ejemplo.com"}"
      class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
      disabled
    />
  `;

    const emailInput = `
    <input
      type="email"
      id="preview_${id}"
      placeholder="${field.placeholder || "usuario@ejemplo.com"}"
      class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
      disabled
    />
  `;

    // Seleccionar input basado en el tipo
    let inputHtml = baseInput;
    switch (field.type) {
      case "text":
        inputHtml = textarea;
        break;
      case "number":
        inputHtml = numberInput;
        break;
      case "boolean":
        inputHtml = checkbox;
        break;
      case "date":
        inputHtml = dateInput;
        break;
      case "url":
        inputHtml = urlInput;
        break;
      case "email":
        inputHtml = emailInput;
        break;
      default:
        inputHtml = baseInput;
    }

    // Información adicional del campo
    const fieldTypeLabel = this.getFieldTypeLabel(field.type);
    const sensitiveInfo = field.sensitive
      ? `<span class="text-red-600 text-xs ml-2"><i class="fas fa-lock mr-1"></i>Cifrado: ${
          field.encryptionLevel || "medio"
        }</span>`
      : "";

    return `
    <div class="mb-4">
      <div class="flex justify-between items-start mb-2">
        <div class="flex-1">
          <label for="preview_${id}" class="block text-sm font-medium text-gray-700">
            ${field.label}${isRequired} ${isSensitive}
          </label>
          <div class="flex items-center mt-1">
            <span class="text-xs text-gray-500">${fieldTypeLabel}</span>
            ${sensitiveInfo}
          </div>
        </div>
        ${
          field.placeholder
            ? `
          <div class="text-xs text-gray-400 ml-4">
            <i class="fas fa-info-circle mr-1"></i>
            "${field.placeholder}"
          </div>
        `
            : ""
        }
      </div>
      
      ${inputHtml}
      
      ${
        field.required
          ? `
        <div class="mt-1 text-xs text-gray-500">
          <i class="fas fa-asterisk text-red-400 mr-1"></i>
          Este campo es obligatorio
        </div>
      `
          : ""
      }
    </div>
  `;
  }

  /**
   * Mostrar vista previa de plantilla existente
   */
  async showTemplatePreview(templateId) {
    try {
      const template = await templateService.getTemplateById(templateId);
      if (!template) {
        throw new Error("Plantilla no encontrada");
      }

      this.showTemplatePreviewData(template);
    } catch (error) {
      console.error("Error al mostrar vista previa:", error);
      this.showError("Error: " + error.message);
    }
  }

  /**
   * Editar plantilla
   */
  async editTemplate(templateId) {
    await this.showTemplateForm(templateId);
  }

  /**
   * Eliminar plantilla
   */
  async deleteTemplate(templateId) {
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar esta plantilla? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      await templateService.deleteTemplate(templateId);
      this.showSuccess("✅ Plantilla eliminada correctamente");
      this.loadTemplates();
    } catch (error) {
      console.error("Error al eliminar plantilla:", error);
      this.showError("Error: " + error.message);
    }
  }

  /**
   * Filtrar plantillas por categoría
   */
  async filterTemplatesByCategory(category) {
    try {
      const allTemplates = await templateService.getUserTemplates();
      const filtered =
        category === "all"
          ? allTemplates
          : allTemplates.filter((t) => t.settings.category === category);

      // Aquí implementarías la actualización de la vista
      console.log(
        `Filtrando por categoría: ${category}, ${filtered.length} resultados`
      );

      // Por ahora, solo mostrar mensaje
      this.showMessage(
        `Mostrando ${filtered.length} plantilla${
          filtered.length !== 1 ? "s" : ""
        } en categoría: ${templateService.getCategoryName(category)}`
      );
    } catch (error) {
      console.error("Error al filtrar plantillas:", error);
    }
  }

  /**
   * Mostrar mensaje
   */
  showMessage(message, type = "info", duration = 3000) {
    // Crear toast
    const toast = document.createElement("div");
    toast.className = `fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg animate-fade-in ${
      type === "success"
        ? "bg-green-500"
        : type === "error"
        ? "bg-red-500"
        : type === "warning"
        ? "bg-yellow-500"
        : "bg-blue-500"
    } text-white`;

    toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${
          type === "success"
            ? "fa-check-circle"
            : type === "error"
            ? "fa-exclamation-circle"
            : type === "warning"
            ? "fa-exclamation-triangle"
            : "fa-info-circle"
        } mr-3"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Auto-eliminar
    setTimeout(() => {
      toast.classList.add("animate-fade-out");
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * Mostrar éxito
   */
  showSuccess(message) {
    this.showMessage(message, "success");
  }

  /**
   * Mostrar error
   */
  showError(message) {
    this.showMessage(message, "error", 5000);
  }

  /**
   * Configurar validación en tiempo real para campos
   */
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

  /**
   * Validar nombre del campo
   */
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

  /**
   * Mostrar error en campo específico
   */
  showFieldError(input, message) {
    this.clearFieldError(input);

    input.classList.add("border-red-500", "bg-red-50");

    const errorDiv = document.createElement("div");
    errorDiv.className = "text-red-600 text-xs mt-1";
    errorDiv.textContent = message;
    errorDiv.id = `error-${input.id || input.name}`;

    input.parentNode.appendChild(errorDiv);
  }

  /**
   * Limpiar error de campo
   */
  clearFieldError(input) {
    input.classList.remove("border-red-500", "bg-red-50");

    const errorId = `error-${input.id || input.name}`;
    const errorDiv = input.parentNode.querySelector(`#${errorId}`);
    if (errorDiv) {
      errorDiv.remove();
    }
  }
}
