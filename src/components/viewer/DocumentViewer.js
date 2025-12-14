import { documentService } from "../../services/documents/index.js";
import { templateService } from "../../services/templates/index.js";
import { encryptionService } from "../../services/encryption/index.js";
import { copyToWhatsApp } from "./WhatsAppExporter.js";
import { printDocument } from "./PrintExporter.js";
import { getLocalCurrency } from "../../utils/helpers.js";

// --- NUEVOS IMPORTS ---
import { globalPlayer } from "../common/MediaPlayer.js";
import * as FieldRenderers from "./FieldRenderers.js";

export class DocumentViewer {
  constructor(docId, onBack) {
    this.docId = docId;
    this.onBack = onBack;
    this.document = null;
    this.template = null;
    this.decryptedData = null;
    this.currencyConfig = getLocalCurrency();
    this.tableStates = {};
  }

  render() {
    return `<div id="documentViewerPlaceholder" class="animate-fade-in-up pb-16"></div>`;
  }

  async load() {
    this.renderLoading();
    if (!encryptionService.isReady()) {
      if (window.app && window.app.requireEncryption) {
        window.app.requireEncryption(() => this.load());
        return;
      }
      this.renderError("Sistema de cifrado no disponible.");
      return;
    }
    try {
      this.document = await documentService.getById(this.docId);
      this.template = await templateService.getTemplateById(
        this.document.templateId
      );
      if (!this.template)
        throw new Error("La plantilla original ya no existe.");
      this.decryptedData = await encryptionService.decryptDocument(
        this.document.encryptedContent
      );
      // Inicializar estados de tablas
      this.template.fields.forEach((f) => {
        if (f.type === "table")
          this.tableStates[f.id] = {
            search: "",
            sortCol: null,
            sortDir: "asc",
          };
      });
      this.renderContent();
    } catch (error) {
      console.error(error);
      this.renderError(error.message);
    }
  }

  // --- LÓGICA DE DELEGACIÓN A FIELDRENDERERS ---
  renderFieldValue(type, value, isTableContext = false) {
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return '<span class="text-slate-300 italic text-xs select-none">Vacío</span>';
    }

    switch (type) {
      case "url":
        return FieldRenderers.renderUrlField(value, isTableContext);
      case "boolean":
        return FieldRenderers.renderBoolean(value);
      case "date":
        return FieldRenderers.renderDate(value);
      case "currency":
        return FieldRenderers.renderCurrency(value, this.currencyConfig);
      case "percentage":
        return FieldRenderers.renderPercentage(value);
      case "secret":
        return FieldRenderers.renderSecret(value, isTableContext);
      case "text":
        return FieldRenderers.renderText(value, isTableContext);
      default:
        return String(value);
    }
  }

  // --- NUEVO: Lógica de Agrupación (Igual al Editor pero adaptada al Visor) ---
  groupFields() {
    const groups = [];
    let currentGroup = {
      id: "group-principal",
      label: "Principal",
      // Icono más "de lectura"
      icon: "fas fa-file-alt",
      fields: [],
    };

    this.template.fields.forEach((field) => {
      if (field.type === "separator") {
        if (currentGroup.fields.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = {
          id: `group-${field.id}`,
          label: field.label,
          icon: "fas fa-bookmark", // Icono distinto para secciones
          fields: [],
          isSeparator: true,
        };
      } else {
        currentGroup.fields.push(field);
      }
    });

    if (currentGroup.fields.length > 0) {
      groups.push(currentGroup);
    }
    return groups;
  }

  // --- REFACTORIZADO: Renderizado con Tabs/Acordeón ---
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

    // 1. Agrupar campos
    const groups = this.groupFields();

    // Color de la plantilla para los Tabs Activos
    const themeColor = this.template.color || "#6366f1";

    // 2. Generar HTML de los campos (Helper interno para no repetir lógica)
    const renderFieldsHTML = (fields) => {
      return fields
        .map((field) => {
          const value = this.decryptedData[field.id];

          // Tablas ocupan todo el ancho
          if (field.type === "table") {
            return `<div class="col-span-1 md:col-span-2 print:col-span-2 print:break-inside-avoid">
                          ${this.renderTableField(field, value)}
                        </div>`;
          }

          // Campos normales
          const isFullWidth = ["text", "url"].includes(field.type); // Textos largos y urls a full width
          const spanClass = isFullWidth
            ? "col-span-1 md:col-span-2"
            : "col-span-1";
          const displayValue = this.renderFieldValue(field.type, value);

          return `
            <div class="${spanClass} print:col-span-1 print:break-inside-avoid bg-slate-50/50 rounded-xl p-4 border border-slate-100 hover:bg-slate-50 transition-colors group">
              <dt class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                 ${field.label}
              </dt>
              <dd class="text-sm text-slate-800 break-words leading-relaxed font-medium">
                 ${displayValue}
              </dd>
            </div>`;
        })
        .join("");
    };

    // 3. Construir el Layout de Pestañas/Acordeón
    let contentHtml = "";

    if (groups.length === 1) {
      // Layout Plano (Sin tabs)
      contentHtml = `<dl class="grid grid-cols-1 md:grid-cols-2 gap-6">${renderFieldsHTML(
        groups[0].fields
      )}</dl>`;
    } else {
      // Layout Pestañas
      contentHtml = `
        <div class="viewer-layout-container">
            
            <div class="hidden md:flex items-center gap-2 mb-8 flex-wrap print:hidden">
                ${groups
                  .map((group, index) => {
                    const isActive = index === 0;
                    // Estilo diferente: Fondo suave en lugar de subrayado
                    const style = isActive
                      ? `background-color: ${themeColor}15; color: ${themeColor}; border-color: ${themeColor}30;`
                      : `background-color: white; color: #64748b; border-color: #e2e8f0;`;

                    return `
                    <button type="button" 
                            class="viewer-tab-trigger px-4 py-2 rounded-lg text-sm font-bold border transition-all flex items-center gap-2 hover:shadow-sm"
                            style="${style}"
                            data-target="${group.id}">
                        <i class="${group.icon} opacity-70"></i>
                        ${group.label}
                    </button>`;
                  })
                  .join("")}
            </div>

            <div class="space-y-4 md:space-y-0">
                ${groups
                  .map((group, index) => {
                    const isActive = index === 0;
                    // Desktop: Oculto si no es activo.
                    // Print: SIEMPRE VISIBLE (block) para que salga todo el reporte continuo.
                    const visibilityClass = isActive ? "" : "md:hidden";

                    // Acordeón Móvil
                    const accordionContentClass = isActive
                      ? "max-h-[5000px] opacity-100 pb-6"
                      : "max-h-0 opacity-0 overflow-hidden";
                    const accordionIconRotation = isActive ? "rotate-180" : "";

                    return `
                    <div class="viewer-group-container ${visibilityClass} print:!block print:!visible print:!max-h-none print:!opacity-100" id="${
                      group.id
                    }">
                        
                        <button type="button" 
                                class="viewer-accordion-trigger md:hidden w-full flex items-center justify-between p-4 bg-white border-b border-slate-100 mb-2 print:hidden group">
                            <div class="flex items-center gap-3 font-bold text-slate-700 group-hover:text-primary transition-colors">
                                <i class="${group.icon} text-slate-400"></i>
                                ${group.label}
                            </div>
                            <i class="fas fa-chevron-down text-slate-300 transition-transform duration-300 ${accordionIconRotation}"></i>
                        </button>

                        <div class="viewer-group-content transition-all duration-500 ease-in-out md:max-h-none md:opacity-100 md:overflow-visible ${accordionContentClass} print:!block print:!max-h-none print:!opacity-100 print:!overflow-visible">
                            <h3 class="hidden print:block text-lg font-bold text-slate-800 mb-4 mt-6 border-b border-slate-200 pb-2">
                                <i class="${
                                  group.icon
                                } mr-2 text-slate-400"></i>${group.label}
                            </h3>

                            <dl class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                ${renderFieldsHTML(group.fields)}
                            </dl>
                        </div>
                    </div>`;
                  })
                  .join("")}
            </div>
        </div>`;
    }

    // Header y estructura general (Sin cambios mayores, solo inyectamos contentHtml)
    container.innerHTML = `
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 no-print">
         <button id="backBtn" class="group flex items-center text-slate-500 hover:text-primary transition-colors font-medium">
            <div class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mr-2 shadow-sm group-hover:-translate-x-1 transition-transform"><i class="fas fa-arrow-left text-xs"></i></div>
            <span>Volver</span>
         </button>
         <div class="flex items-center gap-2 self-end sm:self-auto bg-white p-1.5 rounded-xl shadow-sm border border-slate-200">
            <button id="whatsappDocBtn" class="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="WhatsApp"><i class="fab fa-whatsapp text-lg"></i></button>
            <button id="pdfDocBtn" class="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors" title="Imprimir"><i class="fas fa-print text-lg"></i></button>
            <div class="h-6 w-px bg-slate-100 mx-1"></div>
            <button id="deleteDocBtn" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"><i class="far fa-trash-alt text-lg"></i></button>
            <button id="editDocBtn" class="flex items-center px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-bold ml-1"><i class="fas fa-pen mr-2 text-xs"></i> <span>Editar</span></button>
         </div>
      </div>

      <div id="documentCard" class="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden relative print:shadow-none print:border-none print:rounded-none">
        
        <div class="relative px-8 py-10 overflow-hidden print:px-0 print:py-4">
             <div class="absolute inset-0 opacity-10 print:hidden" style="background-color: ${this.template.color}"></div>
             <div class="absolute top-0 left-0 w-full h-1.5" style="background-color: ${this.template.color}"></div>
             
             <div class="relative z-10 flex gap-6 items-start">
                <div class="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg bg-white text-gradient print:border print:border-slate-200 print:shadow-none" style="color: ${this.template.color}">
                    ${this.template.icon}
                </div>
                <div>
                   <h1 class="text-2xl sm:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight mb-2">${this.document.metadata.title}</h1>
                   <div class="flex flex-wrap items-center gap-3 text-sm">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-lg font-bold text-xs uppercase tracking-wide bg-white/60 border border-slate-200/50 text-slate-600 backdrop-blur-sm print:bg-slate-100 print:border-none">${this.template.name}</span>
                      <span class="text-slate-400 flex items-center text-xs"><i class="far fa-clock mr-1.5"></i> Actualizado: ${updatedAt}</span>
                   </div>
                </div>
             </div>
        </div>

        <div class="p-6 sm:p-8 print:p-0 print:mt-4">
           ${contentHtml}
        </div>

        <div class="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-between mt-4 print:hidden">
           <div class="flex items-center text-emerald-600 text-xs font-bold uppercase tracking-wider"><i class="fas fa-shield-alt mr-2 text-lg"></i> Cifrado E2EE Verificado</div>
           <div class="hidden sm:block text-slate-300 text-[10px] font-mono">UUID: ${this.document.id}</div>
        </div>
      </div>

      <div id="rowDetailModal" class="fixed inset-0 z-50 hidden no-print">
         <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" id="modalBackdrop"></div>
         <div class="flex items-center justify-center min-h-screen p-4">
            <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg transform transition-all relative overflow-hidden flex flex-col max-h-[85vh]">
                <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 class="font-bold text-lg text-slate-800">Detalles del Registro</h3>
                    <button class="close-modal w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"><i class="fas fa-times"></i></button>
                </div>
                <div class="p-6 overflow-y-auto" id="rowDetailContent"></div>
            </div>
         </div>
      </div>
    `;

    this.setupContentListeners();
  }

  // 2. Agrega este nuevo método a la clase DocumentViewer
  // En src/components/viewer/DocumentViewer.js

  showPrintOptions() {
    // 1. Si NO existe el modal, lo creamos (HTML)
    if (!document.getElementById("printOptionsModal")) {
      const modalHtml = `
        <div id="printOptionsModal" class="fixed inset-0 z-[70] flex items-center justify-center p-4 hidden"> <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" id="printModalBackdrop"></div>
            <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
                <div class="p-6 text-center">
                    <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                        <i class="fas fa-print"></i>
                    </div>
                    <h3 class="text-lg font-bold text-slate-800 mb-2">Selecciona Formato</h3>
                    <p class="text-sm text-slate-500 mb-6">¿Cómo deseas imprimir este documento?</p>
                    
                    <div class="space-y-3">
                        <button id="printStandardBtn" class="w-full flex items-center p-3 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group text-left">
                            <div class="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm mr-3">
                                <i class="fas fa-id-card"></i>
                            </div>
                            <div>
                                <span class="block font-bold text-slate-700 text-sm">Estilo Tarjeta (Visual)</span>
                                <span class="block text-xs text-slate-400">Mejor para presentación</span>
                            </div>
                        </button>

                        <button id="printCompactBtn" class="w-full flex items-center p-3 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left">
                            <div class="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 shadow-sm mr-3">
                                <i class="fas fa-compress-alt"></i>
                            </div>
                            <div>
                                <span class="block font-bold text-slate-700 text-sm">Compacto (Ahorro)</span>
                                <span class="block text-xs text-slate-400">Menos espacio, más datos</span>
                            </div>
                        </button>
                    </div>
                </div>
                <div class="bg-slate-50 p-3 text-center border-t border-slate-100">
                    <button id="cancelPrintBtn" class="text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wide">Cancelar</button>
                </div>
            </div>
        </div>`;
      document.body.insertAdjacentHTML("beforeend", modalHtml);
    }

    // 2. Referencias a elementos
    const modal = document.getElementById("printOptionsModal");
    const closeFn = () => modal.classList.add("hidden");

    // 3. LISTENERS DE CIERRE (Reasignarlos siempre es seguro)
    document.getElementById("printModalBackdrop").onclick = closeFn;
    document.getElementById("cancelPrintBtn").onclick = closeFn;

    // --- CORRECCIÓN CLAVE AQUÍ ---
    // 4. SOBRESCRIBIMOS los eventos onclick CADA VEZ que se llama a la función.
    // Esto asegura que 'this' se refiera a la instancia del documento ACTUAL (Estado Financiero),
    // y no a la instancia vieja (Historia de Salud) que creó el modal originalmente.

    document.getElementById("printStandardBtn").onclick = () => {
      this.triggerPrint(false);
      closeFn();
    };

    document.getElementById("printCompactBtn").onclick = () => {
      this.triggerPrint(true);
      closeFn();
    };

    // 5. Mostrar modal
    modal.classList.remove("hidden");
  }

  // 3. Método auxiliar para llamar al exporter
  triggerPrint(isCompact) {
    const dataToPrint = {
      ...this.document.metadata,
      id: this.document.id,
    };
    // Importante: Ahora pasamos el 4to argumento 'isCompact'
    // Asegúrate de importar printDocument arriba

    printDocument(dataToPrint, this.template, this.decryptedData, isCompact);
  }

  setupContentListeners() {
    // ... (Mantén los listeners existentes: backBtn, deleteDocBtn, editDocBtn, whatsappDocBtn, etc.) ...
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

    const container = document.getElementById("documentViewerPlaceholder");

    // --- NUEVO: Lógica de Tabs del Visor ---
    const tabTriggers = container.querySelectorAll(".viewer-tab-trigger");
    const groupContainers = container.querySelectorAll(
      ".viewer-group-container"
    );
    const themeColor = this.template.color || "#6366f1";

    tabTriggers.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.dataset.target;

        // UI Reset
        tabTriggers.forEach((t) => {
          t.style.backgroundColor = "white";
          t.style.color = "#64748b"; // slate-500
          t.style.borderColor = "#e2e8f0"; // slate-200
        });

        // UI Active (Usando color del tema)
        btn.style.backgroundColor = `${themeColor}15`;
        btn.style.color = themeColor;
        btn.style.borderColor = `${themeColor}30`;

        // Visibilidad
        groupContainers.forEach((grp) => {
          if (grp.id === targetId) {
            grp.classList.remove("md:hidden");
          } else {
            grp.classList.add("md:hidden");
          }
        });
      });
    });

    // --- NUEVO: Lógica de Acordeón del Visor ---
    const accordionTriggers = container.querySelectorAll(
      ".viewer-accordion-trigger"
    );
    accordionTriggers.forEach((btn) => {
      btn.addEventListener("click", () => {
        const grpContainer = btn.closest(".viewer-group-container");
        const content = grpContainer.querySelector(".viewer-group-content");
        const icon = btn.querySelector(".fa-chevron-down");

        const isClosed = content.classList.contains("max-h-0");

        if (isClosed) {
          content.classList.remove("max-h-0", "opacity-0", "overflow-hidden");
          content.classList.add("max-h-[5000px]", "opacity-100", "pb-6");
          icon.classList.add("rotate-180");
        } else {
          content.classList.add("max-h-0", "opacity-0", "overflow-hidden");
          content.classList.remove("max-h-[5000px]", "opacity-100", "pb-6");
          icon.classList.remove("rotate-180");
        }
      });
    });

    // ... (Mantén el resto de listeners: Search, Click delegados, Row Modals) ...
    container.querySelectorAll(".table-search-input").forEach((input) => {
      // ...
      input.addEventListener("input", (e) => {
        const fieldId = e.target.dataset.fieldId;
        this.tableStates[fieldId].search = e.target.value;
        this.updateTableUI(fieldId);
      });
    });

    container.addEventListener("click", (e) => {
      // ... (Tu lógica de delegación existente para Media, Sort, Secretos, etc.)
      const mediaBtn = e.target.closest(".trigger-media-btn");
      if (mediaBtn) {
        e.preventDefault();
        const src = mediaBtn.dataset.src;
        const type = mediaBtn.dataset.type;
        const title = mediaBtn.dataset.title;
        globalPlayer.open(type, src, title);
        return;
      }
      // Copia aquí el resto de tus delegaciones (Sort, Secret, Copy, RowModal)
      // ...
      // Sort Tabla
      const header = e.target.closest(".table-header-sort");
      if (header) {
        const fieldId = header.dataset.fieldId;
        const colId = header.dataset.colId;
        const state = this.tableStates[fieldId];
        if (state.sortCol === colId) {
          state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.sortCol = colId;
          state.sortDir = "asc";
        }
        this.refreshTableFieldHTML(fieldId);
      }
      // ... (Secretos, Copy, ViewRowBtn, etc.)
      const toggleBtn = e.target.closest(".toggle-secret-btn");
      if (toggleBtn) {
        // ... lógica secretos
        let wrapper = toggleBtn.parentElement;
        while (wrapper && !wrapper.querySelector(".secret-mask")) {
          wrapper = wrapper.parentElement;
        }
        if (wrapper) {
          const mask = wrapper.querySelector(".secret-mask");
          const revealed = wrapper.querySelector(".secret-revealed");
          const icon = toggleBtn.querySelector("i");
          if (revealed.classList.contains("hidden")) {
            mask.classList.add("hidden");
            revealed.classList.remove("hidden");
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
            toggleBtn.classList.add("text-indigo-600");
          } else {
            mask.classList.remove("hidden");
            revealed.classList.add("hidden");
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
            toggleBtn.classList.remove("text-indigo-600");
          }
        }
      }
      const copyBtn = e.target.closest(".copy-btn");
      if (copyBtn) {
        navigator.clipboard.writeText(copyBtn.dataset.value);
        const icon = copyBtn.querySelector("i");
        icon.className = "fas fa-check text-emerald-500";
        setTimeout(() => (icon.className = "far fa-copy"), 1500);
      }

      const viewRowBtn = e.target.closest(".view-row-btn");
      if (viewRowBtn)
        this.openRowModal(
          viewRowBtn.dataset.fieldId,
          parseInt(viewRowBtn.dataset.rowIndex)
        );
    });

    const rowModal = document.getElementById("rowDetailModal");
    const closeRowModal = () => rowModal.classList.add("hidden");
    rowModal
      ?.querySelectorAll(".close-modal")
      .forEach((b) => b.addEventListener("click", closeRowModal));
    document
      .getElementById("modalBackdrop")
      ?.addEventListener("click", closeRowModal);
  }

  // ... [MANTENER EL RESTO DE MÉTODOS DE TABLA IGUALES] ...
  // (renderTableField, getProcessedRows, updateTableUI, generateTableBodyHtml, refreshTableFieldHTML, openRowModal, etc.)
  // COPIA Y PEGA LOS MÉTODOS DE TABLA DE TU CÓDIGO ORIGINAL AQUÍ ABAJO
  // Para ahorrar espacio en esta respuesta, asumo que mantienes esos métodos sin cambios.

  renderTableField(field, value) {
    // ... (Código original de renderTableField)
    const rows = Array.isArray(value) ? value : [];
    if (rows.length === 0)
      return `<div class="p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-center text-xs text-slate-400 flex flex-col items-center gap-2"><i class="fas fa-table text-xl opacity-20"></i>${field.label} (Tabla vacía)</div>`;
    const state = this.tableStates[field.id] || {
      search: "",
      sortCol: null,
      sortDir: "asc",
    };
    const processed = this.getProcessedRows(field, rows);
    const isComplex = field.columns.length > 3;
    const displayCols = isComplex ? field.columns.slice(0, 3) : field.columns;
    const headers = displayCols
      .map(
        (c) =>
          `<th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-primary transition select-none table-header-sort" data-field-id="${
            field.id
          }" data-col-id="${c.id}">${c.label} ${
            state.sortCol === c.id ? (state.sortDir === "asc" ? "↑" : "↓") : ""
          }</th>`
      )
      .join("");
    const body = processed
      .map(
        (row, i) =>
          `<tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors last:border-0">${displayCols
            .map(
              (c) =>
                `<td class="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">${this.renderFieldValue(
                  c.type,
                  row[c.id],
                  true
                )}</td>`
            )
            .join("")}${
            isComplex
              ? `<td class="px-4 py-3 text-right"><button class="view-row-btn text-primary bg-indigo-50 hover:bg-indigo-100 p-1.5 rounded-lg transition" data-field-id="${field.id}" data-row-index="${i}"><i class="fas fa-eye text-xs"></i></button></td>`
              : ""
          }</tr>`
      )
      .join("");
    return `<div class="col-span-full mt-2 mb-2"><div class="flex items-center justify-between mb-3"><label class="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2"><i class="fas fa-table"></i> ${
      field.label
    } <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">${
      rows.length
    }</span></label><input type="text" class="table-search-input text-xs border border-slate-200 rounded-lg px-2 py-1.5 w-40 focus:ring-2 focus:ring-primary/20 outline-none bg-slate-50" placeholder="Buscar..." data-field-id="${
      field.id
    }"></div><div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-100"><div class="overflow-x-auto"><table class="min-w-full"><thead class="bg-slate-50/50 border-b border-slate-100"><tr>${headers}${
      isComplex ? "<th></th>" : ""
    }</tr></thead><tbody id="tbody-${
      field.id
    }">${body}</tbody></table></div></div></div>`;
  }

  getProcessedRows(field, rows) {
    // ... (Código original de getProcessedRows)
    const state = this.tableStates[field.id] || {
      search: "",
      sortCol: null,
      sortDir: "asc",
    };
    let processed = [...rows];
    if (state.search) {
      const term = state.search.toLowerCase();
      const columnsToCheck = field.columns.slice(0, 3);
      processed = processed.filter((row) =>
        columnsToCheck.some((col) => {
          let val = row[col.id];
          if (typeof val === "object" && val !== null)
            val = val.text || val.url || "";
          return String(val || "")
            .toLowerCase()
            .includes(term);
        })
      );
    }
    if (state.sortCol) {
      const colId = state.sortCol;
      const colDef = field.columns.find((c) => c.id === colId);
      processed.sort((a, b) => {
        let valA = a[colId];
        let valB = b[colId];
        if (valA === undefined || valA === null) valA = "";
        if (valB === undefined || valB === null) valB = "";
        if (typeof valA === "object") valA = valA.text || valA.url || "";
        if (typeof valB === "object") valB = valB.text || valB.url || "";
        if (
          colDef &&
          ["number", "currency", "percentage"].includes(colDef.type)
        ) {
          return state.sortDir === "asc" ? valA - valB : valB - valA;
        }
        return state.sortDir === "asc"
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }
    return processed;
  }

  updateTableUI(fieldId) {
    // ... (Código original)
    const field = this.template.fields.find((f) => f.id === fieldId);
    const rows = this.decryptedData[fieldId] || [];
    const processed = this.getProcessedRows(field, rows);
    const tbody = document.getElementById(`tbody-${fieldId}`);
    if (tbody) tbody.innerHTML = this.generateTableBodyHtml(field, processed);
  }

  generateTableBodyHtml(field, rows) {
    const fullHtml = this.renderTableField(field, rows);

    // CORRECCIÓN CLAVE:
    // 1. <tbody[^>]*> : Acepta cualquier cosa dentro de la etiqueta (como id="...")
    // 2. ([\s\S]*?)   : Captura todo el contenido, incluyendo saltos de línea (multilínea)
    const match = fullHtml.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);

    if (match) {
      return match[1];
    }

    // FALLBACK ROBUSTO:
    // Si la búsqueda no devuelve resultados (la lista 'rows' está vacía por el filtro),
    // renderTableField devuelve un <div> de "Tabla vacía" en lugar de una <table>.
    // Para no romper la UI, devolvemos una fila avisando que no hay coincidencias.

    const isComplex = field.columns.length > 3;
    const colCount =
      (isComplex ? 3 : field.columns.length) + (isComplex ? 1 : 0);

    return `
        <tr>
            <td colspan="${colCount}" class="px-6 py-8 text-center text-slate-400 text-sm bg-white">
                <div class="flex flex-col items-center gap-2">
                    <i class="fas fa-search opacity-20 text-2xl"></i>
                    <span>No se encontraron coincidencias</span>
                </div>
            </td>
        </tr>
    `;
  }

  refreshTableFieldHTML(fieldId) {
    // ... (Código original)
    const field = this.template.fields.find((f) => f.id === fieldId);
    const rows = this.decryptedData[fieldId] || [];
    const table = document.getElementById(`table-${fieldId}`); // Nota: Asegúrate que tus tablas tengan ID o usa el selector anterior
    // Como tu renderTableField no pone ID a la tabla, usaré el selector por contexto que tenías:
    // Pero tu renderTableField devulve un string...
    // Mantenemos la lógica original tuya:
    const containerDiv = document
      .querySelector(`.table-search-input[data-field-id="${fieldId}"]`)
      .closest(".col-span-full");
    if (containerDiv) {
      containerDiv.outerHTML = this.renderTableField(field, rows);
      // Re-attach listener
      const newContainer = document
        .querySelector(`.table-search-input[data-field-id="${fieldId}"]`)
        .closest(".col-span-full");
      const input = newContainer.querySelector(".table-search-input");
      if (input) {
        input.addEventListener("input", (e) => {
          this.tableStates[fieldId].search = e.target.value;
          this.updateTableUI(fieldId);
        });
      }
    }
  }

  openRowModal(fieldId, rowIndex) {
    const field = this.template.fields.find((f) => f.id === fieldId);
    if (!field) return;

    const rowsOriginal = this.decryptedData[fieldId] || [];
    const rowsProcessed = this.getProcessedRows(field, rowsOriginal);
    const rowData = rowsProcessed[rowIndex];

    const content = field.columns
      .map(
        (col) =>
          `<div class="py-3 border-b border-slate-100 last:border-0">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    ${col.label || col.name}
                </p>
                <div class="text-slate-800 text-sm break-words">
                    ${this.renderFieldValue(
                      col.type,
                      rowData[col.id],
                      col.type === "secret" // <--- AQUÍ ESTÁ EL CAMBIO
                    )}
                </div>
           </div>`
      )
      .join("");

    document.getElementById("rowDetailContent").innerHTML = content;
    document.getElementById("rowDetailModal").classList.remove("hidden");
  }

  renderLoading() {
    // ... (Igual al original)
    document.getElementById(
      "documentViewerPlaceholder"
    ).innerHTML = `<div class="flex flex-col items-center justify-center py-24"><div class="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-primary mb-4"></div><p class="text-slate-400 animate-pulse">Desencriptando documento...</p></div>`;
  }

  renderError(msg) {
    // ... (Igual al original)
    document.getElementById(
      "documentViewerPlaceholder"
    ).innerHTML = `<div class="max-w-2xl mx-auto mt-10 p-6 bg-red-50 border border-red-100 rounded-xl text-center"><i class="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i><h3 class="text-red-800 font-bold text-lg">Error de Carga</h3><p class="text-red-600 mt-2">${msg}</p><button id="backBtn" class="mt-6 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition">Volver</button></div>`;
    document
      .getElementById("backBtn")
      ?.addEventListener("click", () => this.onBack());
  }

  async handleDelete() {
    // ... (Igual al original)
    if (!confirm("¿Estás seguro de eliminar este documento permanentemente?"))
      return;
    try {
      await documentService.delete(this.docId);
      this.onBack();
    } catch (error) {
      alert(error.message);
    }
  }

  handleEdit() {
    // ... (Igual al original)
    this.onBack({
      documentId: this.docId,
      template: this.template,
      formData: this.decryptedData,
      metadata: this.document.metadata,
    });
  }

  async handleCopyToWhatsApp() {
    const btn = document.getElementById("whatsappDocBtn");
    // Feedback visual de "Cargando..."
    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin text-lg"></i>';

    try {
      await copyToWhatsApp(
        this.document.metadata,
        this.template,
        this.decryptedData,
        this.currencyConfig
      );

      // Feedback de Éxito
      btn.innerHTML = '<i class="fas fa-check text-green-500 text-lg"></i>';
      setTimeout(() => (btn.innerHTML = originalIcon), 2000);
    } catch (e) {
      alert("Error al copiar para WhatsApp");
      btn.innerHTML = originalIcon;
    }
  }
}
