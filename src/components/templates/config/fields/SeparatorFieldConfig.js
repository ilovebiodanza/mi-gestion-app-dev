import { AbstractFieldConfig } from "../AbstractFieldConfig.js";
export class SeparatorFieldConfig extends AbstractFieldConfig {
  /**
   * Sobrescribimos render() completamente porque el Separador es visualmente muy distinto.
   * No tiene "Required" y su estilo es de "Sección".
   */
  render() {
    return `
      <div class="field-item-config group relative bg-slate-50 border border-slate-300 shadow-inner rounded-2xl p-1 transition-all duration-300 mb-4" data-id="${
        this.data.id
      }">
        <div class="flex items-stretch">
          
          <div class="w-10 flex flex-col items-center justify-center text-slate-400 cursor-grab active:cursor-grabbing hover:text-indigo-500 drag-handle rounded-l-xl border-r border-slate-200/50">
              <i class="fas fa-grip-vertical"></i>
          </div>

          <div class="flex-grow p-4">
              <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div class="md:col-span-7">
                      <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">
                          Título de la Sección
                      </label>
                      <input type="text" class="field-label-input w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition font-bold text-slate-800 text-sm shadow-sm" 
                             value="${this.data.label || ""}" 
                             placeholder="Ej: Información Personal" required />
                  </div>
                  
                  <div class="md:col-span-5">
                      <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Tipo</label>
                      <div class="relative opacity-75">
                           <select class="field-type-select w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg outline-none text-sm font-medium text-slate-500 cursor-pointer hover:bg-white transition">
                              ${this.renderTypeOptions()}
                           </select>
                           <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400"><i class="fas fa-chevron-down text-xs"></i></div>
                      </div>
                  </div>
              </div>

              <div class="pt-4 pb-1 text-center opacity-60">
                <div class="h-px bg-slate-300 w-full flex items-center justify-center">
                    <span class="bg-slate-200 px-3 py-0.5 rounded text-[10px] text-slate-500 font-bold uppercase tracking-widest">Divisor Visual</span>
                </div>
            </div>
          </div>

          <button type="button" class="btn-remove-field absolute -top-3 -right-3 w-8 h-8 bg-white text-slate-300 hover:text-white hover:bg-red-500 border border-slate-200 hover:border-red-500 rounded-full shadow-md flex items-center justify-center transition-all z-20 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100">
              <i class="fas fa-times text-sm"></i>
          </button>
        </div>
      </div>
    `;
  }
}
