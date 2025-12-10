// src/components/DocumentViewer.js

import { documentService } from "../services/documents/index.js";
import { templateService } from "../services/templates/index.js";
import { encryptionService } from "../services/encryption/index.js";
import { getFieldTypeLabel, getLocalCurrency } from "../utils/helpers.js";

export class DocumentViewer {
  constructor(docId, onBack) {
    this.docId = docId;
    this.onBack = onBack;
    this.document = null;
    this.template = null;
    this.decryptedData = null;
    this.currencyConfig = getLocalCurrency();

    // Estado para manejar filtros y ordenamiento de tablas
    // Estructura: { fieldId: { search: "", sortCol: null, sortDir: "asc" } }
    this.tableStates = {};
  }

  render() {
    return `<div id="documentViewerPlaceholder" class="animate-fade-in pb-12"></div>`;
  }

  async load() {
    this.renderLoading();

    // 1. VERIFICACIÓN DE SEGURIDAD (La Muralla)
    // Si el servicio de cifrado no tiene la llave maestra en memoria...
    if (!encryptionService.isReady()) {
      // Delegamos al orquestador global (app.js) para que pida la contraseña
      if (window.app && window.app.requireEncryption) {
        window.app.requireEncryption(() => {
          // Callback: Si el usuario pone la clave correcta, reintentamos cargar
          this.load();
        });
        return; // Detenemos la ejecución aquí
      } else {
        // Fallback por si algo crítico falló en la app
        this.renderError(
          "El sistema de cifrado no está disponible. Por favor recarga la página."
        );
        return;
      }
    }

    try {
      // 2. OBTENER EL DOCUMENTO CIFRADO
      this.document = await documentService.getDocumentById(this.docId);

      // 3. OBTENER LA PLANTILLA (Para saber qué campos mostrar)
      this.template = await templateService.getTemplateById(
        this.document.templateId
      );

      if (!this.template) {
        throw new Error(
          "La plantilla asociada a este documento ya no existe o fue eliminada."
        );
      }

      // 4. DESCIFRAR EL CONTENIDO
      // Aquí usamos la llave maestra que ya validamos en el paso 1
      this.decryptedData = await encryptionService.decryptDocument({
        content: this.document.encryptedContent,
        metadata: this.document.encryptionMetadata,
      });

      // 5. INICIALIZAR ESTADOS DE TABLAS (Para Búsqueda y Ordenamiento)
      // Recorremos los campos para preparar el estado de las tablas si las hay
      if (this.template.fields) {
        this.template.fields.forEach((f) => {
          if (f.type === "table") {
            // Inicializamos el estado solo si no existe
            if (!this.tableStates[f.id]) {
              this.tableStates[f.id] = {
                search: "",
                sortCol: null,
                sortDir: "asc",
              };
            }
          }
        });
      }

      // 6. RENDERIZAR LA VISTA
      this.renderContent();
    } catch (error) {
      console.error("Error al cargar documento:", error);

      // Manejo específico de errores de descifrado (clave incorrecta o datos corruptos)
      let msg = error.message || "Error desconocido al cargar.";
      if (error.message.includes("decrypt")) {
        msg =
          "No se pudo descifrar el documento. Es posible que la contraseña maestra haya cambiado o los datos estén corruptos.";
      }

      this.renderError(msg);
    }
  }

  // --- RENDERIZADO DE VALORES ---
  renderFieldValue(type, value, isTableContext = false) {
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return '<span class="text-slate-300 italic text-xs select-none">Vacío</span>';
    }

    switch (type) {
      case "boolean":
        return value
          ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200"><i class="fas fa-check mr-1"></i> Sí</span>'
          : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">No</span>';

      case "date":
        try {
          const [year, month, day] = String(value).split("-").map(Number);
          const dateObj = new Date(year, month - 1, day);
          return `<span class="font-medium text-slate-700"><i class="far fa-calendar-alt mr-1.5 text-slate-400"></i>${new Intl.DateTimeFormat(
            this.currencyConfig.locale,
            { dateStyle: "medium" }
          ).format(dateObj)}</span>`;
        } catch (e) {
          return value;
        }

      case "currency":
        const numVal = Number(value);
        if (isNaN(numVal)) return value;
        const formatted = new Intl.NumberFormat(this.currencyConfig.locale, {
          style: "currency",
          currency: this.currencyConfig.codigo,
        }).format(numVal);
        return `<span class="font-mono font-medium text-slate-700 tracking-tight">${formatted}</span>`;

      case "percentage":
        return `<span class="font-mono text-slate-700">${value}%</span>`;

      case "secret":
        if (isTableContext) {
          // Versión compacta para tabla
          return `
            <div class="relative group inline-flex items-center">
              <span class="text-xs text-slate-400 font-mono filter blur-[3px] group-hover:blur-none transition-all duration-300 cursor-pointer select-none">••••••</span>
              <span class="absolute inset-0 hidden group-hover:flex items-center justify-center bg-white/90 text-xs font-mono text-slate-800 shadow-sm border rounded px-1">${value}</span>
            </div>`;
        }
        return `
            <div class="relative group inline-flex items-center max-w-full">
              <div class="secret-container relative overflow-hidden rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-sm">
                 <span class="secret-mask filter blur-[4px] select-none transition-all duration-300 group-hover:blur-none font-mono text-sm text-slate-800" data-value="${value}">••••••••••••</span>
                 <span class="secret-revealed hidden font-mono text-sm text-slate-800 select-all">${value}</span>
              </div>
              <button class="toggle-secret-btn ml-2 text-slate-400 hover:text-primary transition-colors p-1" title="Revelar permanentemente">
                <i class="fas fa-eye"></i>
              </button>
              <button class="copy-btn ml-1 text-slate-400 hover:text-emerald-600 transition-colors p-1" data-value="${value}" title="Copiar">
                <i class="far fa-copy"></i>
              </button>
            </div>`;

      case "url":
        let url = value;
        let text = value;
        if (typeof value === "object" && value !== null) {
          url = value.url || "";
          text = value.text || "";
        } else {
          url = String(value || "");
        }

        if (!url)
          return '<span class="text-slate-300 italic text-xs">Sin enlace</span>';
        const displayText = text.trim() !== "" ? text : url;
        const finalDisplay =
          isTableContext && displayText.length > 25
            ? displayText.substring(0, 22) + "..."
            : displayText;

        return `
            <a href="${url}" target="_blank" rel="noopener noreferrer" 
               class="inline-flex items-center gap-1.5 text-primary hover:text-primary-hover hover:underline transition-colors group" 
               title="${url}">
                <i class="fas fa-external-link-alt text-[10px] opacity-70 group-hover:opacity-100"></i>
                <span class="font-medium">${finalDisplay}</span>
            </a>`;

      case "text":
        if (isTableContext)
          return value.length > 30
            ? `<span title="${value}">${value.substring(0, 30)}...</span>`
            : value;
        return `<div class="prose prose-sm max-w-none text-slate-700 bg-slate-50/50 p-4 rounded-xl border border-slate-100 leading-relaxed">${value}</div>`;

      default:
        return String(value);
    }
  }

  renderContent() {
    const container = document.getElementById("documentViewerPlaceholder");
    if (!container) return;

    const updatedAt = new Date(
      this.document.metadata.updatedAt
    ).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const fieldsHtml = this.template.fields
      .map((field, index) => {
        if (index === 0) return "";
        const value = this.decryptedData[field.id];

        if (field.type === "table") return this.renderTableField(field, value);

        const displayValue = this.renderFieldValue(field.type, value);
        return `
        <div class="group py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 hover:bg-slate-50/80 transition-colors rounded-lg">
          <dt class="text-sm font-medium text-slate-500 flex items-center mb-1 sm:mb-0">
             ${field.label}
          </dt>
          <dd class="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2 break-words leading-6">
             ${displayValue}
          </dd>
        </div>
      `;
      })
      .join("");

    container.innerHTML = `
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 px-2 no-print">
         <button id="backBtn" class="flex items-center text-slate-500 hover:text-primary transition-colors font-medium">
            <div class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mr-2 shadow-sm">
                <i class="fas fa-arrow-left text-sm"></i>
            </div>
            <span>Volver</span>
         </button>
         
         <div class="flex items-center gap-2 self-end sm:self-auto bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            <button id="whatsappDocBtn" class="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Copiar para WhatsApp">
               <i class="fab fa-whatsapp text-lg"></i>
            </button>
            <button id="pdfDocBtn" class="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors" title="Imprimir / PDF">
               <i class="fas fa-print text-lg"></i>
            </button>
            <div class="h-6 w-px bg-slate-200 mx-1"></div>
            <button id="deleteDocBtn" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
               <i class="far fa-trash-alt text-lg"></i>
            </button>
            <button id="editDocBtn" class="flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg shadow-sm transition-all text-sm font-medium ml-1">
               <i class="fas fa-pen mr-2 text-xs"></i> <span>Editar</span>
            </button>
         </div>
      </div>

      <div id="documentCard" class="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative print:shadow-none print:border-none">
        <div class="h-1.5 w-full bg-gradient-to-r from-primary to-secondary"></div>
        
        <div class="px-6 py-8 sm:px-8 border-b border-slate-100 bg-white">
          <div class="flex items-start justify-between">
            <div class="flex gap-5">
               <div class="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-slate-50" 
                    style="background-color: ${this.template.color}10; color: ${
      this.template.color
    }">
                  ${this.template.icon}
               </div>
               <div>
                  <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">${
                    this.document.metadata.title
                  }</h1>
                  <div class="flex items-center mt-2 text-sm text-slate-500 space-x-3">
                     <span class="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium text-slate-600 uppercase tracking-wide">${
                       this.template.name
                     }</span>
                     <span>&bull;</span>
                     <span><i class="far fa-clock mr-1"></i> ${updatedAt}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div class="px-4 py-6 sm:px-8">
           <dl class="space-y-1">
              ${fieldsHtml}
           </dl>
        </div>

        <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-center sm:justify-between">
           <div class="flex items-center text-emerald-600 text-xs font-medium">
              <i class="fas fa-lock mr-2"></i> Protegido con cifrado de extremo a extremo
           </div>
           <div class="hidden sm:block text-slate-400 text-xs font-mono">
              ID: ${this.document.id.substring(0, 8)}...
           </div>
        </div>
      </div>

      <div id="rowDetailModal" class="fixed inset-0 z-50 hidden">
         <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" id="modalBackdrop"></div>
         <div class="flex items-center justify-center min-h-screen p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all scale-100 relative overflow-hidden flex flex-col max-h-[85vh]">
                <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 class="font-bold text-slate-800">Detalles del Registro</h3>
                    <button class="close-modal text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full p-1"><i class="fas fa-times"></i></button>
                </div>
                <div class="p-6 overflow-y-auto" id="rowDetailContent"></div>
            </div>
         </div>
      </div>
    `;

    this.setupContentListeners();
  }

  // --- LÓGICA DE TABLAS MEJORADA (Búsqueda y Ordenamiento) ---

  // Función para obtener filas procesadas (filtradas y ordenadas)
  getProcessedRows(field, rows) {
    const state = this.tableStates[field.id] || {
      search: "",
      sortCol: null,
      sortDir: "asc",
    };
    let processed = [...rows];

    // 1. Filtrado
    if (state.search) {
      const term = state.search.toLowerCase();
      const columnsToCheck = field.columns.slice(0, 3); // Buscar solo en columnas visibles
      processed = processed.filter((row) => {
        return columnsToCheck.some((col) => {
          let val = row[col.id];
          // Manejar objetos especiales (URL)
          if (typeof val === "object" && val !== null) {
            val = val.text || val.url || "";
          }
          return String(val || "")
            .toLowerCase()
            .includes(term);
        });
      });
    }

    // 2. Ordenamiento
    if (state.sortCol) {
      const colId = state.sortCol;
      const colDef = field.columns.find((c) => c.id === colId);

      processed.sort((a, b) => {
        let valA = a[colId];
        let valB = b[colId];

        // Normalizar valores nulos
        if (valA === undefined || valA === null) valA = "";
        if (valB === undefined || valB === null) valB = "";

        // Extraer valor real si es URL
        if (typeof valA === "object") valA = valA.text || valA.url || "";
        if (typeof valB === "object") valB = valB.text || valB.url || "";

        // Orden numérico
        if (
          colDef &&
          ["number", "currency", "percentage"].includes(colDef.type)
        ) {
          return state.sortDir === "asc" ? valA - valB : valB - valA;
        }

        // Orden alfanumérico
        return state.sortDir === "asc"
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return processed;
  }

  // Función para generar SOLO el cuerpo de la tabla (usada al filtrar/ordenar)
  generateTableBodyHtml(field, rows) {
    const isComplex = field.columns.length > 3;
    const displayColumns = isComplex
      ? field.columns.slice(0, 3)
      : field.columns;

    if (rows.length === 0) {
      return `<tr><td colspan="${
        displayColumns.length + (isComplex ? 1 : 0)
      }" class="py-8 text-center text-slate-400 text-sm">No se encontraron registros</td></tr>`;
    }

    return rows
      .map((row, idx) => {
        const cells = displayColumns
          .map(
            (c) =>
              `<td class="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">${this.renderFieldValue(
                c.type,
                row[c.id],
                true
              )}</td>`
          )
          .join("");

        const actionBtn = isComplex
          ? `<td class="px-4 py-3 text-right"><button class="view-row-btn text-primary hover:bg-blue-50 p-1.5 rounded transition" data-field-id="${field.id}" data-row-index="${idx}"><i class="fas fa-eye"></i></button></td>`
          : "";

        return `<tr class="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 even:bg-slate-50/50">${cells}${actionBtn}</tr>`;
      })
      .join("");
  }

  // Función para renderizar el componente de tabla completo (Input + Tabla)
  renderTableField(field, value) {
    const rows = Array.isArray(value) ? value : [];
    if (rows.length === 0) {
      return `
        <div class="py-5 px-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/30 text-center my-4">
            <p class="text-sm font-medium text-slate-500 mb-1">${field.label}</p>
            <p class="text-xs text-slate-400">Sin registros almacenados</p>
        </div>`;
    }

    const state = this.tableStates[field.id] || {
      search: "",
      sortCol: null,
      sortDir: "asc",
    };
    const processedRows = this.getProcessedRows(field, rows);

    const isComplex = field.columns.length > 3;
    const displayColumns = isComplex
      ? field.columns.slice(0, 3)
      : field.columns;

    // Headers con funcionalidad de click
    const headers = displayColumns
      .map((c) => {
        let sortIcon = '<i class="fas fa-sort text-slate-300 ml-1"></i>';
        if (state.sortCol === c.id) {
          sortIcon =
            state.sortDir === "asc"
              ? '<i class="fas fa-sort-up text-primary ml-1"></i>'
              : '<i class="fas fa-sort-down text-primary ml-1"></i>';
        }
        return `<th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition select-none table-header-sort" data-field-id="${
          field.id
        }" data-col-id="${c.id}">
            <div class="flex items-center">${
              c.label || c.name
            } ${sortIcon}</div>
        </th>`;
      })
      .join("");

    return `
      <div class="py-6 sm:col-span-3">
         <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
             <div class="flex items-center">
                 <dt class="text-sm font-medium text-slate-500 mr-2">${
                   field.label
                 }</dt>
                 <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">${
                   rows.length
                 } total</span>
             </div>
             
             <div class="relative max-w-xs w-full sm:w-64">
                 <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                     <i class="fas fa-search text-xs"></i>
                 </div>
                 <input type="text" 
                        class="table-search-input w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition outline-none"
                        placeholder="Buscar en tabla..." 
                        data-field-id="${field.id}"
                        value="${state.search}">
             </div>
         </div>

         <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             <div class="overflow-x-auto">
                 <table class="min-w-full divide-y divide-slate-100" id="table-${
                   field.id
                 }">
                    <thead class="bg-slate-50"><tr>${headers}${
      isComplex ? '<th class="w-10"></th>' : ""
    }</tr></thead>
                    <tbody class="divide-y divide-slate-100 bg-white" id="tbody-${
                      field.id
                    }">
                        ${this.generateTableBodyHtml(field, processedRows)}
                    </tbody>
                 </table>
             </div>
             ${
               isComplex
                 ? '<div class="bg-slate-50/50 px-4 py-2 text-[10px] text-slate-400 text-center border-t border-slate-100 uppercase tracking-wide">Mostrando resumen • Click en ojo para detalles</div>'
                 : ""
             }
         </div>
      </div>
    `;
  }

  setupContentListeners() {
    // Botones globales (se mantienen igual)
    ["closeViewerBtn", "backBtn"].forEach((id) =>
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
      ?.addEventListener("click", () => window.print());
    document
      .getElementById("whatsappDocBtn")
      ?.addEventListener("click", () => this.handleCopyToWhatsApp());

    const container = document.getElementById("documentViewerPlaceholder");

    // 1. LISTENERS BÚSQUEDA EN TABLA
    container.querySelectorAll(".table-search-input").forEach((input) => {
      input.addEventListener("input", (e) => {
        const fieldId = e.target.dataset.fieldId;
        const query = e.target.value;
        this.tableStates[fieldId].search = query;
        this.updateTableUI(fieldId);
      });
    });

    // 2. LISTENERS ORDENAMIENTO EN TABLA
    container.addEventListener("click", (e) => {
      const header = e.target.closest(".table-header-sort");
      if (header) {
        const fieldId = header.dataset.fieldId;
        const colId = header.dataset.colId;
        const state = this.tableStates[fieldId];

        // Alternar orden
        if (state.sortCol === colId) {
          state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.sortCol = colId;
          state.sortDir = "asc";
        }
        // Re-renderizar SOLO la tabla (para actualizar iconos y filas)
        this.refreshTableFieldHTML(fieldId);
      }

      // --- Manejo normal de botones (Secret, Copy, RowModal) ---
      // (Se mantiene igual que antes, solo lo copiamos para no perderlo)
      const toggleBtn = e.target.closest(".toggle-secret-btn");
      if (toggleBtn) {
        const wrapper = toggleBtn.parentElement;
        const mask = wrapper.querySelector(".secret-mask");
        const revealed = wrapper.querySelector(".secret-revealed");
        const icon = toggleBtn.querySelector("i");
        if (revealed.classList.contains("hidden")) {
          mask.classList.add("hidden");
          revealed.classList.remove("hidden");
          icon.className = "fas fa-eye-slash";
          toggleBtn.classList.add("text-primary");
        } else {
          mask.classList.remove("hidden");
          revealed.classList.add("hidden");
          icon.className = "fas fa-eye";
          toggleBtn.classList.remove("text-primary");
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

    // Modal cerrar
    const modal = document.getElementById("rowDetailModal");
    const closeModal = () => modal.classList.add("hidden");
    modal
      ?.querySelectorAll(".close-modal")
      .forEach((b) => b.addEventListener("click", closeModal));
    document
      .getElementById("modalBackdrop")
      ?.addEventListener("click", closeModal);
  }

  // --- HELPERS ACTUALIZACIÓN UI PARCIAL ---

  // Actualiza solo el TBODY (usado en Búsqueda)
  updateTableUI(fieldId) {
    const field = this.template.fields.find((f) => f.id === fieldId);
    const rows = this.decryptedData[fieldId] || [];
    const processed = this.getProcessedRows(field, rows);

    const tbody = document.getElementById(`tbody-${fieldId}`);
    if (tbody) {
      tbody.innerHTML = this.generateTableBodyHtml(field, processed);
    }
  }

  // Re-renderiza todo el bloque de la tabla (usado en Sort para actualizar iconos header)
  refreshTableFieldHTML(fieldId) {
    const field = this.template.fields.find((f) => f.id === fieldId);
    const rows = this.decryptedData[fieldId] || [];

    // Encontrar el div padre de la tabla actual y reemplazarlo con el nuevo HTML
    const table = document.getElementById(`table-${fieldId}`);
    if (table) {
      // Subimos hasta encontrar el contenedor padre creado en renderTableField
      const containerDiv = table.closest(".py-6");
      if (containerDiv) {
        containerDiv.outerHTML = this.renderTableField(field, rows);
        // IMPORTANTE: Al reemplazar HTML, los listeners del input de búsqueda se pierden.
        // Hay que reasignarlos.
        const newContainer = document
          .getElementById(`table-${fieldId}`)
          .closest(".py-6");
        const input = newContainer.querySelector(".table-search-input");
        if (input) {
          input.addEventListener("input", (e) => {
            this.tableStates[fieldId].search = e.target.value;
            this.updateTableUI(fieldId);
          });
          // Poner foco de vuelta al input si fue una búsqueda (aunque sort no usa input)
          // En caso de sort, no necesitamos focus.
        }
      }
    }
  }

  // ... (openRowModal, renderLoading, renderError, handleDelete, handleEdit, handleCopyToWhatsApp, getFormattedValueForText se mantienen igual)
  openRowModal(fieldId, rowIndex) {
    const field = this.template.fields.find((f) => f.id === fieldId);
    if (!field) return;

    // IMPORTANTE: Debemos obtener la fila correcta incluso si la tabla está filtrada/ordenada
    // Pero el índice que viene del botón ya corresponde a la lista procesada visualmente?
    // NO, el índice 'rowIndex' en el HTML generado viene del map sobre 'rows' procesadas.
    // Así que necesitamos acceder a la lista procesada, no a la original 'decryptedData'.

    const rowsOriginal = this.decryptedData[fieldId] || [];
    const rowsProcessed = this.getProcessedRows(field, rowsOriginal);
    const rowData = rowsProcessed[rowIndex];

    const content = field.columns
      .map(
        (col) => `
        <div class="py-3 border-b border-slate-100 last:border-0">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">${
              col.label || col.name
            }</p>
            <div class="text-slate-800 text-sm break-words">${this.renderFieldValue(
              col.type,
              rowData[col.id]
            )}</div>
        </div>
    `
      )
      .join("");

    document.getElementById("rowDetailContent").innerHTML = content;
    document.getElementById("rowDetailModal").classList.remove("hidden");
  }

  renderLoading() {
    document.getElementById(
      "documentViewerPlaceholder"
    ).innerHTML = `<div class="flex flex-col items-center justify-center py-24"><div class="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-primary mb-4"></div><p class="text-slate-400 animate-pulse">Desencriptando documento...</p></div>`;
  }

  renderError(msg) {
    document.getElementById(
      "documentViewerPlaceholder"
    ).innerHTML = `<div class="max-w-2xl mx-auto mt-10 p-6 bg-red-50 border border-red-100 rounded-xl text-center"><i class="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i><h3 class="text-red-800 font-bold text-lg">Error de Carga</h3><p class="text-red-600 mt-2">${msg}</p><button id="backBtn" class="mt-6 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition">Volver</button></div>`;
    document
      .getElementById("backBtn")
      ?.addEventListener("click", () => this.onBack());
  }

  async handleDelete() {
    if (!confirm("¿Estás seguro de eliminar este documento permanentemente?"))
      return;
    try {
      await documentService.deleteDocument(this.docId);
      this.onBack();
    } catch (error) {
      alert(error.message);
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
      let waText = `*${this.document.metadata.title}*\n_${this.template.name}_\n\n`;
      this.template.fields.forEach((field, index) => {
        if (index === 0) return;
        const value = this.decryptedData[field.id];
        if (field.type === "table") {
          const rows = Array.isArray(value) ? value : [];
          waText += `*${field.label}:* ${
            rows.length === 0 ? "_Sin datos_" : ""
          }\n`;
          rows.forEach((r, i) => {
            waText += `  ${i + 1}. `;
            field.columns?.forEach(
              (c) =>
                (waText += `${c.label}: ${this.getFormattedValueForText(
                  c.type,
                  r[c.id]
                )} | `)
            );
            waText += `\n`;
          });
        } else {
          waText += `*${field.label}:* ${this.getFormattedValueForText(
            field.type,
            value
          )}\n`;
        }
      });
      waText += `\n_Enviado desde Mi Gestión_`;
      await navigator.clipboard.writeText(waText);
      const btn = document.getElementById("whatsappDocBtn");
      btn.innerHTML = '<i class="fas fa-check text-green-500 text-lg"></i>';
      setTimeout(
        () => (btn.innerHTML = '<i class="fab fa-whatsapp text-lg"></i>'),
        2000
      );
    } catch (e) {
      console.error(e);
    }
  }

  getFormattedValueForText(type, value) {
    if (value === undefined || value === null || value === "") return "_N/A_";
    if (type === "boolean") return value ? "Sí" : "No";
    if (type === "currency")
      return new Intl.NumberFormat(this.currencyConfig.locale).format(
        Number(value)
      );
    return String(value);
  }
}
