// src/components/templates/TemplateFormRenderers.js
import { generateFieldId } from "../../utils/helpers.js";
import { getFieldTypesConfig } from "../../utils/field-types-config.js";

/**
 * Renderiza la estructura principal del formulario de plantilla.
 */
export function renderMainLayout(isEditing, initialData, fieldsHtml = "") {
  const categoryOptions = [
    { value: "custom", label: "Personalizado" },
    { value: "personal", label: "Personal" },
    { value: "access", label: "Accesos" },
    { value: "financial", label: "Financiero" },
    { value: "health", label: "Salud" },
    { value: "home", label: "Hogar" },
    { value: "car", label: "Vehículo" },
    { value: "job", label: "Trabajo" },
    { value: "education", label: "Formación" },
  ];

  const currentCategory = initialData?.settings?.category || "custom";
  const initialIcon = initialData?.icon || "📋";
  const initialColor = initialData?.color || "#4F46E5";

  return `
      <div class="max-w-4xl mx-auto animate-fade-in-up pb-24 flex flex-col gap-6">
          
          <div class="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-sm sticky top-4 z-40 transition-all">
            <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div class="flex items-center">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center mr-4 shadow-lg shadow-indigo-500/20 flex-shrink-0">
                        <i class="fas fa-${
                          isEditing ? "pen-nib" : "magic"
                        } text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-slate-800 leading-tight">
                            ${
                              isEditing
                                ? "Editar Plantilla"
                                : "Nueva Estructura"
                            }
                        </h3>
                        <p class="text-xs text-slate-500 font-medium">Diseña los campos de tu documento</p>
                    </div>
                </div>
                <div class="flex gap-3 w-full sm:w-auto">
                     <button type="button" id="cancelTemplate" class="flex-1 sm:flex-none px-5 py-2.5 bg-white border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition font-bold text-sm shadow-sm">
                        Cancelar
                     </button>
                     <button type="button" id="saveTemplateBtnHeader" class="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white rounded-xl shadow-lg shadow-indigo-500/30 transition transform active:scale-95 font-bold text-sm flex items-center justify-center gap-2">
                          <i class="fas fa-save"></i> <span>Guardar</span>
                     </button>
                </div>
            </div>
          </div>
          
          <form id="templateForm" class="space-y-6">
              
              <div class="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                  <div class="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                     <i class="fas fa-info-circle text-indigo-400"></i>
                     <h4 class="text-sm font-bold text-slate-500 uppercase tracking-wider">Información Básica</h4>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div class="md:col-span-8">
                          <label class="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Nombre</label>
                          <input type="text" id="templateName" value="${
                            initialData?.name || ""
                          }" 
                                 class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition text-slate-800 font-bold placeholder-slate-400 text-lg" 
                                 required placeholder="Ej: Tarjeta de Crédito">
                      </div>

                      <div class="md:col-span-4">
                          <label class="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Categoría</label>
                          <div class="relative">
                              <select id="templateCategory" class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition appearance-none cursor-pointer font-medium text-slate-700">
                                  ${categoryOptions
                                    .map(
                                      (o) =>
                                        `<option value="${o.value}" ${
                                          o.value === currentCategory
                                            ? "selected"
                                            : ""
                                        }>${o.label}</option>`
                                    )
                                    .join("")}
                              </select>
                              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400"><i class="fas fa-chevron-down text-xs"></i></div>
                          </div>
                      </div>

                      <div class="md:col-span-3">
                          <label class="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Icono</label>
                          <input type="text" id="templateIcon" value="${initialIcon}" 
                                 class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition" 
                                 placeholder="📋">
                      </div>
                      
                      <div class="md:col-span-9">
                          <label class="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Color de Identidad</label>
                          <div class="flex items-center gap-3 h-[52px] border border-slate-200 rounded-xl p-2 bg-slate-50">
                              <input type="color" id="templateColor" value="${initialColor}" class="h-full w-16 rounded-lg cursor-pointer border-none p-0 bg-transparent shadow-sm">
                              <span class="text-xs text-slate-400 font-medium">Selecciona un color para identificar rápidamente esta plantilla.</span>
                          </div>
                      </div>

                      <div class="md:col-span-12">
                          <label class="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Descripción (Opcional)</label>
                          <input type="text" id="templateDescription" value="${
                            initialData?.description || ""
                          }" 
                                 class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition text-slate-600" 
                                 placeholder="Describe brevemente el propósito de este documento...">
                      </div>
                  </div>
              </div>
              
              <div class="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 relative min-h-[400px]">
                  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                             <i class="fas fa-layer-group text-secondary"></i>
                             <h4 class="text-sm font-bold text-slate-500 uppercase tracking-wider">Campos del Documento</h4>
                        </div>
                        <p class="text-xs text-slate-400 ml-6">Arrastra desde <i class="fas fa-grip-vertical text-[10px] mx-1"></i> para ordenar.</p>
                    </div>
                    <button type="button" id="addFieldBtn" class="w-full sm:w-auto px-5 py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition font-bold border border-indigo-200 shadow-sm flex items-center justify-center gap-2 group">
                        <div class="w-5 h-5 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700 group-hover:scale-110 transition-transform"><i class="fas fa-plus text-[10px]"></i></div>
                        <span>Agregar Campo</span>
                    </button>
                  </div>

                  <div id="fieldsContainer" class="space-y-4">${fieldsHtml}
                      </div>
                  
                  <div id="noFieldsMessage" class="hidden flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30 mt-4 transition-all hover:bg-slate-50 hover:border-indigo-200 group cursor-pointer" onclick="document.getElementById('addFieldBtn').click()">
                      <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                          <i class="fas fa-plus text-3xl text-slate-300 group-hover:text-indigo-400"></i>
                      </div>
                      <p class="text-slate-600 font-bold text-lg">Lienzo Vacío</p>
                      <p class="text-sm text-slate-400 group-hover:text-indigo-500 transition-colors">Haz clic para agregar tu primer campo</p>
                  </div>
              </div>
          </form>
      </div>
      ${renderColumnsModalHTML()}
    `;
}

/**
 * Renderiza un item de campo individual (la tarjeta arrastrable).
 */
export function renderFieldItemConfig(field = null, index = 0) {
  const fieldId =
    field?.id || generateFieldId(field?.label || `campo_${index + 1}`, index);
  const fieldTypes = getFieldTypesConfig();
  const isSeparator = field?.type === "separator";

  const cardBg = isSeparator
    ? "bg-slate-50 border-slate-300 shadow-inner"
    : "bg-white border-slate-200 hover:shadow-lg hover:border-primary/50";

  const columnsCount =
    field?.type === "table" && field.columns ? field.columns.length : 0;
  const columnsData =
    field?.type === "table" ? JSON.stringify(field.columns) : "[]";

  return `
    <div class="field-item group relative ${cardBg} border rounded-2xl p-1 transition-all duration-300 hover:z-10" data-field-id="${fieldId}">
      <div class="flex items-stretch">
        <div class="w-10 flex flex-col items-center justify-center text-slate-300 cursor-grab active:cursor-grabbing hover:text-indigo-500 drag-handle rounded-l-xl border-r border-slate-200/50 transition-colors">
            <i class="fas fa-grip-vertical"></i>
        </div>

        <div class="flex-grow p-4">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 mb-3">
                <div class="md:col-span-7">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">
                        ${
                          isSeparator
                            ? "Título de la Sección"
                            : "Etiqueta del Campo"
                        }
                    </label>
                    <input type="text" class="field-label w-full px-3 py-2 bg-white/60 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition font-semibold text-slate-700 text-sm" 
                           value="${field?.label || ""}" 
                           placeholder="${
                             isSeparator ? "Ej: Datos Bancarios" : "Ej: Usuario"
                           }" required />
                </div>
                
                <div class="md:col-span-5">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Tipo de Dato</label>
                    <div class="relative">
                        <select class="field-type w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition appearance-none cursor-pointer text-sm font-medium text-slate-600">
                            ${fieldTypes
                              .map(
                                (t) =>
                                  `<option value="${t.value}" ${
                                    field?.type === t.value ? "selected" : ""
                                  }>${t.label}</option>`
                              )
                              .join("")}
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400"><i class="fas fa-chevron-down text-xs"></i></div>
                    </div>
                </div>
            </div>

            <div class="space-y-3 ${isSeparator ? "hidden" : ""}">
                
                <div class="options-input-group ${
                  field?.type === "select" ? "animate-fade-in" : "hidden"
                }">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Opciones (Separadas por coma)</label>
                    <input type="text" class="field-options w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 placeholder-amber-800/50 focus:ring-2 focus:ring-amber-200 outline-none" 
                           value="${(field?.options || []).join(
                             ", "
                           )}" placeholder="Opción A, Opción B, Opción C">
                </div>

                <div class="table-config-group ${
                  field?.type === "table" ? "animate-fade-in" : "hidden"
                }">
                    <input type="hidden" class="field-columns-data" value='${columnsData}'>
                    <div class="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100 group-hover:bg-indigo-100/50 transition-colors">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100"><i class="fas fa-table"></i></div>
                            <div>
                                <p class="text-sm font-bold text-indigo-900">Estructura de Tabla</p>
                                <p class="text-xs text-indigo-600 font-medium"><span class="columns-count-badge font-extrabold bg-white px-1.5 rounded text-indigo-800">${columnsCount}</span> columnas definidas</p>
                            </div>
                        </div>
                        <button type="button" class="configure-table-btn px-4 py-1.5 bg-white text-indigo-600 text-xs font-bold border border-indigo-200 rounded-lg hover:bg-indigo-600 hover:text-white shadow-sm transition-all transform hover:scale-105">
                            Configurar
                        </button>
                    </div>
                </div>

                <div class="flex items-center justify-end pt-2">
                    <label class="flex items-center cursor-pointer select-none group/check p-1.5 rounded-lg hover:bg-slate-50 transition">
                        <input type="checkbox" class="field-required form-checkbox h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 transition" ${
                          field?.required ? "checked" : ""
                        }>
                        <span class="ml-2 text-xs font-bold text-slate-400 group-hover/check:text-slate-600 transition-colors">Campo Obligatorio</span>
                    </label>
                </div>
            </div>
            
            <div class="${
              isSeparator ? "block" : "hidden"
            } pt-2 pb-1 text-center opacity-60">
                <div class="h-px bg-slate-300 w-full flex items-center justify-center">
                    <span class="bg-slate-200 px-3 py-0.5 rounded text-[10px] text-slate-500 font-bold uppercase tracking-widest">Divisor Visual</span>
                </div>
            </div>
        </div>

        <button type="button" class="remove-field absolute -top-3 -right-3 w-8 h-8 bg-white text-slate-300 hover:text-white hover:bg-red-500 border border-slate-200 hover:border-red-500 rounded-full shadow-md flex items-center justify-center transition-all z-20 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100">
            <i class="fas fa-times text-sm"></i>
        </button>
      </div>
    </div>`;
}

/**
 * Renderiza el modal de configuración de columnas.
 */
export function renderColumnsModalHTML() {
  return `
      <div id="columnsModal" class="fixed inset-0 z-[60] hidden">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in" id="closeModalBackdrop"></div>
        <div class="relative w-full h-full flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] relative animate-fade-in-up overflow-hidden ring-1 ring-slate-900/5">
                
                <div class="px-8 py-6 bg-white border-b border-slate-100 flex justify-between items-center z-10">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">
                            <i class="fas fa-table"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-slate-800">Columnas de la Tabla</h3>
                            <p class="text-xs text-slate-500 font-medium">Define qué datos tendrá cada fila.</p>
                        </div>
                    </div>
                    <button type="button" id="closeModalTop" class="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 w-8 h-8 rounded-full transition flex items-center justify-center"><i class="fas fa-times"></i></button>
                </div>
                
                <div class="p-8 overflow-y-auto flex-grow bg-slate-50/50 custom-scrollbar">
                    <div id="modalColumnsContainer" class="space-y-3"></div>
                    
                    <div id="noColumnsMessage" class="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-300 rounded-2xl bg-white mt-2">
                         <div class="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-2"><i class="fas fa-columns"></i></div>
                        <p class="text-slate-500 font-medium text-sm">No hay columnas definidas</p>
                        <button type="button" id="addColBtnEmpty" class="text-indigo-600 text-sm font-bold hover:underline mt-1">Agregar la primera</button>
                    </div>

                    <button type="button" id="addColBtn" class="mt-6 w-full py-3.5 border-2 border-dashed border-indigo-200 bg-indigo-50/40 text-indigo-600 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-sm transition flex items-center justify-center font-bold text-sm gap-2">
                        <i class="fas fa-plus-circle"></i> Agregar Nueva Columna
                    </button>
                </div>

                <div class="px-8 py-5 border-t border-slate-100 flex justify-end space-x-3 bg-white z-10">
                    <button type="button" id="cancelModalBtn" class="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition text-sm">Cancelar</button>
                    <button type="button" id="saveModalBtn" class="px-6 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition text-sm flex items-center gap-2">
                        <i class="fas fa-check"></i> Aplicar Cambios
                    </button>
                </div>
            </div>
        </div>
      </div>`;
}
