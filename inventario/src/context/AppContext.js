import React, { createContext, useState, useMemo, useCallback } from 'react';
import { SYSTEM_SHEETS, PHYSICAL_INVENTORY_SHEETS, FILE_TYPE_SYSTEM, FILE_TYPE_PHYSICAL, CODIGO_COLUMN, STOCK_REAL_COLUMN, STOCK_SISTEMA_COLUMN } from '../utils/constants';
import { aggregateSheetData, calculateInventoryDifferences } from '../utils/inventoryCalculations';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [systemFileRawData, setSystemFileRawData] = useState(null); // Datos crudos del excel del sistema
  const [physicalFileRawData, setPhysicalFileRawData] = useState(null); // Datos crudos del excel físico
  
  const [systemData, setSystemData] = useState([]); // Datos procesados y agregados del sistema
  const [physicalData, setPhysicalData] = useState([]); // Datos procesados y agregados del inventario físico
  
  const [comparisonResults, setComparisonResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stockLocation, setStockLocation] = useState('ENTRE RIOS'); // 'ENTRE RIOS' o 'CABA'

  const handleFileProcessed = useCallback((data, fileType, totalRecords, fileName) => {
    // fileName is now available
    if (fileType === FILE_TYPE_SYSTEM) {
      setSystemFileRawData(data);
      const aggregated = aggregateSheetData(data);
      setSystemData(aggregated);
      console.log(`Datos del sistema (archivo: ${fileName}) cargados: ${totalRecords} registros agregados.`, aggregated);
    } else if (fileType === FILE_TYPE_PHYSICAL) {
      setPhysicalFileRawData(data);
      const aggregated = aggregateSheetData(data);
      setPhysicalData(aggregated);
      console.log(`Datos del inventario físico (archivo: ${fileName}) cargados: ${totalRecords} registros agregados.`, aggregated);
    }
    // Limpiar resultados anteriores si se carga un nuevo archivo
    setComparisonResults([]); 
  }, []);

  const performComparison = useCallback(() => {
    console.log('[AppContext] Entering performComparison');
    console.log('[AppContext] systemData (first 5):', JSON.parse(JSON.stringify(systemData.slice(0,5))));
    console.log('[AppContext] physicalData (first 5):', JSON.parse(JSON.stringify(physicalData.slice(0,5))));
    console.log('[AppContext] stockLocation:', stockLocation);

    if (systemData.length === 0 || physicalData.length === 0) {
      console.warn('[AppContext] Aborting comparison: systemData or physicalData is empty.');
      setError('Cargue ambos archivos de inventario antes de comparar.');
      setComparisonResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log('[AppContext] Initializing comparison. CODIGO_COLUMN:', CODIGO_COLUMN, 'STOCK_REAL_COLUMN:', STOCK_REAL_COLUMN, 'STOCK_SISTEMA_COLUMN:', STOCK_SISTEMA_COLUMN);
      // systemData items already have stock under STOCK_SISTEMA_COLUMN from ExcelUploader
      // No need for systemStockColumn determination here or mapping to EffectiveStock for this purpose.
      
      // If other mappings were intended in mappedSystemData, they should be reviewed.
      // For now, we assume systemData can be used directly or mappedSystemData just passes through items.
      const mappedSystemData = systemData.map(item => ({ ...item })); // Ensures a new array and objects, preserving original systemData
      console.log('[AppContext] Using systemData (mapped) for comparison (first 5 items):', JSON.parse(JSON.stringify(mappedSystemData.slice(0,5))));

      console.log('[AppContext] Calling calculateInventoryDifferences with keyCode:', CODIGO_COLUMN, ', systemStockKey:', STOCK_SISTEMA_COLUMN, ', physicalStockKey:', STOCK_REAL_COLUMN);
      const results = calculateInventoryDifferences(
        mappedSystemData, // This now contains items with STOCK_SISTEMA_COLUMN
        physicalData,
        CODIGO_COLUMN,
        STOCK_SISTEMA_COLUMN, // Use the key directly available in mappedSystemData items
        STOCK_REAL_COLUMN 
      );
      setComparisonResults(results);
      console.log('Resultados de la comparación:', results);
    } catch (e) {
      console.error('Error durante la comparación:', e);
      setError(e.message || 'Error al realizar la comparación.');
      setComparisonResults([]);
    }
    setLoading(false);
    console.log('[AppContext] Exiting performComparison');
  }, [systemData, physicalData, stockLocation]);

  const clearData = useCallback(() => {
    setSystemFileRawData(null);
    setPhysicalFileRawData(null);
    setSystemData([]);
    setPhysicalData([]);
    setComparisonResults([]);
    setError(null);
    console.log('Datos limpiados.');
  }, []);

  const contextValue = useMemo(() => ({
    systemData,
    physicalData,
    systemFileRawData,
    physicalFileRawData,
    comparisonResults,
    loading,
    error,
    stockLocation,
    setStockLocation,
    handleFileProcessed,
    performComparison,
    clearData,
    expectedSystemSheets: SYSTEM_SHEETS,
    expectedPhysicalSheets: PHYSICAL_INVENTORY_SHEETS,
    systemDataCount: systemData.length,
    physicalDataCount: physicalData.length,
  }), [
    systemData, physicalData, systemFileRawData, physicalFileRawData, comparisonResults, loading, error, stockLocation, 
    handleFileProcessed, performComparison, clearData
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
