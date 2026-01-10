// config.ts
// 🔥 Configuración centralizada del backend

const isDevelopment = __DEV__;

// 🌐 CONFIGURACIÓN DE IPs POR RED
const NETWORK_CONFIGS = {
  // Red de tu casa
  CASA: {
    name: "Red Casa",
    ip: "192.168.1.13",
    port: "8080"
  },
  
  // Red del instituto
  INSTITUTO: {
    name: "Red Instituto",
    ip: "192.168.100.50", // 👈 CAMBIA cuando estés en el instituto
    port: "8080"
  },
  
  // Producción (servidor real)
  PRODUCCION: {
    name: "Servidor Producción",
    ip: "tu-dominio.com",
    port: "8080"
  }
};

// 🔥 SELECCIONA LA RED ACTUAL AQUÍ (solo cambia esta línea)
const CURRENT_NETWORK: keyof typeof NETWORK_CONFIGS = "CASA"; // 👈 Cambia entre "CASA", "INSTITUTO", "PRODUCCION"

// Construye la URL base
const getApiBaseUrl = (): string => {
  const config = NETWORK_CONFIGS[CURRENT_NETWORK];
  
  if (isDevelopment) {
    console.log(`🌐 Conectando a: ${config.name}`);
    console.log(`📡 URL: http://${config.ip}:${config.port}`);
  }
  
  return `http://${config.ip}:${config.port}`;
};

// Exporta la configuración
export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 10000, // 10 segundos
  RETRY_ATTEMPTS: 3,
};

// Funciones auxiliares
export const getCurrentNetwork = () => {
  return NETWORK_CONFIGS[CURRENT_NETWORK];
};

export const getAllNetworks = () => {
  return NETWORK_CONFIGS;
};