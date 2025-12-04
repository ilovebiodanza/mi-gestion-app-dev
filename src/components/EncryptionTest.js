/**
 * Componente para probar el cifrado E2EE
 */

import { encryptionService } from "../services/encryption/index.js";

export class EncryptionTest {
  constructor() {
    this.testData = {
      nombre: "Juan Pérez",
      email: "juan@ejemplo.com",
      telefono: "+1234567890",
      direccion: "Calle Principal 123",
      notas: "Información confidencial del usuario",
      fechaNacimiento: "1990-01-01",
      numeroIdentificacion: "123456789",
    };
  }

  /**
   * Renderizar interfaz de prueba
   */
  render() {
    return `
      <div class="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">
          <i class="fas fa-shield-alt text-blue-500 mr-2"></i>
          Prueba de Cifrado E2EE
        </h2>
        
        <div class="space-y-6">
          <!-- Estado del cifrado -->
          <div id="encryptionStatus" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-center">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
              <span class="text-blue-700">Verificando estado del cifrado...</span>
            </div>
          </div>
          
          <!-- Datos de prueba -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="font-semibold text-gray-700 mb-3">Datos de Prueba:</h3>
            <pre id="testData" class="text-sm bg-gray-50 p-3 rounded overflow-x-auto">${JSON.stringify(
              this.testData,
              null,
              2
            )}</pre>
          </div>
          
          <!-- Botones de acción -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button id="btnEncrypt" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
              <i class="fas fa-lock mr-2"></i>
              Cifrar Datos
            </button>
            
            <button id="btnDecrypt" class="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              <i class="fas fa-unlock mr-2"></i>
              Descifrar Datos
            </button>
          </div>
          
          <!-- Resultados -->
          <div id="resultsContainer" class="hidden">
            <h3 class="font-semibold text-gray-700 mb-3">Resultados:</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Datos cifrados -->
              <div class="border border-gray-200 rounded-lg p-4">
                <h4 class="font-medium text-gray-600 mb-2">Datos Cifrados:</h4>
                <div id="encryptedData" class="text-xs font-mono bg-gray-900 text-green-400 p-3 rounded overflow-x-auto h-40 overflow-y-auto">
                  <!-- Se llenará dinámicamente -->
                </div>
                <p class="text-xs text-gray-500 mt-2">Base64 · AES-GCM-256</p>
              </div>
              
              <!-- Datos descifrados -->
              <div class="border border-gray-200 rounded-lg p-4">
                <h4 class="font-medium text-gray-600 mb-2">Datos Descifrados:</h4>
                <pre id="decryptedData" class="text-xs bg-gray-50 p-3 rounded overflow-x-auto h-40 overflow-y-auto">
                  <!-- Se llenará dinámicamente -->
                </pre>
                <p class="text-xs text-gray-500 mt-2">Verificación de integridad</p>
              </div>
            </div>
          </div>
          
          <!-- Estadísticas -->
          <div id="statsContainer" class="hidden">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="bg-gray-50 p-3 rounded-lg">
                <p class="text-xs text-gray-500">Tamaño Original</p>
                <p id="originalSize" class="font-bold text-gray-800">--</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <p class="text-xs text-gray-500">Tamaño Cifrado</p>
                <p id="encryptedSize" class="font-bold text-gray-800">--</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <p class="text-xs text-gray-500">Overhead</p>
                <p id="encryptionOverhead" class="font-bold text-gray-800">--</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <p class="text-xs text-gray-500">Tiempo</p>
                <p id="encryptionTime" class="font-bold text-gray-800">-- ms</p>
              </div>
            </div>
          </div>
          
          <!-- Información de seguridad -->
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 class="font-medium text-green-800 mb-2">
              <i class="fas fa-check-circle mr-2"></i>
              Seguridad Garantizada
            </h4>
            <ul class="text-sm text-green-700 space-y-1">
              <li>• <strong>Cifrado de extremo a extremo:</strong> Los datos nunca salen de tu dispositivo sin cifrar</li>
              <li>• <strong>Clave única por documento:</strong> Cada documento tiene su propia clave de cifrado</li>
              <li>• <strong>AES-GCM 256-bit:</strong> Estándar militar de cifrado</li>
              <li>• <strong>Verificación de integridad:</strong> Detecta cualquier modificación en los datos</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    // Verificar estado del cifrado
    this.checkEncryptionStatus();

    // Botón de cifrar
    document.getElementById("btnEncrypt")?.addEventListener("click", () => {
      this.runEncryptionTest();
    });

    // Botón de descifrar
    document.getElementById("btnDecrypt")?.addEventListener("click", () => {
      this.runDecryptionTest();
    });
  }

  /**
   * Verificar estado del cifrado
   */
  checkEncryptionStatus() {
    const statusElement = document.getElementById("encryptionStatus");

    if (!statusElement) return;

    const status = encryptionService.getStatus();

    if (status.isInitialized && status.hasMasterKey) {
      statusElement.innerHTML = `
      <div class="flex items-center">
        <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
          <i class="fas fa-check text-green-600"></i>
        </div>
        <div>
          <p class="font-medium text-green-800">Cifrado E2EE activo</p>
          <p class="text-sm text-green-600">Clave de ${
            status.keyLength * 8
          } bits · PBKDF2</p>
        </div>
      </div>
    `;

      // Habilitar botones
      const encryptBtn = document.getElementById("btnEncrypt");
      if (encryptBtn) encryptBtn.disabled = false;
    } else {
      statusElement.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
            <i class="fas fa-exclamation-triangle text-yellow-600"></i>
          </div>
          <div>
            <p class="font-medium text-yellow-800">Cifrado no inicializado</p>
            <p class="text-sm text-yellow-600">Esperando activación...</p>
          </div>
        </div>
        <button id="retryEncryption" class="text-sm bg-yellow-100 text-yellow-700 hover:bg-yellow-200 px-3 py-1 rounded-lg transition">
          <i class="fas fa-redo mr-1"></i> Reintentar
        </button>
      </div>
    `;

      // Agregar listener para reintentar
      setTimeout(() => {
        const retryBtn = document.getElementById("retryEncryption");
        if (retryBtn) {
          retryBtn.addEventListener("click", () => {
            this.checkEncryptionStatus();
          });
        }
      }, 100);
    }
  }

  /**
   * Ejecutar prueba de cifrado
   */
  async runEncryptionTest() {
    try {
      const startTime = performance.now();

      // Deshabilitar botones durante la operación
      document.getElementById("btnEncrypt").disabled = true;
      document.getElementById("btnEncrypt").innerHTML =
        '<i class="fas fa-spinner fa-spin mr-2"></i> Cifrando...';

      // Cifrar datos
      const encrypted = await encryptionService.encryptDocument(
        this.testData,
        "test_document"
      );

      const endTime = performance.now();
      const encryptionTime = Math.round(endTime - startTime);

      // Mostrar resultados
      this.displayResults(encrypted, encryptionTime);

      // Guardar datos cifrados para posterior descifrado
      window.lastEncryptedData = encrypted;

      // Habilitar botón de descifrar
      document.getElementById("btnDecrypt").disabled = false;

      // Restaurar botón de cifrar
      document.getElementById("btnEncrypt").innerHTML =
        '<i class="fas fa-lock mr-2"></i> Cifrar Datos';
      document.getElementById("btnEncrypt").disabled = false;
    } catch (error) {
      console.error("Error en prueba de cifrado:", error);
      this.showError("Error al cifrar datos: " + error.message);

      // Restaurar botón
      document.getElementById("btnEncrypt").innerHTML =
        '<i class="fas fa-lock mr-2"></i> Cifrar Datos';
      document.getElementById("btnEncrypt").disabled = false;
    }
  }

  /**
   * Ejecutar prueba de descifrado
   */
  async runDecryptionTest() {
    try {
      if (!window.lastEncryptedData) {
        throw new Error("No hay datos cifrados para descifrar");
      }

      // Deshabilitar botones
      document.getElementById("btnDecrypt").disabled = true;
      document.getElementById("btnDecrypt").innerHTML =
        '<i class="fas fa-spinner fa-spin mr-2"></i> Descifrando...';

      // Descifrar datos
      const decrypted = await encryptionService.decryptDocument(
        window.lastEncryptedData
      );

      // Mostrar datos descifrados
      document.getElementById("decryptedData").textContent = JSON.stringify(
        decrypted,
        null,
        2
      );

      // Verificar integridad
      const isMatch =
        JSON.stringify(decrypted) === JSON.stringify(this.testData);

      if (isMatch) {
        this.showSuccess(
          "✅ Datos descifrados correctamente - Integridad verificada"
        );
      } else {
        this.showWarning(
          "⚠️  Datos descifrados pero la integridad no coincide"
        );
      }

      // Restaurar botón
      document.getElementById("btnDecrypt").innerHTML =
        '<i class="fas fa-unlock mr-2"></i> Descifrar Datos';
      document.getElementById("btnDecrypt").disabled = false;
    } catch (error) {
      console.error("Error en prueba de descifrado:", error);
      this.showError("Error al descifrar: " + error.message);

      document.getElementById("btnDecrypt").innerHTML =
        '<i class="fas fa-unlock mr-2"></i> Descifrar Datos';
      document.getElementById("btnDecrypt").disabled = false;
    }
  }

  /**
   * Mostrar resultados
   */
  displayResults(encryptedData, encryptionTime) {
    // Mostrar contenedores
    document.getElementById("resultsContainer").classList.remove("hidden");
    document.getElementById("statsContainer").classList.remove("hidden");

    // Mostrar datos cifrados (solo parte por seguridad)
    const fullEncrypted = JSON.stringify(encryptedData, null, 2);
    const truncated = fullEncrypted.substring(0, 500) + "...";
    document.getElementById("encryptedData").textContent = truncated;

    // Calcular estadísticas
    const originalSize = JSON.stringify(this.testData).length;
    const encryptedSize = fullEncrypted.length;
    const overhead = (
      ((encryptedSize - originalSize) / originalSize) *
      100
    ).toFixed(1);

    // Mostrar estadísticas
    document.getElementById("originalSize").textContent =
      originalSize + " bytes";
    document.getElementById("encryptedSize").textContent =
      encryptedSize + " bytes";
    document.getElementById("encryptionOverhead").textContent = overhead + "%";
    document.getElementById("encryptionTime").textContent =
      encryptionTime + " ms";

    // Mostrar mensaje de éxito
    this.showSuccess(
      `✅ Datos cifrados en ${encryptionTime}ms (${overhead}% overhead)`
    );
  }

  /**
   * Mostrar mensaje de éxito
   */
  showSuccess(message) {
    this.showMessage(message, "success");
  }

  /**
   * Mostrar error
   */
  showError(message) {
    this.showMessage(message, "error");
  }

  /**
   * Mostrar advertencia
   */
  showWarning(message) {
    this.showMessage(message, "warning");
  }

  /**
   * Mostrar mensaje
   */
  showMessage(message, type = "info") {
    // Crear toast
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg animate-fade-in ${
      type === "success"
        ? "bg-green-500"
        : type === "error"
        ? "bg-red-500"
        : type === "warning"
        ? "bg-yellow-500"
        : "bg-blue-500"
    } text-white`;

    toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${
          type === "success"
            ? "fa-check-circle"
            : type === "error"
            ? "fa-exclamation-circle"
            : type === "warning"
            ? "fa-exclamation-triangle"
            : "fa-info-circle"
        } mr-3"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
      toast.classList.add("animate-fade-out");
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }
}
