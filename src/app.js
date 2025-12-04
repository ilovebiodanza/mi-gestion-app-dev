// src/app.js - Archivo principal de la aplicación
import { authService } from "./services/auth.js";
import { AuthForms } from "./components/AuthForms.js";

console.log("Mi Gestión - Aplicación inicializada");

// Esperar a que el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM cargado");
  initializeApplication();
});

/**
 * Función principal para inicializar la aplicación
 * (Renombrada de initApp para evitar conflicto)
 */
async function initializeApplication() {
  const appElement = document.getElementById("app");

  if (!appElement) {
    console.error("Elemento #app no encontrado");
    return;
  }

  // Suscribirse a cambios de autenticación
  authService.subscribe((user) => {
    handleAuthStateChange(user, appElement);
  });

  // Mostrar estado inicial
  const user = authService.getCurrentUser();
  handleAuthStateChange(user, appElement);
}

/**
 * Manejar cambios en el estado de autenticación
 */
function handleAuthStateChange(user, appElement) {
  if (user) {
    // Usuario autenticado - mostrar dashboard
    showDashboard(user, appElement);
  } else {
    // Usuario no autenticado - mostrar formularios de auth
    showAuthForms(appElement);
  }
}

/**
 * Mostrar formularios de autenticación
 */
function showAuthForms(appElement) {
  const authForms = new AuthForms((userData) => {
    // Cuando la autenticación es exitosa
    console.log("Auth success:", userData);
    // El listener de authService manejará la transición
  });

  appElement.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div class="w-full max-w-lg">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <i class="fas fa-shield-alt text-3xl text-blue-600"></i>
          </div>
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Mi Gestión</h1>
          <p class="text-gray-600">Protege tu información personal con cifrado de extremo a extremo</p>
        </div>
        
        <div id="authContainer"></div>
        
        <div class="mt-8 text-center text-sm text-gray-500">
          <p>
            <i class="fas fa-lock mr-1"></i>
            Tus datos nunca salen de tu dispositivo cifrados
          </p>
          <p class="mt-1">
            <i class="fas fa-user-shield mr-1"></i>
            Solo tú puedes acceder a tu información
          </p>
        </div>
      </div>
    </div>
  `;

  // Inicializar formularios de autenticación
  const authContainer = document.getElementById("authContainer");
  if (authContainer) {
    authForms.updateView(authContainer);
  }
}

/**
 * Mostrar dashboard para usuario autenticado
 */
function showDashboard(user, appElement) {
  appElement.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      <!-- Navbar -->
      <nav class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <div class="flex items-center">
                <i class="fas fa-shield-alt text-xl text-blue-600 mr-3"></i>
                <h1 class="text-xl font-bold text-gray-800">Mi Gestión</h1>
              </div>
              <div class="hidden md:block ml-10">
                <div class="flex space-x-4">
                  <a href="#" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    <i class="fas fa-home mr-1"></i> Inicio
                  </a>
                  <a href="#" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    <i class="fas fa-database mr-1"></i> Mis Datos
                  </a>
                  <a href="#" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    <i class="fas fa-cogs mr-1"></i> Configuración
                  </a>
                </div>
              </div>
            </div>
            
            <div class="flex items-center">
              <div class="flex items-center space-x-3">
                <div class="text-right hidden md:block">
                  <p class="text-sm font-medium text-gray-700">${user.email}</p>
                  <p class="text-xs text-gray-500">Usuario Premium</p>
                </div>
                <div class="relative">
                  <button id="userMenuButton" class="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                      ${user.email.charAt(0).toUpperCase()}
                    </div>
                    <i class="fas fa-chevron-down text-gray-600"></i>
                  </button>
                  
                  <!-- Dropdown menu -->
                  <div id="userMenu" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <i class="fas fa-user mr-2"></i> Mi Perfil
                    </a>
                    <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <i class="fas fa-cog mr-2"></i> Configuración
                    </a>
                    <div class="border-t border-gray-100"></div>
                    <button id="logoutButton" class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                      <i class="fas fa-sign-out-alt mr-2"></i> Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-800">Bienvenido, ${
            user.email.split("@")[0]
          }</h2>
          <p class="text-gray-600">Tu información está segura y cifrada</p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-3 bg-blue-100 rounded-lg">
                <i class="fas fa-shield-alt text-blue-600 text-xl"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm text-gray-500">Documentos Protegidos</p>
                <p class="text-2xl font-bold text-gray-800">0</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-3 bg-green-100 rounded-lg">
                <i class="fas fa-key text-green-600 text-xl"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm text-gray-500">Cifrado Activo</p>
                <p class="text-2xl font-bold text-gray-800">E2EE</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-3 bg-purple-100 rounded-lg">
                <i class="fas fa-user-shield text-purple-600 text-xl"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm text-gray-500">Sesión Activa</p>
                <p class="text-2xl font-bold text-gray-800">Ahora</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h3>
            <div class="space-y-3">
              <button class="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
                <div class="flex items-center">
                  <i class="fas fa-plus-circle text-blue-600 mr-3"></i>
                  <span class="font-medium">Agregar Nuevo Dato</span>
                </div>
                <i class="fas fa-chevron-right text-gray-400"></i>
              </button>
              <button class="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition">
                <div class="flex items-center">
                  <i class="fas fa-file-export text-green-600 mr-3"></i>
                  <span class="font-medium">Crear Backup</span>
                </div>
                <i class="fas fa-chevron-right text-gray-400"></i>
              </button>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Estado de Seguridad</h3>
            <div class="space-y-4">
              <div>
                <div class="flex justify-between mb-1">
                  <span class="text-sm font-medium text-gray-700">Fuerza de Cifrado</span>
                  <span class="text-sm font-bold text-green-600">100%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-green-600 h-2 rounded-full" style="width: 100%"></div>
                </div>
              </div>
              <div class="flex items-center text-sm">
                <i class="fas fa-check-circle text-green-500 mr-2"></i>
                <span class="text-gray-600">Todos tus datos están cifrados localmente</span>
              </div>
              <div class="flex items-center text-sm">
                <i class="fas fa-check-circle text-green-500 mr-2"></i>
                <span class="text-gray-600">Ningún dato se transmite sin cifrar</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  // Configurar event listeners del dashboard
  setupDashboardListeners();
}

/**
 * Configurar listeners del dashboard
 */
function setupDashboardListeners() {
  // Menú de usuario
  const userMenuButton = document.getElementById("userMenuButton");
  const userMenu = document.getElementById("userMenu");
  const logoutButton = document.getElementById("logoutButton");

  if (userMenuButton && userMenu) {
    userMenuButton.addEventListener("click", (e) => {
      e.stopPropagation();
      userMenu.classList.toggle("hidden");
    });

    // Cerrar menú al hacer clic fuera
    document.addEventListener("click", () => {
      userMenu.classList.add("hidden");
    });

    userMenu.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      try {
        await authService.logout();
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
        alert("Error al cerrar sesión. Intenta nuevamente.");
      }
    });
  }
}

// Exportar función init para uso externo (mantener este nombre)
export function initApp() {
  console.log("Aplicación inicializada desde export");
  // Llamar a la función interna
  initializeApplication();
}
