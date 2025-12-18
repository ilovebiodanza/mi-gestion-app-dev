// src/app.js
import { toast } from "./components/Toast.js";
import { authService } from "./services/auth.js";
import { AuthForms } from "./components/AuthForms.js";
import { PasswordPrompt } from "./components/PasswordPrompt.js";
import { encryptionService } from "./services/encryption/index.js";
import { TemplateManager } from "./components/templates/TemplateManager.js";
import { templateService } from "./services/templates/index.js";
import { DocumentEditor } from "./components/editor/DocumentEditor.js";
import { VaultList } from "./components/VaultList.js";
import { DocumentViewer } from "./components/viewer/DocumentViewer.js";
import { SettingsManager } from "./components/SettingsManager.js";

console.log("🚀 Mi Gestión - Sistema Iniciado (v2.0 Clean UI)");

document.addEventListener("DOMContentLoaded", () => {
  initializeApplication();
});

async function initializeApplication() {
  const appElement = document.getElementById("app");
  if (!appElement) return;

  authService.subscribe(async (user) => {
    await handleAuthStateChange(user, appElement);
  });

  const user = authService.getCurrentUser();
  await handleAuthStateChange(user, appElement);
}

async function handleAuthStateChange(user, appElement) {
  if (user) {
    if (!user.emailVerified) {
      console.warn("Usuario no verificado. Cerrando sesión...");
      await authService.logout();
      showAuthForms(appElement);
      toast.show("Debes verificar tu correo para continuar", "error");
      return;
    }

    try {
      await templateService.initialize(user.uid);
    } catch (error) {
      console.error("Error init:", error);
    }
    showDashboard(user, appElement);
  } else {
    showAuthForms(appElement);
  }
}

// --- SEGURIDAD ---

// MODIFICAR ESTA FUNCIÓN EN app.js
function requireEncryption(onSuccess, force = false) {
  const user = authService.getCurrentUser();
  if (!user) return;

  const isKeyValidForCurrentUser =
    encryptionService.isReady() && encryptionService.userId === user.uid; // 🚨 AÑADIMOS LA COMPARACIÓN DE UID AQUÍ

  // CAMBIO: Si 'force' es true, saltamos la validación.
  // Pero si NO es forzado Y la clave es válida para ESTE usuario, continuamos.
  if (!force && isKeyValidForCurrentUser) {
    onSuccess();
    return;
  }

  // 🚨 Si el usuario actual es diferente al que tiene la clave en memoria, forzamos el bloqueo
  // antes de mostrar el prompt para limpiar cualquier estado parcial.
  if (encryptionService.userId !== user.uid) {
    encryptionService.lock();
  }

  const prompt = new PasswordPrompt(async (password) => {
    // ... (El resto del callback se mantiene igual, llamando a authService.initializeEncryption) ...
    try {
      await authService.initializeEncryption(password);

      if (encryptionService.isReady()) {
        onSuccess();
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ Validación fallida:", error);
      if (encryptionService.lock) encryptionService.lock();
      return false;
    }
  }, user.email);

  prompt.show();
}

// --- VISTAS ---

function showAuthForms(appElement) {
  const handleError = (error) => {
    console.error("Error UI:", error);
    const msg =
      error.code === "auth/user-not-found" ||
      error.code === "auth/invalid-credential"
        ? "Credenciales incorrectas."
        : error.message || "Error del sistema";
    toast.show(msg, "error");
  };

  const authForms = new AuthForms(() => {
    console.log("✅ Login OK");
  }, handleError);

  // Layout de Login (Clean Tech)
  appElement.innerHTML = `
    <div class="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 sm:px-6 relative overflow-hidden">
      <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      
      <div class="w-full max-w-md relative z-10">
        <div class="text-center mb-10">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/30 mb-4">
               <i class="fas fa-shield-halved text-2xl"></i>
            </div>
            <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Mi Gestión</h1>
            <p class="text-slate-500 mt-2 font-medium">Bóveda Digital Segura</p>
        </div>
        <div id="authContainer"></div>
      </div>
      
      <div class="mt-12 text-center">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          <i class="fas fa-lock text-emerald-500 mr-1"></i> Encriptación E2EE Militar
        </p>
      </div>
    </div>`;

  authForms.updateView(document.getElementById("authContainer"));
}

async function showDashboard(user, appElement) {
  // Layout del Dashboard (Barra de navegación sólida + Contenido)
  appElement.innerHTML = `
    <div class="min-h-screen flex flex-col bg-slate-50">
      <nav class="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex items-center gap-3 cursor-pointer group" id="navHome">
              <div class="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-md group-hover:bg-brand-700 transition-colors">
                 <i class="fas fa-fingerprint text-lg"></i>
              </div>
              <div>
                <span class="block font-bold text-slate-800 text-base leading-none">Mi Gestión</span>
              </div>
            </div>
            
            <div class="flex items-center gap-6">
                <div class="hidden md:flex flex-col items-end">
                    <p class="text-xs font-semibold text-slate-700">${user.email}</p>
                    <div class="flex items-center gap-1.5">
                      <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      <p class="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Encriptado</p>
                    </div>
                </div>
                <div class="h-8 w-px bg-slate-200 hidden md:block"></div>
                <button id="logoutButton" class="text-slate-500 hover:text-red-600 transition-colors text-sm font-medium flex items-center gap-2">
                    <i class="fas fa-power-off"></i>
                    <span class="hidden sm:inline">Salir</span>
                </button>
            </div>
          </div>
        </div>
      </nav>

      <main class="flex-grow max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div id="dynamicContent" class="animate-fade-in"></div>
      </main>
    </div>`;

  document
    .getElementById("logoutButton")
    ?.addEventListener("click", () => authService.logout());
  document
    .getElementById("navHome")
    ?.addEventListener("click", () => showVaultListView(user));
  showVaultListView(user);
}

function showVaultListView(user) {
  const mainContainer = document.getElementById("dynamicContent");
  if (!mainContainer) return;

  // Header de la Sección (Más limpio, sin gradientes locos)
  mainContainer.innerHTML = `
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4 border-b border-slate-200 pb-6">
      <div>
        <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Mis Documentos</h2>
        <p class="text-slate-500 text-sm mt-1">Gestiona y protege tu información personal.</p>
      </div>
      <div class="flex items-center gap-3 w-full sm:w-auto">
          <button id="btnSettings" class="p-2.5 bg-white text-slate-500 hover:text-brand-600 border border-slate-300 rounded-lg hover:border-brand-500 transition-all shadow-sm" title="Configuración">
             <i class="fas fa-cog text-lg"></i>
          </button>
          <button id="btnNewDocVault" class="flex-1 sm:flex-none px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2">
              <i class="fas fa-plus"></i>
              <span>Nuevo Documento</span>
          </button>
      </div>
    </div>
    <div id="vaultListContainer"></div>
  `;

  const vaultList = new VaultList(
    (docId) => requireEncryption(() => showDocumentDetails(docId, user)),
    () => requireEncryption(() => showTemplateManager(user))
  );

  document
    .getElementById("btnNewDocVault")
    ?.addEventListener("click", () => vaultList.onNewDocument());
  document
    .getElementById("btnSettings")
    ?.addEventListener("click", () => showSettings(user));

  vaultList.loadDocuments();
}

// ... Las funciones showDocumentDetails, showTemplateManager, etc.
// se mantienen igual que en tu código original, ya que modificaremos sus clases internas después.
// Por brevedad, copio las funciones clave sin cambios lógicos mayores pero asegurando el uso de IDs correctos.

function showDocumentDetails(docId, user) {
  const mainContainer = document.getElementById("dynamicContent");
  mainContainer.innerHTML = `
    <div id="documentViewerPlaceholder" class="max-w-4xl mx-auto bg-white rounded-xl shadow-card border border-slate-200 p-8 min-h-[400px]">
        <div class="animate-pulse flex space-x-6">
            <div class="w-16 h-16 bg-slate-100 rounded-lg"></div>
            <div class="flex-1 space-y-4 py-1">
                <div class="h-6 bg-slate-100 rounded w-1/3"></div>
                <div class="space-y-3">
                    <div class="h-4 bg-slate-100 rounded"></div>
                    <div class="h-4 bg-slate-100 rounded w-5/6"></div>
                </div>
            </div>
        </div>
    </div>`;

  const viewer = new DocumentViewer(docId, (actionData) => {
    if (actionData) openEditorForUpdate(actionData, user);
    else showVaultListView(user);
  });

  const placeholder = document.getElementById("documentViewerPlaceholder");
  if (placeholder) placeholder.outerHTML = viewer.render();
  viewer.load();
}

function showTemplateManager(user) {
  const mainContainer = document.getElementById("dynamicContent");
  const templateManager = new TemplateManager((templateId) =>
    showDocumentEditor(templateId, user)
  );

  mainContainer.innerHTML = `
    <div class="max-w-6xl mx-auto animate-fade-in">
        <button id="backToDash" class="mb-6 flex items-center text-slate-500 hover:text-brand-600 transition-colors font-medium text-sm">
            <i class="fas fa-arrow-left mr-2"></i> Volver a Documentos
        </button>
        <div id="tmContainer"></div>
    </div>`;

  document.getElementById("tmContainer").innerHTML = templateManager.render();
  document.getElementById("backToDash").onclick = () => showVaultListView(user);

  templateService.initialize(user.uid);
  templateManager.loadTemplates();
}

async function showDocumentEditor(templateId, user) {
  const mainContainer = document.getElementById("dynamicContent");
  mainContainer.innerHTML = `
    <div class="flex flex-col justify-center items-center h-64 gap-4">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-600"></div>
        <p class="text-slate-500 font-medium text-sm">Preparando editor seguro...</p>
    </div>`;

  try {
    const template = await templateService.getTemplateById(templateId);
    const editor = new DocumentEditor(
      { template },
      (newDocId) => {
        if (newDocId) showDocumentDetails(newDocId, user);
        else showVaultListView(user);
      },
      () => showTemplateManager(user)
    );

    mainContainer.innerHTML = `<div id="editorContainer" class="max-w-4xl mx-auto animate-slide-up"></div>`;
    document.getElementById("editorContainer").innerHTML = editor.render();
    editor.setupEventListeners();
  } catch (error) {
    console.error(error);
    alert("Error cargando plantilla");
    showTemplateManager(user);
  }
}

function openEditorForUpdate(initialData, user) {
  const mainContainer = document.getElementById("dynamicContent");
  const editor = new DocumentEditor(
    initialData,
    () => showDocumentDetails(initialData.documentId, user),
    () => showDocumentDetails(initialData.documentId, user)
  );

  mainContainer.innerHTML = `<div id="editorContainer" class="max-w-4xl mx-auto animate-slide-up"></div>`;
  document.getElementById("editorContainer").innerHTML = editor.render();
  editor.setupEventListeners();
}

function showSettings(user) {
  const mainContainer = document.getElementById("dynamicContent");
  mainContainer.innerHTML = `
    <div class="max-w-3xl mx-auto animate-fade-in">
        <button id="backToDash" class="mb-6 flex items-center text-slate-500 hover:text-brand-600 transition-colors font-medium text-sm">
            <i class="fas fa-arrow-left mr-2"></i> Volver
        </button>
        <div id="settingsContainer"></div>
    </div>`;

  const settingsManager = new SettingsManager();
  document.getElementById("settingsContainer").innerHTML =
    settingsManager.render();
  settingsManager.setupEventListeners();
  document.getElementById("backToDash").onclick = () => showVaultListView(user);
}

window.app = { requireEncryption };
export function initApp() {
  initializeApplication();
}
