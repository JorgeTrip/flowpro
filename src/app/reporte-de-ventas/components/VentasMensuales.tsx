// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ReporteResultados } from '@/app/lib/reportGenerator';

// --- Helper Functions ---
const formatCurrency = (value: number, compacto: boolean = false) => {
  if (compacto) {
    if (value >= 1000000) {
      const valorFormateado = (value / 1000000).toLocaleString('es-AR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      });
      return `$${valorFormateado} mill.`;
    } else if (value >= 1000) {
      return `$${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
    } else {
      return `$${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
    }
  } else {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
  }
};

const formatQuantity = (value: number, compacto: boolean = false) => {
  if (compacto) {
    if (value >= 1000000) {
      const valorFormateado = (value / 1000000).toLocaleString('es-AR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      });
      return `${valorFormateado} mill.`;
    } else {
      return value.toLocaleString('es-AR', { maximumFractionDigits: 0 });
    }
  } else {
    return new Intl.NumberFormat('es-AR').format(value);
  }
};

interface VentasMensualesProps {
    ventasPorMes: Record<string, { A: number; X: number; AX: number }>;
    cantidadesPorMes: Record<string, { A: number; X: number; AX: number }>;
}

export const VentasMensuales = ({ ventasPorMes, cantidadesPorMes }: VentasMensualesProps) => {
    const [metrica, setMetrica] = useState<'importe' | 'cantidad'>('importe');
    const [filtroMeses, setFiltroMeses] = useState<'todos' | 'conDatos' | 'individual'>('conDatos');
    const [mesSeleccionado, setMesSeleccionado] = useState<string | null>(null);
    const [mesesConDatos, setMesesConDatos] = useState<string[]>([]);
    
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    // Identificar meses que tienen datos
    useEffect(() => {
        const mesesDisponibles = meses.filter(mes => {
            const mesData = ventasPorMes[mes];
            return mesData && (mesData.A > 0 || mesData.X > 0 || mesData.AX > 0);
        });
        setMesesConDatos(mesesDisponibles);
        
        if (filtroMeses === 'individual' && !mesSeleccionado && mesesDisponibles.length > 0) {
            setMesSeleccionado(mesesDisponibles[0]);
        }
    }, [ventasPorMes, filtroMeses, mesSeleccionado]);

    const data = useMemo(() => {
        let mesesAMostrar: string[] = [];
        
        if (filtroMeses === 'todos') {
            mesesAMostrar = meses;
        } else if (filtroMeses === 'conDatos') {
            mesesAMostrar = mesesConDatos;
        } else if (filtroMeses === 'individual' && mesSeleccionado) {
            mesesAMostrar = [mesSeleccionado];
        }
        
        return mesesAMostrar.map(mes => {
            const mesData = ventasPorMes[mes] || { A: 0, X: 0, AX: 0 };
            const cantidadData = cantidadesPorMes[mes] || { A: 0, X: 0, AX: 0 };
            return {
                mes,
                A: mesData.A,
                X: mesData.X,
                AX: mesData.AX,
                cantidadA: cantidadData.A,
                cantidadX: cantidadData.X,
                cantidadAX: cantidadData.AX,
            };
        });
    }, [ventasPorMes, filtroMeses, mesSeleccionado, mesesConDatos]);

    interface TooltipProps {
        active?: boolean;
        payload?: Array<{ name: string; value: number; color: string }>;
        label?: string;
    }

    const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-3 bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-600">
                    <p className="font-bold text-sm mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                            <span>{entry.name}: </span>
                            <span className="font-bold">
                                {entry.name.includes('cantidad') 
                                    ? formatQuantity(entry.value) 
                                    : formatCurrency(entry.value)}
                            </span>
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
                <div className="flex items-center space-x-4 flex-wrap">
                    <select
                        value={filtroMeses}
                        onChange={(e) => {
                            setFiltroMeses(e.target.value as 'todos' | 'conDatos' | 'individual');
                            if (e.target.value === 'individual' && mesesConDatos.length > 0 && !mesSeleccionado) {
                                setMesSeleccionado(mesesConDatos[0]);
                            }
                        }}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-44 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    >
                        <option value="todos">Todos los meses</option>
                        <option value="conDatos">Solo meses con datos</option>
                        <option value="individual">Seleccionar mes</option>
                    </select>
                    
                    {filtroMeses === 'individual' && (
                        <select
                            value={mesSeleccionado || (mesesConDatos.length > 0 ? mesesConDatos[0] : meses[0])}
                            onChange={(e) => setMesSeleccionado(e.target.value)}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-36 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        >
                            {meses.map(mes => (
                                <option key={mes} value={mes} disabled={!mesesConDatos.includes(mes)}>
                                    {mes}{!mesesConDatos.includes(mes) ? ' (sin datos)' : ''}
                                </option>
                            ))}
                        </select>
                    )}
                    
                    <div className="border-l border-gray-300 dark:border-gray-600 h-8 mx-2"></div>
                    
                    <select
                        value={metrica}
                        onChange={(e) => setMetrica(e.target.value as 'importe' | 'cantidad')}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-32 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    >
                        <option value="importe">Importe</option>
                        <option value="cantidad">Cantidad</option>
                    </select>
                </div>
            </div>
            
            <ResponsiveContainer width="100%" height={400}>
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    barCategoryGap={5}
                    barGap={8}
                >
                    <defs>
                        <linearGradient id="colorBarA" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8884d8" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="#6c5ce7" stopOpacity={0.8}/>
                        </linearGradient>
                        <linearGradient id="colorBarX" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#82ca9d" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="#6eb58a" stopOpacity={0.8}/>
                        </linearGradient>
                        <linearGradient id="colorBarAX" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffc658" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="#ff9f40" stopOpacity={0.8}/>
                        </linearGradient>
                        <filter id="shadowVentasMensuales" x="-10%" y="-10%" width="120%" height="130%">
                            <feOffset result="offOut" in="SourceGraphic" dx="3" dy="3" />
                            <feColorMatrix result="matrixOut" in="offOut" type="matrix"
                                values="0.2 0 0 0 0 0 0.2 0 0 0 0 0 0.2 0 0 0 0 0 1 0" />
                            <feGaussianBlur result="blurOut" in="matrixOut" stdDeviation="3" />
                            <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                        </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="mes" 
                        angle={-45}
                        textAnchor="end"
                        height={70}
                        interval={0}
                    />
                    <YAxis 
                        tickFormatter={(value) => metrica === 'importe' ? formatCurrency(value, true) : formatQuantity(value, true)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    
                    {metrica === 'importe' ? (
                        <>
                            <Bar 
                                dataKey="A" 
                                fill="url(#colorBarA)" 
                                name="A" 
                                stroke="#6c5ce7"
                                strokeWidth={1}
                                filter="url(#shadowVentasMensuales)"
                            />
                            <Bar 
                                dataKey="X" 
                                fill="url(#colorBarX)" 
                                name="X" 
                                stroke="#6eb58a"
                                strokeWidth={1}
                                filter="url(#shadowVentasMensuales)"
                            />
                            <Bar 
                                dataKey="AX" 
                                fill="url(#colorBarAX)" 
                                name="A+X" 
                                stroke="#ff9f40"
                                strokeWidth={1}
                                filter="url(#shadowVentasMensuales)"
                            />
                        </>
                    ) : (
                        <>
                            <Bar 
                                dataKey="cantidadA" 
                                fill="url(#colorBarA)" 
                                name="A (cantidad)" 
                                stroke="#6c5ce7"
                                strokeWidth={1}
                                filter="url(#shadowVentasMensuales)"
                            />
                            <Bar 
                                dataKey="cantidadX" 
                                fill="url(#colorBarX)" 
                                name="X (cantidad)" 
                                stroke="#6eb58a"
                                strokeWidth={1}
                                filter="url(#shadowVentasMensuales)"
                            />
                            <Bar 
                                dataKey="cantidadAX" 
                                fill="url(#colorBarAX)" 
                                name="A+X (cantidad)" 
                                stroke="#ff9f40"
                                strokeWidth={1}
                                filter="url(#shadowVentasMensuales)"
                            />
                        </>
                    )}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
