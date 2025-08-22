// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, TooltipProps } from 'recharts';
import { ReporteResultados } from '@/app/lib/reportGenerator';

// --- Helper Functions ---
const formatCurrency = (value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
const formatQuantity = (value: number) => new Intl.NumberFormat('es-AR').format(value);
const formatName = (name: string) => name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');

interface VendedorData {
    name: string;
    value: number;
    importe: number;
    cantidad: number;
    porcentaje: string;
}

interface CustomizedLabelProps {
    x?: string | number;
    y?: string | number;
    width?: string | number;
    height?: string | number;
    index?: number;
    data: VendedorData[];
}

const CustomizedLabel = (props: CustomizedLabelProps) => {
    const { x = 0, y = 0, width = 0, height = 0, index, data } = props;

    if (index === undefined || !data || !data[index]) {
        return null;
    }

    const numX = typeof x === 'string' ? parseFloat(x) : x;
    const numY = typeof y === 'string' ? parseFloat(y) : y;
    const numWidth = typeof width === 'string' ? parseFloat(width) : width;
    const numHeight = typeof height === 'string' ? parseFloat(height) : height;
    const item = data[index];

    const porcentaje = item.porcentaje || '0%';
    const importeFormateado = formatCurrency(item.importe);
    const cantidadFormateada = formatQuantity(item.cantidad);

    return (
        <g>
            <text x={numX + numWidth + 8} y={numY + numHeight / 2 - 7} textAnchor="start" dominantBaseline="middle" className="fill-gray-800 dark:fill-gray-200 font-bold text-sm">
                {porcentaje}
            </text>
            <text x={numX + numWidth + 8} y={numY + numHeight / 2 + 9} textAnchor="start" dominantBaseline="middle" className="fill-gray-600 dark:fill-gray-400 text-xs">
                {`${importeFormateado} | ${cantidadFormateada} u.`}
            </text>
        </g>
    );
};

export const VentasPorVendedor = ({ ventasPorVendedor, cantidadesPorVendedor }: {
  ventasPorVendedor: ReporteResultados['ventasPorVendedor'];
  cantidadesPorVendedor: ReporteResultados['cantidadesPorVendedor'];
}) => {
  const [metric, setMetric] = useState<'importe' | 'cantidad'>('importe');
  const [mesSeleccionado, setMesSeleccionado] = useState<string>('Total');

  const mesesConDatos = useMemo(() => {
    const meses = new Set<string>();
    Object.keys(ventasPorVendedor.resultado).forEach(mes => meses.add(mes));
    Object.keys(cantidadesPorVendedor.resultado).forEach(mes => meses.add(mes));
    return Array.from(meses);
  }, [ventasPorVendedor, cantidadesPorVendedor]);

  const data = useMemo(() => {
    const totalsByVendor: Record<string, { importe: number; cantidad: number }> = {};

    if (mesSeleccionado !== 'Total') {
      const vendorsInMonth = new Set([
        ...Object.keys(ventasPorVendedor.resultado[mesSeleccionado] || {}),
        ...Object.keys(cantidadesPorVendedor.resultado[mesSeleccionado] || {}),
      ]);

      vendorsInMonth.forEach(vendor => {
        const importe = ventasPorVendedor.resultado[mesSeleccionado]?.[vendor]?.AX || 0;
        const cantidad = cantidadesPorVendedor.resultado[mesSeleccionado]?.[vendor]?.AX || 0;
        totalsByVendor[vendor] = { importe, cantidad };
      });
    } else {
      // --- Lógica para 'Total' ---
      const allVendors = new Set([
        ...Object.values(ventasPorVendedor.resultado).flatMap(Object.keys),
        ...Object.values(cantidadesPorVendedor.resultado).flatMap(Object.keys),
      ]);

      allVendors.forEach(vendor => {
        totalsByVendor[vendor] = { importe: 0, cantidad: 0 };
        Object.values(ventasPorVendedor.resultado).forEach(monthlyData => {
          if (monthlyData[vendor]) {
            totalsByVendor[vendor].importe += monthlyData[vendor].AX;
          }
        });
        Object.values(cantidadesPorVendedor.resultado).forEach(monthlyData => {
          if (monthlyData[vendor]) {
            totalsByVendor[vendor].cantidad += monthlyData[vendor].AX;
          }
        });
      });
    }

    const totalGeneral = Object.values(totalsByVendor).reduce((sum, data) => sum + (metric === 'importe' ? data.importe : data.cantidad), 0);

    return Object.entries(totalsByVendor)
      .map(([name, data]) => {
        const value = metric === 'importe' ? data.importe : data.cantidad;
        return {
          name: formatName(name),
          value,
          importe: data.importe,
          cantidad: data.cantidad,
          porcentaje: totalGeneral > 0 ? `${((value / totalGeneral) * 100).toFixed(1)}%` : '0%',
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [metric, mesSeleccionado, ventasPorVendedor, cantidadesPorVendedor]);

  const maxValue = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.max(...data.map(item => item.value)) * 1.3;
  }, [data]);

  interface CustomTooltipProps {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-gray-700 text-white rounded-md border border-gray-600 shadow-lg">
          <p className="font-bold">{label}</p>
          <p>{`${metric === 'importe' ? 'Importe' : 'Cantidad'}: ${metric === 'importe' ? formatCurrency(payload[0].value) : formatQuantity(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Top 10 Vendedores</h4>
        <div className="flex items-center space-x-4">
          <select
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          >
            <option value="Total">Todos los meses</option>
            {mesesConDatos.map(mes => <option key={mes} value={mes}>{mes}</option>)}
          </select>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as 'importe' | 'cantidad')}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-32 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          >
            <option value="importe">Importe</option>
            <option value="cantidad">Cantidad</option>
          </select>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 120, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, maxValue]} tickFormatter={(value) => metric === 'importe' ? formatCurrency(value as number) : formatQuantity(value as number)} />
          <YAxis type="category" dataKey="name" width={100} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <defs>
            <linearGradient id="colorBarVendedor" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#9F9AE3" stopOpacity={1}/>
              <stop offset="75%" stopColor="#6F6BB8" stopOpacity={1}/>
              <stop offset="100%" stopColor="#5A57A6" stopOpacity={1}/>
            </linearGradient>
            <filter id="shadowVendedor" x="-10%" y="-10%" width="120%" height="130%">
              <feOffset result="offOut" in="SourceGraphic" dx="3" dy="3" />
              <feColorMatrix result="matrixOut" in="offOut" type="matrix"
                values="0.2 0 0 0 0 0 0.2 0 0 0 0 0 0.2 0 0 0 0 0 1 0" />
              <feGaussianBlur result="blurOut" in="matrixOut" stdDeviation="3" />
              <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
            </filter>
          </defs>
          <Bar dataKey="value" name={metric === 'importe' ? 'Ventas' : 'Cantidad'} fill="url(#colorBarVendedor)" filter="url(#shadowVendedor)" radius={[0, 4, 4, 0]}>
            <LabelList dataKey="value" content={(props) => <CustomizedLabel {...props} data={data} />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
