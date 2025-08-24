// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import React, { useState, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useReporteVentasStore } from '@/app/stores/reporteVentasStore';
import { ReporteResultados } from '@/app/lib/reportGenerator';
import { VentasPorRubro } from './VentasPorRubro';
import { VentasPorZona } from './VentasPorZona';
import { VentasPorVendedor } from './VentasPorVendedor';
import { TopClientes } from './TopClientes';
import { TopProductos } from './TopProductos';
import { TopProductosPorCategoria } from './TopProductosPorCategoria';
import { VentasMensuales } from './VentasMensuales';
import { VentasMensualesTable } from './VentasMensualesTable';
import { TopProductosPorCategoriaTable } from './TopProductosPorCategoriaTable';
import { VentasPorRubroTable } from './VentasPorRubroTable';
import { VentasPorZonaTable } from './VentasPorZonaTable';
import { VentasPorVendedorTable } from './VentasPorVendedorTable';
import { TopProductosTable } from './TopProductosTable';
import { TopClientesTable } from './TopClientesTable';

// --- Helper Functions ---
const formatCurrency = (value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
const formatQuantity = (value: number) => new Intl.NumberFormat('es-AR').format(value);

// --- Sub-components ---


// --- Main Component ---

export function ResultsStep() {
  const { resultados, reset, isGenerating } = useReporteVentasStore();
  const [activeTab, setActiveTab] = useState<'graficos' | 'tablas'>('graficos');

  const handleExportar = () => {
    // TODO: Implementar la lógica para exportar los resultados
  };

  if (isGenerating) {
    return (
        <div className="flex justify-center items-center h-64">
            <div className="text-center">
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Generando reporte...</p>
                <ArrowPathIcon className="animate-spin h-8 w-8 mx-auto mt-4 text-blue-500" />
            </div>
        </div>
    );
  }

  const TabButton = ({ tab, label }: { tab: 'graficos' | 'tablas'; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-6 py-3 text-sm font-medium transition-all duration-200 rounded-t-lg ${
        activeTab === tab
          ? 'bg-blue-400 dark:bg-blue-400 text-white border-b-4 border-blue-600 dark:border-blue-300 shadow-lg shadow-blue-500/50 dark:shadow-blue-400/50'
          : 'bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-shadow-sm hover:shadow-lg'
      }`}
      style={activeTab !== tab ? {
        textShadow: 'none',
        transition: 'all 0.2s ease-in-out'
      } : {
        boxShadow: '0 10px 25px -3px rgba(59, 130, 246, 0.5), 0 4px 6px -2px rgba(59, 130, 246, 0.3)',
        transition: 'all 0.2s ease-in-out'
      }}
      onMouseEnter={(e) => {
        if (activeTab !== tab) {
          e.currentTarget.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (activeTab !== tab) {
          e.currentTarget.style.textShadow = 'none';
        }
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Paso 3: Resultados del Reporte</h3>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button onClick={handleExportar} className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700" disabled={!resultados}>
            <ArrowDownTrayIcon className="-ml-1 mr-2 h-5 w-5" />
            Exportar Resultados
          </button>
          <button onClick={reset} className="inline-flex items-center justify-center rounded-md bg-gray-500 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-gray-600">
            <ArrowPathIcon className="mr-2 h-5 w-5" />
            Generar Nuevo Reporte
          </button>
        </div>
      </div>

      {resultados ? (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <TabButton tab="graficos" label="📊 Gráficos" />
            <TabButton tab="tablas" label="📋 Tablas" />
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'graficos' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <VentasMensuales ventasPorMes={resultados.ventasPorMes} cantidadesPorMes={resultados.cantidadesPorMes} />
                <VentasPorVendedor ventasPorVendedor={resultados.ventasPorVendedor} cantidadesPorVendedor={resultados.cantidadesPorVendedor} />
                <VentasPorRubro ventasPorRubro={resultados.ventasPorRubro} cantidadesPorRubro={resultados.cantidadesPorRubro} />
                <VentasPorZona ventasPorZona={resultados.ventasPorZona} cantidadesPorZona={resultados.cantidadesPorZona} />
                <TopProductos
                  topProductosMasVendidos={resultados.topProductosMasVendidos}
                  topProductosMasVendidosPorImporte={resultados.topProductosMasVendidosPorImporte}
                  topProductosMenosVendidos={resultados.topProductosMenosVendidos}
                />
                <TopClientes 
                  topClientesMinoristas={resultados.topClientesMinoristas}
                  topClientesDistribuidores={resultados.topClientesDistribuidores}
                  topClientesMinoristasPorCantidad={resultados.topClientesMinoristasPorCantidad}
                  topClientesDistribuidoresPorCantidad={resultados.topClientesDistribuidoresPorCantidad}
                />
                <div className="lg:col-span-2">
                  {(() => {
                    console.log('🔍 ResultsStep - resultados completos:', resultados);
                    console.log('🔍 ResultsStep - topProductosPorCategoriaPorCantidad:', resultados.topProductosPorCategoriaPorCantidad);
                    console.log('🔍 ResultsStep - topProductosPorCategoriaPorImporte:', resultados.topProductosPorCategoriaPorImporte);
                    return null;
                  })()}
                  <TopProductosPorCategoria
                    topProductosPorCategoria={resultados.topProductosPorCategoriaPorCantidad}
                    topProductosPorCategoriaImporte={resultados.topProductosPorCategoriaPorImporte}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Tablas de datos */}
                <div className="grid grid-cols-1 gap-8">
                  {/* Tabla de Ventas Mensuales Interactiva */}
                  <VentasMensualesTable 
                    ventasPorMes={resultados.ventasPorMes}
                    cantidadesPorMes={resultados.cantidadesPorMes}
                  />

                  {/* Tabla de Top Productos por Categoría Interactiva */}
                  <TopProductosPorCategoriaTable 
                    topProductosPorCategoria={resultados.topProductosPorCategoriaPorCantidad}
                    topProductosPorCategoriaImporte={resultados.topProductosPorCategoriaPorImporte}
                  />

                  {/* Tabla de Ventas por Rubro Interactiva */}
                  <VentasPorRubroTable 
                    ventasPorRubro={resultados.ventasPorRubro}
                    cantidadesPorRubro={resultados.cantidadesPorRubro}
                  />

                  {/* Tabla de Ventas por Zona Interactiva */}
                  <VentasPorZonaTable 
                    ventasPorZona={resultados.ventasPorZona}
                    cantidadesPorZona={resultados.cantidadesPorZona}
                  />

                  {/* Tabla de Ventas por Vendedor Interactiva */}
                  <VentasPorVendedorTable 
                    ventasPorVendedor={resultados.ventasPorVendedor}
                    cantidadesPorVendedor={resultados.cantidadesPorVendedor}
                  />

                  {/* Tabla de Top Productos Interactiva */}
                  <TopProductosTable 
                    topProductosMasVendidos={resultados.topProductosMasVendidos}
                    topProductosMenosVendidos={resultados.topProductosMenosVendidos}
                  />

                  {/* Tabla de Top Clientes Interactiva */}
                  <TopClientesTable 
                    topClientesMinoristas={resultados.topClientesMinoristas}
                    topClientesDistribuidores={resultados.topClientesDistribuidores}
                  />

                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">No hay resultados para mostrar. Genere un nuevo reporte para comenzar.</p>
        </div>
      )}
    </div>
  );
}
