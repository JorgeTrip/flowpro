// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useState, useEffect } from 'react';
import { useReporteVentasStore, ExcelRow } from '@/app/stores/reporteVentasStore';
// import { Venta } from '../lib/types';
import DataPreviewTable from './DataPreviewTable';

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

  const [mapeo, setMapeo] = useState({
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

  const [isInitialMapping, setIsInitialMapping] = useState(true);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (ventasColumnas.length > 0 && isInitialMapping) {
      console.log('Ejecutando mapeo automático con columnas:', ventasColumnas);
      
      // Crear el mapeo automático directamente
      const automaticMapping = {
        Periodo: '',
        Fecha: '',
        TipoComprobante: '',
        NroComprobante: '',
        ReferenciaVendedor: '',
        Articulo: '',
        Descripcion: '',
        Cantidad: '',
        PrecioTotal: '',
        Cliente: '',
        RazonSocial: '',
        TotalCIVA: '',
        DescripcionZona: '',
        DescRubro: '',
        Direccion: '',
        PrecioUnitario: '',
        Total: '',
        DirectoIndirecto: ''
      };
      
      const usedColumns = new Set<string>();
      
      // Crear un mapa de todas las posibles coincidencias con su especificidad
      const createMatchMap = () => {
        const matches: Array<{field: string, column: string, specificity: number}> = [];
        
        const fieldMappings = [
          { field: 'Fecha', keywords: ['fecha'] },
          { field: 'Articulo', keywords: ['articulo', 'artículo', 'cod', 'cód', 'sku'] },
          { field: 'Descripcion', keywords: ['descripcion', 'descripción'] },
          { field: 'Cantidad', keywords: ['cantidad', 'cant'] },
          { field: 'PrecioTotal', keywords: ['total', 'precio total', 'subtotal'] },
          { field: 'Cliente', keywords: ['razon social', 'razón social', 'razon', 'razón', 'cliente'] },
          { field: 'ReferenciaVendedor', keywords: ['vendedor', 'referencia'] },
          { field: 'DescripcionZona', keywords: ['descripcion zona', 'descripción zona', 'zona'] },
          { field: 'DescRubro', keywords: ['desc rubro', 'descripcion rubro', 'descripción rubro', 'rubro'] },
          { field: 'Periodo', keywords: ['periodo', 'período'] },
          { field: 'TipoComprobante', keywords: ['tipo', 'comprobante'] },
          { field: 'NroComprobante', keywords: ['numero', 'nro'] },
          { field: 'RazonSocial', keywords: ['razon social', 'razón social'] },
          { field: 'Direccion', keywords: ['direccion', 'dirección'] },
          { field: 'PrecioUnitario', keywords: ['precio unitario', 'unitario'] },
          { field: 'Total', keywords: ['total'] },
          { field: 'TotalCIVA', keywords: ['total c/iva', 'total con iva'] },
          { field: 'DirectoIndirecto', keywords: ['directo', 'indirecto'] }
        ];

        fieldMappings.forEach(({ field, keywords }) => {
          keywords.forEach((keyword, keywordIndex) => {
            ventasColumnas.forEach(column => {
              const columnLower = column.toLowerCase();
              const keywordLower = keyword.toLowerCase();
              
              if (columnLower.includes(keywordLower)) {
                // Calcular especificidad: coincidencia exacta > coincidencia de palabras completas > coincidencia parcial
                let specificity = 0;
                
                if (columnLower === keywordLower) {
                  specificity = 1000; // Coincidencia exacta
                } else if (columnLower.split(' ').includes(keywordLower) || keywordLower.split(' ').every(word => columnLower.includes(word))) {
                  specificity = 500 + (keyword.split(' ').length * 10); // Coincidencia de palabras completas, más específico si tiene más palabras
                } else {
                  specificity = 100; // Coincidencia parcial
                }
                
                // Penalizar por orden de keyword (primeras keywords tienen prioridad)
                specificity -= keywordIndex;
                
                matches.push({ field, column, specificity });
              }
            });
          });
        });

        // Ordenar por especificidad descendente
        return matches.sort((a, b) => b.specificity - a.specificity);
      };

      const allMatches = createMatchMap();
      console.log('Todas las coincidencias encontradas:', allMatches);

      // Asignar las mejores coincidencias disponibles
      const assignedFields = new Set<string>();
      
      allMatches.forEach(match => {
        if (!usedColumns.has(match.column) && !assignedFields.has(match.field)) {
          if (!automaticMapping[match.field as keyof typeof automaticMapping] || automaticMapping[match.field as keyof typeof automaticMapping] === '') {
            console.log(`Asignando ${match.field} -> ${match.column} (especificidad: ${match.specificity})`);
            (automaticMapping as Record<string, string>)[match.field] = match.column;
            usedColumns.add(match.column);
            assignedFields.add(match.field);
          }
        }
      });

      console.log('Mapeo final después de asignación automática:', automaticMapping);
      console.log('Campo Cliente específicamente:', automaticMapping.Cliente);

      // Aplicar el mapeo automático de una sola vez
      setMapeo(automaticMapping);
      setIsInitialMapping(false);
    }
  }, [ventasColumnas, isInitialMapping]);

  useEffect(() => {
    console.log('Estado actual completo del mapeo:', mapeo);
    const isMapeoReady = mapeo.Fecha && mapeo.Fecha !== '' && 
                        mapeo.Articulo && mapeo.Articulo !== '' && 
                        mapeo.Descripcion && mapeo.Descripcion !== '' &&
                        mapeo.Cantidad && mapeo.Cantidad !== '' && 
                        mapeo.PrecioTotal && mapeo.PrecioTotal !== '' &&
                        mapeo.Cliente && mapeo.Cliente !== '' &&
                        mapeo.ReferenciaVendedor && mapeo.ReferenciaVendedor !== '' &&
                        mapeo.DescripcionZona && mapeo.DescripcionZona !== '' &&
                        mapeo.DescRubro && mapeo.DescRubro !== '';
    console.log('Validando mapeo completo:', { 
      Fecha: mapeo.Fecha, 
      Articulo: mapeo.Articulo, 
      Descripcion: mapeo.Descripcion,
      Cantidad: mapeo.Cantidad, 
      PrecioTotal: mapeo.PrecioTotal,
      Cliente: mapeo.Cliente,
      ReferenciaVendedor: mapeo.ReferenciaVendedor,
      DescripcionZona: mapeo.DescripcionZona,
      DescRubro: mapeo.DescRubro,
      isReady: !!isMapeoReady
    });
    setIsReady(!!isMapeoReady);
  }, [mapeo]);

  const handleMapeoChange = (field: string, value: string) => {
    const newValue = value === 'Seleccionar columna...' ? '' : value;
    
    setMapeo(prev => {
      const newMapeo = { ...prev };
      
      // Si se está asignando un valor que ya está en uso, limpiar el campo anterior
      if (newValue) {
        Object.keys(newMapeo).forEach(key => {
          if (key !== field && (newMapeo as Record<string, string>)[key] === newValue) {
            (newMapeo as Record<string, string>)[key] = '';
          }
        });
      }
      
      // Asignar el nuevo valor
      (newMapeo as Record<string, string>)[field] = newValue;
      
      return newMapeo;
    });
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
                  highlightedColumns={Object.values(mapeo).filter((v): v is string => !!v && v !== '')}
                />
              )}
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <SelectAsignacion label="Fecha" columnas={ventasColumnas} value={mapeo.Fecha || ''} onChange={(e) => handleMapeoChange('Fecha', e.target.value)} />
              <SelectAsignacion label="Artículo (SKU)" columnas={ventasColumnas} value={mapeo.Articulo || ''} onChange={(e) => handleMapeoChange('Articulo', e.target.value)} />
              <SelectAsignacion label="Descripción" columnas={ventasColumnas} value={mapeo.Descripcion || ''} onChange={(e) => handleMapeoChange('Descripcion', e.target.value)} />
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

      {/* Mensaje de estado del mapeo */}
      <div className="mt-6">
        {isReady ? (
          <div className="flex items-center rounded-md bg-green-50 p-4 dark:bg-green-900/20">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm font-medium text-green-800 dark:text-green-200">
              ✅ Configuración completa. Los campos obligatorios están mapeados y listos para generar el reporte.
            </p>
          </div>
        ) : (
          <div className="flex items-center rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm font-medium text-yellow-800 dark:text-yellow-200">
              ⚠️ Faltan campos obligatorios: Todos los campos (Fecha, Artículo, Descripción, Cantidad, Precio Total, Cliente, Vendedor, Zona y Rubro) son requeridos para continuar.
            </p>
          </div>
        )}
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
