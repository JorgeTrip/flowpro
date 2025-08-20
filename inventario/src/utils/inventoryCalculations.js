import { DESCRIPCION_COLUMN, CATEGORIA_COLUMN } from './constants.js';

/**
 * Calcula las diferencias de inventario entre dos conjuntos de datos.
 * @param {Array<Object>} systemItems - Items del inventario del sistema.
 * @param {Array<Object>} physicalItems - Items del inventario físico.
 * @param {string} keyCode - Nombre de la columna clave para cruzar (ej. 'CÓDIGO').
 * @param {string} systemStockKey - Nombre de la columna de stock en systemItems.
 * @param {string} physicalStockKey - Nombre de la columna de stock en physicalItems.
 * @returns {Array<Object>} Un array con los items y sus diferencias calculadas.
 */
export const calculateInventoryDifferences = (systemItems, physicalItems, keyCode, systemStockKey, physicalStockKey) => {
  console.log('[CalcDiff] Entering calculateInventoryDifferences');
  console.log('[CalcDiff] systemItems (first 5):', JSON.parse(JSON.stringify(systemItems.slice(0,5))));
  console.log('[CalcDiff] physicalItems (first 5):', JSON.parse(JSON.stringify(physicalItems.slice(0,5))));
  console.log('[CalcDiff] keyCode:', keyCode, 'systemStockKey:', systemStockKey, 'physicalStockKey:', physicalStockKey);
  const physicalStockMap = new Map();
  const physicalItemsMap = new Map(); // To store full physical items for later lookup
  physicalItems.forEach(item => {
    // console.log('[CalcDiff] Processing physicalItem for map:', JSON.parse(JSON.stringify(item)));
    const key = item[keyCode];
    const stock = parseFloat(item[physicalStockKey] || 0);
    if (key) {
      // console.log(`[CalcDiff] Mapping physical key: ${key}, stock: ${stock}`);
      physicalStockMap.set(key, (physicalStockMap.get(key) || 0) + stock);
      if (!physicalItemsMap.has(key)) { // Store the first occurrence for description
        physicalItemsMap.set(key, item);
      }
    }
  });
  console.log('[CalcDiff] physicalStockMap built (first 5 entries):', JSON.parse(JSON.stringify(Array.from(physicalStockMap.entries()).slice(0,5))));

  const results = [];
  const processedSystemKeys = new Set();

  systemItems.forEach(systemItem => {
    // console.log('[CalcDiff] Processing systemItem:', JSON.parse(JSON.stringify(systemItem)));
    const key = systemItem[keyCode];
    if (!key) {
      console.warn('[CalcDiff] System item has no key:', JSON.parse(JSON.stringify(systemItem)));
      return;
    }
    if (processedSystemKeys.has(key)) {
      // This case should ideally not happen if data is clean (unique keys in systemItems)
      // console.warn(`[CalcDiff] System key ${key} already processed. Skipping duplicate.`);
      return;
    }

    const stockSystem = parseFloat(systemItem[systemStockKey] || 0);
    // console.log(`[CalcDiff] Item ${key} - stockSystem from ${systemStockKey}: ${systemItem[systemStockKey]} -> ${stockSystem}`);
    const stockReal = physicalStockMap.get(key) || 0;
    // console.log(`[CalcDiff] Item ${key} - stockReal from map: ${physicalStockMap.get(key)} -> ${stockReal}`);

    const diferencia = stockReal - stockSystem;
    
    if (diferencia !== 0) {
      // console.log(`[CalcDiff] Item ${key} - Diferencia: ${diferencia}. Adding to results.`);
            const resultItem = {
        'CODIGO': systemItem[keyCode] || key, // Use systemItem's key first, fallback to map key
        'DESCRIPCION': systemItem[DESCRIPCION_COLUMN] || systemItem['DESCRIPCION'], // Handle potential variations
        // Add other properties from systemItem, mapping them if necessary
        // For example, if systemItem has CATEGORIA_COLUMN ('CATEGORÍA'), map it to 'CATEGORIA'
        'CATEGORIA': systemItem[CATEGORIA_COLUMN] || systemItem['CATEGORIA'],
        'STOCK_SISTEMA': stockSystem,
        'STOCK_REAL': stockReal,
        'DIFERENCIA': diferencia,
        SOBRANTE: diferencia > 0 ? diferencia : 0,
        FALTANTE: diferencia < 0 ? Math.abs(diferencia) : 0,
      };
      // Preserve other properties from systemItem that don't conflict with the above
      for (const sysKey in systemItem) {
        if (!resultItem.hasOwnProperty(sysKey.toUpperCase()) && !resultItem.hasOwnProperty(sysKey)) {
            // Avoid overwriting already set CODIGO, DESCRIPCION, etc. if systemKey is 'CÓDIGO' and we already set 'CODIGO'
            // A more robust mapping might be needed if keys can be very different
            if (sysKey !== keyCode && sysKey !== DESCRIPCION_COLUMN && sysKey !== CATEGORIA_COLUMN) {
                 resultItem[sysKey] = systemItem[sysKey];
            }
        }
      }
      results.push(resultItem);
    }
    physicalStockMap.delete(key);
    processedSystemKeys.add(key);
  });

  console.log('[CalcDiff] Finished processing systemItems. Now processing remaining physicalStockMap items.');
  physicalStockMap.forEach((stockReal, key) => {
    if (stockReal > 0) { // Solo items que sobraron y no estaban en el sistema
      // console.log(`[CalcDiff] Item ${key} only in physical. Stock: ${stockReal}. Adding to results.`);
      const physicalItemDetails = physicalItemsMap.get(key) || {};
            results.push({
        'CODIGO': key,
        'DESCRIPCION': physicalItemDetails[DESCRIPCION_COLUMN] || physicalItemDetails['DESCRIPCION'] || 'Item solo en inventario físico',
        'CATEGORIA': physicalItemDetails[CATEGORIA_COLUMN] || physicalItemDetails['CATEGORIA'],
        'STOCK_SISTEMA': 0,
        'STOCK_REAL': stockReal,
        'DIFERENCIA': stockReal,
        SOBRANTE: stockReal,
        FALTANTE: 0,
      });
    }
  });

  console.log('[CalcDiff] Final results (first 5):', JSON.parse(JSON.stringify(results.slice(0,5))));
  console.log('[CalcDiff] Total results count:', results.length);
  console.log('[CalcDiff] Exiting calculateInventoryDifferences');
  return results;
};

// Otras funciones de cálculo relacionadas con el inventario pueden ir aquí.
// Por ejemplo, calcular estadísticas generales (total sobrantes, total faltantes en valor, etc.)

/**
 * Agrega datos de múltiples hojas de un objeto de hojas de Excel en un solo array.
 * @param {Object} dataObject - Objeto donde las claves son nombres de hojas y los valores son arrays de items.
 * @returns {Array<Object>} Un único array con todos los items.
 */
export const aggregateSheetData = (dataObject) => {
  let aggregated = [];
  if (!dataObject) return aggregated;
  for (const sheetName in dataObject) {
    if (Array.isArray(dataObject[sheetName])) {
      aggregated = aggregated.concat(dataObject[sheetName]);
    }
  }
  return aggregated;
};
