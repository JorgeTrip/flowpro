'use client';

import React, { useState, useMemo } from 'react';

interface Producto {
    articulo: string;
    descripcion: string;
    cantidad: number;
}

interface TopProductosTableProps {
    topProductosMasVendidos: Producto[];
    topProductosMenosVendidos: Producto[];
}

export const TopProductosTable = ({ topProductosMasVendidos, topProductosMenosVendidos }: TopProductosTableProps) => {
    const [tipoProductos, setTipoProductos] = useState<'mas' | 'menos'>('mas');
    const [topN, setTopN] = useState<number>(10);
    const [ordenAscendente, setOrdenAscendente] = useState<boolean>(false);
    const [mostrarPorcentajes, setMostrarPorcentajes] = useState<boolean>(true);

    // Datos según el tipo seleccionado
    const datosOriginales = tipoProductos === 'mas' ? topProductosMasVendidos : topProductosMenosVendidos;

    // Procesar y filtrar datos
    const datosProcesados = useMemo(() => {
        let datos = [...datosOriginales];
        
        // Limitar cantidad
        datos = datos.slice(0, topN);
        
        // Ordenar si es necesario
        if (ordenAscendente) {
            datos.sort((a, b) => a.cantidad - b.cantidad);
        } else {
            datos.sort((a, b) => b.cantidad - a.cantidad);
        }

        return datos;
    }, [datosOriginales, topN, ordenAscendente]);

    // Calcular total para porcentajes
    const totalCantidad = useMemo(() => {
        return datosProcesados.reduce((acc, item) => acc + item.cantidad, 0);
    }, [datosProcesados]);

    const formatQuantity = (value: number) => {
        return value.toLocaleString('es-AR');
    };

    const calcularPorcentaje = (valor: number, total: number) => {
        return total > 0 ? ((valor / total) * 100).toFixed(1) + '%' : '0%';
    };

    const exportarDatos = () => {
        const headers = mostrarPorcentajes 
            ? ['Posición', 'Artículo', 'Descripción', 'Cantidad', '% del Total']
            : ['Posición', 'Artículo', 'Descripción', 'Cantidad'];
        
        const rows = datosProcesados.map((item, index) => {
            const fila = [
                index + 1,
                item.articulo,
                item.descripcion,
                item.cantidad
            ];
            
            if (mostrarPorcentajes) {
                fila.push(calcularPorcentaje(item.cantidad, totalCantidad));
            }
            
            return fila;
        });

        const csvContent = [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `top-productos-${tipoProductos === 'mas' ? 'mas' : 'menos'}-vendidos.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Header con controles */}
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Top Productos {tipoProductos === 'mas' ? 'Más' : 'Menos'} Vendidos
                    </h4>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Selector tipo de productos */}
                        <select
                            value={tipoProductos}
                            onChange={(e) => setTipoProductos(e.target.value as 'mas' | 'menos')}
                            className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-32 p-2"
                        >
                            <option value="mas">Más vendidos</option>
                            <option value="menos">Menos vendidos</option>
                        </select>

                        {/* Selector Top N */}
                        <select
                            value={topN}
                            onChange={(e) => setTopN(Number(e.target.value))}
                            className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-24 p-2"
                        >
                            {[5, 10, 15, 20, 25].map(n => (
                                <option key={n} value={n}>Top {n}</option>
                            ))}
                        </select>

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

                        {/* Switch porcentajes */}
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={mostrarPorcentajes}
                                onChange={(e) => setMostrarPorcentajes(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                                %
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
                                Posición
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Artículo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Descripción
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Cantidad
                            </th>
                            {mostrarPorcentajes && (
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    % del Total
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                        {datosProcesados.map((producto, index) => (
                            <tr key={producto.articulo} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                    {tipoProductos === 'mas' ? '🏆' : '📉'} {index + 1}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    {producto.articulo}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    {producto.descripcion}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                    {formatQuantity(producto.cantidad)}
                                </td>
                                {mostrarPorcentajes && (
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {calcularPorcentaje(producto.cantidad, totalCantidad)}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
