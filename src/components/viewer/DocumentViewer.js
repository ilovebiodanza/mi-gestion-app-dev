import { documentService } from "../../services/documents/index.js";
import { templateService } from "../../services/templates/index.js";
import { encryptionService } from "../../services/encryption/index.js";
import { copyToWhatsApp } from "./WhatsAppExporter.js";
import { printDocument } from "./PrintExporter.js";
import { getLocalCurrency } from "../../utils/helpers.js";
import { globalPlayer } from "../common/MediaPlayer.js";
import { ViewerRegistry } from "./core/ViewerRegistry.js";

export class DocumentViewer {
  constructor(docId, onBack) {
    this.docId = docId;
    this.onBack = onBack;
    this.document = null;
    this.template = null;
    this.decryptedData = null;
    this.currencyConfig = getLocalCurrency();
    this.viewersInstanceCache = []; // Para guardar referencias a los viewers activos
  }

  // MODIFICAR ESTA FUNCIÓN EN DocumentViewer.js
  async load() {
    this.renderLoading();

    // Verificación inicial (se mantiene igual)
    if (!encryptionService.isReady()) {
      if (window.app && window.app.requireEncryption) {
        window.app.requireEncryption(() => this.load());
        return;
      }
      this.renderError("Cifrado no disponible.");
      return;
    }

    try {
      this.document = await documentService.getById(this.docId);
      this.template = await templateService.getTemplateById(
        this.document.templateId
      );
      if (!this.template) throw new Error("Plantilla no encontrada.");

      this.decryptedData = await encryptionService.decryptDocument(
        this.document.encryptedContent
      );

      // --- ❌ ELIMINAR ESTE BLOQUE ---
      /* this.template.fields.forEach((f) => {
        if (f.type === "table")
          this.tableStates[f.id] = {
            search: "",
            sortCol: null,
            sortDir: "asc",
          };
      });
      */
      // -------------------------------
      this.renderContent();
    } catch (error) {
      console.error(error);

      // --- NUEVA LÓGICA DE RECUPERACIÓN ---
      // Si el error es de desencriptado (OperationError) o menciona "Decrypt",
      // significa que las llaves en memoria no coinciden con el usuario actual.
      if (
        error.name === "OperationError" ||
        error.message.includes("Decrypt")
      ) {
        console.warn(
          "🔐 Fallo de desencriptación detectado. Solicitando clave maestra..."
        );

        if (window.app && window.app.requireEncryption) {
          // Llamamos con 'true' (segundo argumento) para FORZAR el modal
          // y al terminar exitosamente, reintentamos this.load()
          window.app.requireEncryption(() => this.load(), true);
          return; // Salimos para no renderizar el error rojo
        }
      }
      // ------------------------------------

      this.renderError(error.message);
    }
  }

  render() {
    return `<div id="documentViewerPlaceholder" class="animate-fade-in pb-20"></div>`;
  }

  renderLoading() {
    document.getElementById(
      "documentViewerPlaceholder"
    ).innerHTML = `<div class="flex flex-col items-center justify-center py-20"><div class="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-brand-600 mb-4"></div><p class="text-slate-400 text-sm">Cargando...</p></div>`;
  }

  renderContent() {
    const container = document.getElementById("documentViewerPlaceholder");
    if (!container) return;
    globalPlayer.renderBase();

    const updatedAt = new Date(
      this.document.metadata.updatedAt
    ).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const groups = this.groupFields();
    const accentColor = this.template.color || "#3b82f6";

    const renderFieldsHTML = (fields) => {
      return fields
        .map((field) => {
          const value = this.decryptedData[field.id];

          // 1. INSTANCIAR EL VIEWER
          const ViewerClass = ViewerRegistry.getViewerClass(field.type);
          const viewerInstance = new ViewerClass(field, value, {
            currencyConfig: this.currencyConfig,
            // Aquí podrías pasar callbacks si el viewer necesita comunicarse con el padre
          });

          // Guardamos la instancia para llamar a postRender después
          this.viewersInstanceCache.push(viewerInstance);

          // 2. RENDERIZAR HTML
          if (field.type === "table") {
            return `<div class="col-span-1 md:col-span-2 mt-4 mb-4">
                ${viewerInstance.render()}
            </div>`;
          }

          const isFullWidth = ["text", "url"].includes(field.type);
          const spanClass = isFullWidth
            ? "col-span-1 md:col-span-2"
            : "col-span-1";

          return `
            <div class="${spanClass} group border-b border-slate-100 pb-3 last:border-0 hover:bg-slate-50/50 transition-colors rounded-lg px-2 -mx-2">
              <dt class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                 ${field.label}
              </dt>
              <dd class="text-sm text-slate-800 font-medium break-words leading-relaxed">
                 ${viewerInstance.render()} 
              </dd>
            </div>`;
        })
        .join("");
    };

    let contentHtml = "";
    if (groups.length === 1) {
      contentHtml = `<dl class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">${renderFieldsHTML(
        groups[0].fields
      )}</dl>`;
    } else {
      // Tabs Modernos
      contentHtml = `
        <div class="viewer-layout-container mt-6">
            <div class="flex border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar gap-6 print:hidden">
                ${groups
                  .map((group, index) => {
                    const isActive = index === 0;
                    const activeClass = isActive
                      ? `text-brand-600 border-b-2 border-brand-600`
                      : `text-slate-500 hover:text-slate-700 border-b-2 border-transparent`;
                    return `
                    <button type="button" 
                            class="viewer-tab-trigger pb-3 text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeClass}"
                            data-target="${group.id}">
                        ${group.label}
                    </button>`;
                  })
                  .join("")}
            </div>

            <div class="space-y-4">
                ${groups
                  .map((group, index) => {
                    const isActive = index === 0;
                    const hiddenClass = isActive ? "" : "hidden";
                    return `
                    <div class="viewer-group-container ${hiddenClass} animate-fade-in" id="${
                      group.id
                    }">
                        <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                            ${renderFieldsHTML(group.fields)}
                        </dl>
                    </div>`;
                  })
                  .join("")}
            </div>
        </div>`;
    }

    container.innerHTML = `
      <div class="flex items-center justify-between mb-4 no-print">
         <button id="backBtn" class="flex items-center text-slate-500 hover:text-slate-800 transition-colors font-medium text-sm gap-2 px-3 py-2 rounded-lg hover:bg-slate-100">
            <i class="fas fa-arrow-left"></i> Volver
         </button>
         
         <div class="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            <button id="whatsappDocBtn" class="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Compartir WhatsApp">
                <i class="fab fa-whatsapp text-lg"></i>
            </button>
            <button id="pdfDocBtn" class="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" title="Imprimir">
                <i class="fas fa-print text-lg"></i>
            </button>
            <div class="w-px h-5 bg-slate-200 mx-1"></div>
            <button id="deleteDocBtn" class="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                <i class="far fa-trash-alt text-lg"></i>
            </button>
            <button id="editDocBtn" class="ml-1 px-4 h-9 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-colors flex items-center gap-2">
                <i class="fas fa-pen"></i> Editar
            </button>
         </div>
      </div>

      <div id="documentCard" class="bg-white rounded-none sm:rounded-xl shadow-card border-y sm:border border-slate-200 min-h-[600px] print:shadow-none print:border-none">
        
        <div class="px-5 py-4 border-b border-slate-100 bg-slate-50/30 print:bg-white print:border-b-2 print:border-black">
             <div class="flex items-start gap-4"> <div class="w-12 h-12 rounded-lg flex items-center justify-center text-xl shadow-sm border border-slate-100 bg-white print:hidden" style="color: ${accentColor}">
                    ${this.template.icon || "📄"}
                </div>
                
                <div>
                   <div class="flex items-center gap-2 mb-1">
                      <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">
                        ${this.template.name}
                      </span>
                   </div>
                   <h1 class="text-2xl font-bold text-slate-900 leading-tight mb-1">${
                     this.document.metadata.title
                   }</h1>
                   <p class="text-[11px] text-slate-400 flex items-center gap-3 font-mono">
                      <span><i class="far fa-clock mr-1"></i> ${updatedAt}</span>
                      <span class="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded"><i class="fas fa-shield-alt mr-1"></i> E2EE</span>
                   </p>
                </div>
             </div>
        </div>

        <div class="p-4 sm:p-5">
           ${contentHtml}
        </div>
      </div>
      
      <div id="rowDetailModal" class="fixed inset-0 z-50 hidden no-print">
         <div class="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" id="modalBackdrop"></div>
         <div class="flex items-center justify-center min-h-screen p-4 pointer-events-none">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg pointer-events-auto flex flex-col max-h-[80vh] animate-slide-up">
                <div class="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 class="font-bold text-slate-800">Detalle</h3>
                    <button class="close-modal text-slate-400 hover:text-slate-600"><i class="fas fa-times"></i></button>
                </div>
                <div class="p-5 overflow-y-auto" id="rowDetailContent"></div>
            </div>
         </div>
      </div>
    `;

    this.setupContentListeners();
  }

  groupFields() {
    const groups = [];
    let currentGroup = {
      id: "group-principal",
      label: "Información General",
      icon: "fas fa-info-circle",
      fields: [],
    };

    this.template.fields.forEach((field) => {
      if (field.type === "separator") {
        if (currentGroup.fields.length > 0) groups.push(currentGroup);
        currentGroup = {
          id: `group-${field.id}`,
          label: field.label,
          icon: "fas fa-layer-group",
          fields: [],
          isSeparator: true,
        };
      } else {
        currentGroup.fields.push(field);
      }
    });
    if (currentGroup.fields.length > 0) groups.push(currentGroup);
    return groups;
  }

  // ... (Mantén los métodos triggerPrint, setupContentListeners y los helpers de tabla igual,
  // ya que la lógica no cambia, solo el HTML generado en renderContent)
  // Asegúrate de copiar el método showPrintOptions actualizado de mi respuesta anterior si no lo tienes.

  showPrintOptions() {
    if (!document.getElementById("printOptionsModal")) {
      const modalHtml = `
        <div id="printOptionsModal" class="fixed inset-0 z-[70] flex items-center justify-center p-4 hidden"> 
            <div class="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" id="printModalBackdrop"></div>
            <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up">
                <div class="p-6 text-center">
                    <h3 class="text-lg font-bold text-slate-800 mb-4">Imprimir Documento</h3>
                    <div class="space-y-3">
                        <button id="printStandardBtn" class="w-full flex items-center p-3 border border-slate-200 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-all text-left group">
                            <i class="fas fa-file-alt text-2xl text-slate-300 group-hover:text-brand-500 mr-4"></i>
                            <div>
                                <span class="block font-bold text-slate-700 text-sm">Formato Visual</span>
                                <span class="block text-xs text-slate-400">Diseño completo con iconos</span>
                            </div>
                        </button>
                        <button id="printCompactBtn" class="w-full flex items-center p-3 border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group">
                            <i class="fas fa-list text-2xl text-slate-300 group-hover:text-emerald-500 mr-4"></i>
                            <div>
                                <span class="block font-bold text-slate-700 text-sm">Formato Compacto</span>
                                <span class="block text-xs text-slate-400">Ahorro de papel y tinta</span>
                            </div>
                        </button>
                        <button id="printAccessibleBtn" class="w-full flex items-center p-3 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group">
                            <i class="fas fa-glasses text-2xl text-slate-300 group-hover:text-blue-500 mr-4"></i>
                            <div>
                                <span class="block font-bold text-slate-700 text-sm">Formato para Lectura Fácil</span>
                                <span class="block text-xs text-slate-400">Letra grande, márgenes mínimos</span>
                            </div>
                        </button>
                    </div>
                </div>
                <div class="bg-slate-50 p-3 text-center border-t border-slate-100">
                    <button id="cancelPrintBtn" class="text-xs font-bold text-slate-500 hover:text-slate-800 uppercase">Cancelar</button>
                </div>
            </div>
        </div>`;
      document.body.insertAdjacentHTML("beforeend", modalHtml);
    }

    const modal = document.getElementById("printOptionsModal");
    const closeFn = () => modal.classList.add("hidden");

    document.getElementById("printModalBackdrop").onclick = closeFn;
    document.getElementById("cancelPrintBtn").onclick = closeFn;

    document.getElementById("printStandardBtn").onclick = () => {
      this.triggerPrint("standard");
      closeFn();
    };
    document.getElementById("printCompactBtn").onclick = () => {
      this.triggerPrint("compact");
      closeFn();
    };
    document.getElementById("printAccessibleBtn").onclick = () => {
      this.triggerPrint("accessible"); // Activamos el nuevo modo
      closeFn();
    };

    modal.classList.remove("hidden");
  }

  triggerPrint(isCompact) {
    const dataToPrint = { ...this.document.metadata, id: this.document.id };
    printDocument(dataToPrint, this.template, this.decryptedData, isCompact);
  }

  setupContentListeners() {
    // Listeners de tabs
    const container = document.getElementById("documentViewerPlaceholder");

    // Ejecutar postRender de todos los viewers (necesario para SecretViewer, etc.)
    if (this.viewersInstanceCache && this.viewersInstanceCache.length > 0) {
      this.viewersInstanceCache.forEach((viewer) => {
        // Pasamos el container para que el viewer busque su ID único dentro de él
        viewer.postRender(container);
      });
    }

    const tabTriggers = container.querySelectorAll(".viewer-tab-trigger");
    const groupContainers = container.querySelectorAll(
      ".viewer-group-container"
    );

    tabTriggers.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.target;
        // Reset Tabs
        tabTriggers.forEach(
          (t) =>
            (t.className =
              "viewer-tab-trigger pb-3 text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 text-slate-500 hover:text-slate-700 border-b-2 border-transparent")
        );
        // Active Tab
        btn.className =
          "viewer-tab-trigger pb-3 text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 text-brand-600 border-b-2 border-brand-600";

        // Show content
        groupContainers.forEach((g) => {
          if (g.id === target) g.classList.remove("hidden");
          else g.classList.add("hidden");
        });
      });
    });

    // Resto de listeners (copiar desde tu versión anterior o la que te di en el paso anterior,
    // asegurando que backBtn, whatsappDocBtn, etc. están conectados)
    ["backBtn"].forEach((id) =>
      document
        .getElementById(id)
        ?.addEventListener("click", () => this.onBack())
    );
    document
      .getElementById("deleteDocBtn")
      ?.addEventListener("click", () => this.handleDelete());
    document
      .getElementById("editDocBtn")
      ?.addEventListener("click", () => this.handleEdit());
    document
      .getElementById("pdfDocBtn")
      ?.addEventListener("click", () => this.showPrintOptions());
    document
      .getElementById("whatsappDocBtn")
      ?.addEventListener("click", () => this.handleCopyToWhatsApp());

    // ...Listeners de tabla, copy, media player se mantienen igual...
    // (Para no hacer la respuesta infinita, asumo que mantienes esa lógica de delegación que ya funcionaba bien)
  }

  // Agrega aquí los demás métodos auxiliares necesarios (renderLoading, renderError, handleDelete, handleEdit, handleCopyToWhatsApp)
  // Copialos del archivo que me pasaste, solo asegurate que renderError use clases de Tailwind limpias (bg-red-50 text-red-600) en lugar de estilos custom.
  renderError(msg) {
    document.getElementById(
      "documentViewerPlaceholder"
    ).innerHTML = `<div class="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg text-center text-sm">${msg}</div>`;
  }
  async handleDelete() {
    if (confirm("¿Eliminar este documento?")) {
      await documentService.delete(this.docId);
      this.onBack();
    }
  }
  handleEdit() {
    this.onBack({
      documentId: this.docId,
      template: this.template,
      formData: this.decryptedData,
      metadata: this.document.metadata,
    });
  }
  async handleCopyToWhatsApp() {
    try {
      await copyToWhatsApp(
        this.document.metadata,
        this.template,
        this.decryptedData,
        this.currencyConfig
      );
      alert("Copiado al portapapeles para WhatsApp");
    } catch (e) {
      alert("Error copiando");
    }
  }
}
