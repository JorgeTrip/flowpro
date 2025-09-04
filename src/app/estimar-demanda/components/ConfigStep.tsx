// 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useState, useEffect } from 'react';
import { useEstimarDemandaStore, ExcelRow } from '@/app/stores/estimarDemandaStore';
import { estimarDemanda } from '@/app/lib/demandEstimator';
import DataPreviewTable from './DataPreviewTable';

// Icono de tilde para confirmación visual
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5 flex-shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const SelectAsignacion = ({ label, columnas, value, onChange, disabled = false }: { label: string, columnas: string[], value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, disabled?: boolean }) => (
  <div>
    <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
      {value && <CheckIcon />}
    </label>
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base shadow-sm transition-shadow duration-200 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm dark:border-gray-600 ${disabled
        ? 'cursor-not-allowed bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
        : 'bg-white text-gray-900 hover:shadow-lg dark:bg-gray-700 dark:text-white dark:hover:shadow-lg dark:hover:shadow-gray-600/[.5]'
      }`}
    >
      <option value="">{disabled ? 'No aplicable' : 'Seleccionar columna...'}</option>
      {columnas.map(col => (
        <option key={col} value={col}>{col}</option>
      ))}
    </select>
  </div>
);

export function ConfigStep() {
  const {
    ventasFile,
    stockFile,
    ventasColumnas,
    stockColumnas,
  } = useEstimarDemandaStore();

  const {
    ventasData,
    stockData,
    setStep,
    setConfiguracion,
    setResultados,
    setIsLoading,
    setError,
    ventasPreviewData,
    stockPreviewData,
  } = useEstimarDemandaStore();

  const [mapeo, setMapeo] = useState({
    ventas: { productoId: '', cantidad: '', fecha: '', descripcion: '' },
    stock: { productoId: '', cantidad: '', deposito: '', stockReservado: '', descripcion: '' },
  });

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const ventasReady = mapeo.ventas.productoId && mapeo.ventas.cantidad && mapeo.ventas.fecha;
    const stockReady = mapeo.stock.productoId && mapeo.stock.cantidad && mapeo.stock.deposito;
    const descripcionReady = mapeo.ventas.descripcion || mapeo.stock.descripcion;
    setIsReady(!!(ventasReady && stockReady && descripcionReady));
  }, [mapeo]);

  useEffect(() => {
    const findDefaultColumn = (columns: string[], keywords: string[]): string => {
      // Prioriza la coincidencia exacta (insensible a mayúsculas/minúsculas)
      for (const keyword of keywords) {
        const exactMatch = columns.find(col => col.toLowerCase() === keyword.toLowerCase());
        if (exactMatch) return exactMatch;
      }
      // Si no hay coincidencia exacta, busca una coincidencia parcial
      for (const keyword of keywords) {
        const partialMatch = columns.find(col => col.toLowerCase().includes(keyword.toLowerCase()));
        if (partialMatch) return partialMatch;
      }
      return '';
    };

    const findValidDescriptionColumn = (data: ExcelRow[], columns: string[], keywords: string[]): string => {
      // Buscar todas las columnas que coincidan con los criterios
      const candidateColumns: string[] = [];
      
      // Coincidencias exactas primero
      for (const keyword of keywords) {
        const exactMatch = columns.find(col => col.toLowerCase() === keyword.toLowerCase());
        if (exactMatch) candidateColumns.push(exactMatch);
      }
      
      // Coincidencias parciales después
      for (const keyword of keywords) {
        const partialMatch = columns.find(col => 
          col.toLowerCase().includes(keyword.toLowerCase()) && 
          !candidateColumns.includes(col)
        );
        if (partialMatch) candidateColumns.push(partialMatch);
      }
      
      // Validar que la columna tenga datos reales en las primeras 3 filas
      for (const column of candidateColumns) {
        let hasValidData = false;
        
        for (let i = 0; i < Math.min(3, data.length); i++) {
          const value = data[i][column];
          if (value && String(value).trim() !== '' && String(value).toLowerCase() !== 'null') {
            hasValidData = true;
            break;
          }
        }
        
        if (hasValidData) {
          console.log(`Columna de descripción válida encontrada: '${column}' con datos reales`);
          return column;
        } else {
          console.log(`Columna '${column}' descartada: sin datos válidos en las primeras filas`);
        }
      }
      
      return '';
    };

    if (ventasColumnas.length > 0 || stockColumnas.length > 0) {
      console.log('Columnas de ventas disponibles:', ventasColumnas);
      console.log('Columnas de stock disponibles:', stockColumnas);
      
      // Buscar descripción en ambos archivos con validación de datos
      const descripcionVentas = findValidDescriptionColumn(
        ventasData, 
        ventasColumnas, 
        ['descripcion', 'descripción', 'desc', 'desc.', 'detalle', 'producto', 'articulo', 'artículo']
      );
      const descripcionStock = findValidDescriptionColumn(
        stockData, 
        stockColumnas, 
        ['descripcion', 'descripción', 'desc', 'desc.']
      );
      
      // Solo asignar descripción a uno de los archivos (priorizar ventas si tiene datos válidos)
      const usarDescripcionVentas = descripcionVentas && descripcionVentas.trim();
      const usarDescripcionStock = !usarDescripcionVentas && descripcionStock && descripcionStock.trim();
      
      setMapeo(prev => ({
        ventas: {
          productoId: prev.ventas.productoId || findDefaultColumn(ventasColumnas, ['cod', 'cód', 'cod.', 'cód.']),
          cantidad: prev.ventas.cantidad || findDefaultColumn(ventasColumnas, ['Cantidad Control Stock', 'control stock', 'cantidad']),
          fecha: prev.ventas.fecha || findDefaultColumn(ventasColumnas, ['fecha']),
          descripcion: prev.ventas.descripcion || (usarDescripcionVentas ? descripcionVentas : ''),
        },
        stock: {
          productoId: prev.stock.productoId || findDefaultColumn(stockColumnas, ['cod', 'cód', 'cod.', 'cód.']),
          cantidad: prev.stock.cantidad || findDefaultColumn(stockColumnas, ['saldo control stock', 'stock', 'saldo']),
          deposito: prev.stock.deposito || findDefaultColumn(stockColumnas, ['deposito', 'depósito', 'almacen', 'almacén', 'sucursal']),
          stockReservado: prev.stock.stockReservado || findDefaultColumn(stockColumnas, ['comprometida', 'reservado']),
          descripcion: prev.stock.descripcion || (usarDescripcionStock ? descripcionStock : ''),
        },
      }));
    }
  }, [ventasColumnas, stockColumnas, ventasData, stockData, setMapeo]);

  const handleMapeoChange = <T extends 'ventas' | 'stock'>(
    fileType: T,
    campo: keyof (typeof mapeo)[T],
    valor: string
  ) => {
    setMapeo(prev => {
      const newState = {
        ...prev,
        [fileType]: { ...prev[fileType], [campo]: valor },
      };

      // Lógica de exclusión mutua para la descripción
      if (campo === 'descripcion' && valor) {
        const otroFileType = fileType === 'ventas' ? 'stock' : 'ventas';
        newState[otroFileType].descripcion = '';
      }

      return newState;
    });
  };

  const handleAnalizar = () => {
    if (!isReady) {
      setError('Por favor, complete todos los campos de mapeo requeridos antes de continuar.');
      return;
    }

    console.log('Iniciando análisis...');
    console.log(`Tamaño de datos de ventas: ${ventasData.length} filas`);
    console.log(`Tamaño de datos de stock: ${stockData.length} filas`);
    console.log('Mapeo de columnas:', mapeo);

    setIsLoading(true);
    setError(null);

    try {
      setConfiguracion({ mapeo });
      console.time('Tiempo de análisis');
      const resultados = estimarDemanda(ventasData, stockData, mapeo);
      console.timeEnd('Tiempo de análisis');
      console.log(`Análisis completado. Se generaron ${resultados.length} resultados.`);
      
      setResultados(resultados);
      setStep(3);
    } catch (err: unknown) {
      console.error('Error durante el análisis:', err);
      setError(err instanceof Error ? err.message : 'Ocurrió un error durante el análisis.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Paso 2: Configurar Análisis</h3>
      <p className="mt-1 text-sm text-gray-700 dark:text-gray-400">Asigne las columnas de sus archivos a los campos requeridos para el análisis.</p>

      <div className="mt-8 space-y-8">
        <div className="rounded-md border border-gray-300 p-6 dark:border-gray-600">
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200">Archivo de Ventas: <span className="font-normal text-gray-700 dark:text-gray-400">{ventasFile?.name}</span></h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              {/* <FileUpload fileType="ventas" title="Archivo de Ventas" /> */}
              {ventasFile && ventasPreviewData.length > 0 && (
                <DataPreviewTable 
                  title="Previsualización de Ventas"
                  previewData={ventasPreviewData}
                  columns={ventasColumnas}
                  highlightedColumns={Object.values(mapeo.ventas)}
                />
              )}
            </div>
            <div>
              <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <SelectAsignacion
                  label="ID de Producto (SKU)"
                  columnas={ventasColumnas}
                  value={mapeo.ventas.productoId}
                  onChange={(e) => handleMapeoChange('ventas', 'productoId', e.target.value)}
                />
                <SelectAsignacion
                  label="Cantidad Vendida"
                  columnas={ventasColumnas}
                  value={mapeo.ventas.cantidad}
                  onChange={(e) => handleMapeoChange('ventas', 'cantidad', e.target.value)}
                />
                <SelectAsignacion
                  label="Fecha"
                  columnas={ventasColumnas}
                  value={mapeo.ventas.fecha}
                  onChange={(e) => handleMapeoChange('ventas', 'fecha', e.target.value)}
                />
                <div>
                  <SelectAsignacion
                    label="Descripción del Producto"
                    columnas={ventasColumnas}
                    value={mapeo.ventas.descripcion}
                    onChange={(e) => handleMapeoChange('ventas', 'descripcion', e.target.value)}
                    disabled={!!mapeo.stock.descripcion && !!mapeo.stock.descripcion.trim()}
                  />
                  {mapeo.stock.descripcion && mapeo.stock.descripcion.trim() && (
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      Ya mapeado en archivo de stock
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-gray-300 p-6 dark:border-gray-600">
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200">Archivo de Stock: <span className="font-normal text-gray-700 dark:text-gray-400">{stockFile?.name}</span></h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              {/* <FileUpload fileType="stock" title="Archivo de Stock" /> */}
              {stockFile && stockPreviewData.length > 0 && (
                <DataPreviewTable 
                  title="Previsualización de Stock"
                  previewData={stockPreviewData}
                  columns={stockColumnas}
                  highlightedColumns={Object.values(mapeo.stock)}
                />
              )}
            </div>
            <div>
              <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <SelectAsignacion
                  label="ID de Producto (SKU)"
                  columnas={stockColumnas}
                  value={mapeo.stock.productoId}
                  onChange={(e) => handleMapeoChange('stock', 'productoId', e.target.value)}
                />
                <SelectAsignacion
                  label="Stock Actual"
                  columnas={stockColumnas}
                  value={mapeo.stock.cantidad}
                  onChange={(e) => handleMapeoChange('stock', 'cantidad', e.target.value)}
                />
                <SelectAsignacion
                  label="Depósito (CABA/Entre Ríos)"
                  columnas={stockColumnas}
                  value={mapeo.stock.deposito}
                  onChange={(e) => handleMapeoChange('stock', 'deposito', e.target.value)}
                />
                <SelectAsignacion
                  label="Stock Reservado"
                  columnas={stockColumnas}
                  value={mapeo.stock.stockReservado}
                  onChange={(e) => handleMapeoChange('stock', 'stockReservado', e.target.value)}
                />
                <div>
                  <SelectAsignacion
                    label="Descripción del Producto"
                    columnas={stockColumnas}
                    value={mapeo.stock.descripcion}
                    onChange={(e) => handleMapeoChange('stock', 'descripcion', e.target.value)}
                    disabled={!!mapeo.ventas.descripcion && !!mapeo.ventas.descripcion.trim()}
                  />
                  {mapeo.ventas.descripcion && mapeo.ventas.descripcion.trim() && (
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      Ya mapeado en archivo de ventas
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-end space-x-4">
          <div className="flex-grow">
            {isReady ? (
              <div className="flex items-center justify-center rounded-md bg-green-600 p-3 text-sm font-medium text-white dark:bg-green-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Todo listo para continuar. Puede iniciar el análisis.
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm font-medium text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.85-1.21 3.486 0l5.58 10.622c.636 1.21-.472 2.779-1.743 2.779H4.42c-1.27 0-2.379-1.569-1.743-2.779l5.58-10.622zM10 14a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Faltan campos por asignar. Revise las asignaciones para continuar.
              </div>
            )}
          </div>
          <button onClick={() => setStep(1)} className="rounded-md border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-800 transition-colors hover:bg-gray-100 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500">
            Volver
          </button>
          <button onClick={handleAnalizar} disabled={!isReady} className="rounded-md bg-green-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-green-700 hover:text-white disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-500">
            Realizar Análisis
          </button>
        </div>
      </div>
    </div>
  );
}
