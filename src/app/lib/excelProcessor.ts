// 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
import * as ExcelJS from 'exceljs';
import type { ExcelRow } from '@/app/stores/estimarDemandaStore';

export const processExcelFile = async (file: File): Promise<{ data: ExcelRow[], columns: string[], previewData: ExcelRow[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      if (!event.target?.result) {
        return reject(new Error('Error al leer el archivo.'));
      }

      try {
        const buffer = event.target.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          return reject(new Error('No se encontró ninguna hoja de cálculo en el archivo.'));
        }

        const data: ExcelRow[] = [];
        const previewData: ExcelRow[] = [];
        let columns: string[] = [];

        const headerRow = worksheet.getRow(1);
        if (headerRow.values) {
          columns = (headerRow.values as any[]).slice(1).map(v => v ? String(v) : '');
        }

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) { // Skip header row
            const rowData: ExcelRow = {};
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              const header = columns[colNumber - 1];
              if (header) {
                rowData[header] = cell.value as string | number;
              }
            });
            data.push(rowData);

            // Capture the first 2 data rows for the preview
            if (rowNumber <= 3) {
              const previewRowData: ExcelRow = {};
              row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const header = columns[colNumber - 1];
                if (header) {
                  previewRowData[header] = cell.text; // Use .text for display-friendly value
                }
              });
              previewData.push(previewRowData);
            }
          }
        });

        resolve({ data, columns, previewData });
      } catch (error) {
        console.error('Error procesando el archivo Excel:', error);
        reject(new Error('El archivo parece estar dañado o no es un formato de Excel válido.'));
      }
    };

    reader.onerror = (error) => {
      reject(new Error('Error al leer el archivo.'));
    };

    reader.readAsArrayBuffer(file);
  });
};
