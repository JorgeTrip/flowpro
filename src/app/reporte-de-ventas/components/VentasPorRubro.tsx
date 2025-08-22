// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector, TooltipProps } from 'recharts';
import { ReporteResultados } from '@/app/lib/reportGenerator';

// --- Helper Functions ---
const formatCurrency = (value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
const formatQuantity = (value: number) => new Intl.NumberFormat('es-AR').format(value);

const COLORS = ['#3b82f6', '#10b981']; // Azul y Verde

interface ActiveShapeProps {
    cx?: number;
    cy?: number;
    innerRadius?: number;
    outerRadius?: number;
    startAngle?: number;
    endAngle?: number;
    fill?: string;
    payload?: { name: string; value: number };
    percent?: number;
    metric: 'importe' | 'cantidad';
}

const renderActiveShape = (props: ActiveShapeProps) => {
    const { cx = 0, cy = 0, innerRadius = 0, outerRadius = 0, startAngle = 0, endAngle = 0, fill = '#8884d8', payload, percent = 0, metric } = props;

    if (!payload) return <g />;

  return (
    <g>
      <text x={cx} y={cy} dy={-15} textAnchor="middle" fill={fill} className="font-bold">
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={5} textAnchor="middle" fill="#333" className="dark:fill-gray-200">
        {metric === 'importe' ? formatCurrency(payload.value) : formatQuantity(payload.value)}
      </text>
      <text x={cx} y={cy} dy={25} textAnchor="middle" fill="#999" className="dark:fill-gray-400">
        {`( ${(percent * 100).toFixed(2)}%)`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export const VentasPorRubro = ({ ventasPorRubro, cantidadesPorRubro }: {
  ventasPorRubro: ReporteResultados['ventasPorRubro'];
  cantidadesPorRubro: ReporteResultados['cantidadesPorRubro'];
}) => {
  const [metric, setMetric] = useState<'importe' | 'cantidad'>('importe');
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const data = useMemo(() => {
    const sourceData = metric === 'importe' ? ventasPorRubro : cantidadesPorRubro;
    return Object.keys(sourceData).map(key => ({
      name: key,
      value: sourceData[key as keyof typeof sourceData].AX,
    }));
  }, [metric, ventasPorRubro, cantidadesPorRubro]);

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  interface CustomTooltipProps {
    active?: boolean;
    payload?: { name: string; value: number }[];
  }

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-gray-700 text-white rounded-md border border-gray-600 shadow-lg">
          <p className="font-bold">{`${payload[0].name}: ${metric === 'importe' ? formatCurrency(payload[0].value) : formatQuantity(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Ventas por Rubro</h4>
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
            {...{ activeIndex, activeShape: (props: any) => renderActiveShape({ ...props, metric }) } as any}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
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
