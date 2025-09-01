// 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CameraIcon } from '@heroicons/react/24/outline';
import { exportChartAsPNG } from '../lib/exportUtils';

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

interface VentasPromedioProps {
    ventasPorMes: Record<string, { A: number; X: number; AX: number }>;
    cantidadesPorMes: Record<string, { A: number; X: number; AX: number }>;
}

export const VentasPromedio = ({ ventasPorMes, cantidadesPorMes }: VentasPromedioProps) => {
    const [metrica, setMetrica] = useState<'importe' | 'cantidad'>('importe');
    const [filtroMeses, setFiltroMeses] = useState<'todos' | 'conDatos' | 'individual'>('conDatos');
    const [mesSeleccionado, setMesSeleccionado] = useState<string | null>(null);
    const [mesesConDatos, setMesesConDatos] = useState<string[]>([]);
    const chartRef = useRef<HTMLDivElement>(null);
    
    const meses = useMemo(() => [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ], []);
    
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
    }, [ventasPorMes, filtroMeses, mesSeleccionado, meses]);

    const promedios = useMemo(() => {
        let mesesACalcular: string[] = [];
        
        if (filtroMeses === 'todos') {
            mesesACalcular = meses;
        } else if (filtroMeses === 'conDatos') {
            mesesACalcular = mesesConDatos;
        } else if (filtroMeses === 'individual' && mesSeleccionado) {
            mesesACalcular = [mesSeleccionado];
        }
        
        const totales = { A: 0, X: 0, AX: 0, cantidadA: 0, cantidadX: 0, cantidadAX: 0 };
        let mesesValidos = 0;
        
        mesesACalcular.forEach(mes => {
            const mesData = ventasPorMes[mes];
            const cantidadData = cantidadesPorMes[mes];
            
            if (mesData && (mesData.A > 0 || mesData.X > 0 || mesData.AX > 0)) {
                totales.A += mesData.A;
                totales.X += mesData.X;
                totales.AX += mesData.AX;
                
                if (cantidadData) {
                    totales.cantidadA += cantidadData.A;
                    totales.cantidadX += cantidadData.X;
                    totales.cantidadAX += cantidadData.AX;
                }
                mesesValidos++;
            }
        });
        
        if (mesesValidos === 0) {
            return { A: 0, X: 0, AX: 0, cantidadA: 0, cantidadX: 0, cantidadAX: 0, mesesValidos: 0 };
        }
        
        return {
            A: totales.A / mesesValidos,
            X: totales.X / mesesValidos,
            AX: totales.AX / mesesValidos,
            cantidadA: totales.cantidadA / mesesValidos,
            cantidadX: totales.cantidadX / mesesValidos,
            cantidadAX: totales.cantidadAX / mesesValidos,
            mesesValidos
        };
    }, [ventasPorMes, cantidadesPorMes, filtroMeses, mesSeleccionado, mesesConDatos, meses]);

    const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-8 border border-gray-200 dark:border-gray-700 shadow-sm min-h-[120px]">
            <div className="flex items-center justify-between h-full">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white break-words">
                        {metrica === 'importe' ? formatCurrency(value) : formatQuantity(value)}
                    </p>
                </div>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ml-4 flex-shrink-0`} style={{ backgroundColor: color + '20' }}>
                    <div className={`w-8 h-8 rounded-full`} style={{ backgroundColor: color }}></div>
                </div>
            </div>
        </div>
    );

    const handleExport = () => {
        exportChartAsPNG(chartRef, 'ventas-promedio');
    };

    return (
        <div ref={chartRef} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Venta Promedio</h4>
                <div className="flex items-center space-x-4 flex-wrap chart-controls">
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                        title="Exportar como PNG"
                    >
                        <CameraIcon className="w-4 h-4" />
                    </button>
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
            
            <div className="space-y-4">
                <StatCard 
                    label={metrica === 'importe' ? 'Promedio A' : 'Promedio A (cantidad)'}
                    value={metrica === 'importe' ? promedios.A : promedios.cantidadA}
                    color="#8884d8"
                />
                <StatCard 
                    label={metrica === 'importe' ? 'Promedio X' : 'Promedio X (cantidad)'}
                    value={metrica === 'importe' ? promedios.X : promedios.cantidadX}
                    color="#82ca9d"
                />
                <StatCard 
                    label={metrica === 'importe' ? 'Promedio A+X' : 'Promedio A+X (cantidad)'}
                    value={metrica === 'importe' ? promedios.AX : promedios.cantidadAX}
                    color="#ffc658"
                />
            </div>
            
            <div className="text-center mt-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {filtroMeses === 'individual' 
                        ? `Datos del mes: ${mesSeleccionado}`
                        : `Promedio calculado sobre ${promedios.mesesValidos} ${promedios.mesesValidos === 1 ? 'mes' : 'meses'} con datos`
                    }
                </span>
            </div>
        </div>
    );
};
