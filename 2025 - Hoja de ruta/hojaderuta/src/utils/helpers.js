/**
 * Colección de funciones auxiliares para la aplicación
 */

/**
 * Formatea un número como moneda en pesos argentinos
 * @param {number} amount - Monto a formatear
 * @returns {string} - Monto formateado como moneda
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Formatea una distancia en metros a kilómetros
 * @param {number} meters - Distancia en metros
 * @returns {string} - Distancia formateada en kilómetros
 */
export const formatDistance = (meters) => {
  const kilometers = meters / 1000;
  return `${kilometers.toFixed(2)} km`;
};

/**
 * Formatea un tiempo en segundos a formato horas y minutos
 * @param {number} seconds - Tiempo en segundos
 * @returns {string} - Tiempo formateado
 */
export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} h ${minutes} min`;
  } else {
    return `${minutes} min`;
  }
};

/**
 * Genera un color aleatorio en formato hexadecimal
 * @returns {string} - Color hexadecimal
 */
export const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

/**
 * Descarga un archivo blob con el nombre especificado
 * @param {Blob} blob - Archivo a descargar
 * @param {string} fileName - Nombre del archivo
 */
export const downloadBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
