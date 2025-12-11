import { documentService } from "../services/documents/index.js";
import { templateService } from "../services/templates/index.js";

export class VaultList {
  constructor(onViewDocument, onNewDocument) {
    this.onViewDocument = onViewDocument;
    this.onNewDocument = onNewDocument;
    this.documents = [];
    this.templatesCache = {}; // Cache para nombres de plantillas
  }

  async loadDocuments() {
    const container = document.getElementById("vaultListContainer");
    if (!container) return;

    // Estado de carga "Skeleton"
    container.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${[1, 2, 3]
          .map(
            () => `
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-40 animate-pulse flex flex-col justify-between">
            <div class="flex items-start gap-4">
               <div class="w-12 h-12 bg-slate-200 rounded-xl"></div>
               <div class="flex-1 space-y-2">
                 <div class="h-4 bg-slate-200 rounded w-3/4"></div>
                 <div class="h-3 bg-slate-200 rounded w-1/2"></div>
               </div>
            </div>
            <div class="h-8 bg-slate-100 rounded-lg w-full mt-4"></div>
          </div>
        `
          )
          .join("")}
      </div>`;

    try {
      this.documents = await documentService.listDocuments(); // Solo metadatos

      // Obtener nombres de plantillas si hay documentos
      if (this.documents.length > 0) {
        const templateIds = [
          ...new Set(this.documents.map((d) => d.templateId)),
        ];
        for (const tid of templateIds) {
          try {
            const t = await templateService.getTemplateById(tid);
            if (t) this.templatesCache[tid] = t.name;
          } catch (e) {
            console.warn("Plantilla no encontrada", tid);
          }
        }
      }

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
          <button id="btnEmptyStateNew" class="px-6 py-2 bg-primary text-white rounded-lg shadow hover:bg-primary-hover transition">
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
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20"; // pb-20 para espacio scroll

    this.documents.forEach((doc) => {
      const templateName = this.templatesCache[doc.templateId] || "Documento";
      // Icono basado en el tipo (puedes expandir esto)
      const iconClass = this.getIconForType(templateName);

      const card = document.createElement("div");
      // Clases: Glassmorphism sutil, hover effect, bordes
      card.className =
        "group relative bg-white hover:bg-slate-50 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 cursor-pointer overflow-hidden";

      card.innerHTML = `
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div class="flex items-start justify-between mb-4">
            <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-primary group-hover:scale-110 transition-transform duration-300">
                <i class="${iconClass} text-xl"></i>
            </div>
            <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-white shadow-sm border border-slate-100 rounded-lg p-1">
                 <i class="fas fa-chevron-right text-slate-400"></i>
            </div>
        </div>
        
        <h3 class="text-lg font-bold text-slate-800 mb-1 line-clamp-1 group-hover:text-primary transition-colors">
            ${doc.title || "Sin título"}
        </h3>
        
        <div class="flex items-center gap-2 mb-4">
            <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wide">
                ${templateName}
            </span>
        </div>

        <div class="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
            <div class="flex items-center gap-1.5">
                <i class="far fa-clock"></i>
                <span>${new Date(doc.updatedAt).toLocaleDateString()}</span>
            </div>
            <div class="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                <i class="fas fa-lock text-[10px]"></i>
                <span class="font-medium">Cifrado</span>
            </div>
        </div>
      `;

      card.addEventListener("click", () => this.onViewDocument(doc.id));
      grid.appendChild(card);
    });

    container.innerHTML = "";
    container.appendChild(grid);
  }

  getIconForType(name) {
    const lower = name.toLowerCase();
    if (
      lower.includes("credito") ||
      lower.includes("tarjeta") ||
      lower.includes("banco")
    )
      return "fas fa-credit-card";
    if (
      lower.includes("login") ||
      lower.includes("pass") ||
      lower.includes("clave")
    )
      return "fas fa-key";
    if (lower.includes("nota") || lower.includes("texto"))
      return "fas fa-sticky-note";
    if (lower.includes("salud") || lower.includes("medico"))
      return "fas fa-heart-pulse";
    if (lower.includes("wifi")) return "fas fa-wifi";
    return "fas fa-file-shield";
  }
}
