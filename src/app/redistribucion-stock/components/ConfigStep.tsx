// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useState, useEffect } from 'react';
import { useRedistribucionStockStore, ExcelRow } from '@/app/stores/redistribucionStockStore';
import { redistribuirStock } from '@/app/lib/stockRedistributor';
import DataPreviewTable from '../../estimar-demanda/components/DataPreviewTable';

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
    stockFile,
    stockColumnas,
    stockData,
    stockPreviewData,
    setStep,
    setConfiguracion,
    setResultados,
    setIsLoading,
    setError,
  } = useRedistribucionStockStore();

  const [mapeo, setMapeo] = useState({
    productoId: '',
    descripcion: '',
    stockCABAMateriaPrima: '',
    stockCABAProductoTerminado: '',
    stockEntreRiosMateriaPrima: '',
    stockEntreRiosProductoTerminado: '',
    rotacionMensual: '',
  });

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const camposRequeridos = [
      mapeo.productoId,
      mapeo.stockCABAMateriaPrima,
      mapeo.stockCABAProductoTerminado,
      mapeo.stockEntreRiosMateriaPrima,
      mapeo.stockEntreRiosProductoTerminado,
      mapeo.rotacionMensual
    ];
    setIsReady(camposRequeridos.every(campo => campo.trim() !== ''));
  }, [mapeo]);

  useEffect(() => {
    const findDefaultColumn = (columns: string[], keywords: string[]): string => {
      // First pass: exact matches (normalized)
      for (const keyword of keywords) {
        const normalizedKeyword = normalizeText(keyword);
        const exactMatch = columns.find(col => normalizeText(col) === normalizedKeyword);
        if (exactMatch) return exactMatch;
      }
      // Second pass: partial matches (normalized)
      for (const keyword of keywords) {
        const normalizedKeyword = normalizeText(keyword);
        const partialMatch = columns.find(col => normalizeText(col).includes(normalizedKeyword));
        if (partialMatch) return partialMatch;
      }
      return '';
    };

    const normalizeText = (text: string): string => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .trim();
    };

    const findValidDescriptionColumn = (data: ExcelRow[], columns: string[], keywords: string[]): string => {
      const candidateColumns: string[] = [];
      
      // First pass: exact matches (normalized)
      for (const keyword of keywords) {
        const normalizedKeyword = normalizeText(keyword);
        const exactMatch = columns.find(col => normalizeText(col) === normalizedKeyword);
        if (exactMatch && !candidateColumns.includes(exactMatch)) {
          candidateColumns.push(exactMatch);
        }
      }
      
      // Second pass: partial matches (normalized)
      for (const keyword of keywords) {
        const normalizedKeyword = normalizeText(keyword);
        const partialMatch = columns.find(col => 
          normalizeText(col).includes(normalizedKeyword) && 
          !candidateColumns.includes(col)
        );
        if (partialMatch) {
          candidateColumns.push(partialMatch);
        }
      }
      
      // Validate candidates have real data
      for (const column of candidateColumns) {
        let hasValidData = false;
        
        for (let i = 0; i < Math.min(5, data.length); i++) {
          const value = data[i][column];
          console.log(`Validando columna '${column}', fila ${i}:`, { value, type: typeof value, string: String(value) });
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

    if (stockColumnas.length > 0) {
      console.log('Columnas disponibles:', stockColumnas);
      // Buscar descripción directamente sin validación estricta de datos
      let descripcionColumn = '';
      for (const keyword of ['descripcion', 'descripción', 'desc', 'desc.', 'detalle', 'producto', 'articulo', 'artículo']) {
        const normalizedKeyword = normalizeText(keyword);
        const exactMatch = stockColumnas.find(col => normalizeText(col) === normalizedKeyword);
        if (exactMatch) {
          descripcionColumn = exactMatch;
          break;
        }
      }
      
      // Si no hay coincidencia exacta, buscar parcial
      if (!descripcionColumn) {
        for (const keyword of ['descripcion', 'descripción', 'desc', 'detalle', 'producto']) {
          const normalizedKeyword = normalizeText(keyword);
          const partialMatch = stockColumnas.find(col => normalizeText(col).includes(normalizedKeyword));
          if (partialMatch) {
            descripcionColumn = partialMatch;
            break;
          }
        }
      }
      
      console.log('Descripción encontrada:', descripcionColumn);
      
      setMapeo(prev => ({
        ...prev,
        productoId: prev.productoId || findDefaultColumn(stockColumnas, ['cod', 'cód', 'cod.', 'cód.', 'codigo', 'código', 'sku']),
        descripcion: prev.descripcion || descripcionColumn,
        stockCABAMateriaPrima: prev.stockCABAMateriaPrima || findDefaultColumn(stockColumnas, ['caba mp', 'caba materia prima', 'buenos aires mp', 'ba mp']),
        stockCABAProductoTerminado: prev.stockCABAProductoTerminado || findDefaultColumn(stockColumnas, ['caba pt', 'caba producto terminado', 'buenos aires pt', 'ba pt']),
        stockEntreRiosMateriaPrima: prev.stockEntreRiosMateriaPrima || findDefaultColumn(stockColumnas, ['entre rios mp', 'er mp', 'entrerios mp']),
        stockEntreRiosProductoTerminado: prev.stockEntreRiosProductoTerminado || findDefaultColumn(stockColumnas, ['entre rios pt', 'er pt', 'entrerios pt']),
        rotacionMensual: prev.rotacionMensual || findDefaultColumn(stockColumnas, ['rotacion', 'rotación', 'consumo', 'demanda mensual', 'venta mensual']),
      }));
    }
  }, [stockColumnas, stockData]);

  const handleMapeoChange = (campo: keyof typeof mapeo, valor: string) => {
    setMapeo(prev => ({ ...prev, [campo]: valor }));
  };

  const handleAnalizar = () => {
    if (!isReady) {
      setError('Por favor, complete todos los campos de mapeo requeridos antes de continuar.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setConfiguracion({ mapeo });
      const resultados = redistribuirStock(stockData, mapeo);
      setResultados(resultados);
      setStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error durante el análisis.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Paso 2: Configurar Análisis</h3>
      <p className="mt-1 text-sm text-gray-700 dark:text-gray-400">Asigne las columnas de su archivo a los campos requeridos para el análisis de redistribución.</p>

      <div className="mt-8 space-y-8">
        <div className="rounded-md border border-gray-300 p-6 dark:border-gray-600">
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200">Archivo de Stock: <span className="font-normal text-gray-700 dark:text-gray-400">{stockFile?.name}</span></h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              {stockFile && stockPreviewData.length > 0 && (
                <DataPreviewTable 
                  title="Previsualización de Stock"
                  previewData={stockPreviewData}
                  columns={stockColumnas}
                  highlightedColumns={Object.values(mapeo)}
                />
              )}
            </div>
            <div>
              <div className="mt-4 grid grid-cols-1 gap-6">
                <SelectAsignacion
                  label="ID de Producto (SKU) *"
                  columnas={stockColumnas}
                  value={mapeo.productoId}
                  onChange={(e) => handleMapeoChange('productoId', e.target.value)}
                />
                <SelectAsignacion
                  label="Descripción del Producto"
                  columnas={stockColumnas}
                  value={mapeo.descripcion}
                  onChange={(e) => handleMapeoChange('descripcion', e.target.value)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectAsignacion
                    label="Stock CABA - Materia Prima *"
                    columnas={stockColumnas}
                    value={mapeo.stockCABAMateriaPrima}
                    onChange={(e) => handleMapeoChange('stockCABAMateriaPrima', e.target.value)}
                  />
                  <SelectAsignacion
                    label="Stock CABA - Producto Terminado *"
                    columnas={stockColumnas}
                    value={mapeo.stockCABAProductoTerminado}
                    onChange={(e) => handleMapeoChange('stockCABAProductoTerminado', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectAsignacion
                    label="Stock Entre Ríos - Materia Prima *"
                    columnas={stockColumnas}
                    value={mapeo.stockEntreRiosMateriaPrima}
                    onChange={(e) => handleMapeoChange('stockEntreRiosMateriaPrima', e.target.value)}
                  />
                  <SelectAsignacion
                    label="Stock Entre Ríos - Producto Terminado *"
                    columnas={stockColumnas}
                    value={mapeo.stockEntreRiosProductoTerminado}
                    onChange={(e) => handleMapeoChange('stockEntreRiosProductoTerminado', e.target.value)}
                  />
                </div>
                <SelectAsignacion
                  label="Rotación Mensual *"
                  columnas={stockColumnas}
                  value={mapeo.rotacionMensual}
                  onChange={(e) => handleMapeoChange('rotacionMensual', e.target.value)}
                />
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
