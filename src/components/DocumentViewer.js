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
  }

  async load() {
    this.renderLoading();
    try {
      this.document = await documentService.getDocumentById(this.docId);
      this.template = await templateService.getTemplateById(
        this.document.templateId
      );

      if (!this.template) {
        throw new Error("La plantilla asociada a este documento ya no existe.");
      }

      if (!encryptionService.isReady()) {
        throw new Error(
          "El servicio de cifrado no está listo. Por favor, ingresa tu contraseña."
        );
      }

      this.decryptedData = await encryptionService.decryptDocument({
        content: this.document.encryptedContent,
        metadata: this.document.encryptionMetadata,
      });

      this.renderContent();
    } catch (error) {
      console.error("Error al cargar documento:", error);
      this.renderError(error.message);
    }
  }

  renderLoading() {
    const container = document.getElementById("documentViewerPlaceholder");
    if (container) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p class="text-gray-600 animate-pulse">Descifrando información segura...</p>
          <p class="text-xs text-gray-400 mt-2">Aplicando algoritmo AES-GCM-256</p>
        </div>
      `;
    }
  }

  renderError(msg) {
    const container = document.getElementById("documentViewerPlaceholder");
    if (container) {
      container.innerHTML = `
        <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
          <h3 class="text-red-800 font-bold mb-2">Error de Desencriptación</h3>
          <p class="text-red-700">${msg}</p>
          <button id="backBtnError" class="mt-4 bg-white border border-red-300 text-red-700 px-4 py-2 rounded hover:bg-red-50 transition">
            Volver
          </button>
        </div>
      `;
      document
        .getElementById("backBtnError")
        ?.addEventListener("click", () => this.onBack());
    }
  }

  renderContent() {
    const container = document.getElementById("documentViewerPlaceholder");
    if (!container) return;

    const date = new Date(this.document.metadata.updatedAt).toLocaleString();
    const currencyConfig = getLocalCurrency();

    // Generar HTML de los campos
    const fieldsHtml = this.template.fields
      .map((field, index) => {
        // Saltar el primer campo (índice 0)
        if (index === 0) return "";

        const value = this.decryptedData[field.id];
        const label = field.label;

        let displayValue;

        if (
          value === undefined ||
          value === null ||
          (typeof value === "string" && value.length === 0)
        ) {
          displayValue = '<span class="text-gray-400 italic">Sin datos</span>';
        } else if (field.type === "date" && value) {
          try {
            const [year, month, day] = value.split("-").map(Number);
            const dateObj = new Date(year, month - 1, day);

            displayValue = new Intl.DateTimeFormat(currencyConfig.locale, {
              year: "numeric",
              month: "short",
              day: "numeric",
            }).format(dateObj);
          } catch (e) {
            displayValue = value;
          }
        } else if (field.type === "boolean") {
          displayValue = value
            ? '<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Sí</span>'
            : '<span class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">No</span>';
        } else if (field.type === "currency" && typeof value === "number") {
          displayValue = new Intl.NumberFormat(currencyConfig.locale, {
            style: "currency",
            currency: currencyConfig.codigo,
          }).format(value);
        } else if (field.type === "percentage" && typeof value === "number") {
          displayValue = `${value}%`;
        } else if (field.type === "secret") {
          displayValue = `
          <div class="flex items-center gap-2">
            <span class="font-mono bg-gray-100 px-2 py-1 rounded secret-mask" data-value="${value}">••••••••</span>
            
            <button type="button" class="toggle-secret-btn text-gray-500 hover:text-blue-600 transition focus:outline-none" title="Ver/Ocultar">
              <i class="fas fa-eye"></i>
            </button>
            
            <button type="button" class="copy-btn text-gray-400 hover:text-green-600 transition" data-value="${value}" title="Copiar">
               <i class="fas fa-copy"></i>
            </button>
          </div>`;
        } else if (field.type === "url") {
          let url = value;
          let text = value;

          // Detectar si es el nuevo formato objeto
          if (typeof value === "object" && value !== null) {
            url = value.url;
            text = value.text || value.url; // Si no hay texto, usar la URL
          }

          // Si no hay URL, mostrar vacío
          if (!url) {
            displayValue =
              '<span class="text-gray-400 italic">Sin enlace</span>';
          } else {
            // Renderizar enlace con icono
            displayValue = `<a href="${url}" target="_blank" class="text-blue-600 hover:underline flex items-center group">
                <i class="fas fa-external-link-alt mr-2 text-xs text-blue-400 group-hover:text-blue-600"></i> 
                ${text}
            </a>`;
          }
        } else if (field.type === "table") {
          // Renderizar tabla de solo lectura
          const columns = field.columns || [];
          const rows = Array.isArray(value) ? value : [];

          if (rows.length === 0) {
            displayValue =
              '<span class="text-gray-400 italic">Tabla vacía</span>';
          } else {
            const headers = columns
              .map(
                (c) =>
                  `<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">${c.name}</th>`
              )
              .join("");

            const bodyRows = rows
              .map((row) => {
                const cells = columns
                  .map((c) => {
                    let cellVal = row[c.id];
                    // Formato moneda si aplica
                    if (c.type === "currency" && cellVal) {
                      cellVal = new Intl.NumberFormat(currencyConfig.locale, {
                        style: "currency",
                        currency: currencyConfig.codigo,
                      }).format(cellVal);
                    }
                    return `<td class="px-3 py-2 text-sm text-gray-700 border-t border-gray-100">${
                      cellVal || "-"
                    }</td>`;
                  })
                  .join("");
                return `<tr>${cells}</tr>`;
              })
              .join("");

            displayValue = `
                <div class="mt-2 overflow-hidden border border-gray-200 rounded-lg">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead><tr>${headers}</tr></thead>
                        <tbody class="bg-white">${bodyRows}</tbody>
                    </table>
                </div>`;
          }
        } else {
          displayValue = String(value);
        }

        if (value === 0 || value === false) {
          displayValue = String(value);
        }

        const isLongText = field.type === "text";
        const ddClass = isLongText
          ? "mt-2 whitespace-pre-wrap text-gray-800 bg-gray-50 p-3 rounded-md border border-gray-100 text-sm font-normal"
          : "text-gray-900 font-medium break-words";

        return `
        <div class="border-b border-gray-100 last:border-0 py-4">
          <dt class="text-sm font-medium text-gray-500 mb-1 flex items-center">
            ${label}
            ${
              field.sensitive
                ? '<i class="fas fa-lock text-red-400 ml-2 text-xs" title="Campo Sensible"></i>'
                : ""
            }
          </dt>
          <dd class="${ddClass}">${displayValue}</dd>
        </div>
      `;
      })
      .join("");

    container.innerHTML = `
      <div id="documentCard" class="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in max-w-3xl mx-auto">
        
        <div class="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-start">
          <div class="flex items-center">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mr-4 shadow-sm" 
                 style="background-color: ${this.template.color}20; color: ${this.template.color}">
              ${this.template.icon}
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900">${this.document.metadata.title}</h2>
              <p class="text-sm text-gray-500">
                ${this.template.name} • Actualizado: ${date}
              </p>
            </div>
          </div>
          <button id="closeViewerBtn" class="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition no-print">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <div class="p-6">
          <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 flex items-center text-sm text-green-800 no-print">
            <i class="fas fa-check-circle mr-2 text-green-600"></i>
            Datos descifrados exitosamente en tu dispositivo.
          </div>
          
          <dl class="divide-y divide-gray-100">
            ${fieldsHtml}
          </dl>
        </div>

        <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between no-print-section">
          <button id="backBtn" class="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded hover:bg-gray-200 transition">
            <i class="fas fa-arrow-left mr-2"></i> Volver
          </button>
          
          <div class="space-x-2 flex">
            <button id="whatsappDocBtn" class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded transition shadow-sm flex items-center" title="Copiar para WhatsApp">
                <i class="fab fa-whatsapp mr-2"></i> <span class="hidden sm:inline">WhatsApp</span>
            </button>

            <button id="pdfDocBtn" class="bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded transition shadow-sm flex items-center" title="Guardar PDF">
                <i class="fas fa-file-pdf mr-2"></i> <span class="hidden sm:inline">PDF</span>
            </button>

            <button id="deleteDocBtn" class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition shadow-sm" title="Eliminar">
                <i class="fas fa-trash"></i>
            </button>
            <button id="editDocBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition shadow-sm" title="Editar">
                <i class="fas fa-edit"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    this.setupContentListeners();
  }

  // Generar texto para WhatsApp (Formateado)
  async handleCopyToWhatsApp() {
    try {
      const currencyConfig = getLocalCurrency();

      let waText = `*${this.document.metadata.title}*\n_${this.template.name}_\n\n`;

      this.template.fields.forEach((field, index) => {
        if (index === 0) return;

        const label = `*${field.label}:*`;
        let value = this.decryptedData[field.id];

        // Si el campo es tabla, manejamos formato especial
        if (field.type === "table") {
          const rows = Array.isArray(value) ? value : [];
          if (rows.length === 0) {
            value = "_Sin registros_";
            waText += `${label} ${value}\n`;
          } else {
            waText += `${label}\n`;
            const columns = field.columns || [];

            // Caso A: Tabla simple (1 columna) -> Lista con viñetas
            if (columns.length === 1) {
              const col = columns[0];
              rows.forEach((row) => {
                let cellVal = row[col.id];
                // Formatear valor si es necesario
                if (col.type === "currency" && cellVal) {
                  cellVal = new Intl.NumberFormat(currencyConfig.locale, {
                    style: "currency",
                    currency: currencyConfig.codigo,
                  }).format(cellVal);
                } else if (col.type === "date" && cellVal) {
                  try {
                    const [y, m, d] = cellVal.split("-");
                    cellVal = new Intl.DateTimeFormat(currencyConfig.locale, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(y, m - 1, d));
                  } catch (e) {}
                }
                waText += `  • ${cellVal || "-"}\n`;
              });
            }
            // Caso B: Tabla compleja (>1 columna) -> Lista numerada con detalles
            else {
              rows.forEach((row, i) => {
                waText += `  *${i + 1}.*\n`; // Nro de ítem
                columns.forEach((col) => {
                  let cellVal = row[col.id];
                  // Formatear valor
                  if (col.type === "currency" && cellVal) {
                    cellVal = new Intl.NumberFormat(currencyConfig.locale, {
                      style: "currency",
                      currency: currencyConfig.codigo,
                    }).format(cellVal);
                  } else if (col.type === "date" && cellVal) {
                    try {
                      const [y, m, d] = cellVal.split("-");
                      cellVal = new Intl.DateTimeFormat(currencyConfig.locale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(y, m - 1, d));
                    } catch (e) {}
                  }
                  // Sangría de dos espacios como pediste
                  waText += `    ${col.name}: ${cellVal || "-"}\n`;
                });
              });
            }
            waText += "\n"; // Separador visual después de la tabla
            return; // Saltamos la lógica estándar de abajo
          }
        }

        // Lógica estándar para otros campos
        if (value === undefined || value === null || value === "") {
          value = "_N/A_";
        } else if (field.type === "date" && value) {
          try {
            const [year, month, day] = value.split("-").map(Number);
            const dateObj = new Date(year, month - 1, day);
            value = new Intl.DateTimeFormat(currencyConfig.locale, {
              year: "numeric",
              month: "short",
              day: "numeric",
            }).format(dateObj);
          } catch (e) {}
        } else if (field.type === "boolean") {
          value = value ? "Sí" : "No";
        } else if (field.type === "secret") {
          value = `\`\`\`${value}\`\`\``;
        } else if (field.type === "currency" && typeof value === "number") {
          value = new Intl.NumberFormat(currencyConfig.locale, {
            style: "currency",
            currency: currencyConfig.codigo,
          }).format(value);
        } else if (field.type === "percentage") {
          value = `${value}%`;
        } else if (field.type === "url") {
          let url = value;
          let text = value;
          if (typeof value === "object" && value !== null) {
            url = value.url;
            text = value.text;
          }
          // Formato para WhatsApp: "Texto: URL" o solo "URL"
          if (text && text !== url) {
            value = `${text}: ${url}`;
          } else {
            value = url;
          }
        }

        if (field.type === "text") {
          waText += `${label}\n${value}\n\n`;
        } else {
          waText += `${label} ${value}\n`;
        }
      });

      waText += `\n_Generado por Mi Gestión_`;

      await navigator.clipboard.writeText(waText);

      const btn = document.getElementById("whatsappDocBtn");
      const originalHTML = btn.innerHTML;
      const originalClasses = btn.className;

      btn.innerHTML = '<i class="fas fa-check mr-2"></i> Copiado';
      btn.className =
        "bg-green-700 text-white px-3 py-2 rounded transition shadow-sm flex items-center";

      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.className = originalClasses;
      }, 2000);
    } catch (err) {
      console.error("Error al copiar para WhatsApp:", err);
      alert(
        "No se pudo copiar al portapapeles. Verifica los permisos de tu navegador."
      );
    }
  }

  handleExportPDF() {
    window.print();
  }

  handleEdit() {
    const editData = {
      documentId: this.docId,
      template: this.template,
      formData: this.decryptedData,
      metadata: this.document.metadata,
    };
    this.onBack(editData);
  }

  async handleDelete() {
    if (
      !confirm(
        "ADVERTENCIA DE SEGURIDAD:\n¿Estás seguro de que deseas ELIMINAR este documento cifrado? Esta acción es PERMANENTE."
      )
    ) {
      return;
    }

    try {
      const btn = document.getElementById("deleteDocBtn");
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      btn.disabled = true;

      await documentService.deleteDocument(this.docId);

      alert("🗑️ Documento eliminado permanentemente de la bóveda.");
      this.onBack();
    } catch (error) {
      console.error("Error al eliminar documento:", error);
      alert("Error al eliminar: " + error.message);
      document.getElementById("deleteDocBtn").disabled = false;
      document.getElementById("deleteDocBtn").innerHTML =
        '<i class="fas fa-trash"></i>';
    }
  }

  setupContentListeners() {
    document
      .getElementById("closeViewerBtn")
      ?.addEventListener("click", () => this.onBack());
    document
      .getElementById("backBtn")
      ?.addEventListener("click", () => this.onBack());
    document
      .getElementById("deleteDocBtn")
      ?.addEventListener("click", () => this.handleDelete());
    document
      .getElementById("editDocBtn")
      ?.addEventListener("click", () => this.handleEdit());
    document
      .getElementById("pdfDocBtn")
      ?.addEventListener("click", () => this.handleExportPDF());
    document
      .getElementById("whatsappDocBtn")
      ?.addEventListener("click", () => this.handleCopyToWhatsApp());

    const viewerContainer = document.getElementById(
      "documentViewerPlaceholder"
    );

    viewerContainer.querySelectorAll(".toggle-secret-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const button = e.currentTarget;
        const span = button.parentElement.querySelector(".secret-mask");
        const icon = button.querySelector("i");

        const realValue = span.dataset.value;
        const isHidden = span.textContent === "••••••••";

        if (isHidden) {
          span.textContent = realValue;
          icon.classList.remove("fa-eye");
          icon.classList.add("fa-eye-slash");
          span.classList.add("text-blue-700", "font-bold");
        } else {
          span.textContent = "••••••••";
          icon.classList.remove("fa-eye-slash");
          icon.classList.add("fa-eye");
          span.classList.remove("text-blue-700", "font-bold");
        }
      });
    });

    document.querySelectorAll(".copy-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const value = btn.dataset.value;
        navigator.clipboard.writeText(value).then(() => {
          const originalHTML = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-check text-green-600"></i>';
          setTimeout(() => (btn.innerHTML = originalHTML), 2000);
        });
      });
    });
  }

  render() {
    return `<div id="documentViewerPlaceholder"></div>`;
  }
}
