// src/components/editor/core/fields/NumberField.js
import { AbstractField } from "../AbstractField.js";

export class NumberField extends AbstractField {
  constructor(def, value, options) {
    super(def, value, options);
    this.activeMenu = null;
    this.blurTimer = null;
    this.handleScroll = this.removeMenu.bind(this);
  }

  renderInput() {
    const isCurrency = this.def.type === "currency";
    const leftIcon = isCurrency
      ? '<i class="fas fa-dollar-sign absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>'
      : "";
    const paddingLeft = isCurrency ? "pl-10" : "pl-4";

    const rightButton = `
      <button type="button" 
              class="suggestion-trigger absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors z-10" 
              title="Insertar valor de otros campos"
              tabindex="-1">
          <i class="fas fa-list-ul text-xs"></i>
      </button>`;

    return `
      <div class="relative number-field-wrapper">
        ${leftIcon}
        <input 
          type="text" 
          name="${this.def.id}" 
          id="field_${this.def.id}"
          class="js-number-input w-full bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${paddingLeft} pr-12 py-3 font-mono text-right text-slate-700 font-bold placeholder-slate-300 cursor-text"
          value="${
            this.value !== null && this.value !== undefined ? this.value : ""
          }" 
          placeholder="0.00"
          autocomplete="off"
        >
        ${rightButton}
      </div>`;
  }

  postRender(container) {
    super.postRender(container);

    if (this.domElement) {
      // 1. Vincular el Botón (Mousedown para evitar blur prematuro)
      const wrapper = this.domElement.parentElement;
      const triggerBtn = wrapper.querySelector(".suggestion-trigger");

      if (triggerBtn) {
        triggerBtn.addEventListener("mousedown", (e) => {
          e.preventDefault();
          if (document.activeElement !== this.domElement) {
            this.domElement.focus();
          }
          if (this.activeMenu) {
            this.removeMenu();
          } else {
            this.showSuggestions();
          }
        });
      }

      // 2. BLUR
      this.domElement.addEventListener("blur", (e) => {
        this.evaluateMath();
        this.blurTimer = setTimeout(() => this.removeMenu(), 200);
      });

      // 3. KEYDOWN
      this.domElement.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          this.removeMenu();
          return;
        }
        if (e.key === "Enter" || e.key === "=") {
          e.preventDefault();
          this.evaluateMath();
          this.removeMenu();
          return;
        }
        if (this.activeMenu && e.key.length === 1) {
          this.removeMenu();
        }
      });

      window.addEventListener("scroll", this.handleScroll, true);
    }
  }

  showSuggestions() {
    if (this.blurTimer) {
      clearTimeout(this.blurTimer);
      this.blurTimer = null;
    }

    if (this.activeMenu) return;

    const singleFields = this.collectSingleFields();
    const tableAggregations = this.collectTableSums();

    if (singleFields.length === 0 && tableAggregations.length === 0) return;

    // --- CONSTRUCCIÓN DEL MENÚ ---
    const menu = document.createElement("div");
    menu.className =
      "fixed z-[10000] bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden animate-fade-in flex flex-col max-h-[300px]";

    const header = document.createElement("div");
    header.className =
      "bg-slate-50 px-3 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center flex-shrink-0";
    header.innerHTML =
      '<span><i class="fas fa-magic text-indigo-400 mr-1"></i> Sugerencias</span><span class="text-[9px] text-slate-300">ESC cerrar</span>';
    menu.appendChild(header);

    const listContainer = document.createElement("div");
    listContainer.className = "overflow-y-auto custom-scrollbar";

    if (singleFields.length > 0) {
      this.renderSectionHeader(listContainer, "Campos Individuales");
      this.renderListItems(listContainer, singleFields);
    }

    if (tableAggregations.length > 0) {
      tableAggregations.forEach((tbl) => {
        this.renderSectionHeader(listContainer, tbl.tableName);
        this.renderListItems(listContainer, tbl.columns, true);
      });
    }

    menu.appendChild(listContainer);
    document.body.appendChild(menu);
    this.positionMenu(menu);
    this.activeMenu = menu;
  }

  // --- RECOLECCIÓN DE DATOS ---

  collectSingleFields() {
    const suggestions = [];
    const allInputs = document.querySelectorAll(".js-number-input");
    allInputs.forEach((input) => {
      if (input === this.domElement || !input.value.trim()) return;
      // Ignoramos inputs que estén dentro de tablas para no duplicar lógica
      if (input.closest("table")) return;

      let labelText = this.findLabelForInput(input);
      suggestions.push({ label: labelText, value: input.value.trim() });
    });
    return suggestions;
  }

  findLabelForInput(input) {
    let labelText = "Dato Numérico";
    const inputId = input.getAttribute("id");

    if (inputId) {
      const labelEl = document.querySelector(`label[for="${inputId}"]`);
      if (labelEl) labelText = labelEl.innerText;
    }

    if (labelText === "Dato Numérico") {
      let parent = input.closest(".group") || input.closest("div.mb-4");
      if (parent && parent.classList.contains("number-field-wrapper")) {
        parent =
          parent.parentElement.closest(".group") ||
          parent.parentElement.closest("div.mb-4") ||
          parent.parentElement;
      }
      if (parent) {
        const labelFound =
          parent.querySelector("label") ||
          parent.querySelector("dt") ||
          parent.querySelector(".text-sm.font-bold");
        if (labelFound) labelText = labelFound.innerText;
      }
    }
    return labelText.replace(/[:*]/g, "").trim();
  }

  // --- LÓGICA ESTRICTA PARA TABLAS (Solo data-raw-value) ---
  collectTableSums() {
    const tablesData = [];
    const tables = document.querySelectorAll("table");

    tables.forEach((table) => {
      let tableName = "Tabla de Datos";
      // Búsqueda del nombre de la tabla (Table -> Parent -> Parent -> Parent -> Label)
      const p1 = table.parentElement;
      const p2 = p1?.parentElement;
      const p3 = p2?.parentElement;
      if (p3) {
        const labelEl = p3.querySelector("label");
        if (labelEl) tableName = labelEl.innerText.replace(/[:*]/g, "").trim();
      }

      const headers = Array.from(table.querySelectorAll("thead th"));
      const rows = Array.from(table.querySelectorAll("tbody tr"));
      if (rows.length === 0) return;

      const columnsSums = [];

      headers.forEach((th, colIndex) => {
        let sum = 0;
        let count = 0;

        rows.forEach((row) => {
          const cells = row.querySelectorAll("td");
          if (cells[colIndex]) {
            const cell = cells[colIndex];
            let val = null;

            // LÓGICA ESTRICTA: Solo buscamos elementos con data-raw-value
            // No leemos inputs, no leemos innerText.
            const rawElement = cell.querySelector("[data-raw-value]");

            if (rawElement) {
              const raw = rawElement.getAttribute("data-raw-value");
              // Validación estricta de que el valor exista
              if (raw && raw !== "null" && raw !== "undefined" && raw !== "") {
                val = parseFloat(raw);
              }
            }

            if (val !== null && !isNaN(val)) {
              sum += val;
              count++;
            }
          }
        });

        // Si la columna tiene sumatorias válidas y un título
        if (count > 0 && th.innerText.trim() && th.innerText.trim() !== "#") {
          const total = Math.round(sum * 100) / 100;
          if (total !== 0) {
            columnsSums.push({
              label: th.innerText.trim(),
              value: total,
            });
          }
        }
      });

      if (columnsSums.length > 0) {
        tablesData.push({ tableName: tableName, columns: columnsSums });
      }
    });

    return tablesData;
  }

  renderSectionHeader(container, title) {
    const el = document.createElement("div");
    el.className =
      "bg-slate-100/50 px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-y border-slate-50 mt-1 first:mt-0";
    el.innerText = title;
    container.appendChild(el);
  }

  renderListItems(container, items, isSum = false) {
    const ul = document.createElement("ul");
    items.forEach((item) => {
      const li = document.createElement("li");
      li.className =
        "px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors group flex justify-between items-center select-none";

      const iconHtml = isSum
        ? '<i class="fas fa-calculator mr-1 text-[10px] text-slate-400"></i> '
        : "";

      li.innerHTML = `
            <span class="text-xs text-slate-600 font-medium truncate w-2/3 pr-2" title="${item.label}">
                ${iconHtml}${item.label}
            </span>
            <span class="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded group-hover:bg-white border border-transparent group-hover:border-indigo-100 shadow-sm transition-all duration-200">
                ${item.value}
            </span>
          `;

      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.insertValue(item.value);
      });
      ul.appendChild(li);
    });
    container.appendChild(ul);
  }

  positionMenu(menu) {
    const rect = this.domElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const menuHeightEstimate = 300;

    menu.style.width = `${Math.max(rect.width, 240)}px`;
    menu.style.left = `${rect.left}px`;

    const spaceBelow = viewportHeight - rect.bottom;

    if (spaceBelow < menuHeightEstimate) {
      menu.style.bottom = `${viewportHeight - rect.top + 4}px`;
      menu.style.top = "auto";
      menu.classList.add("origin-bottom");
    } else {
      menu.style.top = `${rect.bottom + 4}px`;
      menu.style.bottom = "auto";
      menu.classList.add("origin-top");
    }
  }

  insertValue(val) {
    this.domElement.value += val;
    this.domElement.dispatchEvent(new Event("input"));
    this.domElement.focus();
    this.removeMenu();
  }

  removeMenu() {
    if (this.activeMenu) {
      this.activeMenu.remove();
      this.activeMenu = null;
    }
    if (this.blurTimer) {
      clearTimeout(this.blurTimer);
      this.blurTimer = null;
    }
  }

  evaluateMath() {
    const input = this.domElement;
    const value = input.value.trim();
    if (!value) return;

    // Solo si parece una fórmula (contiene operadores)
    if (/^[\d\s\.\+\-\*\/\(\)]+$/.test(value) && /[\+\-\*\/]/.test(value)) {
      try {
        const result = new Function('"use strict";return (' + value + ")")();

        // CORRECCIÓN SOLICITADA:
        // Si es NaN o Infinito, NO HACER NADA (dejar el texto como está)
        if (isNaN(result) || !isFinite(result)) {
          return;
        }

        // Si es válido, reemplazamos
        const finalVal = Math.round(result * 100) / 100;
        input.value = finalVal;
        this.value = finalVal;
        this.onChange(this.def.id, finalVal);
        this.showSuccessFeedback(input);
      } catch (e) {
        console.warn(e);
      }
    } else {
      // Si no es fórmula, actualizamos el valor normalmente
      this.value = value;
      this.onChange(this.def.id, value);
    }
  }

  showSuccessFeedback(input) {
    input.classList.add("text-emerald-600", "bg-emerald-50");
    setTimeout(() => {
      input.classList.remove("text-emerald-600", "bg-emerald-50");
    }, 800);
  }

  getValue() {
    if (this.value === "" || this.value === null) return null;
    return Number(this.value);
  }
}
