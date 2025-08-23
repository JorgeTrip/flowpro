// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ReporteResultados } from '@/app/lib/reportGenerator';

// --- Helper Functions ---
const formatCurrency = (value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
const formatQuantity = (value: number) => new Intl.NumberFormat('es-AR').format(value);

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f97316', '#8b5cf6'];

export const VentasPorZona = ({ ventasPorZona, cantidadesPorZona }: {
  ventasPorZona: ReporteResultados['ventasPorZona'];
  cantidadesPorZona: ReporteResultados['cantidadesPorZona'];
}) => {
  const [metric, setMetric] = useState<'importe' | 'cantidad'>('importe');

  const data = useMemo(() => {
    const sourceData = metric === 'importe' ? ventasPorZona : cantidadesPorZona;
    const totalsByZone: Record<string, number> = {};

    // Sumar los valores de AX para cada zona a través de todos los meses
    Object.values(sourceData).forEach(monthlyData => {
      Object.entries(monthlyData).forEach(([zone, zoneData]) => {
        if (!totalsByZone[zone]) {
          totalsByZone[zone] = 0;
        }
        totalsByZone[zone] += zoneData.AX;
      });
    });

    return Object.entries(totalsByZone)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [metric, ventasPorZona, cantidadesPorZona]);

  interface PieLabelRenderProps {
  cx: number;
  cy: number;
  midAngle?: number;
  innerRadius: number;
  outerRadius: number;
  percent?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { 
    payload: { name: string; value: number };
    name: string;
    value: number;
  }[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const { name, value } = payload[0].payload;
      return (
        <div className="p-2 bg-gray-700 text-white rounded-md border border-gray-600 shadow-lg">
          <p className="font-bold">{`${name}: ${metric === 'importe' ? formatCurrency(value) : formatQuantity(value)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Ventas por Zona</h4>
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
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={150}
            fill="#8884d8"
            dataKey="value"
            label={({ cx, cy, midAngle = 0, innerRadius, outerRadius, percent = 0 }: PieLabelRenderProps) => {
              const RADIAN = Math.PI / 180;
              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
              const x = cx + radius * Math.cos(-midAngle * RADIAN);
              const y = cy + radius * Math.sin(-midAngle * RADIAN);
              return (
                <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                  {`${(percent * 100).toFixed(0)}%`}
                </text>
              );
            }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
