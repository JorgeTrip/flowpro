/**
 * Configuración global de la aplicación
 */

// API Keys y configuraciones de servicios externos
export const API_CONFIG = {
  // En una implementación real, estas claves deberían estar en variables de entorno
  // y no directamente en el código fuente
  OSRM_API_URL: '/api',
  NOMINATIM_API_URL: '/api/geocode',
  
  // Configuración para las solicitudes a Nominatim
  // Según las políticas de uso de Nominatim, se recomienda incluir
  // un nombre de aplicación y correo electrónico en el User-Agent
  NOMINATIM_USER_AGENT: 'HojaDeRuta/1.0',
  
  // Tiempo de espera entre solicitudes a la API (en milisegundos)
  API_DELAY: 1000
};

// Información de la empresa
export const COMPANY_INFO = {
  NAME: 'Hierbas del Oasis S.R.L.',
  ADDRESS: 'Wenceslao Villafañe 1131, La Boca',
  // Coordenadas aproximadas de la dirección (serán reemplazadas por geocodificación)
  COORDINATES: {
    lat: -34.63458763302512,
    lng: -58.3825873948046
  }
};

// Configuración del mapa
export const MAP_CONFIG = {
  // Coordenadas iniciales para centrar el mapa (Argentina)
  DEFAULT_CENTER: [-34.6037, -58.3816],
  DEFAULT_ZOOM: 12,
  
  // URL del tile server de OpenStreetMap
  TILE_LAYER_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  TILE_LAYER_ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

// Configuración de la aplicación
export const APP_CONFIG = {
  // Formatos de archivo aceptados
  ACCEPTED_FILE_FORMATS: ['.xlsx', '.xls'],
  
  // Columnas requeridas en el archivo Excel
  REQUIRED_COLUMNS: [
    'RAZON SOCIAL', 
    'DIRECCION DE ENTREGA', 
    'LOCALIDAD', 
    'TOTAL A COBRAR'
  ]
};
