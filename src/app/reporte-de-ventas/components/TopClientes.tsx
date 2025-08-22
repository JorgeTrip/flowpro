// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { ReporteResultados } from '@/app/lib/reportGenerator';

// --- Helper Functions ---
const formatCurrency = (value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
const formatQuantity = (value: number) => new Intl.NumberFormat('es-AR').format(value);
const formatName = (name: string) => name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');


interface TopClientesProps {
    topClientesMinoristas: ReporteResultados['topClientesMinoristas'];
    topClientesDistribuidores: ReporteResultados['topClientesDistribuidores'];
    topClientesMinoristasPorCantidad: ReporteResultados['topClientesMinoristasPorCantidad'];
    topClientesDistribuidoresPorCantidad: ReporteResultados['topClientesDistribuidoresPorCantidad'];
}

export const TopClientes = ({
    topClientesMinoristas,
    topClientesDistribuidores,
    topClientesMinoristasPorCantidad,
    topClientesDistribuidoresPorCantidad,
}: TopClientesProps) => {
    const [tipoCliente, setTipoCliente] = useState<'Minoristas' | 'Distribuidores'>('Distribuidores');
    const [metric, setMetric] = useState<'importe' | 'cantidad'>('importe');
    const [numClientes, setNumClientes] = useState<number>(10);

    const data = useMemo(() => {
        let sourceData;
        if (tipoCliente === 'Distribuidores') {
            sourceData = metric === 'importe' ? topClientesDistribuidores : topClientesDistribuidoresPorCantidad;
        } else {
            sourceData = metric === 'importe' ? topClientesMinoristas : topClientesMinoristasPorCantidad;
        }

        return sourceData
            .map((item: { cliente: string; total: number }) => ({
                name: formatName(item.cliente),
                value: item.total,
            }))
            .slice(0, numClientes);

    }, [tipoCliente, metric, numClientes, topClientesDistribuidores, topClientesDistribuidoresPorCantidad, topClientesMinoristas, topClientesMinoristasPorCantidad]);

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
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Top Clientes</h4>
                <div className="flex items-center space-x-4">
                    <select
                        value={tipoCliente}
                        onChange={(e) => setTipoCliente(e.target.value as 'Minoristas' | 'Distribuidores')}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    >
                        <option value="Distribuidores">Distribuidores</option>
                        <option value="Minoristas">Minoristas</option>
                    </select>
                    <select
                        value={metric}
                        onChange={(e) => setMetric(e.target.value as 'importe' | 'cantidad')}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-32 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    >
                        <option value="importe">Importe</option>
                        <option value="cantidad">Cantidad</option>
                    </select>
                    <select
                        value={numClientes}
                        onChange={(e) => setNumClientes(Number(e.target.value))}
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
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 100, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, maxValue]} tickFormatter={(value) => metric === 'importe' ? formatCurrency(value as number) : formatQuantity(value as number)} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <defs>
                        <linearGradient id="colorBarCliente" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#82ca9d" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#8884d8" stopOpacity={0.9}/>
                        </linearGradient>
                    </defs>
                    <Bar dataKey="value" name={metric === 'importe' ? 'Ventas' : 'Cantidad'} fill="url(#colorBarCliente)" radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
