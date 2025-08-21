const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Crear la aplicación Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Habilitar CORS para todas las rutas
app.use(express.json()); // Parsear JSON
app.use(morgan('dev')); // Logging

// Middleware personalizado para manejar URLs codificadas
app.use((req, res, next) => {
  // Guardar la URL original para depuración
  req.originalRawUrl = req.url;
  
  // Intentar decodificar la URL si parece estar codificada
  if (req.url.includes('%')) {
    try {
      // Decodificar la URL completa
      const decodedUrl = decodeURIComponent(req.url);
      console.log('URL decodificada:', decodedUrl);
      req.url = decodedUrl;
    } catch (e) {
      console.error('Error al decodificar URL:', e);
    }
  }
  
  next();
});

// Rate limiter para evitar abusos
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // Límite de 500 solicitudes por ventana (aumentado de 100)
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiadas solicitudes, por favor intente más tarde',
  skipSuccessfulRequests: true, // No contar solicitudes exitosas hacia el límite
  skipFailedRequests: false // Contar solicitudes fallidas hacia el límite
});

// Aplicar rate limiter a todas las rutas de la API
app.use('/api', apiLimiter);

// Caché en memoria simple
const cache = {};
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos (aumentado de 24 horas)

// Función para limpiar la caché periódicamente
setInterval(() => {
  console.log('[INFO] Iniciando limpieza programada de caché...');
  const now = Date.now();
  let countRemoved = 0;
  Object.keys(cache).forEach(key => {
    if (now - cache[key].timestamp > CACHE_DURATION) {
      delete cache[key];
      countRemoved++;
    }
  });
  console.log(`[INFO] Limpieza de caché completada. Se eliminaron ${countRemoved} entradas.`);
}, 24 * 60 * 60 * 1000); // Limpiar cada 24 horas (aumentado de 1 hora)

// Ruta para geocodificar direcciones
app.get('/api/geocode', async (req, res) => {
  try {
    // Obtener la dirección del parámetro 'address'
    const address = req.query.address;
    
    console.log('Parámetros recibidos:', req.query);
    console.log('URL original:', req.originalRawUrl);
    
    if (!address) {
      return res.status(400).json({ 
        error: 'Se requiere el parámetro address', 
        params: req.query,
        url: req.originalRawUrl 
      });
    }
    
    console.log('Geocodificando dirección:', address);
    
    // Verificar si la dirección está en caché
    const cacheKey = `geocode:${address}`;
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
      console.log(`Usando caché para: ${address}`);
      return res.json(cache[cacheKey].data);
    }
    
    // Construir la URL para la API de Nominatim
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=ar`;
    
    // Configurar headers según las políticas de Nominatim
    const headers = {
      'User-Agent': 'HojaDeRuta/1.0',
      'Referer': 'https://hojaderuta.app',
      'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8'
    };
    
    console.log('Consultando Nominatim:', nominatimUrl);
    
    // Realizar la solicitud a la API
    const response = await axios.get(nominatimUrl, { headers });
    
    console.log('Respuesta de Nominatim:', response.data);
    
    // Guardar en caché
    cache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
    
    res.json(response.data);
  } catch (error) {
    console.error('Error en geocodificación:', error.message);
    if (error.response) {
      console.error('Detalles del error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    res.status(500).json({ error: 'Error al geocodificar la dirección', details: error.message });
  }
});

// Función de utilidad para agregar retraso
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Ruta para calcular rutas
app.get('/api/route', async (req, res) => {
  try {
    // Agregar un pequeño retraso para evitar demasiadas solicitudes simultáneas
    await delay(Math.random() * 500); // Retraso aleatorio de hasta 500ms
    const { coordinates } = req.query;
    
    console.log('Parámetros recibidos en /api/route:', req.query);
    console.log('URL original:', req.originalRawUrl);
    
    if (!coordinates) {
      return res.status(400).json({ 
        error: 'Se requieren coordenadas', 
        params: req.query,
        url: req.originalRawUrl 
      });
    }
    
    console.log('Calculando ruta con coordenadas:', coordinates);
    
    // Verificar si la ruta está en caché
    const cacheKey = `route:${coordinates}`;
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
      console.log(`Usando caché para ruta: ${coordinates}`);
      return res.json(cache[cacheKey].data);
    }
    
    // Construir la URL para la API de OSRM
    // Asegurarse de que las coordenadas estén en el formato correcto
    let formattedCoordinates = coordinates;
    
    // Si las coordenadas contienen espacios, reemplazarlos
    if (formattedCoordinates.includes(' ')) {
      formattedCoordinates = formattedCoordinates.replace(/\s+/g, '');
      console.log('Coordenadas formateadas (espacios eliminados):', formattedCoordinates);
    }
    
    // Verificar si las coordenadas tienen el formato correcto (lng,lat;lng,lat)
    const coordPattern = /^(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)(;(-?\d+(\.\d+)?),(-?\d+(\.\d+)?))*$/;
    if (!coordPattern.test(formattedCoordinates)) {
      console.error('Formato de coordenadas inválido:', formattedCoordinates);
      return res.status(400).json({ 
        error: 'Formato de coordenadas inválido', 
        coordinates: formattedCoordinates,
        expectedFormat: 'lng,lat;lng,lat'
      });
    }
    
    // Verificar si hay demasiados puntos para la API pública
    const coordPoints = formattedCoordinates.split(';');
    if (coordPoints.length > 25) {
      console.warn(`Demasiados puntos (${coordPoints.length}) para la API pública de OSRM (máximo 25).`);
      console.log('Dividiendo la ruta en segmentos...');
      
      // Dividir los puntos en segmentos de máximo 25 puntos
      const segments = [];
      for (let i = 0; i < coordPoints.length; i += 24) {
        // Cada segmento se superpone con el anterior para asegurar continuidad
        const start = i === 0 ? 0 : i - 1;
        const end = Math.min(start + 25, coordPoints.length);
        segments.push(coordPoints.slice(start, end));
      }
      
      console.log(`Ruta dividida en ${segments.length} segmentos`);
      
      // Calcular cada segmento por separado
      let totalDistance = 0;
      let totalDuration = 0;
      const allRoutes = [];
      
      try {
        for (let i = 0; i < segments.length; i++) {
          const segmentCoords = segments[i].join(';');
          console.log(`Calculando segmento ${i+1}/${segments.length} con ${segments[i].length} puntos`);
          
          // Agregar un retraso entre solicitudes para evitar errores 429
          await delay(1000); // Esperar 1 segundo entre solicitudes
          
          const segmentUrl = `https://router.project-osrm.org/route/v1/driving/${segmentCoords}?overview=full&geometries=geojson`;
          console.log(`[INFO] Consultando segmento ${i+1}/${segments.length}: ${segmentUrl}`);
          
          // Intentar hasta 3 veces con retraso exponencial
          let attempts = 0;
          let segmentResponse;
          
          while (attempts < 3) {
            try {
              segmentResponse = await axios.get(segmentUrl, {
                timeout: 10000, // 10 segundos de timeout
                headers: {
                  'User-Agent': 'HojaDeRuta/1.0 (https://hojaderuta.app)'
                }
              });
              break; // Si la solicitud es exitosa, salir del bucle
            } catch (err) {
              attempts++;
              console.warn(`[WARN] Intento ${attempts}/3 fallido para el segmento ${i+1}: ${err.message}`);
              
              if (attempts >= 3) {
                throw err; // Lanzar el error si se agotaron los intentos
              }
              
              // Esperar con retraso exponencial (1s, 2s, 4s, etc.)
              const backoffDelay = Math.pow(2, attempts) * 1000;
              console.log(`[INFO] Esperando ${backoffDelay}ms antes del siguiente intento...`);
              await delay(backoffDelay);
            }
          }
          
          if (segmentResponse.data && segmentResponse.data.routes && segmentResponse.data.routes.length > 0) {
            const route = segmentResponse.data.routes[0];
            totalDistance += route.distance;
            totalDuration += route.duration;
            
            if (route.geometry) {
              allRoutes.push(route.geometry);
            }
          } else {
            throw new Error(`No se encontraron rutas para el segmento ${i+1}`);
          }
        }
        
        // Crear una respuesta combinada
        const combinedResponse = {
          code: 'Ok',
          routes: [{
            distance: totalDistance,
            duration: totalDuration,
            geometry: allRoutes.length > 0 ? allRoutes[0] : null // Usar la geometría del primer segmento como aproximación
          }],
          waypoints: segmentResponse.data.waypoints
        };
        
        // Guardar en caché
        cache[cacheKey] = {
          data: combinedResponse,
          timestamp: Date.now()
        };
        
        console.log(`Ruta combinada calculada: ${(totalDistance/1000).toFixed(2)} km, ${Math.floor(totalDuration/3600)} h ${Math.floor((totalDuration%3600)/60)} min`);
        return res.json(combinedResponse);
      } catch (error) {
        console.error('Error al calcular ruta por segmentos:', error.message);
        return res.status(500).json({
          error: 'Error al calcular ruta por segmentos',
          message: error.message
        });
      }
    }
    
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${formattedCoordinates}`;
    
    // Parámetros adicionales para la API
    const params = {
      overview: 'full',
      geometries: 'geojson',
      steps: 'false'
    };
    
    console.log('Consultando OSRM Route:', osrmUrl);
    console.log('Con parámetros:', params);
    
    try {
      // Realizar la solicitud a la API
      const response = await axios.get(osrmUrl, { params });
      
      console.log('Respuesta de OSRM Route recibida. Estado:', response.status);
      
      if (response.data) {
        console.log('Código de respuesta:', response.data.code);
        console.log('Rutas en respuesta:', response.data.routes ? response.data.routes.length : 0);
        
        if (response.data.code !== 'Ok') {
          console.error('Error en respuesta de OSRM:', response.data);
          return res.status(400).json({
            error: 'Error en respuesta de OSRM',
            code: response.data.code,
            message: response.data.message
          });
        }
        
        // Guardar en caché
        cache[cacheKey] = {
          data: response.data,
          timestamp: Date.now()
        };
        
        return res.json(response.data);
      } else {
        console.error('Respuesta de OSRM sin datos');
        return res.status(500).json({
          error: 'Respuesta de OSRM sin datos'
        });
      }
    } catch (error) {
      console.error('Error al consultar OSRM:', error.message);
      
      // Proporcionar información detallada sobre el error
      const errorResponse = {
        error: 'Error al consultar OSRM',
        message: error.message
      };
      
      if (error.response) {
        // La solicitud fue realizada y el servidor respondió con un código de estado
        // que no está en el rango 2xx
        errorResponse.status = error.response.status;
        errorResponse.statusText = error.response.statusText;
        errorResponse.data = error.response.data;
        console.error('Detalles de la respuesta de error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      } else if (error.request) {
        // La solicitud fue realizada pero no se recibió respuesta
        errorResponse.requestError = 'No se recibió respuesta';
        console.error('No se recibió respuesta de OSRM');
      } else {
        // Algo ocurrió al configurar la solicitud que desencadenó un error
        errorResponse.setupError = 'Error al configurar la solicitud';
        console.error('Error al configurar la solicitud:', error.message);
      }
      
      // Verificar si el error puede ser por demasiados puntos
      if (formattedCoordinates.split(';').length > 25) {
        errorResponse.possibleCause = 'Demasiados puntos en la ruta (máximo 25 para la API pública)';
        console.warn('Posible causa: demasiados puntos en la ruta (máximo 25 para la API pública)');
      }
      
      return res.status(500).json(errorResponse);
    }
  } catch (error) {
    console.error('Error en cálculo de ruta:', error.message);
    if (error.response) {
      console.error('Detalles del error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    res.status(500).json({ 
      error: 'Error al calcular la ruta', 
      details: error.message,
      coordinates: req.query.coordinates
    });
  }
});

// Ruta para optimizar rutas
app.get('/api/trip', async (req, res) => {
  try {
    // Agregar un pequeño retraso para evitar demasiadas solicitudes simultáneas
    await delay(Math.random() * 500); // Retraso aleatorio de hasta 500ms
    const { coordinates } = req.query;
    
    console.log('Parámetros recibidos en /api/trip:', req.query);
    console.log('URL original:', req.originalRawUrl);
    
    if (!coordinates) {
      return res.status(400).json({ 
        error: 'Se requieren coordenadas', 
        params: req.query,
        url: req.originalRawUrl
      });
    }
    
    console.log('Optimizando ruta con coordenadas:', coordinates);
    
    // Verificar si la optimización está en caché
    const cacheKey = `trip:${coordinates}`;
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
      console.log(`Usando caché para optimización: ${coordinates}`);
      return res.json(cache[cacheKey].data);
    }
    
    // Formatear las coordenadas (eliminar espacios si los hay)
    let formattedCoordinates = coordinates;
    if (formattedCoordinates.includes(' ')) {
      formattedCoordinates = formattedCoordinates.replace(/\s+/g, '');
      console.log('[INFO] Coordenadas formateadas (espacios eliminados):', formattedCoordinates);
    }
    
    // Verificar si las coordenadas tienen el formato correcto
    const coordPattern = /^(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)(;(-?\d+(\.\d+)?),(-?\d+(\.\d+)?))*$/;
    if (!coordPattern.test(formattedCoordinates)) {
      console.error('[ERROR] Formato de coordenadas inválido:', formattedCoordinates);
      return res.status(400).json({
        error: 'Formato de coordenadas inválido',
        coordinates: formattedCoordinates,
        expectedFormat: 'lng,lat;lng,lat'
      });
    }
    
    // Construir la URL para la API de OSRM Trip con parámetros adicionales
    const osrmUrl = `https://router.project-osrm.org/trip/v1/driving/${formattedCoordinates}`;
    
    // Parámetros adicionales para la API
    const params = {
      roundtrip: 'false',
      source: 'first',
      destination: 'last',
      geometries: 'geojson',
      overview: 'full'
    };
    
    console.log('[INFO] Consultando OSRM Trip:', osrmUrl);
    
    // Intentar hasta 3 veces con retraso exponencial
    let attempts = 0;
    let response;
    
    while (attempts < 3) {
      try {
        // Agregar un retraso entre intentos para evitar errores 429
        if (attempts > 0) {
          const backoffDelay = Math.pow(2, attempts) * 1000;
          console.log(`[INFO] Esperando ${backoffDelay}ms antes del intento ${attempts+1}...`);
          await delay(backoffDelay);
        }
        
        // Realizar la solicitud a la API
        response = await axios.get(osrmUrl, { 
          params,
          timeout: 15000, // 15 segundos de timeout
          headers: {
            'User-Agent': 'HojaDeRuta/1.0 (https://hojaderuta.app)'
          }
        });
        
        // Si llegamos aquí, la solicitud fue exitosa
        console.log('[INFO] Solicitud a OSRM Trip exitosa:', response.status);
        break;
      } catch (err) {
        attempts++;
        console.warn(`[WARN] Intento ${attempts}/3 fallido para OSRM Trip: ${err.message}`);
        
        if (attempts >= 3) {
          throw err; // Lanzar el error si se agotaron los intentos
        }
      }
    }
    
    console.log('Respuesta de OSRM Trip:', response.status);
    
    // Guardar en caché
    cache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
    
    res.json(response.data);
  } catch (error) {
    console.error('Error en optimización de ruta:', error.message);
    if (error.response) {
      console.error('Detalles del error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    res.status(500).json({ 
      error: 'Error al optimizar la ruta', 
      details: error.message,
      coordinates: req.query.coordinates
    });
  }
});

// Endpoint para limpiar la caché
app.get('/api/clear-cache', (req, res) => {
  try {
    const cacheSize = Object.keys(cache).length;
    cache = {}; // Reiniciar la caché
    console.log(`Caché limpiada. Se eliminaron ${cacheSize} entradas.`);
    res.json({ 
      success: true, 
      message: `Caché limpiada. Se eliminaron ${cacheSize} entradas.` 
    });
  } catch (error) {
    console.error('Error al limpiar la caché:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al limpiar la caché' 
    });
  }
});

// Servir la aplicación React en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor proxy ejecutándose en http://localhost:${PORT}`);
  console.log('Rutas disponibles:');
  console.log(`- http://localhost:${PORT}/api/geocode?address=DIRECCION`);
  console.log(`- http://localhost:${PORT}/api/route?coordinates=LNG,LAT;LNG,LAT`);
  console.log(`- http://localhost:${PORT}/api/trip?coordinates=LNG,LAT;LNG,LAT`);
  console.log(`- http://localhost:${PORT}/api/clear-cache`);
});
