import * as XLSX from 'xlsx';
import { APP_CONFIG, COMPANY_INFO } from '../utils/config';

/**
 * Procesa un archivo Excel o CSV y extrae la información relevante
 * @param {File} file - Archivo Excel o CSV a procesar
 * @returns {Promise<Object>} - Datos procesados del archivo
 */
export const processExcelData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        // Determinar el tipo de archivo por su extensión
        const fileExt = file.name.split('.').pop().toLowerCase();
        console.log('Tipo de archivo detectado:', fileExt);
        
        // Opciones de lectura basadas en el tipo de archivo
        const readOptions = {
          type: 'array',
          // Para archivos CSV, configurar opciones adicionales
          ...(fileExt === 'csv' ? {
            cellDates: true,
            dateNF: 'dd/mm/yyyy',
            raw: false,
            codepage: 65001 // UTF-8
          } : {})
        };
        
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, readOptions);
        
        // Obtener la primera hoja del libro
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Intentar encontrar los encabezados en varias filas (hasta 10 filas)
        let jsonData = [];
        let headerRowIndex = 0;
        const maxHeaderSearchRows = 10;
        
        // Función para normalizar nombres de columnas (quitar espacios adicionales, convertir a mayúsculas)
        const normalizeColumnName = (name) => {
          if (typeof name !== 'string') return '';
          return name.trim().toUpperCase().replace(/\s+/g, ' ');
        };
        
        // Obtener las columnas requeridas de la configuración y normalizarlas
        const requiredColumns = APP_CONFIG.REQUIRED_COLUMNS.map(normalizeColumnName);
        
        // Probar diferentes filas como encabezados hasta encontrar una que funcione
        for (let i = 0; i < maxHeaderSearchRows && (jsonData.length === 0 || !hasRequiredColumns(jsonData[0])); i++) {
          try {
            // Convertir a JSON usando la fila i como encabezado
            jsonData = XLSX.utils.sheet_to_json(worksheet, { 
              raw: true,
              range: i // Comenzar desde la fila i
            });
            
            // Verificar si esta fila parece ser una fecha o contiene principalmente fechas
            if (jsonData.length > 0) {
              const firstRow = jsonData[0];
              const keys = Object.keys(firstRow);
              
              // Verificar si la fila parece ser una fecha o tiene pocas columnas
              const isDateRow = keys.length < 3 || keys.some(key => {
                const value = firstRow[key];
                // Verificar si el valor parece una fecha (formato dd/mm/yyyy o similar)
                if (typeof value === 'string') {
                  return /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(value.trim());
                }
                return value instanceof Date;
              });
              
              // Verificar si la fila contiene los encabezados requeridos
              const hasRequiredHeaders = hasRequiredColumns(firstRow);
              
              if (isDateRow || !hasRequiredHeaders) {
                console.log(`La fila ${i + 1} no contiene los encabezados requeridos o parece contener fechas. Ignorando...`);
                console.log('Columnas encontradas:', keys);
                // Continuar con la siguiente fila si no encontramos los encabezados requeridos
                if (!hasRequiredHeaders && i < maxHeaderSearchRows - 1) {
                  continue;
                }
              }
              
              // Si encontramos datos y tienen las columnas que necesitamos, guardamos el índice
              if (Object.keys(firstRow).length > 0) {
                headerRowIndex = i;
                console.log(`Encabezados encontrados en la fila ${i + 1}`);
                console.log('Columnas encontradas:', Object.keys(firstRow));
                
                // Verificar si tenemos las columnas requeridas
                if (hasRequiredHeaders) {
                  console.log('Se encontraron todas las columnas requeridas');
                  break;
                }
              }
            }
          } catch (e) {
            console.warn(`Error al intentar usar la fila ${i} como encabezado:`, e);
            // Continuar con la siguiente fila
          }
        }
        
        if (jsonData.length === 0) {
          reject(new Error('El archivo Excel está vacío o no se encontraron encabezados válidos en las primeras filas.'));
          return;
        }
        
        // Función para verificar si un objeto tiene las columnas requeridas
        function hasRequiredColumns(row) {
          if (!row) return false;
          
          // Obtener las columnas del archivo y normalizarlas
          const fileColumns = Object.keys(row).map(normalizeColumnName);
          
          // Verificar que todas las columnas requeridas estén presentes
          let missingColumns = [];
          
          for (const requiredCol of requiredColumns) {
            const found = fileColumns.some(fileCol => {
              // Verificar coincidencia exacta
              if (fileCol === requiredCol) return true;
              
              // Verificar coincidencia parcial (por ejemplo, si falta un espacio o hay algún carácter adicional)
              if (fileCol.includes(requiredCol) || requiredCol.includes(fileCol)) return true;
              
              // Casos especiales para TOTAL A COBRAR
              if (requiredCol === 'TOTAL A COBRAR') {
                // Aceptar IMPORTE, TOTAL, MONTO, VALOR, etc.
                const alternativeNames = ['IMPORTE', 'TOTAL', 'MONTO', 'VALOR', 'PRECIO'];
                if (alternativeNames.some(alt => fileCol.includes(alt))) {
                  return true;
                }
              }
              
              return false;
            });
            
            if (!found) {
              missingColumns.push(requiredCol);
            }
          }
          
          return missingColumns.length === 0;
        }
        
        // Obtener las columnas del archivo y normalizarlas
        const fileColumns = Object.keys(jsonData[0]).map(normalizeColumnName);
        
        // Crear un mapa para buscar las columnas originales por su nombre normalizado
        const columnMap = {};
        Object.keys(jsonData[0]).forEach(col => {
          columnMap[normalizeColumnName(col)] = col;
        });
        
        // Verificar que todas las columnas requeridas estén presentes
        const missingColumns = [];
        const columnMatches = {};
        
        requiredColumns.forEach(requiredCol => {
          const matchingCol = fileColumns.find(fileCol => {
            // Verificar coincidencia exacta
            if (fileCol === requiredCol) return true;
            
            // Verificar coincidencia parcial (por ejemplo, si falta un espacio o hay algún carácter adicional)
            if (fileCol.includes(requiredCol) || requiredCol.includes(fileCol)) return true;
            
            // Casos especiales para TOTAL A COBRAR
            if (requiredCol === 'TOTAL A COBRAR') {
              // Aceptar IMPORTE, TOTAL, MONTO, VALOR, etc.
              const alternativeNames = ['IMPORTE', 'TOTAL', 'MONTO', 'VALOR', 'PRECIO'];
              if (alternativeNames.some(alt => fileCol.includes(alt))) {
                console.log(`Columna '${fileCol}' aceptada como equivalente a 'TOTAL A COBRAR'`);
                return true;
              }
            }
            
            return false;
          });
          
          if (matchingCol) {
            columnMatches[requiredCol] = columnMap[matchingCol];
          } else {
            missingColumns.push(APP_CONFIG.REQUIRED_COLUMNS[requiredColumns.indexOf(requiredCol)]);
          }
        });
        
        if (missingColumns.length > 0) {
          reject(new Error(`El archivo no contiene las siguientes columnas requeridas: ${missingColumns.join(', ')}. \n\nColumnas encontradas: ${Object.keys(jsonData[0]).join(', ')}`));
          return;
        }
        
        // Función para obtener el valor de una columna usando el mapa de coincidencias
        const getColumnValue = (row, columnName) => {
          const normalizedName = normalizeColumnName(columnName);
          const matchedColumn = columnMatches[normalizedName];
          
          // Si encontramos una coincidencia directa, usarla
          if (matchedColumn) {
            return row[matchedColumn];
          }
          
          // Casos especiales para TOTAL A COBRAR si no hay coincidencia directa
          if (normalizedName === 'TOTAL A COBRAR') {
            // Buscar columnas alternativas como IMPORTE, TOTAL, etc.
            const alternativeNames = ['IMPORTE', 'TOTAL', 'MONTO', 'VALOR', 'PRECIO'];
            
            // Buscar en las columnas del archivo
            for (const colName of Object.keys(row)) {
              const normalizedColName = normalizeColumnName(colName);
              if (alternativeNames.some(alt => normalizedColName.includes(alt))) {
                console.log(`Usando columna '${colName}' como equivalente a 'TOTAL A COBRAR'`);
                return row[colName];
              }
            }
          }
          
          return null;
        };
        
        // Procesar los datos y agrupar por razón social y dirección
        const clientSummary = {};
        let totalAmount = 0;
        
        jsonData.forEach(row => {
          // Verificar si alguna columna contiene "FIRMA DEL CHOFER"
          const isDriverSignatureRow = Object.values(row).some(value => 
            value && 
            typeof value === 'string' && 
            value.toUpperCase().includes('FIRMA DEL CHOFER')
          );
          
          // Si es una fila de firma del chofer, ignorarla
          if (isDriverSignatureRow) {
            console.log('Ignorando fila de firma del chofer:', row);
            return; // Saltar esta iteración
          }
          
          const originalClientName = getColumnValue(row, 'RAZON SOCIAL');
          const direccion = getColumnValue(row, 'DIRECCION DE ENTREGA');
          const localidad = getColumnValue(row, 'LOCALIDAD');
          const address = `${direccion}, ${localidad}`;
          const amount = parseFloat(getColumnValue(row, 'TOTAL A COBRAR')) || 0;
          
          // Crear un identificador único para cada combinación de cliente y dirección
          let clientKey = originalClientName;
          
          // Verificar si ya existe este cliente con una dirección diferente
          const existingEntries = Object.entries(clientSummary).filter(([key, data]) => {
            return key.startsWith(originalClientName) && data.address !== address;
          });
          
          // Si ya existe una entrada para este cliente pero con otra dirección,
          // crear un nuevo nombre con el formato "[Razón Social] Suc. [Localidad]"
          if (existingEntries.length > 0 || 
              (clientSummary[clientKey] && clientSummary[clientKey].address !== address)) {
            
            // Renombrar la entrada existente si es la primera vez que encontramos una dirección diferente
            if (existingEntries.length === 0 && clientSummary[clientKey]) {
              const existingLocalidad = clientSummary[clientKey].address.split(', ').pop();
              const newKey = `${originalClientName} Suc. ${existingLocalidad}`;
              
              // Crear una nueva entrada con el nombre actualizado
              clientSummary[newKey] = { ...clientSummary[clientKey] };
              // Eliminar la entrada antigua
              delete clientSummary[clientKey];
            }
            
            // Crear un nuevo nombre para esta entrada
            clientKey = `${originalClientName} Suc. ${localidad}`;
          }
          
          // Agregar o actualizar la información del cliente
          if (!clientSummary[clientKey]) {
            clientSummary[clientKey] = {
              address,
              originalName: originalClientName,
              localidad,
              orderCount: 1,
              totalAmount: amount,
              orders: [row]
            };
          } else {
            // Actualizar los datos si la dirección coincide
            if (clientSummary[clientKey].address === address) {
              clientSummary[clientKey].orderCount += 1;
              clientSummary[clientKey].totalAmount += amount;
              clientSummary[clientKey].orders.push(row);
            } else {
              // Si hay conflicto de nombres, crear un nuevo nombre con un sufijo numérico
              let newKey = `${clientKey} (${Math.floor(Math.random() * 1000)})`;
              clientSummary[newKey] = {
                address,
                originalName: originalClientName,
                localidad,
                orderCount: 1,
                totalAmount: amount,
                orders: [row]
              };
            }
          }
          
          totalAmount += amount;
        });
        
        console.log('Resumen de clientes procesados:', clientSummary);
        
        // Extraer las direcciones únicas para la ruta
        const addresses = Object.entries(clientSummary).map(([clientName, data]) => ({
          name: clientName,
          address: data.address
        }));
        
        resolve({
          clientSummary,
          addresses,
          totalOrders: jsonData.length,
          totalAmount
        });
        
      } catch (error) {
        reject(new Error(`Error al procesar el archivo Excel: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo.'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Exporta los datos procesados a un archivo Excel
 * @param {Object} data - Datos procesados
 * @param {Object} routeInfo - Información de la ruta
 * @returns {Blob} - Archivo Excel generado
 */
export const exportToExcel = (data, routeInfo) => {
  // Crear una hoja de cálculo con el resumen
  // Primero agregar la empresa como punto de inicio
  const summaryData = [
    {
      'Orden': 0,
      'Razón Social': COMPANY_INFO.NAME,
      'Dirección': COMPANY_INFO.ADDRESS,
      'Cantidad de Pedidos': '-',
      'Importe Total': '-',
      'Tipo': 'Punto de inicio'
    }
  ];
  
  // Luego agregar los clientes
  Object.entries(data.clientSummary).forEach(([clientName, clientData], index) => {
    summaryData.push({
      'Orden': index + 1,
      'Razón Social': clientName,
      'Dirección': clientData.address,
      'Cantidad de Pedidos': clientData.orderCount,
      'Importe Total': clientData.totalAmount.toFixed(2),
      'Tipo': 'Cliente'
    });
  });
  
  // Añadir fila de totales
  summaryData.push({
    'Orden': '',
    'Razón Social': 'TOTAL',
    'Dirección': '',
    'Cantidad de Pedidos': data.totalOrders,
    'Importe Total': data.totalAmount.toFixed(2)
  });
  
  // Crear una nueva hoja de trabajo
  const ws = XLSX.utils.json_to_sheet(summaryData);
  
  // Crear un nuevo libro
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hoja de Ruta');
  
  // Generar el archivo
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};
