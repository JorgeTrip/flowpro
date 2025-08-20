import { useState, useCallback } from 'react';

// Este hook se encargará de la lógica de comparación de inventarios.
import {
  CODIGO_COLUMN,
  DESCRIPCION_COLUMN,
  DESCRIPCION_ADICIONAL_COLUMN,
  STOCK_ENTRE_RIOS_COLUMN,
  STOCK_CABA_COLUMN,
  STOCK_REAL_COLUMN,
  STOCK_GENERAL_SYSTEM_COLUMN // Assuming this might be used as a fallback
} from '../../utils/constants';

const useInventoryComparison = () => {
  const [comparisonResult, setComparisonResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  

  const aggregateData = (dataObject) => {
    let aggregated = [];
    for (const sheetName in dataObject) {
      aggregated = aggregated.concat(dataObject[sheetName]);
    }
    return aggregated;
  };

  const compareInventories = useCallback((systemDataSheets, physicalDataSheets, stockLocation = 'ENTRE RIOS') => {
    setLoading(true);
    setError(null);
    try {
      const systemStockKey = stockLocation === 'CABA' ? STOCK_CABA_COLUMN : STOCK_ENTRE_RIOS_COLUMN;
      console.log(`[useInventoryComparison] Using system stock key: ${systemStockKey} for location: ${stockLocation}`);

      const systemItemsArray = aggregateData(systemDataSheets);
      const physicalItemsArray = aggregateData(physicalDataSheets);

      console.log('[useInventoryComparison] Sample system item (first 5):', systemItemsArray.slice(0, 5));
      console.log('[useInventoryComparison] Sample physical item (first 5):', physicalItemsArray.slice(0, 5));
      console.log(`[useInventoryComparison] Total system items aggregated: ${systemItemsArray.length}`);
      console.log(`[useInventoryComparison] Total physical items aggregated: ${physicalItemsArray.length}`);

      const physicalStockMap = new Map();
      physicalItemsArray.forEach(item => {
        const codigo = item[CODIGO_COLUMN];
        const stockReal = parseFloat(item[STOCK_REAL_COLUMN] || 0);
        if (codigo) {
          // Sumar stock si hay códigos duplicados en el inventario físico
          physicalStockMap.set(codigo, (physicalStockMap.get(codigo) || 0) + stockReal);
        }
      });
      console.log('[useInventoryComparison] Physical stock map populated (first 5 entries):', Array.from(physicalStockMap.entries()).slice(0,5));
      console.log(`[useInventoryComparison] Total unique codes in physical stock map: ${physicalStockMap.size}`);

      const results = [];
      const processedSystemCodes = new Set();

      // Iterar sobre los items del sistema
      systemItemsArray.forEach(systemItem => {
        const codigo = systemItem[CODIGO_COLUMN];
        if (!codigo || processedSystemCodes.has(codigo)) return; // Omitir si no hay código o ya fue procesado

        const stockSystem = parseFloat(systemItem[systemStockKey] || systemItem[STOCK_GENERAL_SYSTEM_COLUMN] || 0); // Fallback to general stock column
        const stockReal = physicalStockMap.get(codigo) || 0;

        // Log details for the first few processed system items
        if (results.length < 5) {
            console.log(`[useInventoryComparison] Processing system item: Code=${codigo}, SystemStock=${stockSystem}, FoundPhysicalStock=${stockReal}, RawSystemItem:`, systemItem);
        }

        const diferencia = stockReal - stockSystem;
        let sobrante = 0;
        let faltante = 0;

        if (diferencia > 0) {
          sobrante = diferencia;
        } else if (diferencia < 0) {
          faltante = Math.abs(diferencia);
        }

        if (diferencia !== 0) {
          results.push({
            CODIGO: codigo,
            DESCRIPCION: systemItem[DESCRIPCION_COLUMN] || '',
            DESCRIPCION_ADICIONAL: systemItem[DESCRIPCION_ADICIONAL_COLUMN] || '',
            STOCK_SISTEMA: stockSystem,
            STOCK_REAL: stockReal,
            SOBRANTE: sobrante,
            FALTANTE: faltante,
            DIFERENCIA: diferencia // Mantener la diferencia real para sortear, pero mostrar sobrante/faltante
          });
        }
        physicalStockMap.delete(codigo); // Remover para luego procesar los que solo están en el físico
        processedSystemCodes.add(codigo);
      });

      // Items que solo están en el inventario físico (sobrantes puros)
      physicalStockMap.forEach((stockReal, codigo) => {
        if (stockReal > 0) { // Solo considerar si hay stock real positivo
            results.push({
                CODIGO: codigo,
                DESCRIPCION: 'N/A (Solo en inventario físico)',
                DESCRIPCION_ADICIONAL: '',
                STOCK_SISTEMA: 0,
                STOCK_REAL: stockReal,
                SOBRANTE: stockReal,
                FALTANTE: 0,
                DIFERENCIA: stockReal
            });
        }
      });

      setComparisonResult(results);
      console.log('[useInventoryComparison] Final comparison results (first 5):', results.slice(0,5));
      console.log(`[useInventoryComparison] Total differences found: ${results.length}`);
    } catch (e) {
      console.error("Error comparando inventarios:", e);
      setError(e.message || 'Error al comparar los datos.');
      setComparisonResult([]);
    }
    setLoading(false);
  }, []);

  return { compareInventories, comparisonResult, loading, error, setComparisonResult };
};

export default useInventoryComparison;
