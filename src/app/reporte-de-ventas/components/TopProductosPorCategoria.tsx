// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { ReporteResultados } from '@/app/lib/reportGenerator';

// --- Helper Functions ---
const formatCurrency = (value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
const formatQuantity = (value: number) => new Intl.NumberFormat('es-AR').format(value);

const CustomizedLabel = (props: any) => {
    const { x, y, width, value, payload } = props;
    const { isCategory, porcentaje, totalCategoria, cantidadCategoria, total, cantidad } = payload;

    const percentageText = `${(porcentaje || 0).toFixed(2)}%`;
    let detailsText = '';
    if (isCategory) {
        detailsText = `${formatCurrency(totalCategoria)} | ${formatQuantity(cantidadCategoria)} u.`;
    } else {
        detailsText = `${formatCurrency(total || 0)} | ${formatQuantity(cantidad || 0)} u.`;
    }

    return (
        <g>
            <text x={x + width + 8} y={y + 10} textAnchor="start" dominantBaseline="middle" className="fill-gray-800 dark:fill-gray-200 font-bold text-sm">
                {percentageText}
            </text>
            <text x={x + width + 8} y={y + 25} textAnchor="start" dominantBaseline="middle" className="fill-gray-600 dark:fill-gray-400 text-xs">
                {detailsText}
            </text>
        </g>
    );
};

export const TopProductosPorCategoria = ({
    topProductosPorCategoriaPorCantidad,
    topProductosPorCategoriaPorImporte,
}: {
    topProductosPorCategoriaPorCantidad: ReporteResultados['topProductosPorCategoriaPorCantidad'];
    topProductosPorCategoriaPorImporte: ReporteResultados['topProductosPorCategoriaPorImporte'];
}) => {
    const [metric, setMetric] = useState<'importe' | 'cantidad'>('cantidad');
    const [numProductos, setNumProductos] = useState<number>(3);

    const chartData = useMemo(() => {
        const sourceData = metric === 'cantidad' ? topProductosPorCategoriaPorCantidad : topProductosPorCategoriaPorImporte;
        const flattenedData: any[] = [];

        const totalGeneral = sourceData.reduce((acc, cat) => acc + (metric === 'cantidad' ? cat.cantidadCategoria : cat.totalCategoria), 0);

        sourceData.forEach(cat => {
            const catValue = metric === 'cantidad' ? cat.cantidadCategoria : cat.totalCategoria;
            flattenedData.push({
                name: `${cat.categoria} (Total)`,
                value: catValue,
                isCategory: true,
                porcentaje: (catValue / totalGeneral) * 100,
                ...cat
            });

            cat.productos.slice(0, numProductos).forEach(prod => {
                const prodValue = metric === 'cantidad' ? prod.cantidad : prod.total;
                flattenedData.push({
                    name: `  ${prod.descripcion}`,
                    value: prodValue,
                    isCategory: false,
                    porcentaje: (prodValue / catValue) * 100,
                    ...prod
                });
            });
        });

        return flattenedData;
    }, [metric, numProductos, topProductosPorCategoriaPorCantidad, topProductosPorCategoriaPorImporte]);

    const chartHeight = 300 + chartData.length * 40;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="p-2 bg-gray-700 text-white rounded-md border border-gray-600 shadow-lg">
                    <p className="font-bold">{data.isCategory ? data.categoria : data.descripcion}</p>
                    <p>{`Categoría: ${data.categoria}`}</p>
                    <p>{`${metric === 'importe' ? 'Importe' : 'Cantidad'}: ${metric === 'importe' ? formatCurrency(data.value) : formatQuantity(data.value)}`}</p>
                    <p>{`Porcentaje: ${data.porcentaje.toFixed(2)}% ${data.isCategory ? 'del total' : 'de la categoría'}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Top Productos por Categoría</h4>
                <div className="flex items-center space-x-4">
                    <select
                        value={metric}
                        onChange={(e) => setMetric(e.target.value as 'importe' | 'cantidad')}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-32 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    >
                        <option value="cantidad">Cantidad</option>
                        <option value="importe">Importe</option>
                    </select>
                    <select
                        value={numProductos}
                        onChange={(e) => setNumProductos(Number(e.target.value))}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-28 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    >
                        <option value={1}>Top 1</option>
                        <option value={2}>Top 2</option>
                        <option value={3}>Top 3</option>
                        <option value={5}>Top 5</option>
                    </select>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 150, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => metric === 'importe' ? formatCurrency(value as number) : formatQuantity(value as number)} />
                    <YAxis type="category" dataKey="name" width={200} tick={{ fontSize: 12 }} interval={0} />
                    <Tooltip content={<CustomTooltip />} />
                    <defs>
                        <linearGradient id="colorBarCategoria" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#8884d8" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="#6762a8" stopOpacity={0.9}/>
                        </linearGradient>
                        <linearGradient id="colorBarProductoCat" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#82ca9d" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#6eb58a" stopOpacity={0.8}/>
                        </linearGradient>
                    </defs>
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.isCategory ? 'url(#colorBarCategoria)' : 'url(#colorBarProductoCat)'} />
                        ))}
                        <LabelList dataKey="value" content={<CustomizedLabel />} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
