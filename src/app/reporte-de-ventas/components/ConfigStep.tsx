// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useState, useEffect } from 'react';
import { useReporteVentasStore, ExcelRow } from '@/app/stores/reporteVentasStore';
import { Venta } from '../lib/types';
import DataPreviewTable from '@/app/estimar-demanda/components/DataPreviewTable'; // TODO: Mover a una carpeta compartida

// Icono de tilde para confirmación visual
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5 flex-shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const SelectAsignacion = ({ label, columnas, value, onChange }: { label: string, columnas: string[], value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }) => (
  <div>
    <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
      {value && <CheckIcon />}
    </label>
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
    ventasColumnas,
    ventasPreviewData,
    setStep,
    setConfiguracion,
    generarReporte,
  } = useReporteVentasStore();

  const [mapeo, setMapeo] = useState<{[key in keyof Venta]?: string}>({
    Periodo: '',
    Fecha: '',
    TipoComprobante: '',
    NroComprobante: '',
    ReferenciaVendedor: '',
    RazonSocial: '',
    Cliente: '',
    Direccion: '',
    Articulo: '',
    Descripcion: '',
    Cantidad: '',
    PrecioUnitario: '',
    PrecioTotal: '',
    Total: '',
    TotalCIVA: '',
    DirectoIndirecto: '',
    DescRubro: '',
    DescripcionZona: '',
  });

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const findDefaultColumn = (columns: string[], keywords: string[]): string => {
      for (const keyword of keywords) {
        const foundColumn = columns.find(col => col.toLowerCase().includes(keyword.toLowerCase()));
        if (foundColumn) return foundColumn;
      }
      return '';
    };

    if (ventasColumnas.length > 0) {
      setMapeo(prev => ({
        ...prev,
        Periodo: prev.Periodo || findDefaultColumn(ventasColumnas, ['periodo', 'período']),
        Fecha: prev.Fecha || findDefaultColumn(ventasColumnas, ['fecha']),
        TipoComprobante: prev.TipoComprobante || findDefaultColumn(ventasColumnas, ['tipo', 'comprobante']),
        NroComprobante: prev.NroComprobante || findDefaultColumn(ventasColumnas, ['numero', 'nro']),
        ReferenciaVendedor: prev.ReferenciaVendedor || findDefaultColumn(ventasColumnas, ['vendedor', 'referencia']),
        RazonSocial: prev.RazonSocial || findDefaultColumn(ventasColumnas, ['razon social', 'razón social']),
        Cliente: prev.Cliente || findDefaultColumn(ventasColumnas, ['cliente']),
        Direccion: prev.Direccion || findDefaultColumn(ventasColumnas, ['direccion', 'dirección']),
        Articulo: prev.Articulo || findDefaultColumn(ventasColumnas, ['articulo', 'artículo', 'cod', 'cód', 'sku']),
        Descripcion: prev.Descripcion || findDefaultColumn(ventasColumnas, ['descripcion', 'descripción']),
        Cantidad: prev.Cantidad || findDefaultColumn(ventasColumnas, ['cantidad', 'cant']),
        PrecioUnitario: prev.PrecioUnitario || findDefaultColumn(ventasColumnas, ['precio unitario', 'unitario']),
        PrecioTotal: prev.PrecioTotal || findDefaultColumn(ventasColumnas, ['precio total', 'subtotal']),
        Total: prev.Total || findDefaultColumn(ventasColumnas, ['total']),
        TotalCIVA: prev.TotalCIVA || findDefaultColumn(ventasColumnas, ['total c/iva', 'total con iva']),
        DirectoIndirecto: prev.DirectoIndirecto || findDefaultColumn(ventasColumnas, ['directo', 'indirecto']),
        DescRubro: prev.DescRubro || findDefaultColumn(ventasColumnas, ['rubro']),
        DescripcionZona: prev.DescripcionZona || findDefaultColumn(ventasColumnas, ['zona']),
      }));
    }
  }, [ventasColumnas]);

  useEffect(() => {
    const isMapeoReady = mapeo.Fecha && mapeo.Articulo && mapeo.Cantidad && mapeo.PrecioTotal;
    setIsReady(!!isMapeoReady);
  }, [mapeo]);

  const handleMapeoChange = (campo: keyof Venta, valor: string) => {
    setMapeo(prev => ({ ...prev, [campo]: valor }));
  };

  const handleAnalizar = () => {
    if (!isReady) return;
    setConfiguracion({ mapeo });
    generarReporte();
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Paso 2: Configurar Reporte</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Asigne las columnas de su archivo de ventas a los campos requeridos.</p>

      <div className="mt-8 space-y-8">
        <div className="rounded-md border border-gray-300 p-6 dark:border-gray-600">
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200">Archivo de Ventas: <span className="font-normal text-gray-600 dark:text-gray-400">{ventasFile?.name}</span></h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <div>
              {ventasFile && ventasPreviewData.length > 0 && (
                <DataPreviewTable 
                  title="Previsualización de Ventas"
                  previewData={ventasPreviewData as ExcelRow[]}
                  columns={ventasColumnas}
                  highlightedColumns={Object.values(mapeo).filter((v): v is string => !!v)}
                />
              )}
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <SelectAsignacion label="Fecha" columnas={ventasColumnas} value={mapeo.Fecha || ''} onChange={(e) => handleMapeoChange('Fecha', e.target.value)} />
              <SelectAsignacion label="Artículo (SKU)" columnas={ventasColumnas} value={mapeo.Articulo || ''} onChange={(e) => handleMapeoChange('Articulo', e.target.value)} />
              <SelectAsignacion label="Cantidad" columnas={ventasColumnas} value={mapeo.Cantidad || ''} onChange={(e) => handleMapeoChange('Cantidad', e.target.value)} />
              <SelectAsignacion label="Precio Total" columnas={ventasColumnas} value={mapeo.PrecioTotal || ''} onChange={(e) => handleMapeoChange('PrecioTotal', e.target.value)} />
              <SelectAsignacion label="Cliente" columnas={ventasColumnas} value={mapeo.Cliente || ''} onChange={(e) => handleMapeoChange('Cliente', e.target.value)} />
              <SelectAsignacion label="Vendedor" columnas={ventasColumnas} value={mapeo.ReferenciaVendedor || ''} onChange={(e) => handleMapeoChange('ReferenciaVendedor', e.target.value)} />
              <SelectAsignacion label="Zona" columnas={ventasColumnas} value={mapeo.DescripcionZona || ''} onChange={(e) => handleMapeoChange('DescripcionZona', e.target.value)} />
              <SelectAsignacion label="Rubro" columnas={ventasColumnas} value={mapeo.DescRubro || ''} onChange={(e) => handleMapeoChange('DescRubro', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-end space-x-4">
        <button onClick={() => setStep(1)} className="rounded-md bg-gray-200 px-4 py-2 font-semibold text-gray-800 transition-colors hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500">
          Volver
        </button>
        <button onClick={handleAnalizar} disabled={!isReady} className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-500">
          Generar Reporte
        </button>
      </div>
    </div>
  );
}
