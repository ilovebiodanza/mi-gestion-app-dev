// src/components/VaultList.js
import { documentService } from "../services/documents/index.js";

export class VaultList {
  constructor(onDocumentSelect, onNewDocument) {
    this.onDocumentSelect = onDocumentSelect; // Callback para abrir/descifrar
    this.onNewDocument = onNewDocument; // Callback para ir a crear uno nuevo
    this.documents = [];
    this.isLoading = false;
  }

  /**
   * Cargar documentos desde el servicio
   */
  async loadDocuments() {
    this.isLoading = true;
    this.render(); // Mostrar spinner

    try {
      this.documents = await documentService.getAllDocuments();
    } catch (error) {
      console.error("Error cargando vault:", error);
      this.error = "No se pudieron cargar tus documentos seguros.";
    } finally {
      this.isLoading = false;
      this.render(); // Mostrar lista o vacío
    }
  }

  render() {
    const container = document.getElementById("vaultListContainer");
    if (!container) return; // Guard para seguridad

    if (this.isLoading) {
      container.innerHTML = `
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <span class="ml-3 text-gray-500">Accediendo a la bóveda segura...</span>
        </div>
      `;
      return;
    }

    if (this.error) {
      container.innerHTML = `
        <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
          <p class="text-red-700">${this.error}</p>
          <button id="retryLoadBtn" class="mt-2 text-sm text-red-600 underline hover:text-red-800">Reintentar</button>
        </div>
      `;
      document
        .getElementById("retryLoadBtn")
        ?.addEventListener("click", () => this.loadDocuments());
      return;
    }

    if (this.documents.length === 0) {
      container.innerHTML = this.renderEmptyState();
      document
        .getElementById("createFirstDocBtn")
        ?.addEventListener("click", () => this.onNewDocument());
      return;
    }

    // Renderizar lista de documentos
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
        ${this.documents.map((doc) => this.renderDocumentCard(doc)).join("")}
      </div>
    `;

    // Asignar listeners a las tarjetas
    container.querySelectorAll(".vault-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        // Evitar disparar si se hace click en acciones secundarias (futuras)
        const docId = card.dataset.id;
        this.onDocumentSelect(docId);
      });
    });
  }

  renderEmptyState() {
    return `
      <div class="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-box-open text-gray-400 text-3xl"></i>
        </div>
        <h3 class="text-lg font-medium text-gray-900">Tu bóveda está vacía</h3>
        <p class="mt-1 text-gray-500 max-w-sm mx-auto">Comienza a proteger tu información personal creando tu primer documento cifrado.</p>
        <div class="mt-6">
          <button id="createFirstDocBtn" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
            <i class="fas fa-plus mr-2"></i>
            Crear Nuevo Documento
          </button>
        </div>
      </div>
    `;
  }

  renderDocumentCard(doc) {
    // Formatear fecha
    const date = new Date(doc.metadata.updatedAt).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    return `
      <div class="vault-card bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer p-4 group" data-id="${
        doc.id
      }">
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <span class="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-blue-50 text-blue-600 text-xl">
                ${doc.metadata.icon || "📄"}
              </span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-900 truncate">
                ${doc.metadata.title || "Sin Título"}
              </p>
              <p class="text-xs text-gray-500 truncate">
                Modificado: ${date}
              </p>
            </div>
          </div>
          <div class="opacity-0 group-hover:opacity-100 transition-opacity">
            <i class="fas fa-chevron-right text-gray-400"></i>
          </div>
        </div>
        <div class="mt-3 flex items-center justify-between text-xs">
          <div class="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded">
            <i class="fas fa-lock mr-1"></i> E2EE
          </div>
          <span class="text-gray-400 font-mono">v${doc.version || 1}</span>
        </div>
      </div>
    `;
  }
}
