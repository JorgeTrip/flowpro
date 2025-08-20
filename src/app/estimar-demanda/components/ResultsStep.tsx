// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useEstimarDemandaStore } from '@/app/stores/estimarDemandaStore';
import { ResultadoItem } from '@/app/lib/demandEstimator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DemandaStockChart = ({ data }: { data: ResultadoItem[] }) => (
  <ResponsiveContainer width="100%" height={400}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="productoId" />
      <YAxis />
      <Tooltip
        contentStyle={{
          backgroundColor: 'rgba(31, 41, 55, 0.9)',
          borderColor: '#4b5563',
        }}
        labelStyle={{ color: '#f3f4f6' }}
      />
      <Legend />
      <Bar dataKey="venta" fill="#8884d8" name="Ventas Año Anterior" />
      <Bar dataKey="stock" fill="#82ca9d" name="Stock Actual" />
    </BarChart>
  </ResponsiveContainer>
);

const ResultsTable = ({ data }: { data: ResultadoItem[] }) => (
  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead className="bg-gray-50 dark:bg-gray-800">
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">ID Producto</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Ventas</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Stock</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Demanda Insatisfecha</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Sugerencia</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
        {data.map((item, index) => (
          <tr key={`${item.productoId}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.productoId}</td>
            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">{item.venta}</td>
            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">{item.stock}</td>
            <td className={`whitespace-nowrap px-6 py-4 text-sm font-semibold ${item.demandaInsatisfecha > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{item.demandaInsatisfecha}</td>
            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">{item.sugerencia}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export function ResultsStep() {
  const { resultados, reset } = useEstimarDemandaStore();

  const chartData = [...(resultados || [])]
    .sort((a, b) => b.demandaInsatisfecha - a.demandaInsatisfecha)
    .slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Paso 3: Resultados del Análisis</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Visualice la comparación entre el stock actual y la demanda, y las sugerencias de compra.</p>
        
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Top 10 Productos con Mayor Demanda Insatisfecha</h4>
          <DemandaStockChart data={chartData} />
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
          <button onClick={reset} className="rounded-md bg-gray-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-gray-700">
            Realizar Nuevo Análisis
          </button>
        </div>
      </div>
    </div>
  );
}
