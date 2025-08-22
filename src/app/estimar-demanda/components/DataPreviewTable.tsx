// 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import React from 'react';
import type { ExcelRow } from '@/app/stores/estimarDemandaStore';

interface DataPreviewTableProps {
  previewData: ExcelRow[];
  columns: string[];
  title: string;
  highlightedColumns?: string[];
}

const DataPreviewTable: React.FC<DataPreviewTableProps> = ({ previewData, columns, title, highlightedColumns = [] }) => {
  if (!previewData || previewData.length === 0) {
    return null;
  }

  // Ensure we have a consistent set of columns from the props
  const displayColumns = columns.filter(Boolean);

  return (
    <div className="my-4">
      <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{title}</h4>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {displayColumns.map((header, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider ${highlightedColumns.includes(header) ? 'bg-green-50 text-green-700 dark:bg-green-800 dark:text-green-100' : 'text-gray-500 dark:text-gray-300'}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {previewData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-100 dark:hover:bg-gray-600">
                {displayColumns.map((header, colIndex) => (
                  <td key={colIndex} className={`px-4 py-2 whitespace-nowrap text-sm ${highlightedColumns.includes(header) ? 'bg-green-50 text-green-900 dark:bg-green-800 dark:text-green-100' : 'text-gray-900 dark:text-gray-200'}`}>
                    {row[header] !== undefined && row[header] !== null ? String(row[header]) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataPreviewTable;
