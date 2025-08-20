// Constantes para la aplicación

export const APP_TITLE = "Control de Inventario";

// Nombres de columnas comunes
export const PHYSICAL_INVENTORY_HEADER_ROW_INDEX = 10; // Headers on row 11 (0-indexed 10), data starts row 12, Data starts Row 11
export const SYSTEM_INVENTORY_HEADER_ROW_INDEX = 0;    // Fila 1
export const RAW_PHYSICAL_QUANTITY_COLUMN = 'CANTIDAD'; // Actual column name in FISICO file for stock
export const CODIGO_COLUMN = 'CÓDIGO';
export const DESCRIPCION_COLUMN = 'DESCRIPCIÓN';
export const DESCRIPCION_ADICIONAL_COLUMN = 'DESCRIPCIÓN ADICIONAL';
export const CATEGORIA_COLUMN = 'CATEGORÍA';
export const PHYSICAL_OBSERVACIONES_COLUMN = 'OBSERVACIONES'; // For physical inventory specific observation column handling
export const PV_COLUMN = 'PV';
export const PV_MIN_COLUMN = 'PV_MIN';
export const PROVEEDOR_COLUMN = 'PROVEEDOR';

// Columnas de stock del sistema (ejemplos, ajustar según necesidad)
export const STOCK_ENTRE_RIOS_COLUMN = 'STOCK ENTRE RÍOS';
export const STOCK_CABA_COLUMN = 'STOCK CABA';
export const STOCK_CABA_HDO_COLUMN = 'STOCK CABA (HDO)';
export const STOCK_GENERAL_SYSTEM_COLUMN = 'STOCK'; // Fallback o nombre común para sistema
export const STOCK_PLANTA_3_COLUMN = 'STOCK PLANTA 3';
export const STOCK_GENERAL_COLUMN = 'STOCK'; // Nombre estandarizado genérico para stock si aplica

// Columna de stock del inventario físico (estandarizado)
export const PHYSICAL_STOCK_COLUMN = 'STOCK'; // Nombre estandarizado para el stock físico después de la normalización
export const STOCK_REAL_COLUMN = 'STOCK'; // Manteniendo por si se usa en otro lado, pero PHYSICAL_STOCK_COLUMN es el preferido para la lógica de normalización

// Mapeo de columnas para el inventario del SISTEMA
// La clave es la constante interna de la app, el valor es un array de posibles nombres de encabezado en el Excel
export const SYSTEM_INVENTORY_COLUMN_MAPPINGS = {
  [CODIGO_COLUMN]: ['CÓDIGO', 'CODIGO'],
  [DESCRIPCION_COLUMN]: ['DESCRIPCIÓN', 'DESCRIPCION'],
  [DESCRIPCION_ADICIONAL_COLUMN]: ['DESCRIPCIÓN ADICIONAL', 'DESCRIPCION ADICIONAL'],
  [CATEGORIA_COLUMN]: ['CATEGORÍA', 'CATEGORIA', 'CATEGORÍA DE MP', 'CATEGORIA DE MP', 'CATEGORÍA DE SE', 'CATEGORIA DE SE', 'LÍNEA', 'LINEA', 'UNIDAD DE NEGOCIO', 'UNIDAD DE NEGOCIO'], // Added LÍNEA and UNIDAD DE NEGOCIO
  [STOCK_ENTRE_RIOS_COLUMN]: ['STOCK ENTRE RÍOS', 'STOCK ENTRE RIOS', 'STOCK\r\nENTRE RÍOS'],
  [STOCK_CABA_COLUMN]: ['STOCK CABA', 'STOCK\r\nCABA'],
  [STOCK_CABA_HDO_COLUMN]: ['STOCK CABA (HDO)', 'STOCK\r\nCABA (HDO)'],
  [STOCK_PLANTA_3_COLUMN]: ['STOCK PLANTA 3', 'STOCK\r\nPLANTA 3'],
  [STOCK_GENERAL_SYSTEM_COLUMN]: ['STOCK'], // Usado como fallback si otras columnas de stock específicas no están
};

// Mapeo de columnas para el inventario FÍSICO
export const PHYSICAL_INVENTORY_COLUMN_MAPPINGS = {
  [CODIGO_COLUMN]: ['CÓDIGO', 'CODIGO', 'Código'], // 'Código' from physical file logs
  [DESCRIPCION_COLUMN]: ['DESCRIPCIÓN', 'DESCRIPCION', 'DETALLE', 'PRODUCTO'], // Common alternatives for description
  [PHYSICAL_STOCK_COLUMN]: [RAW_PHYSICAL_QUANTITY_COLUMN, 'STOCK', 'STOCK FÍSICO', 'STOCK FISICO', 'CANTIDAD ACTUAL', 'EXISTENCIA'], // RAW_PHYSICAL_QUANTITY_COLUMN is 'CANTIDAD'
  // Nota: Las columnas como '__EMPTY', 'F-SGC-042' vistas en los logs del físico NO se mapean aquí
  // directamente a menos que sepamos que consistentemente contienen datos útiles como descripción o stock.
  // El filtrado de filas de metadatos se encarga de las filas que no son de datos.
  // Si las columnas reales de datos en el físico tienen nombres como '__EMPTY', deben mapearse aquí.
  // Por ahora, asumimos que los encabezados correctos (Código, Descripción, Cantidad) existen en la fila de encabezados (index 10)
  // y las filas de datos válidas usan esos encabezados.
};

// Hojas esperadas para la planilla del sistema
export const SYSTEM_SHEETS = ['MP', 'PT', 'SE'];

// Hojas esperadas para la planilla de inventario físico
export const PHYSICAL_INVENTORY_SHEETS = [
  'TINTURA MADRE',
  'COMPRIMIDOS',
  'INFUSIONES',
  'ESENCIAS SABORIZANTES',
  'COSMÉTICA',
  'ACEITES',
  'YERBA MATE',
  'VITAMINAS EXCIPIENTES',
  'TERCEROS',
  'EMBALAJE',
  'HIERBAS FRACCIONADAS',
  'HIERBAS Y OTROS A GRANEL'
];

// Prefixes in CODIGO_COLUMN of physical inventory that indicate a non-data row
export const IGNORED_CODE_PREFIXES_PHYSICAL = [
  // e.g., 'ZZ-', 'TEMP-'
].map(s => s.toUpperCase().trim());

// Values in CODIGO_COLUMN of system inventory that indicate a non-data row
export const IGNORED_CODE_VALUES_SYSTEM = [
  '-',
  'CÓDIGO',
  'CODIGO',
  'DESCRIPCIÓN',
  'DESCRIPCION',
  'TOTAL',
  'SUBTOTAL',
  // Add any other specific strings seen in the system inventory's CODIGO_COLUMN that are not actual product codes
].map(s => s.replace(/\r\n|\n|\r/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase());

// Specific constant for system stock if needed distinctly from STOCK_GENERAL_SYSTEM_COLUMN
export const STOCK_SISTEMA_COLUMN = 'STOCK SISTEMA'; // This is the key ExcelUploader is looking for.

// Configuration for SISTEMA.xlsx file processing
export const EXPECTED_SYSTEM_SHEETS = ["MP", "PT", "SE"];

// Defines column indices for each expected sheet in SISTEMA.xlsx
// Assumes sheet_to_json with { header: 1 }, so indices are 0-based for the array of rows.
// Header row is at index 0 of this array, data starts at index 1.
export const SYSTEM_SHEET_CONFIGS = {
  "MP": {
    sheetName: "MP",
    headerRowIndex: 0, // Index of the header row in the array_of_arrays
    dataStartRowIndex: 1, // Index where data rows begin in the array_of_arrays
    columns: {
      [CATEGORIA_COLUMN]: 0,         // "CATEGORÍA DE MP"
      [CODIGO_COLUMN]: 1,            // "CÓDIGO"
      [DESCRIPCION_COLUMN]: 2,       // "DESCRIPCIÓN"
      [DESCRIPCION_ADICIONAL_COLUMN]: 3, // "DESCRIPCIÓN ADICIONAL"
      [STOCK_SISTEMA_COLUMN]: 4      // "STOCK ENTRE RÍOS"
    }
  },
  "PT": {
    sheetName: "PT",
    headerRowIndex: 0,
    dataStartRowIndex: 1,
    columns: {
      // Custom keys for PT-specific fields, can be added if needed for display/logic
      // For now, we'll map them to existing generic keys if appropriate or new ones.
      // Example: 'MARCA_COLUMN': 0, 'UNIDAD_NEGOCIO_COLUMN': 1, 'LINEA_COLUMN': 2
      // Using existing CATEGORIA_COLUMN for 'MARCA' as a placeholder if no specific key exists
      // Consider adding MARCA_COLUMN, UNIDAD_NEGOCIO_COLUMN, LINEA_COLUMN to constants if they are distinct concepts.
      'MARCA': 0,                    // "MARCA"
      'UNIDAD_NEGOCIO': 1,           // "UNIDAD DE NEGOCIO"
      'LINEA': 2,                    // "LÍNEA"
      [CODIGO_COLUMN]: 3,            // "CÓDIGO"
      [DESCRIPCION_COLUMN]: 4,       // "DESCRIPCIÓN"
      [DESCRIPCION_ADICIONAL_COLUMN]: 5, // "DESCRIPCIÓN ADICIONAL"
      [STOCK_SISTEMA_COLUMN]: 6      // "STOCK ENTRE RÍOS"
    }
  },
  "SE": {
    sheetName: "SE",
    headerRowIndex: 0,
    dataStartRowIndex: 1,
    columns: {
      [CATEGORIA_COLUMN]: 0,         // "CATEGORÍA DE SE"
      [CODIGO_COLUMN]: 1,            // "CÓDIGO"
      [DESCRIPCION_COLUMN]: 2,       // "DESCRIPCIÓN"
      [DESCRIPCION_ADICIONAL_COLUMN]: 3, // "DESCRIPCIÓN ADICIONAL"
      [STOCK_SISTEMA_COLUMN]: 4      // "STOCK ENTRE RÍOS"
    }
  }
};

// Modos de tema
export const THEME_LIGHT = 'light';
export const THEME_DARK = 'dark';

// Values in CODIGO_COLUMN of physical inventory that indicate a non-data row (e.g., section titles, repeated headers)
// These are normalized (uppercase, trimmed) for comparison.
export const IGNORED_CODE_VALUES_PHYSICAL = [
  '-',
  "LÍNEA",
  "LINEA",
  "PRODUCTO TERMINADO",
  "SEMIELABORADO",
  "CATEGORÍA",
  "CATEGORIA",
  "CÓDIGO",
  "CODIGO",
  "DESCRIPCIÓN",
  "DESCRIPCION",
  "CANTIDAD",
  "OBSERVACIONES",
  "INSTRUCCIONES", // From image, this is also a non-data row label
  'PLANTA',
  'RESPONSABLE',
  'FECHA',
  // Category-like headers observed in logs
  'TINTURAS MADRE',
  'COMPRIMIDOS',
  'SAQUITOS',
  'ESENCIAS SABORIZANTES', // From sheet name, likely also a category header
  'SABORIZANTES',
  'COSMÉTICA', // From sheet name
  'CAPILAR',
  'ALCOHOL EN GEL',
  'CREMAS',
  'ACEITES',
  'YERBA MATE',
  'VITAMINAS EXCIPIENTES', // From sheet name
  'VITAMINAS',
  'TERCEROS', // From sheet name
  'EMBALAJE', // From sheet name
  'EXPEDICIÓN',
  'HIERBAS FRACCIONADAS', // From sheet name
  'X 1 KG',
  'X 1/2 KG',
  'HIERBAS Y OTROS A GRANEL', // From sheet name
  'HIERBAS',
  'MATERIA PRIMA / INSUMOS',
  'PRODUCTO TERMINADO',
  'MATERIA PRIMA',
  'INSUMOS',
  // Add any other specific strings seen in the CODIGO_COLUMN that are not actual product codes
].map(s => s.replace(/\r\n|\n|\r/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase()); // Use a simple normalize function here

// Configuration for identifying headers and mapping columns in Physical Inventory files with multiple sections
// Each key is an internal column name (e.g., CODIGO_COLUMN). 
// `expectedTexts` are the strings to look for in a header row (case-insensitive, normalized).
// `required` indicates if this header must be found for a row to be considered a valid header section.
export const PHYSICAL_HEADER_CONFIG = {
  [CATEGORIA_COLUMN]: { expectedTexts: ['categoría', 'categoria'], required: false },
  [CODIGO_COLUMN]: { expectedTexts: ['código', 'codigo'], required: true },
  [DESCRIPCION_COLUMN]: { expectedTexts: ['descripción', 'descripcion'], required: true }, // Typically required
  [DESCRIPCION_ADICIONAL_COLUMN]: { expectedTexts: ['descripción adicional', 'descripcion adicional', 'descripción\nadicional'], required: false },
  [PHYSICAL_STOCK_COLUMN]: { expectedTexts: ['cantidad'], required: true }, // This is the internal key for the parsed stock value
  [PHYSICAL_OBSERVACIONES_COLUMN]: { expectedTexts: ['observaciones'], required: false },
};

// Tipos de archivo para el uploader
export const FILE_TYPE_SYSTEM = 'system';
export const FILE_TYPE_PHYSICAL = 'fisico';

// Otras constantes que puedan surgir...
