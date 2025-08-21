// 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useStoreWithEqualityFn } from 'zustand/traditional';
import { useEstimarDemandaStore, EstimarDemandaState } from '@/app/stores/estimarDemandaStore';
import { shallow } from 'zustand/shallow';
import { ResultadoItem, getCriticalityColor, Criticidad } from '@/app/lib/demandEstimator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCwIcon, Loader2 } from 'lucide-react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const DemandaStockChart = ({ data }: { data: ResultadoItem[] }) => (
  <ResponsiveContainer width="100%" height={400}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis 
        dataKey="descripcion" 
        angle={-45}
        textAnchor="end"
        height={100}
        interval={0}
      />
      <YAxis />
      <Tooltip
        contentStyle={{
          backgroundColor: 'rgba(31, 41, 55, 0.9)',
          borderColor: '#4b5563',
        }}
        labelStyle={{ color: '#f3f4f6' }}
        formatter={(value, name, props) => [
          value,
          name,
          `${props.payload.productoId} - ${props.payload.descripcion}`
        ]}
      />
      <Legend />
      <Bar dataKey="venta" fill="#8884d8" name="Ventas Mensuales" />
      <Bar dataKey="stockNeto" fill="#82ca9d" name="Stock Neto" />
    </BarChart>
  </ResponsiveContainer>
);

const ResultsTable = ({ data }: { data: ResultadoItem[] }) => (
  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead className="bg-gray-50 dark:bg-gray-800">
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Descripción</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">ID Producto</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Ventas Anuales</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Stock Actual</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Stock Reservado</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Stock Neto</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Meses Cobertura</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Sugerencia</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
        {data.map((item, index) => {
          const criticalityClass = getCriticalityColor(item.criticidad);
          return (
            <tr key={`${item.productoId}-${index}`} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${criticalityClass}`}>
              <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white max-w-xs truncate" title={item.descripcion}>
                {item.descripcion}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-gray-700 dark:text-gray-300">
                {item.productoId}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                {item.venta.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                {item.stock.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                {item.stockReservado.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                {item.stockNeto.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-bold">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.criticidad === 'alta' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                  item.criticidad === 'media' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                }`}>
                  {item.mesesCobertura === 999 ? '∞' : item.mesesCobertura} meses
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-sm">
                {item.sugerencia}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export function ResultsStep() {
  const { resultados, isLoading, error, reset, reAnalizar } = useStoreWithEqualityFn(
    useEstimarDemandaStore,
    (state: EstimarDemandaState) => ({
      resultados: state.resultados,
      isLoading: state.isLoading,
      error: state.error,
      reset: state.reset,
      reAnalizar: state.reAnalizar,
    }),
    shallow
  );

  const chartData = [...(resultados || [])]
    .sort((a, b) => {
      // Ordenar por criticidad primero, luego por meses de cobertura
      if (a.criticidad !== b.criticidad) {
        const orden: { [key in Criticidad]: number } = { 'alta': 0, 'media': 1, 'baja': 2 };
        return orden[a.criticidad] - orden[b.criticidad];
      }
      return a.mesesCobertura - b.mesesCobertura;
    })
    .slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Paso 3: Resultados del Análisis</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Visualice la comparación entre el stock actual y la demanda, y las sugerencias de compra.</p>
        
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Top 10 Productos Más Críticos por Stock</h4>
          <DemandaStockChart data={chartData} />
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Leyenda de Criticidad:</h5>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-red-100 border border-red-300 rounded"></span>
              <span className="text-gray-700 dark:text-gray-300">Crítico (&lt; 4 meses)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></span>
              <span className="text-gray-700 dark:text-gray-300">Atención (= 4 meses)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-100 border border-green-300 rounded"></span>
              <span className="text-gray-700 dark:text-gray-300">Adecuado (&gt; 4 meses)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Detalle del Análisis</h4>
        <ResultsTable data={resultados || []} />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h4 className="font-semibold text-gray-800 dark:text-gray-200">Acciones</h4>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button className="rounded-md bg-green-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-green-700">
            Exportar a Excel
          </button>
                                                  <button onClick={reAnalizar} disabled={isLoading} className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-500">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <RefreshCwIcon className="mr-2 h-5 w-5" />
                Refrescar Análisis
              </>
            )}
          </button>
          <button onClick={reset} disabled={isLoading} className="inline-flex items-center justify-center rounded-md bg-gray-500 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50">
            <ArrowPathIcon className="mr-2 h-5 w-5" />
            Realizar Nuevo Análisis
          </button>
        </div>
      </div>
    </div>
  );
}
