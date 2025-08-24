'use client';

import React, { useState, useMemo } from 'react';

interface VentasMensualesTableProps {
    ventasPorMes: Record<string, { A: number; X: number }>;
    cantidadesPorMes: Record<string, { A: number; X: number }>;
}

export const VentasMensualesTable = ({ ventasPorMes, cantidadesPorMes }: VentasMensualesTableProps) => {
    const [filtroMeses, setFiltroMeses] = useState<'todos' | 'conDatos' | 'seleccionados'>('conDatos');
    const [mesesSeleccionados, setMesesSeleccionados] = useState<string[]>([]);
    const [mostrarCantidad, setMostrarCantidad] = useState<boolean>(false);
    const [mostrarTotales, setMostrarTotales] = useState<boolean>(true);

    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Filtrar meses con datos
    const mesesConDatos = useMemo(() => {
        return meses.filter(mes => {
            const ventas = ventasPorMes[mes];
            const cantidades = cantidadesPorMes[mes];
            return (ventas?.A || 0) > 0 || (ventas?.X || 0) > 0 || 
                   (cantidades?.A || 0) > 0 || (cantidades?.X || 0) > 0;
        });
    }, [ventasPorMes, cantidadesPorMes, meses]);

    // Datos filtrados según la selección
    const datosFiltrados = useMemo(() => {
        let mesesAMostrar: string[] = [];
        
        switch (filtroMeses) {
            case 'todos':
                mesesAMostrar = meses;
                break;
            case 'conDatos':
                mesesAMostrar = mesesConDatos;
                break;
            case 'seleccionados':
                mesesAMostrar = mesesSeleccionados.length > 0 ? mesesSeleccionados : mesesConDatos;
                break;
        }

        return mesesAMostrar.map(mes => ({
            mes,
            importeA: ventasPorMes[mes]?.A || 0,
            importeX: ventasPorMes[mes]?.X || 0,
            cantidadA: cantidadesPorMes[mes]?.A || 0,
            cantidadX: cantidadesPorMes[mes]?.X || 0,
            total: (ventasPorMes[mes]?.A || 0) + (ventasPorMes[mes]?.X || 0),
            totalCantidad: (cantidadesPorMes[mes]?.A || 0) + (cantidadesPorMes[mes]?.X || 0)
        }));
    }, [filtroMeses, mesesSeleccionados, mesesConDatos, ventasPorMes, cantidadesPorMes, meses]);

    // Calcular totales
    const totales = useMemo(() => {
        return datosFiltrados.reduce((acc, item) => ({
            importeA: acc.importeA + item.importeA,
            importeX: acc.importeX + item.importeX,
            cantidadA: acc.cantidadA + item.cantidadA,
            cantidadX: acc.cantidadX + item.cantidadX,
            total: acc.total + item.total,
            totalCantidad: acc.totalCantidad + item.totalCantidad
        }), {
            importeA: 0,
            importeX: 0,
            cantidadA: 0,
            cantidadX: 0,
            total: 0,
            totalCantidad: 0
        });
    }, [datosFiltrados]);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('es-AR', { 
            style: 'currency', 
            currency: 'ARS', 
            maximumFractionDigits: 0 
        });
    };

    const formatQuantity = (value: number) => {
        return value.toLocaleString('es-AR');
    };

    const handleMesToggle = (mes: string) => {
        setMesesSeleccionados(prev => 
            prev.includes(mes) 
                ? prev.filter(m => m !== mes)
                : [...prev, mes]
        );
    };

    const exportarDatos = () => {
        const headers = mostrarCantidad 
            ? ['Mes', 'Cantidad A', 'Cantidad X', 'Total Cantidad']
            : ['Mes', 'Importe A', 'Importe X', 'Total Importe'];
        
        const rows = datosFiltrados.map(item => mostrarCantidad
            ? [item.mes, item.cantidadA, item.cantidadX, item.totalCantidad]
            : [item.mes, item.importeA, item.importeX, item.total]
        );

        if (mostrarTotales) {
            rows.push(mostrarCantidad
                ? ['TOTAL', totales.cantidadA, totales.cantidadX, totales.totalCantidad]
                : ['TOTAL', totales.importeA, totales.importeX, totales.total]
            );
        }

        const csvContent = [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ventas-mensuales-${mostrarCantidad ? 'cantidad' : 'importe'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Header con controles */}
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Ventas Mensuales
                    </h4>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Filtro de meses */}
                        <select
                            value={filtroMeses}
                            onChange={(e) => setFiltroMeses(e.target.value as any)}
                            className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 p-2"
                        >
                            <option value="todos">Todos los meses</option>
                            <option value="conDatos">Solo con datos</option>
                            <option value="seleccionados">Seleccionados</option>
                        </select>

                        {/* Selector múltiple de meses */}
                        {filtroMeses === 'seleccionados' && (
                            <div className="relative">
                                <select
                                    multiple
                                    value={mesesSeleccionados}
                                    onChange={(e) => {
                                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                                        setMesesSeleccionados(selected);
                                    }}
                                    className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2"
                                    size={4}
                                >
                                    {mesesConDatos.map(mes => (
                                        <option key={mes} value={mes}>
                                            {mes}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Switch cantidad/importe */}
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={mostrarCantidad}
                                onChange={(e) => setMostrarCantidad(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                                {mostrarCantidad ? 'Cantidad' : 'Importe'}
                            </span>
                        </label>

                        {/* Switch mostrar totales */}
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={mostrarTotales}
                                onChange={(e) => setMostrarTotales(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                                Totales
                            </span>
                        </label>

                        {/* Botón exportar */}
                        <button
                            onClick={exportarDatos}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                            📊 Exportar
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Mes
                            </th>
                            {mostrarCantidad ? (
                                <>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Cantidad A
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Cantidad X
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Total Cantidad
                                    </th>
                                </>
                            ) : (
                                <>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Importe A
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Importe X
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Total Importe
                                    </th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                        {datosFiltrados.map((item, index) => (
                            <tr key={item.mes} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                    {item.mes}
                                </td>
                                {mostrarCantidad ? (
                                    <>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {formatQuantity(item.cantidadA)}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {formatQuantity(item.cantidadX)}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                            {formatQuantity(item.totalCantidad)}
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {formatCurrency(item.importeA)}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {formatCurrency(item.importeX)}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(item.total)}
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        
                        {/* Fila de totales */}
                        {mostrarTotales && (
                            <tr className="bg-blue-50 dark:bg-blue-900/20 border-t-2 border-blue-200 dark:border-blue-700">
                                <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-blue-900 dark:text-blue-300">
                                    TOTAL
                                </td>
                                {mostrarCantidad ? (
                                    <>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-blue-900 dark:text-blue-300">
                                            {formatQuantity(totales.cantidadA)}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-blue-900 dark:text-blue-300">
                                            {formatQuantity(totales.cantidadX)}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-blue-900 dark:text-blue-300">
                                            {formatQuantity(totales.totalCantidad)}
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-blue-900 dark:text-blue-300">
                                            {formatCurrency(totales.importeA)}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-blue-900 dark:text-blue-300">
                                            {formatCurrency(totales.importeX)}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-blue-900 dark:text-blue-300">
                                            {formatCurrency(totales.total)}
                                        </td>
                                    </>
                                )}
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
