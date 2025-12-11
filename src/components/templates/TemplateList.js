// src/components/TemplateList.js
import { getCategoryName, getCategoryIcon } from "../../utils/helpers.js";

export class TemplateList {
  constructor(handlers) {
    this.handlers = handlers; // { onNew, onImport, onSelect, onEdit, onDelete, onExport }
  }

  render(templates, categories, currentCategory) {
    const customTemplates = templates.filter(
      (t) => !t.settings?.isSystemTemplate
    );

    // Renderizado de Filtros (Estilo Píldora Horizontal)
    const filtersHtml = categories
      .map((cat) => {
        const isActive = cat.id === currentCategory;
        const baseClass =
          "flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border cursor-pointer whitespace-nowrap";
        const activeClass = isActive
          ? "bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-200 scale-105"
          : "bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:bg-slate-50 hover:text-slate-800";

        return `
        <button class="${baseClass} ${activeClass} category-filter" data-category="${
          cat.id
        }">
            <span class="mr-2 text-lg">${getCategoryIcon(cat.id)}</span>
            ${getCategoryName(cat.id)}
            <span class="ml-2 ${
              isActive ? "bg-white/20" : "bg-slate-100 text-slate-500"
            } px-2 py-0.5 rounded-full text-xs transition-colors">
                ${cat.count}
            </span>
        </button>`;
      })
      .join("");

    // Botón "Todas"
    const allActive = currentCategory === "all";
    const allFilterHtml = `
        <button class="flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border cursor-pointer whitespace-nowrap category-filter ${
          allActive
            ? "bg-slate-800 text-white border-slate-800 shadow-lg"
            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
        }" data-category="all">
            <span class="mr-2 text-lg">💠</span> Todas
            <span class="ml-2 ${
              allActive ? "bg-white/20" : "bg-slate-100 text-slate-500"
            } px-2 py-0.5 rounded-full text-xs">${templates.length}</span>
        </button>
    `;

    // Renderizado de Lista Principal
    return `
      <div class="animate-fade-in space-y-8">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div class="flex items-center gap-4">
              <div class="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                <i class="fas fa-swatchbook text-2xl text-indigo-600"></i>
              </div>
              <div>
                <h2 class="text-2xl font-bold text-slate-800">Mis Plantillas</h2>
                <p class="text-slate-500 text-sm">Diseña las estructuras para tus datos.</p>
              </div>
            </div>
            
            <div class="flex gap-3 w-full md:w-auto">
              <input type="file" id="importTemplateInput" accept=".json" class="hidden" />
              <button id="btnImportTemplate" class="flex-1 md:flex-none px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 font-medium rounded-xl transition shadow-sm flex items-center justify-center gap-2">
                <i class="fas fa-file-import"></i> <span>Importar</span>
              </button>
              <button id="btnNewTemplate" class="flex-1 md:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
                <i class="fas fa-plus"></i> <span>Nueva Plantilla</span>
              </button>
            </div>
        </div>

        <div class="flex space-x-3 overflow-x-auto pb-4 no-scrollbar">
            ${allFilterHtml}
            ${filtersHtml}
        </div>

        <div id="customTemplatesList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${customTemplates.map((t) => this.renderCard(t)).join("")}
        </div>
        
        ${
          customTemplates.length === 0
            ? `
            <div class="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📭</div>
                <p class="text-slate-500 font-medium">No hay plantillas en esta categoría.</p>
                <button class="mt-4 text-indigo-600 font-medium text-sm hover:underline" onclick="document.querySelector('[data-category=all]').click()">
                    Ver todas las plantillas
                </button>
            </div>
        `
            : ""
        }
      </div>`;
  }

  renderCard(template) {
    const fieldCount = template.fields.length;
    // Fondo sutil del icono basado en el color de la plantilla
    const iconBgStyle = `background-color: ${template.color}15; color: ${template.color}`;

    return `
    <div class="template-card group relative bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden" 
         data-template-id="${template.id}">
      
      <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${
        template.color
      }"></div>

      <div class="flex justify-between items-start mb-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-slate-50" style="${iconBgStyle}">
                ${template.icon || "📋"}
            </div>
            <div>
                <h4 class="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">${
                  template.name
                }</h4>
                <div class="flex items-center text-xs text-slate-500 mt-1">
                    <span class="bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider font-semibold mr-2">${getCategoryName(
                      template.settings?.category
                    )}</span>
                </div>
            </div>
          </div>
          
          <div class="flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 absolute top-4 right-4 sm:relative sm:top-auto sm:right-auto bg-white sm:bg-transparent shadow-sm sm:shadow-none rounded-lg p-1 sm:p-0 border sm:border-0 border-slate-100">
              <button class="edit-template w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition" title="Editar Estructura">
                <i class="fas fa-pencil-alt"></i>
              </button>
              <button class="export-template w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition" title="Exportar JSON">
                <i class="fas fa-file-export"></i>
              </button>
              <button class="delete-template w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition" title="Eliminar">
                <i class="fas fa-trash-alt"></i>
              </button>
          </div>
      </div>
      
      <p class="text-sm text-slate-500 mb-6 line-clamp-2 h-10 leading-relaxed">
        ${template.description || "Sin descripción disponible."}
      </p>

      <div class="flex items-center justify-between pt-4 border-t border-slate-100">
        <div class="text-xs font-medium text-slate-400 flex items-center">
            <i class="fas fa-layer-group mr-1.5"></i> ${fieldCount} Campos
        </div>
        <button class="use-template-btn px-4 py-2 bg-slate-50 hover:bg-indigo-600 hover:text-white text-indigo-600 text-sm font-bold rounded-lg transition-colors">
            Usar Plantilla
        </button>
      </div>
    </div>`;
  }

  setupListeners(container) {
    // Listeners Globales
    container
      .querySelector("#btnNewTemplate")
      ?.addEventListener("click", this.handlers.onNew);
    const importInput = container.querySelector("#importTemplateInput");
    container
      .querySelector("#btnImportTemplate")
      ?.addEventListener("click", () => importInput.click());
    importInput?.addEventListener("change", (e) => {
      if (e.target.files.length) this.handlers.onImport(e.target.files[0]);
    });

    // Listeners Filtros
    container.querySelectorAll(".category-filter").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        this.handlers.onFilter(e.currentTarget.dataset.category)
      );
    });

    // Delegación Tarjetas
    container.addEventListener("click", (e) => {
      // Priorizar botones específicos primero
      if (e.target.closest(".use-template-btn")) {
        e.stopPropagation();
        const card = e.target.closest(".template-card");
        if (card) this.handlers.onSelect(card.dataset.templateId);
        return;
      }

      const btnEdit = e.target.closest(".edit-template");
      if (btnEdit) {
        e.stopPropagation();
        const card = btnEdit.closest(".template-card");
        this.handlers.onEdit(card.dataset.templateId);
        return;
      }

      const btnDel = e.target.closest(".delete-template");
      if (btnDel) {
        e.stopPropagation();
        const card = btnDel.closest(".template-card");
        this.handlers.onDelete(card.dataset.templateId);
        return;
      }

      const btnExp = e.target.closest(".export-template");
      if (btnExp) {
        e.stopPropagation();
        const card = btnExp.closest(".template-card");
        this.handlers.onExport(card.dataset.templateId);
        return;
      }

      // Click general en tarjeta (opcionalmente abre modo uso)
      const card = e.target.closest(".template-card");
      if (card && !e.target.closest("button")) {
        this.handlers.onSelect(card.dataset.templateId);
      }
    });
  }
}
