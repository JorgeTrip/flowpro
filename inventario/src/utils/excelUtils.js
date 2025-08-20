import * as XLSX from 'xlsx';

/**
 * Lee un archivo Excel y devuelve los datos de las hojas especificadas o todas las hojas.
 * @param {File} file - El archivo Excel a procesar.
 * @param {string[]} [sheetNames] - Nombres de las hojas a procesar. Si es nulo o vacío, procesa todas.
 * @returns {Promise<Object>} Un objeto donde las claves son los nombres de las hojas y los valores son arrays de objetos (filas).
 */
export const readExcelFile = (file, sheetNames) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const result = {};
        const sheetsToProcess = sheetNames && sheetNames.length > 0 ? sheetNames : workbook.SheetNames;

        sheetsToProcess.forEach(sheetName => {
          if (workbook.Sheets[sheetName]) {
            const worksheet = workbook.Sheets[sheetName];
            result[sheetName] = XLSX.utils.sheet_to_json(worksheet);
          } else {
            console.warn(`La hoja "${sheetName}" no se encontró en el archivo.`);
          }
        });
        resolve(result);
      } catch (error) {
        console.error('Error al procesar el archivo Excel:', error);
        reject(error);
      }
    };
    reader.onerror = (error) => {
      console.error('Error al leer el archivo:', error);
      reject(error);
    };
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Exporta datos a un archivo Excel.
 * @param {Array<Object>} data - Array de objetos a exportar.
 * @param {string} sheetName - Nombre de la hoja en el archivo Excel.
 * @param {string} fileName - Nombre del archivo Excel a generar.
 */
export const exportToExcel = (data, sheetName = 'Datos', fileName = 'export.xlsx') => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, fileName);
    return true;
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    return false;
  }
};

// Podrías añadir más utilidades aquí, como:
// - Validación de columnas esperadas
// - Transformación de datos (ej. convertir fechas, limpiar strings)
// - Mapeo de nombres de columnas
