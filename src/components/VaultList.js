// src/components/VaultList.js
import { documentService } from "../services/documents/index.js";
import { authService } from "../services/auth.js";
import { VaultSetupModal } from "./VaultSetupModal.js";
import { encryptionService } from "../services/encryption/index.js";

export class VaultList {
  constructor(onViewDocument, onNewDocument) {
    this.onViewDocument = onViewDocument;

    // Estado interno para filtros
    this.documents = [];
    this.activeFilter = "all"; // 'all' | 'Nombre de Plantilla'

    // --- LÓGICA INTERCEPTADA (Setup Inicial) ---
    this.onNewDocument = async () => {
      try {
        const isConfigured = await authService.isVaultConfigured();

        if (!isConfigured) {
          const setupModal = new VaultSetupModal(() => onNewDocument());
          setupModal.show();
        } else {
          if (window.app && window.app.requireEncryption) {
            window.app.requireEncryption(() => onNewDocument());
          } else {
            if (!encryptionService.isReady()) {
              window.app.requireEncryption(() => onNewDocument());
            } else {
              onNewDocument();
            }
          }
        }
      } catch (error) {
        console.error("Error al verificar estado de bóveda:", error);
        onNewDocument();
      }
    };
  }

  async loadDocuments() {
    const container = document.getElementById("vaultListContainer");
    if (!container) return;

    // Skeleton Loader
    container.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${[1, 2, 3]
          .map(
            () => `
          <div class="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 h-32 animate-pulse flex flex-col justify-between">
            <div class="flex items-center gap-4">
               <div class="w-12 h-12 bg-slate-200 rounded-xl flex-shrink-0"></div>
               <div class="flex-1 space-y-2">
                 <div class="h-4 bg-slate-200 rounded w-3/4"></div>
                 <div class="h-3 bg-slate-200 rounded w-1/3"></div>
               </div>
            </div>
            <div class="h-6 bg-slate-100 rounded-lg w-full mt-2"></div>
          </div>
        `
          )
          .join("")}
      </div>`;

    try {
      // 1. Cargar datos
      this.documents = await documentService.listDocuments();

      // 2. Preparar Layout (Contenedor de Filtros + Contenedor de Grid)
      container.innerHTML = `
        <div id="vaultFiltersContainer" class="mb-8 flex flex-wrap items-center gap-2 animate-fade-in"></div>
        <div id="vaultGridContainer" class="animate-fade-in-up"></div>
      `;

      // 3. Renderizar componentes
      this.renderFilters();
      this.renderGrid();
    } catch (error) {
      console.error("Error cargando bóveda:", error);
      this.renderErrorState(container);
    }
  }

  /**
   * Genera los botones de filtrado basados en las plantillas existentes
   */
  renderFilters() {
    const filterContainer = document.getElementById("vaultFiltersContainer");
    if (!filterContainer) return;

    if (this.documents.length === 0) {
      filterContainer.innerHTML = "";
      return;
    }

    // 1. Calcular estadísticas (agrupar por nombre de plantilla)
    const stats = this.documents.reduce((acc, doc) => {
      const name = doc.templateName || "Sin Plantilla";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    // 2. Ordenar alfabéticamente
    const templateNames = Object.keys(stats).sort((a, b) => a.localeCompare(b));

    // 3. Construir lista de filtros
    const filters = [
      { id: "all", label: "Todos", count: this.documents.length },
      ...templateNames.map((name) => ({
        id: name,
        label: name,
        count: stats[name],
      })),
    ];

    // 4. Renderizar botones
    filterContainer.innerHTML = filters
      .map((f) => {
        const isActive = this.activeFilter === f.id;
        // Estilos: Activo (Oscuro/Brand) vs Inactivo (Blanco/Gris)
        const btnClass = isActive
          ? "bg-slate-800 text-white shadow-lg shadow-slate-500/30 ring-2 ring-slate-800 ring-offset-2 transform scale-105"
          : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 hover:shadow-sm";

        const countClass = isActive
          ? "bg-white/20 text-white"
          : "bg-slate-100 text-slate-400";

        return `
          <button type="button" 
              class="filter-btn px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${btnClass}"
              data-filter="${f.id}">
              <span>${f.label}</span>
              <span class="px-1.5 py-0.5 rounded-md text-[10px] ${countClass}">${f.count}</span>
          </button>
        `;
      })
      .join("");

    // 5. Listeners
    filterContainer.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.activeFilter = btn.dataset.filter;
        this.renderFilters(); // Re-renderizar para actualizar estilos activo/inactivo
        this.renderGrid(); // Filtrar documentos
      });
    });
  }

  /**
   * Renderiza la cuadrícula de tarjetas según el filtro activo
   */
  renderGrid() {
    const gridContainer = document.getElementById("vaultGridContainer");
    if (!gridContainer) return;

    // 1. Filtrar
    let displayDocs = this.documents;
    if (this.activeFilter !== "all") {
      displayDocs = this.documents.filter(
        (d) => (d.templateName || "Sin Plantilla") === this.activeFilter
      );
    }

    // 2. Estado Vacío (Total o Parcial)
    if (displayDocs.length === 0) {
      if (this.documents.length === 0) {
        this.renderEmptyStateTotal(gridContainer); // Bóveda vacía (sin documentos)
      } else {
        // Bóveda con documentos, pero ninguno coincide con el filtro (raro, pero posible)
        gridContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center py-16 text-slate-400">
                    <i class="fas fa-search text-3xl mb-3 opacity-20"></i>
                    <p>No hay documentos en esta categoría.</p>
                </div>`;
      }
      return;
    }

    // 3. Renderizar Grid
    gridContainer.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-20">
        ${displayDocs.map((doc) => this.renderCardHtml(doc)).join("")}
      </div>
    `;

    // 4. Listeners de Click en Tarjetas
    gridContainer.querySelectorAll(".doc-card").forEach((card) => {
      card.addEventListener("click", () => {
        this.onViewDocument(card.dataset.id);
      });
    });
  }

  /**
   * Genera el HTML de una tarjeta individual
   */
  renderCardHtml(doc) {
    const color = doc.color || "#4f46e5";
    const icon = doc.icon || "📋";
    const title = doc.title || "Sin título";
    const templateName = doc.templateName || "Documento";
    const date = new Date(doc.updatedAt).toLocaleDateString();

    return `
      <div class="doc-card group relative bg-white hover:bg-slate-50 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 cursor-pointer overflow-hidden" data-id="${doc.id}">
          
          <div class="absolute top-0 left-0 w-full h-1.5" style="background-color: ${color}"></div>
          
          <div class="absolute top-5 right-5 text-slate-300 group-hover:text-slate-500 transition-colors">
              <i class="fas fa-chevron-right text-xs"></i>
          </div>

          <div class="flex items-center gap-4 mb-4 pr-6">
              <div class="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl text-xl shadow-sm transition-transform duration-300 group-hover:scale-110"
                   style="background-color: ${color}15; color: ${color}">
                  ${icon}
              </div>
              
              <div class="flex-1 min-w-0">
                  <h3 class="text-base font-bold text-slate-800 truncate leading-tight group-hover:text-slate-900 transition-colors mb-1">
                      ${title}
                  </h3>
                  <span class="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border border-slate-100 bg-white text-slate-500 shadow-sm truncate max-w-full">
                      ${templateName}
                  </span>
              </div>
          </div>

          <div class="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
              <div class="flex items-center gap-1.5 truncate">
                  <i class="far fa-clock"></i> <span>${date}</span>
              </div>
              <div class="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                  <i class="fas fa-lock text-[10px]"></i> <span>E2EE</span>
              </div>
          </div>
      </div>
    `;
  }

  renderEmptyStateTotal(container) {
    container.innerHTML = `
        <div class="text-center py-16 px-4">
          <div class="inline-block p-6 rounded-full bg-slate-50 mb-4 animate-fade-in-up">
            <i class="fas fa-folder-open text-4xl text-slate-300"></i>
          </div>
          <h3 class="text-lg font-bold text-slate-700">Tu bóveda está vacía</h3>
          <p class="text-slate-500 max-w-xs mx-auto mt-2 mb-6">Comienza a proteger tu información importante hoy mismo.</p>
          <button id="btnEmptyStateNew" class="px-6 py-2 bg-primary text-white rounded-xl shadow-lg hover:bg-primary-hover transition font-bold">
            Crear primer documento
          </button>
        </div>`;

    container
      .querySelector("#btnEmptyStateNew")
      ?.addEventListener("click", this.onNewDocument);
  }

  renderErrorState(container) {
    container.innerHTML = `
        <div class="text-center py-12 bg-red-50 rounded-2xl border border-red-100">
          <div class="inline-flex bg-red-100 p-3 rounded-full text-red-500 mb-3"><i class="fas fa-exclamation-triangle"></i></div>
          <p class="text-red-600 font-medium">No se pudieron cargar los documentos.</p>
          <button id="retryBtn" class="mt-4 text-sm text-red-700 underline hover:text-red-900">Reintentar</button>
        </div>`;
    document
      .getElementById("retryBtn")
      ?.addEventListener("click", () => this.loadDocuments());
  }
}
