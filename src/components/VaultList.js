// src/components/VaultList.js
import { documentService } from "../services/documents/index.js";
import { templateService } from "../services/templates/index.js";

export class VaultList {
  constructor(onViewDocument, onNewDocument) {
    this.onViewDocument = onViewDocument;
    this.onNewDocument = onNewDocument;
    this.documents = [];
  }

  async loadDocuments() {
    const container = document.getElementById("vaultListContainer");
    if (!container) return;

    // Skeleton Loader (Ajustado al nuevo layout horizontal)
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
      this.documents = await documentService.listDocuments();
      this.render(container);
    } catch (error) {
      console.error("Error cargando bóveda:", error);
      container.innerHTML = `
        <div class="text-center py-12 bg-red-50 rounded-2xl border border-red-100">
          <div class="inline-flex bg-red-100 p-3 rounded-full text-red-500 mb-3"><i class="fas fa-exclamation-triangle"></i></div>
          <p class="text-red-600 font-medium">No se pudieron cargar los documentos.</p>
          <button onclick="location.reload()" class="mt-4 text-sm text-red-700 underline hover:text-red-900">Reintentar</button>
        </div>`;
    }
  }

  render(container) {
    if (this.documents.length === 0) {
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
      return;
    }

    const grid = document.createElement("div");
    grid.className =
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-20";

    this.documents.forEach((doc) => {
      const icon = doc.icon || "📋";
      const color = doc.color || "#4f46e5";
      const templateName = doc.templateName || "Documento";

      const card = document.createElement("div");
      // Ajusté el padding a p-5 para hacerlo un poco más compacto
      card.className =
        "group relative bg-white hover:bg-slate-50 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 cursor-pointer overflow-hidden";

      card.innerHTML = `
        <div class="absolute top-0 left-0 w-full h-1.5" style="background-color: ${color}"></div>
        
        <div class="absolute top-5 right-5 text-slate-300 group-hover:text-slate-500 transition-colors">
             <i class="fas fa-chevron-right text-xs"></i>
        </div>

        <div class="flex items-center gap-4 mb-4 pr-6">
            
            <div class="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl text-xl shadow-sm transition-transform duration-300 group-hover:scale-110"
                 style="background-color: ${color}15; color: ${color}">
                ${icon}
            </div>
            
            <div class="flex-1 min-w-0"> <h3 class="text-base font-bold text-slate-800 truncate leading-tight group-hover:text-slate-900 transition-colors mb-1">
                    ${doc.title || "Sin título"}
                </h3>
                <span class="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border border-slate-100 bg-white text-slate-500 shadow-sm truncate max-w-full">
                    ${templateName}
                </span>
            </div>
        </div>

        <div class="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
            <div class="flex items-center gap-1.5 truncate">
                <i class="far fa-clock"></i>
                <span>${new Date(doc.updatedAt).toLocaleDateString()}</span>
            </div>
            <div class="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                <i class="fas fa-lock text-[10px]"></i>
                <span>E2EE</span>
            </div>
        </div>
      `;

      card.addEventListener("click", () => this.onViewDocument(doc.id));
      grid.appendChild(card);
    });

    container.innerHTML = "";
    container.appendChild(grid);
  }
}
