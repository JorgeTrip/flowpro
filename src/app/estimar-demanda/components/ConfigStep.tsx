// 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useState } from 'react';
import { useEstimarDemandaStore } from '@/app/stores/estimarDemandaStore';
import { estimarDemanda } from '@/app/lib/demandEstimator';
import DataPreviewTable from './DataPreviewTable';

const SelectAsignacion = ({ label, columnas, value, onChange }: { label: string, columnas: string[], value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="mt-1 block w-full rounded-md border-gray-300 bg-white py-2 pl-3 pr-10 text-base shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
    >
      <option value="">Seleccionar columna...</option>
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
    ventasData,
    stockData,
    ventasColumnas,
    stockColumnas,
    configuracion,
    setResultados,
    setConfiguracion,
    setStep,
    setIsLoading,
    setError,
    ventasPreviewData,
    stockPreviewData,
  } = useEstimarDemandaStore();

  const [mapeo, setMapeo] = useState({
    ventas: { productoId: '', cantidad: '' },
    stock: { productoId: '', cantidad: '' },
  });

  const handleMapeoChange = (fileType: 'ventas' | 'stock', campo: 'productoId' | 'cantidad', valor: string) => {
    setMapeo(prev => ({
      ...prev,
      [fileType]: { ...prev[fileType], [campo]: valor },
    }));
  };

  const handleAnalizar = () => {
    if (!mapeo.ventas.productoId || !mapeo.ventas.cantidad || !mapeo.stock.productoId || !mapeo.stock.cantidad) {
      setError('Debe asignar una columna para cada campo requerido en ambos archivos.');
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
    } catch (err: any) {
      console.error('Error durante el análisis:', err);
      setError(err.message || 'Ocurrió un error durante el análisis.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Paso 2: Configurar Análisis</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Asigne las columnas de sus archivos a los campos requeridos para el análisis.</p>

      <div className="mt-8 space-y-8">
        <div className="rounded-md border border-gray-300 p-6 dark:border-gray-600">
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200">Archivo de Ventas: <span className="font-normal text-gray-600 dark:text-gray-400">{ventasFile?.name}</span></h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              {/* <FileUpload fileType="ventas" title="Archivo de Ventas" /> */}
              {ventasFile && ventasPreviewData.length > 0 && (
                <DataPreviewTable 
                  title="Previsualización de Ventas"
                  previewData={ventasPreviewData}
                  columns={ventasColumnas}
                />
              )}
            </div>
            <div>
              <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
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
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-gray-300 p-6 dark:border-gray-600">
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200">Archivo de Stock: <span className="font-normal text-gray-600 dark:text-gray-400">{stockFile?.name}</span></h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              {/* <FileUpload fileType="stock" title="Archivo de Stock" /> */}
              {stockFile && stockPreviewData.length > 0 && (
                <DataPreviewTable 
                  title="Previsualización de Stock"
                  previewData={stockPreviewData}
                  columns={stockColumnas}
                />
              )}
            </div>
            <div>
              <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
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
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end space-x-4">
        <button onClick={() => setStep(1)} className="rounded-md bg-gray-200 px-4 py-2 font-semibold text-gray-800 transition-colors hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500">
          Volver
        </button>
        <button onClick={handleAnalizar} className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400">
          Realizar Análisis
        </button>
      </div>
    </div>
  );
}
