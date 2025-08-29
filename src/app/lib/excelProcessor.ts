// 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
import * as ExcelJS from 'exceljs';
import type { ExcelRow, ExcelCellValue } from '@/app/stores/estimarDemandaStore';

interface RichTextElement {
  text: string;
}

interface FormulaResult {
  richText?: RichTextElement[];
  text?: string;
  error?: unknown;
  formula?: string;
  sharedFormula?: string;
  result?: unknown;
}

function processFormulaResult(result: unknown): ExcelCellValue {
  if (result instanceof Date) {
    return result.toISOString();
  }
  if (typeof result === 'object' && result !== null) {
    const formulaResult = result as FormulaResult;
    if ('richText' in formulaResult && formulaResult.richText) {
      return formulaResult.richText.map((rt: RichTextElement) => rt.text).join('');
    }
    if ('hyperlink' in formulaResult && formulaResult.text) {
      return formulaResult.text;
    }
    if ('error' in formulaResult) {
      return ''; // Or some error indicator string
    }
    // It might be a formula that results in another formula object, recurse
    if ('formula' in formulaResult || 'sharedFormula' in formulaResult) {
        return processFormulaResult(formulaResult.result);
    }
    // If it's just a generic object that can't be parsed, return empty string
    return '';
  }
  // For primitive types or null/undefined
  return result === null || result === undefined ? '' : result as ExcelCellValue;
}

export async function processExcelFile(file: File): Promise<{ data: ExcelRow[], columns: string[], previewData: ExcelRow[] }> {
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
        const rawHeaders = (headerRow.values as string[])?.slice(1) || [];
        columns = rawHeaders.map(h => h?.trim() || '');

        // Mapeo de cabeceras flexibles - mantener nombres originales para redistribución
        const headerMapping: { [key: string]: string } = {};
        const expectedHeaders: { [key: string]: string[] } = {
          Fecha: ['fecha'],
          Cliente: ['cliente'],
          Articulo: ['articulo', 'artículo'],
          // Para redistribución, mantener el nombre original de la columna descripción
          Descripcion: ['descripcion', 'descripción'],
          Cantidad: ['cantidad'],
          PrecioTotal: ['preciototal', 'precio total'],
          DescripcionZona: ['descripcionzona', 'descripción zona', 'zona'],
          ReferenciaVendedor: ['referenciavendedor', 'vendedor'],
          DescRubro: ['descrubro', 'rubro'],
          DirectoIndirecto: ['directoindirecto', 'tipo venta'],
        };

        columns.forEach((header) => {
          const normalizedHeader = header.toLowerCase().replace(/\s+/g, '');
          for (const key in expectedHeaders) {
            if (expectedHeaders[key].includes(normalizedHeader)) {
              headerMapping[normalizedHeader] = key;
              break;
            }
          }
        });

        // Process data rows
        for (let i = 2; i <= worksheet.rowCount; i++) {
          const row = worksheet.getRow(i);
          const rowData: ExcelRow = {};
          let hasValues = false;

          // Procesar todas las columnas, incluso las vacías
          for (let colNumber = 1; colNumber <= columns.length; colNumber++) {
            const header = columns[colNumber - 1];
            if (header) {
              const cell = row.getCell(colNumber);
              const normalizedHeader = header.toLowerCase().replace(/\s+/g, '');
              // Para redistribución de stock, usar siempre el nombre original de la columna
              const mappedHeader = header;

              let cellValue = cell.value;
              
              // Debug logging para columna Descripción
              if (header.toLowerCase().includes('descripci') && i <= 5) {
                console.log(`Fila ${i}, Columna ${header}:`, {
                  cellValue,
                  cellType: typeof cellValue,
                  cellText: cell.text,
                  cellFormula: (cell as FormulaResult).formula,
                  cellResult: (cell as FormulaResult).result,
                  finalValue: cellValue === undefined ? '' : cellValue
                });
              }

              if (cellValue !== null && cellValue !== undefined && String(cellValue).trim() !== '') {
                hasValues = true;
              }

              if (cellValue instanceof Date) {
                cellValue = cellValue.toISOString();
              } else if (typeof cellValue === 'object' && cellValue !== null && 'error' in cellValue) {
                cellValue = '';
              } else if (typeof cellValue === 'object' && cellValue !== null && 'richText' in cellValue) {
                cellValue = (cellValue as FormulaResult).richText?.map((rt: RichTextElement) => rt.text).join('') || '';
              } else if (typeof cellValue === 'object' && cellValue !== null && 'hyperlink' in cellValue) {
                cellValue = (cellValue as FormulaResult).text || '';
              } else if (typeof cellValue === 'object' && cellValue !== null && ('formula' in cellValue || 'sharedFormula' in cellValue)) {
                cellValue = processFormulaResult((cellValue as FormulaResult).result);
              }

              // Usar cell.text como fallback si cellValue está vacío pero hay texto visible
              if ((!cellValue || cellValue === '') && cell.text && cell.text.trim() !== '') {
                cellValue = cell.text;
              }

              if (typeof cellValue === 'object' && cellValue !== null) {
                // Para objetos, intentar extraer el texto
                if ('richText' in cellValue) {
                  rowData[mappedHeader] = (cellValue as FormulaResult).richText?.map((rt: RichTextElement) => rt.text).join('') || '';
                } else if ('text' in cellValue) {
                  rowData[mappedHeader] = (cellValue as FormulaResult).text || '';
                } else {
                  rowData[mappedHeader] = String(cellValue);
                }
              } else {
                rowData[mappedHeader] = cellValue === undefined ? '' : cellValue;
              }
              
              // Debug adicional para previsualización
              if (header.toLowerCase().includes('descripci') && i <= 5) {
                console.log(`Final rowData[${mappedHeader}]:`, rowData[mappedHeader]);
              }
            }
          }

          if (hasValues) {
            data.push(rowData);
            if (previewData.length < 5) {
              const previewRow = { ...rowData };
              console.log(`PreviewData row ${previewData.length + 1}:`, previewRow);
              previewData.push(previewRow);
            }
          }
        }

        resolve({ data, columns, previewData });
      } catch {
        console.error('Error procesando el archivo Excel');
        reject(new Error('El archivo parece estar dañado o no es un formato de Excel válido.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo.'));
    };

    reader.readAsArrayBuffer(file);
  });
};
