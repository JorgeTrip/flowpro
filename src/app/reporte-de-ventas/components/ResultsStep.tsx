// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useState, useMemo } from 'react';
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

// --- Helper Functions ---
const formatCurrency = (value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
const formatQuantity = (value: number) => new Intl.NumberFormat('es-AR').format(value);

// --- Sub-components ---

const VentasMensuales = ({ ventasPorMes, cantidadesPorMes }: {
  ventasPorMes: ReporteResultados['ventasPorMes'];
  cantidadesPorMes: ReporteResultados['cantidadesPorMes'];
}) => {
  const [metric, setMetric] = useState<'importe' | 'cantidad'>('importe');
  const allMonths = useMemo(() => Object.keys(ventasPorMes), [ventasPorMes]);

  const chartData = useMemo(() => {
    return allMonths.map(mes => {
      const importeData = ventasPorMes[mes] || { A: 0, X: 0, AX: 0 };
      const cantidadData = cantidadesPorMes[mes] || { A: 0, X: 0, AX: 0 };
      return {
        name: mes,
        importeA: importeData.A,
        importeX: importeData.X,
        importeAX: importeData.AX,
        cantidadA: cantidadData.A,
        cantidadX: cantidadData.X,
        cantidadAX: cantidadData.AX,
      };
    });
  }, [allMonths, ventasPorMes, cantidadesPorMes]);

  interface TooltipEntry {
    name: string;
    value: number;
    color: string;
  }

  interface TooltipProps {
    active?: boolean;
    payload?: TooltipEntry[];
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-gray-700 text-white rounded-md border border-gray-600 shadow-lg">
          <p className="font-bold">{label}</p>
          {payload.map((entry: TooltipEntry, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {`${entry.name}: ${metric === 'importe' ? formatCurrency(entry.value) : formatQuantity(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Ventas Mensuales</h4>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as 'importe' | 'cantidad')}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-32 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        >
          <option value="importe">Importe</option>
          <option value="cantidad">Cantidad</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} interval={0} stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" tickFormatter={(value) => metric === 'importe' ? `$${(Number(value) / 1000000).toFixed(1)}M` : `${(Number(value) / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }} />
          <Legend wrapperStyle={{ paddingTop: '40px' }} />
          {metric === 'importe' ? (
            <>
              <Bar dataKey="importeA" stackId="a" fill="#3b82f6" name="Importe A" />
              <Bar dataKey="importeX" stackId="a" fill="#10b981" name="Importe X" />
            </>
          ) : (
            <>
              <Bar dataKey="cantidadA" stackId="b" fill="#8b5cf6" name="Cantidad A" />
              <Bar dataKey="cantidadX" stackId="b" fill="#ec4899" name="Cantidad X" />
            </>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};


// --- Main Component ---

export function ResultsStep() {
  const { resultados, reset, isGenerating } = useReporteVentasStore();

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
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <VentasMensuales ventasPorMes={resultados.ventasPorMes} cantidadesPorMes={resultados.cantidadesPorMes} />
            <VentasPorRubro ventasPorRubro={resultados.ventasPorRubro} cantidadesPorRubro={resultados.cantidadesPorRubro} />
            <VentasPorZona ventasPorZona={resultados.ventasPorZona} cantidadesPorZona={resultados.cantidadesPorZona} />
            <VentasPorVendedor ventasPorVendedor={resultados.ventasPorVendedor} cantidadesPorVendedor={resultados.cantidadesPorVendedor} />
            <TopClientes 
              topClientesMinoristas={resultados.topClientesMinoristas}
              topClientesDistribuidores={resultados.topClientesDistribuidores}
              topClientesMinoristasPorCantidad={resultados.topClientesMinoristasPorCantidad}
              topClientesDistribuidoresPorCantidad={resultados.topClientesDistribuidoresPorCantidad}
            />
            <TopProductos
              topProductosMasVendidos={resultados.topProductosMasVendidos}
              topProductosMasVendidosPorImporte={resultados.topProductosMasVendidosPorImporte}
              topProductosMenosVendidos={resultados.topProductosMenosVendidos}
            />
            <TopProductosPorCategoria
              topProductosPorCategoriaPorCantidad={resultados.topProductosPorCategoriaPorCantidad}
              topProductosPorCategoriaPorImporte={resultados.topProductosPorCategoriaPorImporte}
            />
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">No hay resultados para mostrar. Genere un nuevo reporte para comenzar.</p>
        </div>
      )}
    </div>
  );
}
