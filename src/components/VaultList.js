// src/components/VaultList.js
import { documentService } from "../services/documents/index.js"; // <--- ESTA IMPORTACIÓN FALTABA
import { authService } from "../services/auth.js";
import { VaultSetupModal } from "./VaultSetupModal.js";
import { encryptionService } from "../services/encryption/index.js";

export class VaultList {
  constructor(onViewDocument, onNewDocument) {
    this.onViewDocument = onViewDocument;

    // --- LÓGICA INTERCEPTADA (Setup Inicial) ---
    this.onNewDocument = async () => {
      try {
        // 1. Verificamos si ya configuró la bóveda
        const isConfigured = await authService.isVaultConfigured();

        if (!isConfigured) {
          // CASO A: Usuario Nuevo -> Setup Modal
          const setupModal = new VaultSetupModal(() => {
            // Al terminar setup, procedemos a crear el documento
            onNewDocument();
          });
          setupModal.show();
        } else {
          // CASO B: Usuario Configurado -> Verificar Bloqueo normal
          if (window.app && window.app.requireEncryption) {
            window.app.requireEncryption(() => {
              onNewDocument();
            });
          } else {
            // Fallback
            if (!encryptionService.isReady()) {
              window.app.requireEncryption(() => onNewDocument());
            } else {
              onNewDocument();
            }
          }
        }
      } catch (error) {
        console.error("Error al verificar estado de bóveda:", error);
        // En caso de error, intentamos flujo normal por seguridad
        onNewDocument();
      }
    };
  }

  // --- Helper de Seguridad XSS ---
  createElement(tag, classes = [], textContent = "") {
    const el = document.createElement(tag);
    if (classes.length) el.classList.add(...classes);
    if (textContent) el.textContent = textContent;
    return el;
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
      // Llamamos al servicio real
      const documents = await documentService.listDocuments();
      this.render(container, documents);
    } catch (error) {
      console.error("Error cargando bóveda:", error);
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

  render(container, documents) {
    container.innerHTML = "";

    // Estado vacío
    if (documents.length === 0) {
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

      // IMPORTANTE: Usamos this.onNewDocument para que salte el SetupModal si es necesario
      container
        .querySelector("#btnEmptyStateNew")
        ?.addEventListener("click", this.onNewDocument);
      return;
    }

    // Grid de documentos
    const grid = this.createElement("div", [
      "grid",
      "grid-cols-1",
      "sm:grid-cols-2",
      "lg:grid-cols-3",
      "gap-5",
      "pb-20",
    ]);

    documents.forEach((doc) => {
      const card = this.createElement("div", [
        "group",
        "relative",
        "bg-white",
        "hover:bg-slate-50",
        "rounded-3xl",
        "p-5",
        "shadow-sm",
        "hover:shadow-xl",
        "hover:-translate-y-1",
        "transition-all",
        "duration-300",
        "border",
        "border-slate-100",
        "cursor-pointer",
        "overflow-hidden",
      ]);

      const colorStrip = this.createElement("div", [
        "absolute",
        "top-0",
        "left-0",
        "w-full",
        "h-1.5",
      ]);
      colorStrip.style.backgroundColor = doc.color || "#4f46e5";
      card.appendChild(colorStrip);

      const arrowDiv = this.createElement("div", [
        "absolute",
        "top-5",
        "right-5",
        "text-slate-300",
        "group-hover:text-slate-500",
        "transition-colors",
      ]);
      arrowDiv.innerHTML = '<i class="fas fa-chevron-right text-xs"></i>';
      card.appendChild(arrowDiv);

      const mainRow = this.createElement("div", [
        "flex",
        "items-center",
        "gap-4",
        "mb-4",
        "pr-6",
      ]);

      const iconBox = this.createElement("div", [
        "flex-shrink-0",
        "flex",
        "items-center",
        "justify-center",
        "w-12",
        "h-12",
        "rounded-2xl",
        "text-xl",
        "shadow-sm",
        "transition-transform",
        "duration-300",
        "group-hover:scale-110",
      ]);
      iconBox.style.backgroundColor = (doc.color || "#4f46e5") + "15";
      iconBox.style.color = doc.color || "#4f46e5";
      iconBox.textContent = doc.icon || "📋";
      mainRow.appendChild(iconBox);

      const textInfo = this.createElement("div", ["flex-1", "min-w-0"]);

      const title = this.createElement("h3", [
        "text-base",
        "font-bold",
        "text-slate-800",
        "truncate",
        "leading-tight",
        "group-hover:text-slate-900",
        "transition-colors",
        "mb-1",
      ]);
      title.textContent = doc.title || "Sin título";
      textInfo.appendChild(title);

      const badge = this.createElement("span", [
        "inline-block",
        "px-2",
        "py-0.5",
        "rounded-md",
        "text-[10px]",
        "font-bold",
        "uppercase",
        "tracking-wide",
        "border",
        "border-slate-100",
        "bg-white",
        "text-slate-500",
        "shadow-sm",
        "truncate",
        "max-w-full",
      ]);
      badge.textContent = doc.templateName || "Documento";
      textInfo.appendChild(badge);

      mainRow.appendChild(textInfo);
      card.appendChild(mainRow);

      const footer = this.createElement("div", [
        "flex",
        "items-center",
        "justify-between",
        "text-xs",
        "text-slate-400",
        "pt-3",
        "border-t",
        "border-slate-100",
      ]);

      const dateDiv = this.createElement("div", [
        "flex",
        "items-center",
        "gap-1.5",
        "truncate",
      ]);
      dateDiv.innerHTML = `<i class="far fa-clock"></i> <span>${new Date(
        doc.updatedAt
      ).toLocaleDateString()}</span>`;
      footer.appendChild(dateDiv);

      const secureBadge = this.createElement("div", [
        "flex",
        "items-center",
        "gap-1",
        "text-emerald-600",
        "bg-emerald-50",
        "px-2",
        "py-0.5",
        "rounded-full",
        "font-medium",
        "flex-shrink-0",
      ]);
      secureBadge.innerHTML =
        '<i class="fas fa-lock text-[10px]"></i> <span>E2EE</span>';
      footer.appendChild(secureBadge);

      card.appendChild(footer);

      card.addEventListener("click", () => this.onViewDocument(doc.id));

      grid.appendChild(card);
    });

    container.appendChild(grid);
  }
}
