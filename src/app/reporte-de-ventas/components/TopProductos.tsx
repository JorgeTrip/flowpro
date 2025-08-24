// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList as RechartsLabelList } from 'recharts';
import { ReporteResultados } from '@/app/lib/reportGenerator';

// --- Helper Functions ---
const formatCurrency = (value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
const formatQuantity = (value: number) => new Intl.NumberFormat('es-AR').format(value);
const formatName = (name: string) => name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');

interface CustomizedLabelProps {
    x?: string | number;
    y?: string | number;
    width?: string | number;
    value?: string | number;
    metric: 'importe' | 'cantidad';
}

const CustomizedLabel = (props: CustomizedLabelProps) => {
    const { x = 0, y = 0, width = 0, value = 0, metric } = props;

    const numX = typeof x === 'string' ? parseFloat(x) : x;
    const numY = typeof y === 'string' ? parseFloat(y) : y;
    const numWidth = typeof width === 'string' ? parseFloat(width) : width;
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (numValue === undefined) return null;

    // Formatear números de forma compacta
    const formatearNumeroCompacto = (num: number, esMoneda: boolean) => {
        if (num >= 1000000) {
            const valorFormateado = (num / 1000000).toLocaleString('es-AR', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            });
            return esMoneda ? `$${valorFormateado} mill.` : `${valorFormateado} mill.`;
        } else if (num >= 1000) {
            const valorFormateado = num.toLocaleString('es-AR', { maximumFractionDigits: 0 });
            return esMoneda ? `$${valorFormateado}` : `${valorFormateado}`;
        } else {
            const valorFormateado = num.toLocaleString('es-AR', { maximumFractionDigits: 0 });
            return esMoneda ? `$${valorFormateado}` : `${valorFormateado}`;
        }
    };

    const formattedValue = formatearNumeroCompacto(numValue, metric === 'importe');

    return (
        <text x={numX + numWidth + 8} y={numY + 12} textAnchor="start" dominantBaseline="middle" className="fill-gray-800 dark:fill-gray-200 font-bold text-sm">
            {formattedValue}
        </text>
    );
};


interface TopProductosComponentProps {
    topProductosMasVendidos: ReporteResultados['topProductosMasVendidos'];
    topProductosMasVendidosPorImporte: ReporteResultados['topProductosMasVendidosPorImporte'];
    topProductosMenosVendidos: ReporteResultados['topProductosMenosVendidos'];
}

export const TopProductos = ({
    topProductosMasVendidos,
    topProductosMasVendidosPorImporte,
    topProductosMenosVendidos,
}: TopProductosComponentProps) => {
    const [tipo, setTipo] = useState<'mas' | 'menos'>('mas');
    const [metric, setMetric] = useState<'importe' | 'cantidad'>('cantidad');
    const [numProductos, setNumProductos] = useState<number>(10);

    const data = useMemo(() => {
        let sourceData;
        if (tipo === 'mas') {
            sourceData = metric === 'importe' ? topProductosMasVendidosPorImporte : topProductosMasVendidos;
        } else {
            sourceData = topProductosMenosVendidos;
        }

        console.log('🔍 TopProductos - sourceData:', sourceData);
        console.log('🔍 TopProductos - tipo:', tipo, 'metric:', metric);

        return sourceData
            .map((item: { articulo: string; descripcion: string; total?: number; cantidad?: number }) => {
                console.log('🔍 TopProductos - item completo:', JSON.stringify(item, null, 2));
                console.log('🔍 TopProductos - item.descripcion:', item.descripcion);
                console.log('🔍 TopProductos - typeof descripcion:', typeof item.descripcion);
                
                // Usar artículo como fallback si descripción está vacía
                const displayName = item.descripcion && item.descripcion.trim() ? 
                    formatName(item.descripcion) : 
                    item.articulo;
                
                return {
                    name: displayName,
                    value: metric === 'importe' ? (item.total || 0) : (item.cantidad || 0),
                };
            })
            .slice(0, numProductos);

    }, [tipo, metric, numProductos, topProductosMasVendidos, topProductosMasVendidosPorImporte, topProductosMenosVendidos]);

    const maxValue = useMemo(() => {
        if (data.length === 0) return 0;
        return Math.max(...data.map((item: { value: number }) => item.value)) * 1.2;
    }, [data]);

    interface TooltipProps {
        active?: boolean;
        payload?: Array<{ value: number }>;
        label?: string;
    }

    const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
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
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Top Productos</h4>
                <div className="flex items-center space-x-4">
                    <select
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value as 'mas' | 'menos')}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    >
                        <option value="mas">Más Vendidos</option>
                        <option value="menos">Menos Vendidos</option>
                    </select>
                    <select
                        value={metric}
                        onChange={(e) => setMetric(e.target.value as 'importe' | 'cantidad')}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-32 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        disabled={tipo === 'menos'}
                    >
                        <option value="cantidad">Cantidad</option>
                        <option value="importe">Importe</option>
                    </select>
                    <select
                        value={numProductos}
                        onChange={(e) => setNumProductos(Number(e.target.value))}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-28 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    >
                        <option value={5}>Top 5</option>
                        <option value={10}>Top 10</option>
                        <option value={15}>Top 15</option>
                        <option value={20}>Top 20</option>
                    </select>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 120, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        type="number" 
                        domain={[0, maxValue]} 
                        tickFormatter={(value) => {
                            if (metric === 'importe') {
                                if (value >= 1000000) {
                                    const valorFormateado = (value / 1000000).toLocaleString('es-AR', {
                                        minimumFractionDigits: 1,
                                        maximumFractionDigits: 1
                                    });
                                    return `$${valorFormateado} mill.`;
                                } else {
                                    return `$${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
                                }
                            } else {
                                return value.toLocaleString('es-AR', { maximumFractionDigits: 0 });
                            }
                        }}
                    />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <defs>
                        <linearGradient id="colorBarProducto" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#98e3b5" stopOpacity={1}/>
                            <stop offset="75%" stopColor="#82ca9d" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#6eb58a" stopOpacity={1}/>
                        </linearGradient>
                        <filter id="shadowProductos" x="-10%" y="-10%" width="120%" height="130%">
                            <feOffset result="offOut" in="SourceGraphic" dx="3" dy="3" />
                            <feColorMatrix result="matrixOut" in="offOut" type="matrix"
                                values="0.2 0 0 0 0 0 0.2 0 0 0 0 0 0.2 0 0 0 0 0 1 0" />
                            <feGaussianBlur result="blurOut" in="matrixOut" stdDeviation="3" />
                            <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                        </filter>
                    </defs>
                    <Bar 
                        dataKey="value" 
                        name={metric === 'importe' ? 'Ventas' : 'Cantidad'} 
                        fill="url(#colorBarProducto)" 
                        stroke="#6eb58a"
                        strokeWidth={1}
                        radius={[0, 4, 4, 0]}
                        barSize={16}
                        filter="url(#shadowProductos)"
                    >
                        <RechartsLabelList dataKey="value" content={(props) => <CustomizedLabel {...props} metric={metric} />} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
