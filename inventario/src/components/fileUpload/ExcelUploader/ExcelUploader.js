import React, { useState } from 'react';
import { Upload, App } from 'antd'; // Replaced message with App
import { InboxOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx'; // Corrected XLSX import
import styles from './ExcelUploader.module.css'; // Added CSS module import
import { 
    FILE_TYPE_SYSTEM, FILE_TYPE_PHYSICAL, 
    CODIGO_COLUMN, DESCRIPCION_COLUMN, STOCK_SISTEMA_COLUMN, PV_COLUMN, PV_MIN_COLUMN, STOCK_REAL_COLUMN, PROVEEDOR_COLUMN, // System keys
    PHYSICAL_STOCK_COLUMN, // Internal key for physical stock quantity
    IGNORED_CODE_VALUES_SYSTEM, IGNORED_CODE_VALUES_PHYSICAL, IGNORED_CODE_PREFIXES_PHYSICAL,
    PHYSICAL_HEADER_CONFIG, // New config for dynamic header detection
    CATEGORIA_COLUMN, // Used as a key in PHYSICAL_HEADER_CONFIG & SYSTEM_SHEET_CONFIGS
    DESCRIPCION_ADICIONAL_COLUMN, // Used as a key in PHYSICAL_HEADER_CONFIG & SYSTEM_SHEET_CONFIGS
    // eslint-disable-next-line no-unused-vars
    PHYSICAL_OBSERVACIONES_COLUMN, // Used as a key in PHYSICAL_HEADER_CONFIG
    EXPECTED_SYSTEM_SHEETS, // For SISTEMA.xlsx processing
    SYSTEM_SHEET_CONFIGS    // For SISTEMA.xlsx processing
} from '../../../utils/constants';

const { Dragger } = Upload;

// Helper function to parse stock quantity for physical inventory
const parseStockQuantity = (rawValue) => {
    if (rawValue === null || rawValue === undefined || (typeof rawValue === 'string' && rawValue.trim() === '')) {
        return null; // Keep it null if empty or truly blank, to distinguish from 0
    }
    // Handle numbers that might be strings with thousand separators (e.g., "1.234,56" or "1,234.56")
    // And simple numbers
    let numStr = String(rawValue);
    // Remove thousand separators (dots if European, commas if US)
    // Assuming European format primarily (dot for thousands, comma for decimal)
    // If US format (comma for thousands, dot for decimal) is also possible, this needs more robust logic
    numStr = numStr.replace(/\./g, ''); // Remove all dots (potential thousand separators)
    numStr = numStr.replace(',', '.');   // Replace comma with dot (potential decimal separator)

    const num = parseFloat(numStr);
    if (isNaN(num)) {
        // console.warn(`[ExcelUploader] Could not parse stock value: ${rawValue} (processed as ${numStr})`);
        return null; // Or 0, depending on desired behavior for unparseable non-empty strings
    }
    return num;
};

// Helper function to check if a raw row is a physical inventory data header
// and map column indices based on PHYSICAL_HEADER_CONFIG
const checkAndMapPhysicalHeader = (rawRowArray) => {
    if (!rawRowArray || rawRowArray.length === 0) return null;

    const headerMap = {};
    let requiredHeadersFound = 0;
    const totalRequiredHeaders = Object.values(PHYSICAL_HEADER_CONFIG).filter(cfg => cfg.required).length;

    rawRowArray.forEach((cellValue, index) => {
        const cellText = cellValue ? String(cellValue).trim().toLowerCase().replace(/\n/g, ' ') : '';
        if (!cellText) return;

        for (const [internalKey, config] of Object.entries(PHYSICAL_HEADER_CONFIG)) {
            if (config.expectedTexts.includes(cellText)) {
                headerMap[internalKey] = index;
                if (config.required) {
                    requiredHeadersFound++;
                }
                break; // Found a match for this cell, move to next cell
            }
        }
    });

    // Validate if all required headers are present
    if (requiredHeadersFound >= totalRequiredHeaders && headerMap[CODIGO_COLUMN] !== undefined && headerMap[PHYSICAL_STOCK_COLUMN] !== undefined) {
      // console.log('[ExcelUploader Debug] Physical Header Matched. Config:', PHYSICAL_HEADER_CONFIG, 'Row:', rawRowArray, 'Mapped Indices:', headerMap);
      return headerMap;
    }
    // console.log('[ExcelUploader Debug] Row did not match physical header criteria. Required found:', requiredHeadersFound, '/', totalRequiredHeaders, 'Row:', rawRowArray.slice(0,5));
    return null;
};

const ExcelUploader = ({ onFileProcessed, expectedSheets, title, description, fileType }) => {
  const [loading, setLoading] = useState(false);
  const { message: appMessage, notification: appNotification } = App.useApp(); // Ant Design hook

  const props = {
    name: 'file',
    multiple: false,
    accept: '.xlsx, .xls',
    beforeUpload: file => {
      const isXlsx = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const isXls = file.type === 'application/vnd.ms-excel';
      if (!isXlsx && !isXls) {
        appMessage.error(`${file.name} no es un archivo Excel válido.`);
      }
      return isXlsx || isXls || Upload.LIST_IGNORE;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      setLoading(true);
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'array', cellNF: false, cellDates: true });
            // headerRowOption is not used directly here anymore, logic is per file type
            
            console.log('[ExcelUploader] Parsed sheet names:', workbook.SheetNames);
            
            const allProcessedData = {}; // Object to hold data per sheet
            let grandTotalValidRecords = 0;
            let omittedItemsCount = 0; // Initialize for items omitted due to bad codes, etc.
            let omittedSheetsCount = 0; // Initialize for sheets that couldn't be processed or were missing

            if (fileType === FILE_TYPE_PHYSICAL) {
                console.log('[ExcelUploader] Starting physical inventory processing with dynamic header detection.');
                // For physical inventory, sheets like 'Instrucciones' or 'Planilla Stock' are often metadata, not data sheets.
                const ignoredSheetsPhysical = ['Instrucciones', 'Planilla Stock']; 
                // Determine sheets to process: if expectedSheets is provided, use that, otherwise all sheets minus ignored ones.
                let sheetsToProcessPhysical = workbook.SheetNames.filter(sn => !ignoredSheetsPhysical.includes(sn));
                if (expectedSheets.length > 0) {
                    sheetsToProcessPhysical = expectedSheets.filter(sn => workbook.SheetNames.includes(sn) && !ignoredSheetsPhysical.includes(sn));
                    // Warn if expected sheets are not found
                    expectedSheets.forEach(es => {
                        if (!workbook.SheetNames.includes(es)) {
                            appNotification.warn({
                                message: 'Hoja Esperada No Encontrada',
                                description: `La hoja '${es}' (Físico) no se encontró en el archivo ${file.name}.`
                            });
                        }
                    });
                }

                sheetsToProcessPhysical.forEach(sheetName => {
                    console.log(`[ExcelUploader] Processing physical sheet: ${sheetName}`);
                    const sheet = workbook.Sheets[sheetName];
                    const rawRowsArray = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", blankrows: false });

                    let currentHeaderMap = null;
                    let processedSheetData = [];
                    let omittedForInvalidCodeCountInSheet = 0;

                    // console.log(`[ExcelUploader Debug - Physical Raw Rows] Sheet ${sheetName} first 5 raw rows:`, rawRowsArray.slice(0, 5));

                    rawRowsArray.forEach((rowArray, rowIndex) => {
                        const headerMapAttempt = checkAndMapPhysicalHeader(rowArray);
                        
                        if (headerMapAttempt) {
                            currentHeaderMap = headerMapAttempt;
                            // console.log(`[ExcelUploader Debug - Physical] New header section identified on sheet '${sheetName}', row ${rowIndex + 1}. Column map:`, currentHeaderMap, 'Header Row Content:', rowArray.slice(0,6));
                            return; 
                        }

                        if (!currentHeaderMap) return;

                        const newItem = {};
                        let hasCodigo = false;
                        for (const [internalKey, excelIndex] of Object.entries(currentHeaderMap)) {
                                const rawValue = rowArray[excelIndex];
                                if (internalKey === PHYSICAL_STOCK_COLUMN) {
                                    newItem[STOCK_REAL_COLUMN] = parseStockQuantity(rawValue); // Map to STOCK_REAL_COLUMN
                                } else {
                                    newItem[internalKey] = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
                                }
                                if (internalKey === CODIGO_COLUMN && newItem[internalKey] && String(newItem[internalKey]).trim() !== '') {
                                    hasCodigo = true;
                                }
                        }
                        
                        if (!hasCodigo || !newItem[CODIGO_COLUMN]) {
                            omittedForInvalidCodeCountInSheet++;
                            return;
                        }

                        const codigoValueUpper = String(newItem[CODIGO_COLUMN]).toUpperCase().trim();

                        if (IGNORED_CODE_VALUES_PHYSICAL.includes(codigoValueUpper)) {
                            omittedForInvalidCodeCountInSheet++;
                            return;
                        }
                        if (IGNORED_CODE_PREFIXES_PHYSICAL.some(prefix => codigoValueUpper.startsWith(prefix))) {
                            omittedForInvalidCodeCountInSheet++;
                            return;
                        }
                        
                        // Ensure essential fields are present
                        if (!newItem.hasOwnProperty(STOCK_REAL_COLUMN)) newItem[STOCK_REAL_COLUMN] = null;
                        if (!newItem.hasOwnProperty(DESCRIPCION_COLUMN)) newItem[DESCRIPCION_COLUMN] = ''; 
                        if (!newItem.hasOwnProperty(CODIGO_COLUMN)) newItem[CODIGO_COLUMN] = ''; // Should not happen due to filter above

                        processedSheetData.push(newItem);
                    });

                    if (omittedForInvalidCodeCountInSheet > 0) {
                        appNotification.info({
                            message: `Hoja '${sheetName}' (Físico)`, 
                            description: `${omittedForInvalidCodeCountInSheet} filas fueron omitidas por código inválido, ignorado, o por estar antes de un encabezado válido.`
                        });
                    }

                    if (processedSheetData.length > 0) {
                        console.log(`[ExcelUploader Debug - Physical Processed & Filtered] First 3 items for sheet ${sheetName}:`, processedSheetData.slice(0, 3).map(it => ({ 
                            CÓDIGO: it[CODIGO_COLUMN], 
                            STOCK_REAL: it[STOCK_REAL_COLUMN], 
                            DESC: it[DESCRIPCION_COLUMN]
                        })));
                        allProcessedData[sheetName] = processedSheetData;
                        grandTotalValidRecords += processedSheetData.length;
                    } else {
                        console.log(`[ExcelUploader] No valid data found in sheet: ${sheetName} (Físico) after dynamic processing and filtering.`);
                        // Optionally notify if a processed sheet yields no data
                        // appNotification.warn({ message: `Hoja '${sheetName}' (Físico)`, description: 'No se encontraron datos válidos.' });
                    }
                });

                console.log(`[ExcelUploader Debug - Physical] Total valid records from all physical sheets: ${grandTotalValidRecords}`);

            } else if (fileType === FILE_TYPE_SYSTEM) {
                console.log('[ExcelUploader] Starting system inventory processing.');
                // omittedItemsCount and omittedSheetsCount are initialized at the start of reader.onload's try block

                EXPECTED_SYSTEM_SHEETS.forEach(sheetName => {
                    const sheetConfig = SYSTEM_SHEET_CONFIGS[sheetName];
                    if (!sheetConfig) {
                        appNotification.warning({
                            message: 'Configuración de Hoja Faltante (Sistema)',
                            description: `No se encontró configuración para la hoja esperada '${sheetName}'. Esta hoja será omitida.`
                        });
                        omittedSheetsCount++;
                        return; // continue to next sheetName in forEach
                    }

                    const worksheet = workbook.Sheets[sheetName];
                    if (!worksheet) {
                        appNotification.warning({
                            message: 'Hoja Faltante (Sistema)',
                            description: `La hoja esperada '${sheetName}' no se encontró en el archivo. Será omitida.`
                        });
                        omittedSheetsCount++;
                        return; // continue to next sheetName in forEach
                    }

                    const sheetDataAsArray = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, blankrows: false });

                    // sheetConfig.dataStartRowIndex is 0-based index for the first data row (e.g., 1 if headers are in row 0)
                    if (sheetDataAsArray.length <= sheetConfig.dataStartRowIndex) { 
                        appNotification.info({
                            message: 'Hoja Vacía o Sin Datos (Sistema)',
                            description: `La hoja '${sheetName}' parece no contener datos a partir de la fila ${sheetConfig.dataStartRowIndex + 1}.`
                        });
                        return; // continue to next sheetName in forEach
                    }
                    
                    let validRecordsInSheet = 0;
                    for (let rowIndex = sheetConfig.dataStartRowIndex; rowIndex < sheetDataAsArray.length; rowIndex++) {
                        const rowArray = sheetDataAsArray[rowIndex];
                        if (!rowArray || rowArray.every(cell => cell === null || String(cell).trim() === '')) {
                            continue; // Skip entirely empty or effectively blank rows
                        }

                        const codigoRaw = rowArray[sheetConfig.columns[CODIGO_COLUMN]];
                        const codigo = codigoRaw ? String(codigoRaw).trim().toUpperCase() : null;
                        // eslint-disable-next-line no-unused-vars
                        const originalCodigo = codigoRaw ? String(codigoRaw).trim() : "";

                        if (!codigo) {
                            omittedItemsCount++;
                            continue;
                        }

                        if (IGNORED_CODE_VALUES_SYSTEM.includes(codigo)) {
                            omittedItemsCount++;
                            continue;
                        }
                        
                        const stockRaw = rowArray[sheetConfig.columns[STOCK_SISTEMA_COLUMN]];
                        let stockSistema = null;
                        if (stockRaw !== null && stockRaw !== undefined && String(stockRaw).trim() !== '') {
                            const stockNumStr = String(stockRaw).replace(/\./g, '').replace(/,/g, '.');
                            const stockNum = parseFloat(stockNumStr);
                            if (!isNaN(stockNum)) {
                                stockSistema = stockNum;
                            }
                        }

                        const processedItem = {
                            [CODIGO_COLUMN]: codigo,
                            [DESCRIPCION_COLUMN]: rowArray[sheetConfig.columns[DESCRIPCION_COLUMN]] ? String(rowArray[sheetConfig.columns[DESCRIPCION_COLUMN]]).trim() : null,
                            [DESCRIPCION_ADICIONAL_COLUMN]: (sheetConfig.columns[DESCRIPCION_ADICIONAL_COLUMN] !== undefined && rowArray[sheetConfig.columns[DESCRIPCION_ADICIONAL_COLUMN]]) ? String(rowArray[sheetConfig.columns[DESCRIPCION_ADICIONAL_COLUMN]]).trim() : null,
                            [STOCK_SISTEMA_COLUMN]: stockSistema,
                            fileName: file.name,
                            sheetName: sheetName,
                            rowIndexInSheet: rowIndex + 1 // 1-based row index for user messages
                        };
                        
                        // Add sheet-specific fields
                        if (sheetName === 'PT') {
                            if (sheetConfig.columns['MARCA'] !== undefined) processedItem['MARCA'] = rowArray[sheetConfig.columns['MARCA']] ? String(rowArray[sheetConfig.columns['MARCA']]).trim() : null;
                            if (sheetConfig.columns['UNIDAD_NEGOCIO'] !== undefined) processedItem['UNIDAD_NEGOCIO'] = rowArray[sheetConfig.columns['UNIDAD_NEGOCIO']] ? String(rowArray[sheetConfig.columns['UNIDAD_NEGOCIO']]).trim() : null;

                        } else if (sheetName === 'MP' || sheetName === 'SE') {
                            if (sheetConfig.columns[CATEGORIA_COLUMN] !== undefined) processedItem[CATEGORIA_COLUMN] = rowArray[sheetConfig.columns[CATEGORIA_COLUMN]] ? String(rowArray[sheetConfig.columns[CATEGORIA_COLUMN]]).trim() : null;
                        }
                        
                        // Add other potential generic columns if defined in sheetConfig
                        if (sheetConfig.columns[PV_COLUMN] !== undefined) {
                            const pvRaw = rowArray[sheetConfig.columns[PV_COLUMN]];
                            processedItem[PV_COLUMN] = (pvRaw !== null && pvRaw !== undefined && String(pvRaw).trim() !== '') ? parseFloat(String(pvRaw).replace(/\./g, '').replace(/,/g, '.')) : null;
                            if (isNaN(processedItem[PV_COLUMN])) processedItem[PV_COLUMN] = null;
                        }
                        if (sheetConfig.columns[PV_MIN_COLUMN] !== undefined) {
                            const pvMinRaw = rowArray[sheetConfig.columns[PV_MIN_COLUMN]];
                            processedItem[PV_MIN_COLUMN] = (pvMinRaw !== null && pvMinRaw !== undefined && String(pvMinRaw).trim() !== '') ? parseFloat(String(pvMinRaw).replace(/\./g, '').replace(/,/g, '.')) : null;
                            if (isNaN(processedItem[PV_MIN_COLUMN])) processedItem[PV_MIN_COLUMN] = null;
                        }
                        if (sheetConfig.columns[PROVEEDOR_COLUMN] !== undefined) {
                             processedItem[PROVEEDOR_COLUMN] = rowArray[sheetConfig.columns[PROVEEDOR_COLUMN]] ? String(rowArray[sheetConfig.columns[PROVEEDOR_COLUMN]]).trim() : null;
                        }

                        if (!allProcessedData[sheetName]) {
                            allProcessedData[sheetName] = [];
                        }
                        allProcessedData[sheetName].push(processedItem);
                        validRecordsInSheet++;
                    } // end for loop over rows
                    
                    if (validRecordsInSheet > 0) {
                        grandTotalValidRecords += validRecordsInSheet;
                        // console.log(`[ExcelUploader Debug - System Processed] Sheet: ${sheetName}, ${validRecordsInSheet} valid records. First item:`, allProcessedData[sheetName][0]);
                    } else {
                        // console.log(`[ExcelUploader] No valid data found in sheet: ${sheetName} (Sistema) after processing.`);
                    }
                }); // end forEach over EXPECTED_SYSTEM_SHEETS
                
                if (omittedItemsCount > 0 && grandTotalValidRecords > 0) { // Only show if there's also valid data, to avoid noise if file is totally empty/bad
                    appNotification.info({
                        message: 'Registros Omitidos (Sistema)',
                        description: `${omittedItemsCount} fila(s) fueron omitidas en total (entre todas las hojas de sistema procesadas) por código inválido, vacío o ignorado.`
                    });
                }
            }

            // Common logic for all file types after processing all sheets
            const sheetsProcessedCount = Object.keys(allProcessedData).length;
            // Determine relevant sheets attempted based on file type and expectedSheets
            let relevantSheetsAttemptedCount = 0;
            if (fileType === FILE_TYPE_PHYSICAL) {
                const ignoredSheetsPhysical = ['Instrucciones', 'Planilla Stock'];
                relevantSheetsAttemptedCount = (expectedSheets.length > 0 ? expectedSheets : workbook.SheetNames).filter(sn => !ignoredSheetsPhysical.includes(sn) && workbook.SheetNames.includes(sn)).length;
            } else {
                relevantSheetsAttemptedCount = (expectedSheets.length > 0 ? expectedSheets : workbook.SheetNames).filter(sn => workbook.SheetNames.includes(sn)).length;
            }

            if (sheetsProcessedCount === 0 && relevantSheetsAttemptedCount > 0) {
              appNotification.error({
                message: 'Procesamiento Fallido',
                description: 'Ninguna de las hojas relevantes contenía datos válidos o no se pudieron procesar adecuadamente.'
              });
              onError(new Error('Ninguna de las hojas relevantes contenía datos válidos.'));
              setLoading(false); // Ensure loading is set to false before returning
              return;
            }
            
            if (grandTotalValidRecords === 0 && sheetsProcessedCount > 0 && Object.keys(allProcessedData).length === 0) { 
                appNotification.warn({
                    message: 'Archivo Procesado Sin Datos Útiles',
                    description: `El archivo ${file.name} fue procesado y se leyeron ${sheetsProcessedCount} hoja(s), pero no se encontraron registros con código válido.`
                });
            }

            if (omittedSheetsCount > 0 && fileType === FILE_TYPE_SYSTEM) {
              appNotification.info({
                message: 'Hojas Omitidas (Sistema)',
                description: `${omittedSheetsCount} hoja(s) esperada(s) del archivo de sistema '${file.name}' no se encontraron, no tenían configuración, o no pudieron ser procesadas.`,
              });
            }

            onFileProcessed(allProcessedData, fileType, grandTotalValidRecords, file.name);

            if (grandTotalValidRecords > 0) {
                appMessage.success(`${file.name} procesado: ${grandTotalValidRecords} registros válidos cargados de ${sheetsProcessedCount} hoja(s).`);
            }
            // If grandTotalValidRecords is 0 but sheets were processed (e.g. all rows filtered out), 
            // onFileProcessed is still called, and a warning might have been shown.
            // onSuccess should still be called to indicate the file reading/parsing operation itself didn't fail catastrophically.
            onSuccess('ok');
          } catch (err) {
            console.error('Error procesando el archivo Excel:', err);
            appMessage.error('Error al procesar el archivo Excel.');
            onError(err);
          }
          setLoading(false);
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        console.error('Error leyendo el archivo:', err);
        appMessage.error('Error al leer el archivo.');
        onError(err);
        setLoading(false);
      }
    },
  };

  return (
    <Dragger {...props} className={styles.uploader} disabled={loading}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">{title || 'Haz clic o arrastra un archivo Excel aquí para subirlo'}</p>
      <p className="ant-upload-hint">
        {description || 'Soporta archivos .xlsx y .xls.'}
      </p>
      {loading && <p>Procesando archivo...</p>}
    </Dragger>
  );
};

export default ExcelUploader;
