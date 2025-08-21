/**
 * Utilidades para manejar problemas de CORS al interactuar con APIs externas
 */

/**
 * URLs de servicios proxy CORS públicos
 * Estos servicios permiten hacer solicitudes a APIs que no tienen CORS habilitado
 */
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://cors.sh/?',
  'https://api.codetabs.com/v1/proxy?quest='
];

// Índice del proxy actual (rotaremos entre ellos si hay errores)
let currentProxyIndex = 0;

/**
 * Aplica un proxy CORS a una URL
 * @param {string} url - URL original
 * @returns {string} - URL con proxy CORS aplicado
 */
export const applyCorsProxy = (url) => {
  // Verificar si la URL ya está usando nuestro servidor proxy local
  if (url.startsWith('http://localhost:3001/')) {
    return url; // Ya está usando nuestro proxy local, no necesita proxy CORS
  }
  
  // Utilizar el proxy actual y rotar al siguiente para la próxima solicitud
  const proxy = CORS_PROXIES[currentProxyIndex];
  currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
  return `${proxy}${encodeURIComponent(url)}`;
};

/**
 * Determina si una URL necesita un proxy CORS y lo aplica si es necesario
 * @param {string} url - URL original
 * @returns {string} - URL con proxy CORS aplicado si es necesario
 */
export const getProxiedUrlIfNeeded = (url) => {
  // Si la URL es de nuestro servidor proxy local, no necesita proxy CORS
  if (url.startsWith('http://localhost:3001/')) {
    return url;
  }
  
  // Si la URL es de una API externa, aplicar proxy CORS
  return applyCorsProxy(url);
};
