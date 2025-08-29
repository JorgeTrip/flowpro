// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useStoreWithEqualityFn } from 'zustand/traditional';
import { useRedistribucionStockStore } from '@/app/stores/redistribucionStockStore';
import { shallow } from 'zustand/shallow';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RefreshCwIcon, Loader2, FileDownIcon } from 'lucide-react';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface ChartData {
  name: string;
  count: number;
  fill: string;
}

interface ResultadoItem {
  productoId: string | number;
  descripcion: string;
  stockCABATotal: number;
  stockEntreRiosTotal: number;
  rotacionMensual: number;
  accion: 'Pedir a Entre Ríos' | 'Sin stock disponible' | 'Stock suficiente';
  cantidadSugerida: number;
  criticidad: 'alta' | 'media' | 'baja';
}

const getCriticalityColor = (criticidad: 'alta' | 'media' | 'baja'): string => {
  switch (criticidad) {
    case 'alta':
      return 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500';
    case 'media':
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500';
    case 'baja':
      return 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500';
    default:
      return '';
  }
};

const RedistribucionChart = ({ data }: { data: ChartData[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis allowDecimals={false} />
      <Tooltip
        contentStyle={{
          backgroundColor: 'rgba(31, 41, 55, 0.9)',
          borderColor: '#4b5563',
        }}
        labelStyle={{ color: '#f3f4f6' }}
      />
      <Bar dataKey="count" name="N° de Productos">
        <LabelList dataKey="count" position="insideTop" fill="#fff" fontSize={12} fontWeight="bold" />
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.fill} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

const ResultsTable = ({ data }: { data: ResultadoItem[] }) => (
  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead className="bg-gray-100 dark:bg-gray-800">
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-200">Descripción</th>
          <th scope="col" className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-200">ID Producto</th>
          <th scope="col" className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-200">Stock CABA</th>
          <th scope="col" className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-200">Stock Entre Ríos</th>
          <th scope="col" className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-200">Rotación Mensual</th>
          <th scope="col" className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-200">Acción</th>
          <th scope="col" className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-200">Cantidad Sugerida</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
        {data.map((item, index) => {
          const criticalityClass = getCriticalityColor(item.criticidad);
          return (
            <tr key={`${item.productoId}-${index}`} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${criticalityClass}`}>
              <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white w-64 break-words">
                {item.descripcion}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-gray-900 dark:text-white text-center">
                {item.productoId}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white text-center">
                {item.stockCABATotal.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white text-center">
                {item.stockEntreRiosTotal.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white text-center">
                {item.rotacionMensual.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-center">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.accion === 'Pedir a Entre Ríos' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                  item.accion === 'Sin stock disponible' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                }`}>
                  {item.accion}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-center">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.criticidad === 'alta' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                  item.criticidad === 'media' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                }`}>
                  {item.cantidadSugerida > 0 ? item.cantidadSugerida.toLocaleString() : '-'}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export function ResultsStep() {
  const { resultados, isLoading, reset, reAnalizar } = useStoreWithEqualityFn(
    useRedistribucionStockStore,
    (state) => ({
      resultados: state.resultados,
      isLoading: state.isLoading,
      reset: state.reset,
      reAnalizar: state.reAnalizar,
    }),
    shallow
  );

  if (!resultados || resultados.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">No hay resultados para mostrar.</p>
          <button
            onClick={() => reset()}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white font-semibold shadow-sm transition-colors hover:bg-blue-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Preparar datos para el gráfico
  const chartData: ChartData[] = [
    {
      name: 'Pedir a Entre Ríos',
      count: resultados.filter(r => r.accion === 'Pedir a Entre Ríos').length,
      fill: '#3B82F6'
    },
    {
      name: 'Sin stock disponible',
      count: resultados.filter(r => r.accion === 'Sin stock disponible').length,
      fill: '#EF4444'
    },
    {
      name: 'Stock suficiente',
      count: resultados.filter(r => r.accion === 'Stock suficiente').length,
      fill: '#10B981'
    }
  ];

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Redistribución de Stock');

    // Configurar columnas
    worksheet.columns = [
      { header: 'ID Producto', key: 'productoId', width: 15 },
      { header: 'Descripción', key: 'descripcion', width: 40 },
      { header: 'Stock CABA Total', key: 'stockCABATotal', width: 18 },
      { header: 'Stock Entre Ríos Total', key: 'stockEntreRiosTotal', width: 20 },
      { header: 'Rotación Mensual', key: 'rotacionMensual', width: 18 },
      { header: 'Acción', key: 'accion', width: 20 },
      { header: 'Cantidad Sugerida', key: 'cantidadSugerida', width: 18 },
      { header: 'Criticidad', key: 'criticidad', width: 12 },
    ];

    // Agregar datos
    resultados.forEach(item => {
      worksheet.addRow({
        productoId: item.productoId,
        descripcion: item.descripcion,
        stockCABATotal: item.stockCABATotal,
        stockEntreRiosTotal: item.stockEntreRiosTotal,
        rotacionMensual: item.rotacionMensual,
        accion: item.accion,
        cantidadSugerida: item.cantidadSugerida,
        criticidad: item.criticidad,
      });
    });

    // Estilizar encabezados
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' }
    };

    // Aplicar colores según criticidad
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const criticidad = row.getCell('criticidad').value as string;
        let fillColor = '';
        
        switch (criticidad) {
          case 'alta':
            fillColor = 'FFFEF2F2';
            break;
          case 'media':
            fillColor = 'FFFFFBEB';
            break;
          case 'baja':
            fillColor = 'FFF0FDF4';
            break;
        }
        
        if (fillColor) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: fillColor }
          };
        }
      }
    });

    // Generar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `redistribucion-stock-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Resultados del Análisis</h3>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-400">
              Se analizaron {resultados.length} productos para redistribución de stock
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={reAnalizar}
              disabled={isLoading}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCwIcon className="mr-2 h-4 w-4" />
              )}
              Re-analizar
            </button>
            <button
              onClick={exportToExcel}
              className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <FileDownIcon className="mr-2 h-4 w-4" />
              Exportar Excel
            </button>
            <button
              onClick={reset}
              className="inline-flex items-center rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Nuevo Análisis
            </button>
          </div>
        </div>
      </div>

      {/* Gráfico de resumen */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Resumen de Acciones</h4>
        <RedistribucionChart data={chartData} />
      </div>

      {/* Tabla de resultados */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Detalle de Productos</h4>
        <ResultsTable data={resultados} />
      </div>
    </div>
  );
}
