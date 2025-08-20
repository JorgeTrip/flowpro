import { useState } from 'react';
import * as XLSX from 'xlsx';

// Este hook podría encapsular la lógica de procesamiento de Excel si se vuelve más compleja
// o si se necesita reutilizar en múltiples lugares fuera del ExcelUploader.
// Por ahora, gran parte de la lógica está en ExcelUploader.js, se puede refactorizar aquí si es necesario.

const useExcelProcessor = () => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const processFile = async (file, expectedSheets) => {
    setProcessing(true);
    setError(null);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const processedData = {};
          let totalRecords = 0;

          if (expectedSheets && expectedSheets.length > 0) {
            expectedSheets.forEach(sheetName => {
              if (workbook.SheetNames.includes(sheetName)) {
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                processedData[sheetName] = jsonData;
                totalRecords += jsonData.length;
              } else {
                console.warn(`Hoja esperada '${sheetName}' no encontrada.`);
              }
            });
            if (Object.keys(processedData).length === 0) {
              throw new Error('Ninguna de las hojas esperadas fue encontrada.');
            }
          } else {
            // Procesar todas las hojas si no se especifican hojas esperadas
            workbook.SheetNames.forEach(sheetName => {
              const worksheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(worksheet);
              processedData[sheetName] = jsonData;
              totalRecords += jsonData.length;
            });
          }
          
          setProcessing(false);
          resolve({ data: processedData, totalRecords });
        } catch (err) {
          console.error('Error procesando el archivo Excel en el hook:', err);
          setError(err.message || 'Error al procesar el archivo Excel.');
          setProcessing(false);
          reject(err);
        }
      };
      reader.onerror = (err) => {
        console.error('Error leyendo el archivo en el hook:', err);
        setError('Error al leer el archivo.');
        setProcessing(false);
        reject(err);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  return { processFile, processing, error };
};

export default useExcelProcessor;
