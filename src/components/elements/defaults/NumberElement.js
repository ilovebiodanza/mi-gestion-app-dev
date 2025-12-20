import { BaseElement } from "../BaseElement.js";

export class NumberElement extends BaseElement {
  static getType() {
    return "number";
  }
  static getLabel() {
    return "Número";
  }
  static getIcon() {
    return "fas fa-hashtag";
  }
  static getDescription() {
    return "Cantidades, unidades o cálculos matemáticos.";
  }
  static getColumns() {
    return 1;
  }

  renderSettings() {
    return `
      <div class="md:col-span-12">
        <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Placeholder</label>
        <input type="text" id="setting-placeholder-${this.def.id}" value="${
      this.def.placeholder || ""
    }" 
               class="w-full px-3 py-2 bg-white/60 border border-slate-200 rounded-lg text-sm outline-none transition focus:ring-2 focus:ring-indigo-100"
               placeholder="Ej: 0">
      </div>`;
  }

  postRenderSettings(container, updateConfig) {
    container
      .querySelector(`#setting-placeholder-${this.def.id}`)
      ?.addEventListener("input", (e) =>
        updateConfig("placeholder", e.target.value)
      );
  }

  // Símbolo a la izquierda (por defecto #)
  renderLeftSymbol() {
    return `<i class="fas fa-hashtag"></i>`;
  }

  renderEditor() {
    const placeholder = this.def.placeholder || "0";
    const label = this.def.label || "Número";
    const value =
      this.value !== undefined && this.value !== null ? this.value : "";

    return `
      <div class="flex flex-col gap-1 relative group" data-field-id="${
        this.def.id
      }">
        <label class="block text-xs font-bold text-slate-500 uppercase ml-1" for="${
          this.def.id
        }">
          ${label}
        </label>
        
        <div class="relative flex items-center">
          <div class="absolute left-3 text-slate-400 z-10 pointer-events-none">
            ${this.renderLeftSymbol()}
          </div>
          
          <input 
            type="text" 
            inputmode="decimal"
            id="${this.def.id}" 
            value="${value}"
            placeholder="${placeholder}"
            autocomplete="off"
            class="js-number-input w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-10 py-2 text-sm focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all font-mono text-right"
          >

          <button type="button" 
                  id="btn-list-${this.def.id}"
                  class="absolute right-2 text-slate-400 hover:text-brand-600 hover:bg-slate-100 p-1.5 rounded-md transition-colors z-20"
                  title="Insertar valor de otro campo">
            <i class="fas fa-list-ul text-xs"></i>
          </button>

          <ul id="list-menu-${this.def.id}" 
              class="hidden absolute right-0 w-64 bg-white border border-slate-200 shadow-xl rounded-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
              </ul>
        </div>

        <div class="text-[10px] text-slate-400 px-1 hidden md:block text-right">
           <span class="opacity-70">Soporta fórmulas (+ - * /)</span>
        </div>
      </div>
    `;
  }

  postRenderEditor(container, onChange) {
    const input = container.querySelector(`#${this.def.id}`);
    const listBtn = container.querySelector(`#btn-list-${this.def.id}`);
    const listMenu = container.querySelector(`#list-menu-${this.def.id}`);

    if (!input) return;

    // --- 1. LÓGICA DE ALINEACIÓN Y CÁLCULO (Existente) ---

    const evaluateExpression = (expr) => {
      if (/[^0-9+\-*/().\s,]/.test(expr)) return null;
      try {
        const sanitized = expr.replace(/,/g, ".");
        const result = new Function("return " + sanitized)();
        return isFinite(result) ? result : null;
      } catch (e) {
        return null;
      }
    };

    const processValue = () => {
      const rawValue = input.value.trim();
      if (rawValue === "") {
        this.value = null;
        if (onChange) onChange(this.def.id, null);
        return;
      }
      const result = evaluateExpression(rawValue);
      if (result !== null) {
        input.value = result;
        this.value = result;
        if (onChange) onChange(this.def.id, result);
        input.classList.add("text-emerald-600", "font-bold");
        setTimeout(
          () => input.classList.remove("text-emerald-600", "font-bold"),
          500
        );
      } else {
        const prevValue =
          this.value !== undefined && this.value !== null ? this.value : "";
        input.value = prevValue;
        input.classList.add("border-red-500", "bg-red-50");
        setTimeout(
          () => input.classList.remove("border-red-500", "bg-red-50"),
          500
        );
      }
    };

    input.addEventListener("focus", () => {
      input.classList.remove("text-right");
      input.classList.add("text-left");
    });

    input.addEventListener("blur", () => {
      input.classList.remove("text-left");
      input.classList.add("text-right");
      processValue(); // Calculamos al salir
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      }
    });

    // --- 2. LÓGICA DEL MENÚ DE CAMPOS (Nueva Funcionalidad) ---

    // Función para cerrar el menú
    const closeMenu = () => {
      if (!listMenu.classList.contains("hidden")) {
        listMenu.classList.add("hidden");
        // Limpiamos eventos globales para no acumular basura
        document.removeEventListener("click", outsideClickListener);
        document.removeEventListener("keydown", escapeListener);
      }
    };

    // Listener para cerrar con Escape
    const escapeListener = (e) => {
      if (e.key === "Escape") closeMenu();
    };

    // Listener para cerrar al hacer click fuera
    const outsideClickListener = (e) => {
      if (!listMenu.contains(e.target) && !listBtn.contains(e.target)) {
        closeMenu();
      }
    };

    // Función para mostrar el menú
    const openMenu = () => {
      // 1. Encontrar todos los inputs numéricos (js-number-input)
      const allInputs = Array.from(
        document.querySelectorAll("input.js-number-input")
      );

      // Filtrar el propio input actual y aquellos sin valor
      const sources = allInputs
        .filter(
          (el) => el.id !== input.id && el.value && !isNaN(parseFloat(el.value))
        )
        .map((el) => {
          // Intentar encontrar el label asociado:
          // Buscamos el contenedor padre más cercano con [data-field-id] y luego el label dentro
          const parent = el.closest("[data-field-id]");
          const labelEl = parent ? parent.querySelector("label") : null;
          const labelText = labelEl
            ? labelEl.innerText.trim()
            : "Campo sin nombre";

          return {
            label: labelText,
            value: el.value,
            id: el.id,
          };
        });

      // 2. Construir HTML de la lista
      if (sources.length === 0) {
        listMenu.innerHTML = `<li class="px-4 py-3 text-xs text-slate-400 text-center italic">No hay otros valores numéricos disponibles.</li>`;
      } else {
        listMenu.innerHTML = sources
          .map(
            (item) => `
          <li class="border-b border-slate-100 last:border-0">
            <button type="button" 
                    data-val="${item.value}" 
                    class="w-full text-left px-4 py-2 hover:bg-slate-50 flex justify-between items-center group transition-colors">
              <span class="text-xs font-medium text-slate-600 group-hover:text-brand-600 truncate mr-2 max-w-[140px]" title="${item.label}">
                ${item.label}
              </span>
              <span class="text-xs font-mono font-bold text-slate-400 group-hover:text-brand-600 bg-slate-100 group-hover:bg-brand-50 px-1.5 py-0.5 rounded">
                ${item.value}
              </span>
            </button>
          </li>
        `
          )
          .join("");
      }

      // 3. Añadir listeners a los items generados
      listMenu.querySelectorAll("button").forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation(); // Evitar cerrar inmediatamente
          const valToAdd = btn.dataset.val;

          // Lógica de inserción: Si ya hay valor, agregar " + VAL", si no, poner "VAL"
          if (input.value) {
            input.value = `${input.value} + ${valToAdd}`;
          } else {
            input.value = valToAdd;
          }

          // Efecto visual y cierre
          input.focus(); // Esto alineará a la izquierda automáticamente
          closeMenu();
        };
      });

      // 4. Posicionamiento (Arriba o Abajo según espacio)
      listMenu.classList.remove(
        "hidden",
        "bottom-full",
        "top-full",
        "mb-1",
        "mt-1"
      );

      const rect = input.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Preferencia: Arriba (bottom-full) si hay espacio (> 250px), si no, Abajo
      if (spaceBelow > 200) {
        listMenu.classList.add("top-full", "mt-1");
      } else {
        listMenu.classList.add("bottom-full", "mb-1");
      }

      // 5. Activar listeners globales de cierre
      document.addEventListener("click", outsideClickListener);
      document.addEventListener("keydown", escapeListener);
    };

    // Click en el botón de lista
    if (listBtn) {
      listBtn.onclick = (e) => {
        e.stopPropagation();
        if (listMenu.classList.contains("hidden")) {
          openMenu();
        } else {
          closeMenu();
        }
      };
    }
  }

  renderViewer() {
    if (!this.value)
      return '<span class="text-slate-300 text-xs italic">--</span>';
    return `<span class="font-mono text-slate-700 font-medium">${this.value}</span>`;
  }

  renderPrint(mode) {
    const val = this.value || "—";
    if (mode === "compact")
      return `<div class="text-[9px]"><b class="uppercase">${this.def.label}:</b> ${val}</div>`;
    return `<div class="mb-2 page-break avoid-break-inside">
              <dt class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">${this.def.label}</dt>
              <dd class="text-sm text-slate-900 border-b border-slate-100 pb-1 font-mono text-right">${val}</dd>
            </div>`;
  }
}
