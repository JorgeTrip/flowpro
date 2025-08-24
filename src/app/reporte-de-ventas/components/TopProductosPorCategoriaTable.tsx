'use client';

import React, { useState, useMemo } from 'react';

interface Producto {
    articulo: string;
    descripcion: string;
    cantidad: number;
    total: number;
}

interface CategoriaData {
    categoria: string;
    cantidadCategoria: number;
    totalCategoria: number;
    productos: Producto[];
}

interface TopProductosPorCategoriaTableProps {
    topProductosPorCategoria: CategoriaData[];
    topProductosPorCategoriaImporte: CategoriaData[];
}

export const TopProductosPorCategoriaTable = ({ 
    topProductosPorCategoria, 
    topProductosPorCategoriaImporte 
}: TopProductosPorCategoriaTableProps) => {
    const [filtroMeses, setFiltroMeses] = useState<'todos' | 'conDatos' | 'individual'>('conDatos');
    const [topN, setTopN] = useState<number>(3);
    const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);
    const [ordenAscendente, setOrdenAscendente] = useState<boolean>(false);
    const [mostrarCantidad, setMostrarCantidad] = useState<boolean>(true);
    const [mostrarPorcentajes, setMostrarPorcentajes] = useState<boolean>(true);

    // Datos según el tipo seleccionado
    const datosOriginales = mostrarCantidad ? topProductosPorCategoria : topProductosPorCategoriaImporte;

    // Obtener todas las categorías disponibles
    const todasLasCategorias = useMemo(() => {
        return Array.from(new Set(datosOriginales.map(item => item.categoria)));
    }, [datosOriginales]);

    // Inicializar categorías seleccionadas
    React.useEffect(() => {
        if (categoriasSeleccionadas.length === 0) {
            setCategoriasSeleccionadas(todasLasCategorias);
        }
    }, [todasLasCategorias, categoriasSeleccionadas.length]);

    // Filtrar y procesar datos
    const datosProcesados = useMemo(() => {
        let datosFiltrados = datosOriginales.filter(item => 
            categoriasSeleccionadas.includes(item.categoria)
        );

        // Ordenar categorías
        datosFiltrados.sort((a, b) => {
            const valorA = mostrarCantidad ? a.cantidadCategoria : a.totalCategoria;
            const valorB = mostrarCantidad ? b.cantidadCategoria : b.totalCategoria;
            return ordenAscendente ? valorA - valorB : valorB - valorA;
        });

        // Limitar productos por categoría
        datosFiltrados = datosFiltrados.map(categoria => ({
            ...categoria,
            productos: categoria.productos.slice(0, topN)
        }));

        return datosFiltrados;
    }, [datosOriginales, categoriasSeleccionadas, ordenAscendente, topN, mostrarCantidad]);

    // Calcular totales generales
    const totalesGenerales = useMemo(() => {
        return datosProcesados.reduce((acc, categoria) => ({
            cantidad: acc.cantidad + categoria.cantidadCategoria,
            importe: acc.importe + categoria.totalCategoria
        }), { cantidad: 0, importe: 0 });
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

    const calcularPorcentaje = (valor: number, total: number) => {
        return total > 0 ? ((valor / total) * 100).toFixed(1) + '%' : '0%';
    };

    const handleCategoriaToggle = (categoria: string) => {
        setCategoriasSeleccionadas(prev => 
            prev.includes(categoria) 
                ? prev.filter(c => c !== categoria)
                : [...prev, categoria]
        );
    };

    const seleccionarTodasCategorias = () => {
        setCategoriasSeleccionadas(todasLasCategorias);
    };

    const limpiarCategorias = () => {
        setCategoriasSeleccionadas([]);
    };

    const exportarDatos = () => {
        const headers = mostrarPorcentajes 
            ? ['Categoría/Producto', 'Artículo', 'Descripción', mostrarCantidad ? 'Cantidad' : 'Importe', '% Total', '% Categoría']
            : ['Categoría/Producto', 'Artículo', 'Descripción', mostrarCantidad ? 'Cantidad' : 'Importe'];
        
        const rows: any[] = [];
        
        datosProcesados.forEach(categoria => {
            const totalGeneral = mostrarCantidad ? totalesGenerales.cantidad : totalesGenerales.importe;
            const valorCategoria = mostrarCantidad ? categoria.cantidadCategoria : categoria.totalCategoria;
            
            // Fila de categoría
            const filaCat = [
                `CATEGORÍA: ${categoria.categoria}`,
                '',
                '',
                mostrarCantidad ? categoria.cantidadCategoria : categoria.totalCategoria
            ];
            
            if (mostrarPorcentajes) {
                filaCat.push(calcularPorcentaje(valorCategoria, totalGeneral));
                filaCat.push('100%');
            }
            
            rows.push(filaCat);
            
            // Filas de productos
            categoria.productos.forEach(producto => {
                const valorProducto = mostrarCantidad ? producto.cantidad : producto.total;
                const filaProducto = [
                    `  ${producto.articulo}`,
                    producto.articulo,
                    producto.descripcion,
                    valorProducto
                ];
                
                if (mostrarPorcentajes) {
                    filaProducto.push(calcularPorcentaje(valorProducto, totalGeneral));
                    filaProducto.push(calcularPorcentaje(valorProducto, valorCategoria));
                }
                
                rows.push(filaProducto);
            });
        });

        const csvContent = [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `top-productos-categoria-${mostrarCantidad ? 'cantidad' : 'importe'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Header con controles */}
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Top Productos por Categoría
                    </h4>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Filtro de período */}
                        <select
                            value={filtroMeses}
                            onChange={(e) => setFiltroMeses(e.target.value as any)}
                            className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-36 p-2"
                        >
                            <option value="todos">Todos</option>
                            <option value="conDatos">Con datos</option>
                            <option value="individual">Individual</option>
                        </select>

                        {/* Selector Top N */}
                        <select
                            value={topN}
                            onChange={(e) => setTopN(Number(e.target.value))}
                            className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-24 p-2"
                        >
                            {[1, 2, 3, 4, 5].map(n => (
                                <option key={n} value={n}>Top {n}</option>
                            ))}
                        </select>

                        {/* Filtro de categorías */}
                        <div className="relative">
                            <button
                                className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-32 p-2 text-left"
                                onClick={() => {
                                    const popup = document.getElementById('categorias-popup');
                                    popup?.classList.toggle('hidden');
                                }}
                            >
                                Categorías ({categoriasSeleccionadas.length})
                            </button>
                            
                            <div id="categorias-popup" className="hidden absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                                <div className="p-3">
                                    <div className="flex gap-2 mb-3">
                                        <button
                                            onClick={seleccionarTodasCategorias}
                                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                                        >
                                            Todas
                                        </button>
                                        <button
                                            onClick={limpiarCategorias}
                                            className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                                        >
                                            Limpiar
                                        </button>
                                    </div>
                                    
                                    {todasLasCategorias.map(categoria => (
                                        <label key={categoria} className="flex items-center mb-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={categoriasSeleccionadas.includes(categoria)}
                                                onChange={() => handleCategoriaToggle(categoria)}
                                                className="mr-2"
                                            />
                                            <span className="text-sm text-gray-900 dark:text-white">
                                                {categoria}
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
                                Categoría/Producto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Artículo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Descripción
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                {mostrarCantidad ? 'Cantidad' : 'Importe'}
                            </th>
                            {mostrarPorcentajes && (
                                <>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        % Total
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        % Categoría
                                    </th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                        {datosProcesados.map((categoria, categoriaIndex) => {
                            const totalGeneral = mostrarCantidad ? totalesGenerales.cantidad : totalesGenerales.importe;
                            const valorCategoria = mostrarCantidad ? categoria.cantidadCategoria : categoria.totalCategoria;
                            
                            return (
                                <React.Fragment key={categoria.categoria}>
                                    {/* Fila de categoría */}
                                    <tr className="bg-blue-100 dark:bg-blue-900/30 border-t-2 border-blue-200 dark:border-blue-700">
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-blue-900 dark:text-blue-300">
                                            📁 {categoria.categoria}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            -
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            -
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-blue-900 dark:text-blue-300">
                                            {mostrarCantidad ? formatQuantity(categoria.cantidadCategoria) : formatCurrency(categoria.totalCategoria)}
                                        </td>
                                        {mostrarPorcentajes && (
                                            <>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-blue-900 dark:text-blue-300">
                                                    {calcularPorcentaje(valorCategoria, totalGeneral)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-blue-900 dark:text-blue-300">
                                                    100%
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                    
                                    {/* Filas de productos */}
                                    {categoria.productos.map((producto, productoIndex) => {
                                        const valorProducto = mostrarCantidad ? producto.cantidad : producto.total;
                                        const isEven = (categoriaIndex + productoIndex) % 2 === 0;
                                        
                                        return (
                                            <tr key={`${categoria.categoria}-${producto.articulo}`} 
                                                className={isEven ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400 pl-12">
                                                    📦 {producto.articulo}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {producto.articulo}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {producto.descripcion}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                    {mostrarCantidad ? formatQuantity(producto.cantidad) : formatCurrency(producto.total)}
                                                </td>
                                                {mostrarPorcentajes && (
                                                    <>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                            {calcularPorcentaje(valorProducto, totalGeneral)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                            {calcularPorcentaje(valorProducto, valorCategoria)}
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
