import { AbstractViewer } from "../AbstractViewer.js";

export class BooleanViewer extends AbstractViewer {
  render(value) {
    return value
      ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"><i class="fas fa-check mr-1"></i> Sí</span>'
      : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">No</span>';
  }
}
