// 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import React, { useState, useMemo, useRef } from 'react';
import { PieChart, Pie, ResponsiveContainer, Tooltip, Legend, Sector, Cell } from 'recharts';
import { CameraIcon } from '@heroicons/react/24/outline';
import { exportChartAsPNG } from '../lib/exportUtils';
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
  const [_activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [distanciaEtiquetas, setDistanciaEtiquetas] = useState<number>(1.8);
  const chartRef = useRef<HTMLDivElement>(null);

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

  interface _PieLabelRenderProps {
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
      const total = data.reduce((sum, item) => sum + item.value, 0);
      const percentage = total > 0 ? (value / total * 100).toFixed(2) : '0.00';
      
      return (
        <div className="p-3 bg-white border border-gray-300 rounded-lg shadow-lg max-w-xs">
          <p className="font-bold text-gray-800 mb-2">{name}</p>
          <p className="text-gray-600">
            {metric === 'importe' ? 'Importe: ' : 'Cantidad: '}
            <strong className="text-gray-800">{metric === 'importe' ? formatCurrency(value) : formatQuantity(value)}</strong>
          </p>
          <p className="text-gray-600">
            Porcentaje: <strong className="text-gray-800">{percentage}%</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  interface ActiveShapeProps {
    cx: number;
    cy: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    fill: string;
    payload: { name: string; value: number };
    percent: number;
  }

  const _renderActiveShape = (props: ActiveShapeProps) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
    
    return (
      <g>
        <text x={cx} y={cy} dy={-20} textAnchor="middle" fill={fill} className="font-bold text-sm">
          {payload.name}
        </text>
        <text x={cx} y={cy} dy={0} textAnchor="middle" fill="#333" className="text-sm">
          {metric === 'importe' ? formatCurrency(payload.value) : formatQuantity(payload.value)}
        </text>
        <text x={cx} y={cy} dy={20} textAnchor="middle" fill="#666" className="text-xs">
          {`${(percent * 100).toFixed(2)}%`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  const formatearNumeroCompacto = (num: number, esMoneda: boolean) => {
    const formatearConSeparadores = (valor: number, decimales: number = 1): string => {
      return valor.toLocaleString('es-AR', {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales
      });
    };
    
    if (num >= 1000000) {
      const valorFormateado = formatearConSeparadores(num / 1000000);
      return esMoneda
        ? `$${valorFormateado} mill.`
        : `${valorFormateado} mill.`;
    } else if (num >= 1000) {
      const valorFormateado = formatearConSeparadores(num, 0);
      return esMoneda
        ? `$${valorFormateado}`
        : `${valorFormateado}`;
    } else {
      const valorFormateado = formatearConSeparadores(num, 0);
      return esMoneda
        ? `$${valorFormateado}`
        : `${valorFormateado}`;
    }
  };

  const handleExport = () => {
    exportChartAsPNG(chartRef, 'ventas-por-zona');
  };

  return (
    <div ref={chartRef} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Ventas por Zona</h4>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center chart-controls">
          <button
            onClick={handleExport}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            title="Exportar como PNG"
          >
            <CameraIcon className="w-4 h-4" />
          </button>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as 'importe' | 'cantidad')}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-32 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          >
            <option value="importe">Importe</option>
            <option value="cantidad">Cantidad</option>
          </select>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 dark:text-gray-400">Distancia de etiquetas</label>
            <input
              type="range"
              min="1"
              max="6"
              step="0.5"
              value={distanciaEtiquetas}
              onChange={(e) => setDistanciaEtiquetas(parseFloat(e.target.value))}
              className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <span className="text-xs text-gray-500 text-center">{distanciaEtiquetas}</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <defs>
            <filter id="shadow3DZona" x="-10%" y="-10%" width="120%" height="130%">
              <feOffset result="offOut" in="SourceGraphic" dx="0" dy="3" />
              <feColorMatrix result="matrixOut" in="offOut" type="matrix"
                values="0.2 0 0 0 0 0 0.2 0 0 0 0 0 0.2 0 0 0 0 0 1 0" />
              <feGaussianBlur result="blurOut" in="matrixOut" stdDeviation="3" />
              <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
            </filter>
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            startAngle={90}
            endAngle={-270}
            filter="url(#shadow3DZona)"
            label={(props) => {
              const { cx, cy, midAngle, _innerRadius, outerRadius, name, value, index } = props;
              
              // Validaciones de tipos
              if (!cx || !cy || midAngle === undefined || !outerRadius || !name || value === undefined || index === undefined) {
                return null;
              }
              
              const total = data.reduce((sum, item) => sum + item.value, 0);
              const percentage = total > 0 ? (value / total * 100).toFixed(2) : '0.00';
              
              // Calcular posición de la etiqueta usando el ángulo medio
              const RADIAN = Math.PI / 180;
              const radius = outerRadius + (20 * distanciaEtiquetas);
              const x = cx + radius * Math.cos(-midAngle * RADIAN);
              const y = cy + radius * Math.sin(-midAngle * RADIAN);
              
              // Determinar alineación del texto
              const textAnchor = x > cx ? 'start' : 'end';
              
              // Formatear valores
              const valorFormateado = formatearNumeroCompacto(value, metric === 'importe');
              
              return (
                <g>
                  {/* Línea conectora */}
                  <line
                    x1={cx + (outerRadius + 5) * Math.cos(-midAngle * RADIAN)}
                    y1={cy + (outerRadius + 5) * Math.sin(-midAngle * RADIAN)}
                    x2={x - (textAnchor === 'start' ? 5 : -5)}
                    y2={y}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={1}
                  />
                  
                  {/* Nombre y porcentaje en negrita */}
                  <text 
                    x={x} 
                    y={y - 10} 
                    fill={COLORS[index % COLORS.length]} 
                    textAnchor={textAnchor} 
                    dominantBaseline="central"
                    className="font-bold text-sm"
                  >
                    {name}: {percentage}%
                  </text>
                  
                  {/* Valor formateado */}
                  <text 
                    x={x} 
                    y={y + 10} 
                    fill="#666" 
                    textAnchor={textAnchor} 
                    dominantBaseline="central"
                    className="text-xs"
                  >
                    {metric === 'importe' ? '$: ' : 'Cant: '}{valorFormateado}
                  </text>
                </g>
              );
            }}
            labelLine={{
              stroke: "#666",
              strokeWidth: 1
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
