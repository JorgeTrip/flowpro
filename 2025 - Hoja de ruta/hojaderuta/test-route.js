const axios = require('axios');

// Coordenadas de prueba
const start = { lat: -34.6037, lng: -58.3816 }; // Centro de Buenos Aires
const end = { lat: -34.6052, lng: -58.4353 }; // Otro punto en Buenos Aires

// Función para probar la API directamente
async function testDirectApi() {
  try {
    const coordinates = `${start.lng},${start.lat};${end.lng},${end.lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
    
    console.log('Probando API directa...');
    console.log('URL:', url);
    
    const response = await axios.get(url);
    
    console.log('Respuesta de API directa:');
    console.log('Status:', response.status);
    console.log('Tiene rutas:', !!response.data.routes);
    console.log('Cantidad de rutas:', response.data.routes?.length);
    
    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      console.log('Distancia:', route.distance, 'metros');
      console.log('Duración:', route.duration, 'segundos');
      console.log('Tiene geometría:', !!route.geometry);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error en API directa:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return null;
  }
}

// Función para probar el servidor proxy
async function testProxyServer() {
  try {
    const coordinates = `${start.lng},${start.lat};${end.lng},${end.lat}`;
    const url = `http://localhost:3001/api/route?coordinates=${coordinates}`;
    
    console.log('\nProbando servidor proxy...');
    console.log('URL:', url);
    
    const response = await axios.get(url);
    
    console.log('Respuesta de servidor proxy:');
    console.log('Status:', response.status);
    console.log('Tiene rutas:', !!response.data.routes);
    console.log('Cantidad de rutas:', response.data.routes?.length);
    
    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      console.log('Distancia:', route.distance, 'metros');
      console.log('Duración:', route.duration, 'segundos');
      console.log('Tiene geometría:', !!route.geometry);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error en servidor proxy:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return null;
  }
}

// Ejecutar las pruebas
async function runTests() {
  console.log('=== PRUEBA DE RUTAS ===');
  
  // Probar API directa
  const directResult = await testDirectApi();
  
  // Probar servidor proxy
  const proxyResult = await testProxyServer();
  
  console.log('\n=== COMPARACIÓN DE RESULTADOS ===');
  console.log('API directa funcionó:', !!directResult);
  console.log('Servidor proxy funcionó:', !!proxyResult);
  
  if (directResult && proxyResult) {
    console.log('Ambos funcionan correctamente');
  } else if (directResult) {
    console.log('Solo la API directa funciona');
  } else if (proxyResult) {
    console.log('Solo el servidor proxy funciona');
  } else {
    console.log('Ninguno funciona');
  }
}

// Ejecutar las pruebas
runTests().catch(console.error);
