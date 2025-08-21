import axios from 'axios';
import { API_CONFIG, COMPANY_INFO } from '../utils/config';
import { getProxiedUrlIfNeeded } from '../utils/corsProxy';

// Esta función se define más abajo con funcionalidad adicional

// Crear un emisor de eventos para informar sobre el progreso
const progressEmitter = new EventTarget();

/**
 * Emite un evento de progreso
 * @param {string} stage - Etapa actual del proceso
 * @param {number} progress - Progreso de 0 a 100
 * @param {string} message - Mensaje descriptivo
 */
const emitProgress = (stage, progress, message) => {
  const event = new CustomEvent('routeProgress', {
    detail: { stage, progress, message }
  });
  progressEmitter.dispatchEvent(event);
};

// Exportar el emisor de eventos para que los componentes puedan suscribirse
export const routeProgressEvents = progressEmitter;

/**
 * Función para esperar un tiempo determinado
 * @param {number} ms - Tiempo en milisegundos
 * @param {string} [message] - Mensaje opcional para mostrar durante la espera
 * @returns {Promise} - Promesa que se resuelve después del tiempo especificado
 */
const delay = (ms, message) => {
  if (message) {
    emitProgress('delay', 0, message);
  }
  
  // Para esperas largas, mostrar una cuenta regresiva
  if (ms > 2000 && message) {
    const startTime = Date.now();
    const endTime = startTime + ms;
    
    return new Promise(resolve => {
      const updateProgress = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(100, (elapsed / ms) * 100);
        const remaining = Math.ceil((ms - elapsed) / 1000);
        
        emitProgress('delay', progress, `${message} (${remaining}s restantes)`);
        
        if (now < endTime) {
          setTimeout(updateProgress, 1000);
        } else {
          resolve();
        }
      };
      
      updateProgress();
    });
  }
  
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Coordenadas de respaldo para cuando falla la geocodificación
 * Estas son coordenadas aproximadas de barrios comunes en Ciudad autónoma de Buenos Aires, Argentina
 */
const FALLBACK_COORDINATES = {
  'CABA': { lat: -34.6037, lng: -58.3816 },
  'LA BOCA': { lat: -34.6345, lng: -58.3631 },
  'BALVANERA': { lat: -34.6152, lng: -58.4023 },
  'SAN NICOLAS': { lat: -34.6037, lng: -58.3816 },
  'BARRACAS': { lat: -34.6463, lng: -58.3815 },
  'MONSERRAT': { lat: -34.6131, lng: -58.3772 },
  'RECOLETA': { lat: -34.5873, lng: -58.3939 },
  'PALERMO': { lat: -34.5882, lng: -58.4294 },
  'BUENOS AIRES': { lat: -34.6037, lng: -58.3816 },
  // Coordenada por defecto (Buenos Aires)
  'DEFAULT': { lat: -34.6037, lng: -58.3816 }
};

/**
 * Obtiene las coordenadas geográficas (latitud y longitud) de una dirección
 * @param {string|Object} address - Dirección a geocodificar (puede ser un string o un objeto con propiedad address)
 * @param {number} [index] - Índice de la dirección en la lista (para progreso)
 * @param {number} [total] - Total de direcciones a geocodificar (para progreso)
 * @returns {Promise<Object>} - Coordenadas de la dirección
 */
export const geocodeAddress = async (address, index, total) => {
  try {
    // Asegurarse de que tenemos una cadena de texto para la dirección
    let addressString = '';
    if (typeof address === 'string') {
      addressString = address;
    } else if (address && typeof address === 'object' && address.address) {
      addressString = address.address;
    } else {
      console.error('[ERROR] Formato de dirección inválido:', address);
      throw new Error('Formato de dirección inválido');
    }
    
    // Verificar si tenemos coordenadas manuales para esta dirección
    if (index !== undefined && manualCoordinates && manualCoordinates[index]) {
      console.log(`[INFO] Usando coordenadas manuales para dirección ${index}: ${manualCoordinates[index].lat}, ${manualCoordinates[index].lng}`);
      
      // Devolver las coordenadas manuales
      return {
        lat: manualCoordinates[index].lat,
        lng: manualCoordinates[index].lng,
        address: manualCoordinates[index].address || addressString,
        source: 'manual'
      };
    }
    
    // Validar que la dirección no esté vacía
    if (!addressString.trim()) {
      console.error('[ERROR] Dirección vacía');
      throw new Error('La dirección no puede estar vacía');
    }
    
    console.log('[DEBUG] Geocodificando dirección:', addressString);
    
    // Mostrar progreso de geocodificación
    if (index !== undefined && total !== undefined) {
      const progress = Math.round((index / total) * 100);
      emitProgress('geocoding', progress, `Geocodificando dirección ${index + 1} de ${total}: ${addressString}`);
    }
    
    // Esperar el tiempo configurado entre consultas
    await delay(API_CONFIG.API_DELAY, `Esperando para geocodificar: ${addressString}`);
    
    // Consultar la API para obtener las coordenadas con reintentos
    let attempts = 0;
    let response;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        // Agregar retraso entre intentos (adicional al delay ya configurado)
        if (attempts > 0) {
          const backoffDelay = Math.pow(2, attempts) * 1000;
          console.log(`[DEBUG] Reintento ${attempts}/${maxAttempts} para geocodificar "${addressString}". Esperando ${backoffDelay}ms...`);
          await delay(backoffDelay);
        }
        
        response = await axios.get(`${API_CONFIG.NOMINATIM_API_URL}?address=${encodeURIComponent(addressString)}`, {
          timeout: 10000, // 10 segundos de timeout
          headers: {
            'User-Agent': 'HojaDeRuta/1.0 (https://hojaderuta.app)'
          }
        });
        break; // Si la solicitud es exitosa, salir del bucle
      } catch (err) {
        attempts++;
        console.warn(`[WARN] Intento ${attempts}/${maxAttempts} fallido para geocodificar "${addressString}": ${err.message}`);
        
        if (attempts >= maxAttempts) {
          throw err; // Lanzar el error si se agotaron los intentos
        }
      }
    }
    
    // Verificar si se encontraron resultados
    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      
      // Extraer latitud y longitud
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      
      // Validar que las coordenadas sean números válidos
      if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
        console.error(`[ERROR] Coordenadas inválidas para: ${addressString}`, { lat, lng });
        throw new Error(`Coordenadas inválidas para: ${addressString}`);
      }
      
      console.log(`Geocodificación exitosa para: ${addressString}`, { lat, lng });
      
      return {
        address: addressString,
        lat,
        lng,
        displayName: result.display_name,
        osmType: result.osm_type,
        osmId: result.osm_id
      };
    } else {
      console.warn(`No se encontraron resultados para: ${addressString}`);
      
      // Verificar si podemos usar coordenadas de respaldo
      const upperAddress = addressString.toUpperCase();
      
      // Buscar coincidencias en las coordenadas de respaldo
      for (const [key, coords] of Object.entries(FALLBACK_COORDINATES)) {
        if (upperAddress.includes(key)) {
          console.warn(`Usando coordenadas de respaldo para: ${addressString} (coincidencia: ${key})`);
          
          return {
            address: addressString,
            lat: coords.lat,
            lng: coords.lng,
            isFallback: true,
            fallbackMatch: key
          };
        }
      }
      
      // Si no hay coincidencias específicas, usar las coordenadas por defecto
      console.warn(`Usando coordenadas de respaldo DEFAULT para: ${addressString}`);
      
      return {
        address: addressString,
        lat: FALLBACK_COORDINATES.DEFAULT.lat,
        lng: FALLBACK_COORDINATES.DEFAULT.lng,
        isFallback: true,
        fallbackMatch: 'DEFAULT'
      };
    }
  } catch (error) {
    console.error(`Error al geocodificar: ${error.message}`);
    
    // Intentar usar coordenadas de respaldo
    const upperAddress = (typeof address === 'string') 
      ? address.toUpperCase() 
      : (address && address.address) 
        ? address.address.toUpperCase() 
        : '';
    
    // Buscar coincidencias en las coordenadas de respaldo
    for (const [key, coords] of Object.entries(FALLBACK_COORDINATES)) {
      if (upperAddress.includes(key)) {
        console.warn(`Usando coordenadas de respaldo para error: ${upperAddress} (coincidencia: ${key})`);
        
        return {
          address: typeof address === 'string' ? address : (address && address.address) ? address.address : 'Dirección desconocida',
          lat: coords.lat,
          lng: coords.lng,
          isFallback: true,
          fallbackMatch: key,
          error: error.message
        };
      }
    }
    
    // Si no hay coincidencias específicas, usar las coordenadas por defecto
    console.warn(`Usando coordenadas de respaldo DEFAULT para error: ${upperAddress}`);
    
    return {
      address: typeof address === 'string' ? address : (address && address.address) ? address.address : 'Dirección desconocida',
      lat: FALLBACK_COORDINATES.DEFAULT.lat,
      lng: FALLBACK_COORDINATES.DEFAULT.lng,
      isFallback: true,
      fallbackMatch: 'DEFAULT',
      error: error.message
    };
  }
};

/**
 * Calcula una ruta directa entre puntos (modo de respaldo)
 * @param {Array} waypoints - Lista de puntos con coordenadas
 * @returns {Object} - Información de la ruta directa
 */
export const calculateDirectRoute = async (waypoints) => {
  try {
    // Filtrar waypoints con coordenadas válidas
    const validWaypoints = waypoints.filter(wp => 
      wp && typeof wp.lat === 'number' && !isNaN(wp.lat) && 
      typeof wp.lng === 'number' && !isNaN(wp.lng)
    );
    
    console.log('[DEBUG] Waypoints válidos para optimización:', validWaypoints.length, 'de', waypoints.length);
    
    // Verificar que haya suficientes puntos para optimizar
    if (validWaypoints.length < 2) {
      console.error('[ERROR] No hay suficientes puntos válidos para optimizar la ruta');
      throw new Error('No hay suficientes puntos válidos para optimizar la ruta');
    }
    
    // Construir el string de coordenadas para la API usando SOLO waypoints válidos
    const coordinates = validWaypoints.map(wp => `${wp.lng.toFixed(6)},${wp.lat.toFixed(6)}`).join(';');
    
    // Intentar calcular la distancia real del recorrido por calles usando la API
    try {
      // Consultar la API para obtener la distancia real
      console.log(`Intentando calcular la ruta directa con coordenadas: ${coordinates}`);
      console.log(`URL de API para ruta directa: ${API_CONFIG.OSRM_API_URL}/route`);
      
      try {
        console.log(`[DEBUG] Enviando solicitud directa a: ${API_CONFIG.OSRM_API_URL}/route?coordinates=${coordinates}`);
        
        const response = await axios.get(`${API_CONFIG.OSRM_API_URL}/route?coordinates=${coordinates}`, {
          // No enviamos parámetros aquí porque ya están en la URL
        });
        
        console.log('[DEBUG] Respuesta directa recibida:', response.status);
        console.log('[DEBUG] Datos de respuesta directa:', response.data ? 'Disponibles' : 'No disponibles');
        console.log('[DEBUG] Tiene rutas directas:', response.data?.routes ? 'Sí' : 'No');
        console.log('[DEBUG] Cantidad de rutas directas:', response.data?.routes?.length || 0);
        
        // Si la API responde correctamente, usar esos datos
        if (response.data && response.data.routes && response.data.routes.length > 0) {
          const route = response.data.routes[0];
          
          // Obtener la distancia total en metros y convertirla a kilómetros
          const distanceInMeters = route.distance || 0;
          const distanceInKm = (distanceInMeters / 1000).toFixed(2);
          
          console.log(`[DEBUG] Distancia directa calculada: ${distanceInKm} km`);
          
          // Obtener la duración total en segundos y convertirla a horas y minutos
          const durationInSeconds = route.duration || 0;
          const hours = Math.floor(durationInSeconds / 3600);
          const minutes = Math.floor((durationInSeconds % 3600) / 60);
          const durationFormatted = hours > 0 
            ? `${hours} h ${minutes} min` 
            : `${minutes} min`;
          
          console.log(`[DEBUG] Duración directa calculada: ${durationFormatted}`);
          
          // Crear un objeto GeoJSON con la geometría de la ruta
          const geometry = route.geometry;
          
          console.log('[DEBUG] Ruta directa calculada exitosamente usando la API');
          
          return {
            waypoints: validWaypoints,
            geometry,
            distance: distanceInKm,
            distanceInMeters,
            duration: durationFormatted,
            durationInSeconds,
            usingFallbackMode: false // Usando ruta real, no fallback
          };
        } else {
          console.error('[ERROR] La API directa devolvió una respuesta sin rutas:', response.data);
          throw new Error('La API directa no devolvió rutas válidas');
        }
      } catch (apiError) {
        console.error('[ERROR] Error al intentar calcular la distancia real:', apiError.message);
        if (apiError.response) {
          console.error('[ERROR] Detalles de la respuesta del servidor:', {
            status: apiError.response.status,
            statusText: apiError.response.statusText,
            data: apiError.response.data
          });
        } else if (apiError.request) {
          console.error('[ERROR] No se recibió respuesta del servidor:', apiError.request);
        } else {
          console.error('[ERROR] Error en la configuración de la solicitud:', apiError.message);
        }
        
        // En lugar de usar el cálculo en línea recta, lanzar el error para ver los detalles completos
        throw apiError;
      }
      
      // Si la API falla, calcular la distancia en línea recta (último recurso)
      // Comentado para ver el error completo
      /*
      // Crear un arreglo de coordenadas para la polilínea
      const lineCoordinates = validWaypoints.map(wp => [wp.lng, wp.lat]);
      
      // Calcular la distancia total usando la fórmula de Haversine
      let totalDistanceInMeters = 0;
      for (let i = 0; i < validWaypoints.length - 1; i++) {
        const start = validWaypoints[i];
        const end = validWaypoints[i + 1];
        totalDistanceInMeters += haversineDistance(start.lat, start.lng, end.lat, end.lng);
      }
      
      // Convertir la distancia a kilómetros
      const distanceInKm = (totalDistanceInMeters / 1000).toFixed(2);
      
      // Estimar la duración (asumiendo una velocidad promedio de 30 km/h en ciudad)
      const speedKmPerHour = 30;
      const durationInHours = totalDistanceInMeters / 1000 / speedKmPerHour;
      const durationInSeconds = durationInHours * 3600;
      const hours = Math.floor(durationInHours);
      const minutes = Math.floor((durationInHours - hours) * 60);
      const durationFormatted = hours > 0 
        ? `${hours} h ${minutes} min` 
        : `${minutes} min`;
      
      // Crear un objeto GeoJSON con la geometría de la polilínea
      const geometry = {
        type: 'LineString',
        coordinates: lineCoordinates
      };
      
      return {
        waypoints: validWaypoints,
        geometry,
        distance: distanceInKm,
        distanceInMeters: totalDistanceInMeters,
        duration: durationFormatted,
        durationInSeconds,
        usingFallbackMode: true
      };
      */
    } catch (error) {
      console.error('Error al calcular la ruta directa:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error al calcular la ruta directa:', error);
    throw error;
  }
};

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 * @param {number} lat1 - Latitud del punto 1
 * @param {number} lon1 - Longitud del punto 1
 * @param {number} lat2 - Latitud del punto 2
 * @param {number} lon2 - Longitud del punto 2
 * @returns {number} - Distancia en metros
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  // Radio de la Tierra en metros
  const R = 6371000;
  
  // Convertir latitud y longitud de grados a radianes
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  
  // Fórmula de Haversine
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Distancia en metros
  return R * c;
};

/**
 * Calcula la ruta optimizada entre las direcciones proporcionadas
 * @param {Array} addresses - Array de direcciones a incluir en la ruta
 * @returns {Object} - Objeto con la información de la ruta
 */
// Almacena las direcciones que no pudieron ser geocodificadas correctamente
export let failedAddresses = [];

// Función para obtener las direcciones fallidas
export const getFailedAddresses = () => {
  return failedAddresses;
};

// Función para limpiar las direcciones fallidas
export const clearFailedAddresses = () => {
  failedAddresses = [];
};

// Función para guardar una ubicación manual
export const saveManualLocation = (addressIndex, lat, lng) => {
  if (addressIndex >= 0 && addressIndex < failedAddresses.length) {
    // Guardar las coordenadas en la dirección fallida
    failedAddresses[addressIndex].manualCoordinates = { lat, lng };
    
    // Obtener el índice original de la dirección
    const originalIndex = failedAddresses[addressIndex].originalIndex;
    
    // Establecer las coordenadas manuales para ser usadas en el cálculo de ruta
    setManualCoordinates(originalIndex, lat, lng);
    
    console.log(`[INFO] Ubicación manual guardada para la dirección ${failedAddresses[addressIndex].address}`);
    return true;
  }
  return false;
};

// Almacena las coordenadas manuales proporcionadas por el usuario
let manualCoordinates = {};

// Función para establecer coordenadas manuales
export const setManualCoordinates = (addressIndex, lat, lng) => {
  manualCoordinates[addressIndex] = { lat, lng };
  console.log(`[INFO] Coordenadas manuales establecidas para el índice ${addressIndex}:`, { lat, lng });
};

// Función para limpiar las coordenadas manuales
export const clearManualCoordinates = () => {
  manualCoordinates = {};
  console.log('[INFO] Coordenadas manuales limpiadas');
};

export const calculateRoute = async (addresses) => {
  console.log('[DEBUG] Iniciando calculateRoute con', addresses.length, 'direcciones');
  
  // Limpiar las direcciones fallidas al iniciar un nuevo cálculo
  clearFailedAddresses();
  
  // Verificar que haya al menos dos direcciones para calcular una ruta
  if (!addresses || addresses.length < 2) {
    console.error('[ERROR] Se requieren al menos dos direcciones para calcular una ruta');
    throw new Error('Se requieren al menos dos direcciones para calcular una ruta');
  }
  
  // Iniciar el proceso con progreso 0
  emitProgress('route', 0, 'Iniciando cálculo de ruta...');
  
  // Inicializar variables que se usarán en toda la función
  let usingFallbackMode = false;
  let startPoint = null;
  let allWaypoints = [];
  
  try {
    // Geocodificar las direcciones para obtener las coordenadas
    console.log('[DEBUG] Iniciando geocodificación de direcciones');
    emitProgress('route', 10, 'Geocodificando direcciones...');
    
    // Obtener la dirección de la empresa (primera dirección)
    const companyAddress = addresses[0];
    console.log('[DEBUG] Geocodificando dirección de la empresa:', companyAddress);
    
    // Geocodificar la dirección de la empresa
    startPoint = await geocodeAddress(companyAddress);
    console.log('[DEBUG] Coordenadas de la empresa obtenidas:', startPoint);
    
    // Verificar si se usaron coordenadas de respaldo para la empresa
    if (startPoint.isFallback) {
      console.warn(`[WARN] Se usaron coordenadas de respaldo para la empresa: ${typeof companyAddress === 'string' ? companyAddress : companyAddress.address}`);
      failedAddresses.push({
        index: 0, // Índice 0 para la empresa
        originalIndex: 0,
        address: typeof companyAddress === 'string' ? companyAddress : companyAddress.address,
        fallbackCoordinates: { lat: startPoint.lat, lng: startPoint.lng },
        fallbackMatch: startPoint.fallbackMatch || 'DEFAULT',
        originalData: companyAddress,
        isCompany: true
      });
    }
    
    // Geocodificar las direcciones de los clientes
    emitProgress('route', 30, 'Geocodificando direcciones de clientes...');
    
    const clientAddresses = addresses.slice(1);
    console.log('[DEBUG] Geocodificando', clientAddresses.length, 'direcciones de clientes');
    
    // Geocodificar todas las direcciones de clientes en paralelo
    const clientWaypoints = await Promise.all(
      clientAddresses.map(async (address, index) => {
        try {
          const result = await geocodeAddress(address);
          
          // Si se usaron coordenadas de respaldo, guardar la dirección como fallida
          if (result.isFallback) {
            console.warn(`[WARN] Se usaron coordenadas de respaldo para: ${typeof address === 'string' ? address : address.address}`);
            failedAddresses.push({
              index: index + 1, // +1 porque el índice 0 es la empresa
              originalIndex: index + 1,
              address: typeof address === 'string' ? address : address.address,
              fallbackCoordinates: { lat: result.lat, lng: result.lng },
              fallbackMatch: result.fallbackMatch || 'DEFAULT',
              originalData: address
            });
          }
          
          return result;
        } catch (error) {
          console.error('[ERROR] Error al geocodificar dirección de cliente:', address, error);
          
          // Guardar la dirección como fallida
          failedAddresses.push({
            index: index + 1, // +1 porque el índice 0 es la empresa
            originalIndex: index + 1,
            address: typeof address === 'string' ? address : address.address,
            error: error.message,
            originalData: address
          });
          
          return null;
        }
      })
    );
    
    // Filtrar los puntos nulos o con coordenadas inválidas
    const validClientWaypoints = clientWaypoints.filter(wp => {
      // Verificar que el waypoint existe y tiene coordenadas válidas (números finitos, no NaN)
      const isValid = wp !== null && 
                     typeof wp.lat === 'number' && 
                     typeof wp.lng === 'number' && 
                     !isNaN(wp.lat) && 
                     !isNaN(wp.lng) &&
                     isFinite(wp.lat) &&
                     isFinite(wp.lng);
      
      if (!isValid && wp !== null) {
        console.warn('[WARN] Waypoint con coordenadas inválidas descartado:', wp);
      }
      return isValid;
    });
    
    console.log('[DEBUG] Waypoints válidos para optimización:', validClientWaypoints.length, 'de', clientWaypoints.length);
    
    // Verificar si alguna coordenada es de respaldo
    const anyFallbackCoordinates = [startPoint, ...validClientWaypoints].some(wp => wp.isFallback === true);
    if (anyFallbackCoordinates) {
      console.warn('[WARN] Se están usando coordenadas de respaldo para algunas direcciones');
    }
    
    // Optimizar el orden de los puntos de clientes
    emitProgress('route', 50, 'Optimizando orden de los puntos...');
    const optimizedClientWaypoints = await optimizeRoute(validClientWaypoints);
    
    // Combinar el punto de inicio (empresa) con los puntos optimizados de clientes
    const allWaypoints = [startPoint, ...optimizedClientWaypoints];
    
    // Verificar si alguna coordenada es de respaldo
    const usingFallbackMode = allWaypoints.some(wp => wp.isFallback === true);
    
    // Intentar calcular la ruta real usando la API de OSRM
    try {
      emitProgress('route', 70, 'Calculando ruta real usando la API...');
      
      // Preparar las coordenadas para la API
      const coordinates = allWaypoints.map(wp => `${wp.lng.toFixed(6)},${wp.lat.toFixed(6)}`).join(';');
      
      console.log('[DEBUG] Intentando calcular la ruta directa con coordenadas:', coordinates);
      
      // Construir la URL con el formato correcto para la API OSRM a través del proxy local
      const url = `${API_CONFIG.OSRM_API_URL}/route?coordinates=${encodeURIComponent(coordinates)}`;
      console.log('[DEBUG] URL de API para ruta directa:', url);
      
      // Realizar la solicitud a la API con reintentos
      console.log('[DEBUG] Enviando solicitud directa a:', url);
      
      // Implementar reintentos con retraso exponencial
      let attempts = 0;
      let routeResponse;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          emitProgress('route', 70 + (attempts * 5), 
            `Calculando ruta (intento ${attempts + 1}/${maxAttempts})...`);
          
          // Agregar retraso entre intentos
          if (attempts > 0) {
            const backoffDelay = Math.pow(2, attempts) * 1000;
            console.log(`[DEBUG] Esperando ${backoffDelay}ms antes del intento ${attempts + 1}...`);
            await delay(backoffDelay);
          }
          
          routeResponse = await axios.get(url, {
            timeout: 20000 // 20 segundos de timeout
          });
          break; // Si la solicitud es exitosa, salir del bucle
        } catch (err) {
          attempts++;
          console.warn(`[WARN] Intento ${attempts}/${maxAttempts} fallido para cálculo de ruta: ${err.message}`);
          
          if (attempts >= maxAttempts) {
            throw err; // Lanzar el error si se agotaron los intentos
          }
        }
      }
      
      console.log('[DEBUG] Respuesta directa recibida:', routeResponse.status);
      console.log('[DEBUG] Datos de respuesta directa:', routeResponse.data ? 'Disponibles' : 'No disponibles');
      console.log('[DEBUG] Tiene rutas directas:', routeResponse.data?.routes ? 'Sí' : 'No');
      console.log('[DEBUG] Cantidad de rutas directas:', routeResponse.data?.routes?.length);
      
      if (routeResponse.data && routeResponse.data.routes && routeResponse.data.routes.length > 0) {
        const route = routeResponse.data.routes[0];
        
        // Extraer la información de la ruta
        const totalDistance = route.distance / 1000; // Convertir a kilómetros
        const totalDuration = route.duration; // En segundos
        
        // Formatear la duración en horas y minutos
        const hours = Math.floor(totalDuration / 3600);
        const minutes = Math.floor((totalDuration % 3600) / 60);
        
        console.log(`[DEBUG] Distancia directa calculada: ${totalDistance.toFixed(2)} km`);
        console.log(`[DEBUG] Duración directa calculada: ${hours} h ${minutes} min`);
        
        // Obtener la geometría de la ruta en formato GeoJSON
        // En el nuevo formato de la API, la geometría viene en formato GeoJSON
        const routeGeometry = route.geometry;
        
        console.log('[DEBUG] Ruta directa calculada exitosamente usando la API');
        
        emitProgress('route', 100, 'Ruta calculada con éxito');
        return {
          waypoints: allWaypoints,
          route: routeGeometry,
          totalDistance: totalDistance,
          totalDuration: totalDuration,
          usingFallbackMode: false // No estamos usando el modo de respaldo para la ruta
        };
      } else {
        throw new Error('No se encontraron rutas en la respuesta de la API');
      }
    } catch (error) {
      console.error('[ERROR] Error al calcular la ruta usando la API:', error);
      
      // Si hay un error al calcular la ruta real, usar el modo de respaldo
      console.warn('[WARN] Usando modo de respaldo para calcular la ruta (línea recta entre puntos)');
      emitProgress('route', 60, 'Usando modo de respaldo para calcular la ruta...');
      
      // Calcular la ruta directamente sin usar la API externa
      const routeInfo = await calculateDirectRoute(allWaypoints);
      
      emitProgress('route', 100, 'Ruta calculada con éxito (modo respaldo)');
      return {
        waypoints: allWaypoints,
        route: routeInfo.route,
        totalDistance: routeInfo.totalDistance,
        usingFallbackMode: true
      };
    }
  } catch (error) {
    console.error('Error al calcular la ruta:', error);
    throw error;
  }
};

/**
 * Optimiza el orden de los puntos para minimizar la distancia total
 * @param {Array} waypoints - Lista de puntos con coordenadas
 * @returns {Promise<Array>} - Lista de puntos en orden optimizado
 */
export const optimizeRoute = async (waypoints) => {
  emitProgress('optimization', 0, 'Iniciando optimización de ruta...');
  try {
    // Si hay menos de 2 puntos, no hay nada que optimizar
    if (waypoints.length < 2) {
      emitProgress('optimization', 100, 'No se requiere optimización (menos de 2 puntos)');
      return waypoints;
    }
    
    // Preparar los datos para la API de OSRM Trip
    emitProgress('optimization', 20, 'Preparando solicitud de optimización...');
    const coordinates = waypoints.map(wp => `${wp.lng.toFixed(6)},${wp.lat.toFixed(6)}`).join(';');
    
    console.log('[DEBUG] Coordenadas para optimización:', coordinates);
    
    // Esperar antes de consultar la API de optimización
    await delay(API_CONFIG.API_DELAY, 'Esperando para consultar la API de optimización...');
    
    // Realizar la solicitud a la API usando la URL directamente con query params
    emitProgress('optimization', 50, 'Consultando API de optimización...');
    
    // Construir la URL correctamente con los parámetros necesarios
    // Usamos encodeURIComponent para asegurar que las coordenadas estén correctamente codificadas
    const tripUrl = `${API_CONFIG.OSRM_API_URL}/trip?coordinates=${encodeURIComponent(coordinates)}`;
    console.log(`[DEBUG] Enviando solicitud a: ${tripUrl}`);
    
    try {
      // Implementar reintentos con retraso exponencial
      let attempts = 0;
      let response;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          emitProgress('optimization', 50 + (attempts * 10), 
            `Consultando API de optimización (intento ${attempts + 1}/${maxAttempts})...`);
          
          // Agregar retraso entre intentos
          if (attempts > 0) {
            const backoffDelay = Math.pow(2, attempts) * 1000;
            console.log(`[DEBUG] Esperando ${backoffDelay}ms antes del intento ${attempts + 1}...`);
            await delay(backoffDelay);
          }
          
          response = await axios.get(tripUrl, {
            timeout: 15000 // 15 segundos de timeout
          });
          break; // Si la solicitud es exitosa, salir del bucle
        } catch (err) {
          attempts++;
          console.warn(`[WARN] Intento ${attempts}/${maxAttempts} fallido para optimización: ${err.message}`);
          
          if (attempts >= maxAttempts) {
            throw err; // Lanzar el error si se agotaron los intentos
          }
        }
      }
      
      console.log('[DEBUG] Respuesta recibida de la API de optimización:', response.status);
      console.log('[DEBUG] Datos de respuesta:', response.data ? 'Disponibles' : 'No disponibles');
      console.log('[DEBUG] Tiene waypoints:', response.data?.waypoints ? 'Sí' : 'No');
      
      if (response.data && response.data.trips && response.data.trips.length > 0) {
        // Obtener el orden optimizado de los puntos
        emitProgress('optimization', 80, 'Procesando resultado de optimización...');
        
        // En el nuevo formato de la API, el orden optimizado viene en 'waypoint_order'
        const trip = response.data.trips[0];
        console.log('[DEBUG] Detalles del viaje optimizado:', {
          distancia: trip.distance,
          duracion: trip.duration,
          tieneWaypoints: response.data.waypoints ? 'Sí' : 'No'
        });
        
        if (response.data.waypoints) {
          // Obtener el orden optimizado de los puntos
          const optimizedOrder = response.data.waypoints.map(wp => wp.waypoint_index);
          console.log('[DEBUG] Orden optimizado de puntos:', optimizedOrder);
          
          // Reordenar los puntos según el orden optimizado
          const optimizedWaypoints = optimizedOrder.map(index => waypoints[index]);
          
          emitProgress('optimization', 100, 'Optimización completada con éxito');
          return optimizedWaypoints;
        } else {
          // Si no hay waypoints pero hay trips, intentar extraer el orden de la geometría del viaje
          console.log('[DEBUG] No se encontraron waypoints en la respuesta, pero sí hay trips');
          
          // En este caso, simplemente devolvemos los waypoints originales
          // ya que no podemos determinar el orden optimizado
          console.warn('[WARN] No se pudo determinar el orden optimizado de los puntos, usando orden original');
          emitProgress('optimization', 100, 'No se pudo determinar el orden optimizado, usando orden original');
          return waypoints;
        }
      } else {
        throw new Error('No se pudo optimizar la ruta.');
      }
    } catch (error) {
      console.error('Error al optimizar la ruta:', error);
      if (error.response) {
        console.error('Detalles del error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      // Intentar una estrategia alternativa de optimización: algoritmo del vecino más cercano
      console.warn('Intentando optimización alternativa con algoritmo del vecino más cercano');
      emitProgress('optimization', 60, 'Usando algoritmo alternativo de optimización...');
      
      try {
        // Implementación simple del algoritmo del vecino más cercano
        const optimizedWaypoints = [];
        const remainingWaypoints = [...waypoints];
        
        // Comenzar con el primer punto
        let currentPoint = remainingWaypoints.shift();
        optimizedWaypoints.push(currentPoint);
        
        // Mientras queden puntos por visitar
        while (remainingWaypoints.length > 0) {
          // Encontrar el punto más cercano al punto actual
          let nearestIndex = 0;
          let minDistance = Infinity;
          
          for (let i = 0; i < remainingWaypoints.length; i++) {
            const distance = Math.sqrt(
              Math.pow(remainingWaypoints[i].lat - currentPoint.lat, 2) +
              Math.pow(remainingWaypoints[i].lng - currentPoint.lng, 2)
            );
            
            if (distance < minDistance) {
              minDistance = distance;
              nearestIndex = i;
            }
          }
          
          // Agregar el punto más cercano a la ruta y removerlo de los puntos restantes
          currentPoint = remainingWaypoints.splice(nearestIndex, 1)[0];
          optimizedWaypoints.push(currentPoint);
        }
        
        emitProgress('optimization', 100, 'Optimización alternativa completada con éxito');
        return optimizedWaypoints;
      } catch (altError) {
        console.error('Error en la optimización alternativa:', altError);
        throw new Error('No se pudo optimizar la ruta: ' + error.message);
      }
    }
  } catch (error) {
    console.error('Error al optimizar la ruta:', error);
    throw error;
  }
};
