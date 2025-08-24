// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { ExcelRow } from '@/app/stores/reporteVentasStore';

interface DataPreviewTableProps {
  title: string;
  previewData: ExcelRow[];
  columns: string[];
  highlightedColumns?: string[];
}

export default function DataPreviewTable({ 
  title, 
  previewData, 
  columns, 
  highlightedColumns = [] 
}: DataPreviewTableProps) {
  const displayData = previewData.slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Mostrando {displayData.length} de {previewData.length} filas
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    highlightedColumns.includes(column)
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-500 dark:text-gray-300'
                  }`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {displayData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      highlightedColumns.includes(column)
                        ? 'text-blue-900 dark:text-blue-100 bg-blue-50 dark:bg-blue-900/20 font-medium'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {(() => {
                      let value = row[column];
                      
                      // Fix para columnas con tildes: buscar tanto con tilde como sin tilde
                      if (value === undefined && column === 'Descripción') {
                        value = row['Descripcion']; // Sin tilde
                      }
                      
                      return String(value || '');
                    })()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
