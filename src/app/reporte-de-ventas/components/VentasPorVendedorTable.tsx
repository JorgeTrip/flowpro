'use client';

import React, { useState, useMemo } from 'react';

interface VentasPorVendedorTableProps {
    ventasPorVendedor: { resultado: Record<string, Record<string, { A: number; X: number }>> };
    cantidadesPorVendedor: { resultado: Record<string, Record<string, { A: number; X: number }>> };
}

export const VentasPorVendedorTable = ({ ventasPorVendedor, cantidadesPorVendedor }: VentasPorVendedorTableProps) => {
    const [mostrarCantidad, setMostrarCantidad] = useState<boolean>(false);
    const [mostrarTotales, setMostrarTotales] = useState<boolean>(true);
    const [ordenAscendente, setOrdenAscendente] = useState<boolean>(false);
    const [vendedoresSeleccionados, setVendedoresSeleccionados] = useState<string[]>([]);

    // Obtener todos los vendedores disponibles
    const todosLosVendedores = useMemo(() => {
        const vendedores = new Set<string>();
        Object.entries(ventasPorVendedor.resultado).forEach(([_vendedor, subvendedores]) => {
            Object.keys(subvendedores).forEach(subvendedor => {
                vendedores.add(subvendedor || 'Sin vendedor');
            });
        });
        return Array.from(vendedores);
    }, [ventasPorVendedor]);

    // Inicializar vendedores seleccionados
    React.useEffect(() => {
        if (vendedoresSeleccionados.length === 0) {
            setVendedoresSeleccionados(todosLosVendedores);
        }
    }, [todosLosVendedores, vendedoresSeleccionados.length]);

    // Procesar y filtrar datos
    const datosProcesados = useMemo(() => {
        const datos: Array<{
            vendedor: string;
            importeA: number;
            importeX: number;
            cantidadA: number;
            cantidadX: number;
            total: number;
            totalCantidad: number;
        }> = [];

        Object.entries(ventasPorVendedor.resultado).forEach(([_vendedor, subvendedores]) => {
            Object.entries(subvendedores).forEach(([_subvendedor, data]) => {
                const nombreVendedor = _subvendedor || 'Sin vendedor';
                if (vendedoresSeleccionados.includes(nombreVendedor)) {
                    const cantidades = cantidadesPorVendedor.resultado[_vendedor]?.[_subvendedor] || { A: 0, X: 0 };
                    datos.push({
                        vendedor: nombreVendedor,
                        importeA: data.A || 0,
                        importeX: data.X || 0,
                        cantidadA: cantidades.A || 0,
                        cantidadX: cantidades.X || 0,
                        total: (data.A || 0) + (data.X || 0),
                        totalCantidad: (cantidades.A || 0) + (cantidades.X || 0)
                    });
                }
            });
        });

        // Ordenar datos
        datos.sort((a, b) => {
            const valorA = mostrarCantidad ? a.totalCantidad : a.total;
            const valorB = mostrarCantidad ? b.totalCantidad : b.total;
            return ordenAscendente ? valorA - valorB : valorB - valorA;
        });

        return datos;
    }, [ventasPorVendedor, cantidadesPorVendedor, vendedoresSeleccionados, mostrarCantidad, ordenAscendente]);

    // Calcular totales
    const totales = useMemo(() => {
        return datosProcesados.reduce((acc, item) => ({
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
    }, [datosProcesados]);

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

    const handleVendedorToggle = (vendedor: string) => {
        setVendedoresSeleccionados(prev => 
            prev.includes(vendedor) 
                ? prev.filter(v => v !== vendedor)
                : [...prev, vendedor]
        );
    };

    const seleccionarTodosVendedores = () => {
        setVendedoresSeleccionados(todosLosVendedores);
    };

    const limpiarVendedores = () => {
        setVendedoresSeleccionados([]);
    };

    const exportarDatos = () => {
        const headers = mostrarCantidad 
            ? ['Vendedor', 'Cantidad A', 'Cantidad X', 'Total Cantidad']
            : ['Vendedor', 'Importe A', 'Importe X', 'Total Importe'];
        
        const rows = datosProcesados.map(item => mostrarCantidad
            ? [item.vendedor, item.cantidadA, item.cantidadX, item.totalCantidad]
            : [item.vendedor, item.importeA, item.importeX, item.total]
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
        a.download = `ventas-por-vendedor-${mostrarCantidad ? 'cantidad' : 'importe'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Header con controles */}
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Ventas por Vendedor
                    </h4>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Filtro de vendedores */}
                        <div className="relative">
                            <button
                                className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-36 p-2 text-left"
                                onClick={() => {
                                    const popup = document.getElementById('vendedores-popup');
                                    popup?.classList.toggle('hidden');
                                }}
                            >
                                Vendedores ({vendedoresSeleccionados.length})
                            </button>
                            
                            <div id="vendedores-popup" className="hidden absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                                <div className="p-3">
                                    <div className="flex gap-2 mb-3">
                                        <button
                                            onClick={seleccionarTodosVendedores}
                                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                                        >
                                            Todos
                                        </button>
                                        <button
                                            onClick={limpiarVendedores}
                                            className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                                        >
                                            Limpiar
                                        </button>
                                    </div>
                                    
                                    {todosLosVendedores.map(vendedor => (
                                        <label key={vendedor} className="flex items-center mb-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={vendedoresSeleccionados.includes(vendedor)}
                                                onChange={() => handleVendedorToggle(vendedor)}
                                                className="mr-2"
                                            />
                                            <span className="text-sm text-gray-900 dark:text-white">
                                                {vendedor}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Switch ordenamiento */}
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={ordenAscendente}
                                onChange={(e) => setOrdenAscendente(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                                {ordenAscendente ? '↑ Asc' : '↓ Desc'}
                            </span>
                        </label>

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
                                Vendedor
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
                        {datosProcesados.map((item, index) => (
                            <tr key={item.vendedor} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                    👤 {item.vendedor}
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
                                    📊 TOTAL
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
