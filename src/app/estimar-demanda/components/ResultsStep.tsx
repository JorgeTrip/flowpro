// 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useStoreWithEqualityFn } from 'zustand/traditional';
import { useEstimarDemandaStore, EstimarDemandaState } from '@/app/stores/estimarDemandaStore';
import { shallow } from 'zustand/shallow';
import { ResultadoItem, getCriticalityColor } from '@/app/lib/demandEstimator';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RefreshCwIcon, Loader2, FileDownIcon } from 'lucide-react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface ChartData {
  name: string;
  count: number;
  fill: string;
}

const DemandaStockChart = ({ data }: { data: ChartData[] }) => (
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
          <th scope="col" className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-200">Venta Mensual</th>
          <th scope="col" className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-200">Stock CABA</th>
          <th scope="col" className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-200">Stock Reservado</th>
          <th scope="col" className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-200">Stock Neto CABA</th>
          <th scope="col" className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-200">Stock Entre Ríos</th>
          <th scope="col" className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-200">Pedir a Entre Ríos</th>
          <th scope="col" className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-200">Meses Cobertura</th>
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
                {item.venta.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white text-center">
                {item.stockCABA.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white text-center">
                {item.stockReservadoCABA.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white text-center">
                {item.stockNetoCABA.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-blue-600 dark:text-blue-400 text-center font-medium">
                {item.stockEntreRios.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.pedirAEntreRios === 'No necesario' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                  item.pedirAEntreRios === 'Sin stock disponible en ambos' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                  item.pedirAEntreRios.includes('insuficiente') ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                }`}>
                  {item.pedirAEntreRios}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-center">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.criticidad === 'alta' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                  item.criticidad === 'media' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                }`}>
                  {item.mesesCobertura === 999 ? '∞' : item.mesesCobertura} meses
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
    useEstimarDemandaStore,
    (state: EstimarDemandaState) => ({
      resultados: state.resultados,
      isLoading: state.isLoading,
      reset: state.reset,
      reAnalizar: state.reAnalizar,
    }),
    shallow
  );

  const handleExport = async () => {
    if (!resultados || resultados.length === 0) {
      console.log("No hay datos para exportar.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Análisis de Demanda');

    worksheet.columns = [
      { header: 'Descripción', key: 'descripcion', width: 40 },
      { header: 'ID Producto', key: 'productoId', width: 20 },
      { header: 'Venta Mensual', key: 'venta', width: 20 },
      { header: 'Stock CABA', key: 'stockCABA', width: 15 },
      { header: 'Stock Reservado CABA', key: 'stockReservadoCABA', width: 20 },
      { header: 'Stock Neto CABA', key: 'stockNetoCABA', width: 18 },
      { header: 'Stock Entre Ríos', key: 'stockEntreRios', width: 18 },
      { header: 'Pedir a Entre Ríos', key: 'pedirAEntreRios', width: 25 },
      { header: 'Meses Cobertura', key: 'mesesCobertura', width: 20 },
      { header: 'Sugerencia', key: 'sugerencia', width: 50 },
      { header: 'Criticidad', key: 'criticidad', width: 15 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2F75B5' }, // Blue
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    resultados.forEach(item => {
      worksheet.addRow({
        ...item,
        mesesCobertura: item.mesesCobertura === 999 ? '∞' : item.mesesCobertura,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'analisis_demanda.xlsx');
  };

  const coverageData = (resultados || []).reduce((acc, item) => {
    const coverage = Math.floor(item.mesesCobertura);
    if (coverage < 1) acc[0].count++;
    else if (coverage < 2) acc[1].count++;
    else if (coverage < 3) acc[2].count++;
    else if (coverage < 4) acc[3].count++;
    else if (coverage === 4) acc[4].count++;
    else acc[5].count++;
    return acc;
  }, [
    { name: '0 meses', count: 0, fill: '#ef4444' }, // red-500
    { name: '1 mes', count: 0, fill: '#ef4444' },
    { name: '2 meses', count: 0, fill: '#ef4444' },
    { name: '3 meses', count: 0, fill: '#ef4444' },
    { name: '4 meses', count: 0, fill: '#facc15' }, // yellow-400
    { name: '> 4 meses', count: 0, fill: '#22c55e' }, // green-500
  ]);

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Paso 3: Resultados del Análisis</h3>
        <p className="ml-2 text-sm text-gray-900 dark:text-gray-300">Visualice la comparación entre el stock actual y la demanda, y las sugerencias de compra.</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h4 className="font-semibold text-gray-800 dark:text-gray-200">Acciones</h4>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button onClick={handleExport} className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-800">
            <FileDownIcon className="mr-2 h-5 w-5" />
            Exportar a Excel
          </button>
          <button onClick={reAnalizar} disabled={isLoading} className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-500">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <RefreshCwIcon className="mr-2 h-5 w-5" />
                Refrescar Análisis
              </>
            )}
          </button>
          <button onClick={reset} disabled={isLoading} className="inline-flex items-center justify-center rounded-md bg-gray-500 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
            <ArrowPathIcon className="mr-2 h-5 w-5" />
            Realizar Nuevo Análisis
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Distribución de Productos por Cobertura de Stock</h4>
          <DemandaStockChart data={coverageData} />
        </div>
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Leyenda de Criticidad:</h5>
          <div className="flex flex-wrap gap-4 text-sm mb-3">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-red-500 border border-red-700 rounded"></span>
              <span className="text-gray-900 dark:text-gray-300">Alta: Stock CABA insuficiente, sin stock en Entre Ríos o insuficiente</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-yellow-400 border border-yellow-600 rounded"></span>
              <span className="text-gray-900 dark:text-gray-300">Media: Stock CABA insuficiente, pero hay stock disponible en Entre Ríos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-500 border border-green-700 rounded"></span>
              <span className="text-gray-900 dark:text-gray-300">Baja: Stock CABA suficiente (≥ 4 meses de cobertura)</span>
            </div>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 border-t border-gray-300 dark:border-gray-600 pt-2">
            <strong>Nota:</strong> La lógica considera que si Entre Ríos tiene stock para 3+ meses de rotación, puede cubrir la demanda insatisfecha de CABA.
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Detalle del Análisis</h4>
        <ResultsTable data={resultados || []} />
      </div>
    </div>
  );
}
