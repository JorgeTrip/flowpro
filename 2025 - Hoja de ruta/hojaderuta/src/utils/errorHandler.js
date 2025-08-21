/**
 * Utilidades para manejar errores en la aplicación
 */

/**
 * Clase personalizada para errores de la aplicación
 */
export class AppError extends Error {
  /**
   * Constructor de la clase AppError
   * @param {string} message - Mensaje de error
   * @param {string} code - Código de error
   */
  constructor(message, code = 'ERROR_GENERAL') {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

/**
 * Códigos de error comunes en la aplicación
 */
export const ERROR_CODES = {
  FILE_FORMAT: 'ERROR_FILE_FORMAT',
  MISSING_COLUMNS: 'ERROR_MISSING_COLUMNS',
  GEOCODING_FAILED: 'ERROR_GEOCODING_FAILED',
  ROUTE_CALCULATION_FAILED: 'ERROR_ROUTE_CALCULATION_FAILED',
  NETWORK_ERROR: 'ERROR_NETWORK',
  EXPORT_FAILED: 'ERROR_EXPORT_FAILED'
};

/**
 * Obtiene un mensaje de error amigable basado en el código de error
 * @param {string} code - Código de error
 * @returns {string} - Mensaje de error amigable
 */
export const getFriendlyErrorMessage = (code) => {
  switch (code) {
    case ERROR_CODES.FILE_FORMAT:
      return 'El formato del archivo no es válido. Por favor, utilice un archivo Excel (.xlsx o .xls).';
    
    case ERROR_CODES.MISSING_COLUMNS:
      return 'El archivo no contiene todas las columnas requeridas. Verifique el formato del archivo.';
    
    case ERROR_CODES.GEOCODING_FAILED:
      return 'No se pudieron obtener las coordenadas para una o más direcciones. Verifique que las direcciones sean correctas.';
    
    case ERROR_CODES.ROUTE_CALCULATION_FAILED:
      return 'No se pudo calcular la ruta entre los puntos proporcionados. Intente con menos puntos o verifique las direcciones.';
    
    case ERROR_CODES.NETWORK_ERROR:
      return 'Error de conexión. Verifique su conexión a Internet e intente nuevamente.';
    
    case ERROR_CODES.EXPORT_FAILED:
      return 'Error al exportar los datos. Intente nuevamente.';
    
    default:
      return 'Se produjo un error inesperado. Intente nuevamente.';
  }
};

/**
 * Maneja errores de la API y los convierte en errores de la aplicación
 * @param {Error} error - Error original
 * @returns {AppError} - Error de la aplicación
 */
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  // Determinar el tipo de error
  if (error.message.includes('Network Error')) {
    return new AppError(
      getFriendlyErrorMessage(ERROR_CODES.NETWORK_ERROR),
      ERROR_CODES.NETWORK_ERROR
    );
  }
  
  if (error.message.includes('geocodificar')) {
    return new AppError(
      getFriendlyErrorMessage(ERROR_CODES.GEOCODING_FAILED),
      ERROR_CODES.GEOCODING_FAILED
    );
  }
  
  if (error.message.includes('calcular la ruta')) {
    return new AppError(
      getFriendlyErrorMessage(ERROR_CODES.ROUTE_CALCULATION_FAILED),
      ERROR_CODES.ROUTE_CALCULATION_FAILED
    );
  }
  
  // Error genérico
  return new AppError(error.message);
};
