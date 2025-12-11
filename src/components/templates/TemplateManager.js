// src/components/TemplateManager.js

import { templateService } from "../../services/templates/index.js";
import { TemplateList } from "./TemplateList.js";
import { TemplateForm } from "./TemplateForm.js";

export class TemplateManager {
  constructor(onTemplateSelect) {
    this.onTemplateSelect = onTemplateSelect;
    this.currentView = "list";
    this.editingTemplateId = null;

    // Inicializamos la Lista
    this.listComponent = new TemplateList({
      onNew: () => this.setView("create"),
      onImport: (file) => this.handleImport(file),
      onSelect: (id) => this.onTemplateSelect(id),
      onEdit: (id) => this.setView("edit", id),
      onDelete: (id) => this.handleDelete(id),
      onExport: (id) => this.handleExport(id),
      onFilter: (cat) => this.loadTemplates(cat),
    });

    // Inicializamos el Formulario
    this.formComponent = new TemplateForm({
      onSave: (data) => this.handleSave(data),
      onCancel: () => this.setView("list"),
    });
  }

  render() {
    // Contenedor principal con animación
    return `<div id="templateContent" class="min-h-[500px] w-full animate-fade-in"></div>`;
  }

  async setView(view, id = null) {
    this.currentView = view;
    this.editingTemplateId = id;
    const container = document.getElementById("templateContent");
    if (!container) return;

    // Solo mostramos loading si cambiamos de vista drásticamente
    if (view === "list" && !container.querySelector(".template-card")) {
      this.renderLoading(container);
    }

    if (view === "list") {
      await this.loadTemplates();
    } else {
      let template = null;
      if (id) {
        // Pequeño loading local mientras carga la data de edición
        container.innerHTML = `<div class="flex justify-center p-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>`;
        template = await templateService.getTemplateById(id);
      }
      container.innerHTML = this.formComponent.render(template);
      this.formComponent.setupListeners(container);
    }
  }

  async loadTemplates(categoryFilter = "all") {
    const container = document.getElementById("templateContent");
    if (!container) return;

    // Si estamos volviendo de 'create', aseguramos loading
    if (this.currentView !== "list") this.renderLoading(container);

    try {
      const templates = await templateService.getUserTemplates();

      // --- LÓGICA DE CONTADORES DINÁMICOS ---
      // Calculamos cuántas plantillas hay por categoría en tiempo real
      const stats = templates.reduce((acc, t) => {
        const cat = t.settings?.category || "custom";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});

      // Generamos el array de objetos { id, count } que necesita TemplateList.js
      // Orden: 'custom' primero, luego el resto
      const uniqueCats = Object.keys(stats).sort((a, b) => {
        if (a === "custom") return -1;
        if (b === "custom") return 1;
        return a.localeCompare(b);
      });

      const categories = uniqueCats.map((id) => ({
        id: id,
        count: stats[id],
      }));
      // ---------------------------------------

      let displayTemplates = templates;
      if (categoryFilter !== "all") {
        displayTemplates = templates.filter(
          (t) => (t.settings?.category || "custom") === categoryFilter
        );
      }

      container.innerHTML = this.listComponent.render(
        displayTemplates,
        categories,
        categoryFilter
      );
      this.listComponent.setupListeners(container);
    } catch (error) {
      console.error(error);
      this.renderError(container, error.message);
    }
  }

  renderLoading(container) {
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-96">
            <div class="relative">
                <div class="w-16 h-16 rounded-full border-4 border-indigo-50 border-t-primary animate-spin"></div>
                <div class="absolute inset-0 flex items-center justify-center">
                    <i class="fas fa-layer-group text-indigo-300 text-xs"></i>
                </div>
            </div>
            <p class="text-slate-500 font-medium mt-4 animate-pulse">Cargando catálogo...</p>
        </div>`;
  }

  renderError(container, message) {
    container.innerHTML = `
        <div class="max-w-md mx-auto mt-10 p-6 bg-red-50 border border-red-100 rounded-2xl text-center">
            <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-red-500">
                <i class="fas fa-wifi-slash"></i>
            </div>
            <h3 class="text-red-800 font-bold">Error de Conexión</h3>
            <p class="text-red-600 text-sm mt-1">${message}</p>
            <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-bold transition">Reintentar</button>
        </div>`;
  }

  // --- Handlers ---

  async handleSave(data) {
    try {
      if (this.currentView === "edit" && this.editingTemplateId) {
        await templateService.updateTemplate(this.editingTemplateId, data);
      } else {
        await templateService.createTemplate(data);
      }
      this.setView("list");
    } catch (e) {
      alert("Error: " + e.message);
    }
  }

  async handleDelete(id) {
    if (confirm("¿Estás seguro de eliminar esta plantilla?")) {
      try {
        await templateService.deleteTemplate(id);
        this.loadTemplates();
      } catch (e) {
        alert("Error: " + e.message);
      }
    }
  }

  async handleExport(id) {
    try {
      const data = await templateService.exportTemplate(id);
      const fileName = `${(data.name || "plantilla")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}.json`;

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      alert("Error exportando: " + e.message);
    }
  }

  async handleImport(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        await templateService.importTemplate(json);
        this.loadTemplates();
      } catch (err) {
        alert("El archivo no es válido.");
      }
    };
    reader.readAsText(file);
  }
}
