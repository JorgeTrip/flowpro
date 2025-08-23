// 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados

import { ExcelCellValue, ExcelRow } from '@/app/stores/estimarDemandaStore';

// Tipos de datos compartidos que se exportan para ser usados en otros componentes
export interface Mapeo {
  ventas: {
    productoId: string;
    cantidad: string;
    fecha: string;
    descripcion?: string;
  };
  stock: {
    productoId: string;
    cantidad: string;
    stockReservado?: string;
    descripcion?: string;
  };
}

export type Criticidad = 'alta' | 'media' | 'baja';

export interface ResultadoItem {
  productoId: string | number;
  descripcion: string;
  venta: number;
  stock: number;
  stockReservado: number;
  stockNeto: number;
  mesesCobertura: number;
  demandaInsatisfecha: number;
  sugerencia: string;
  criticidad: Criticidad;
}

// Función de utilidad para obtener el color de fondo según la criticidad
export function getCriticalityColor(criticidad: 'alta' | 'media' | 'baja'): string {
  switch (criticidad) {
    case 'alta': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    case 'media': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    case 'baja': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    default: return 'text-gray-600 dark:text-gray-400';
  }
}

// Función interna para parsear fechas de Excel
function parseExcelDate(rawDate: ExcelCellValue): Date | null {
  if (rawDate instanceof Date) {
    return rawDate;
  }
  if (typeof rawDate === 'string') {
    const parsedDate = new Date(rawDate);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }
  if (typeof rawDate === 'number') {
    const excelDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
    if (!isNaN(excelDate.getTime())) {
      return excelDate;
    }
  }
  return null;
}

// Función principal que se exporta para realizar el análisis
export function estimarDemanda(
  ventasData: ExcelRow[],
  stockData: ExcelRow[],
  mapeo: Mapeo
): ResultadoItem[] {
  console.log("Iniciando la estimación de demanda...");

  const ventasPorMes: { [key: string]: ExcelRow[] } = {};
  ventasData.forEach((row, index) => {
    const fechaCruda = row[mapeo.ventas.fecha];
    if (index < 5) { // Log details for the first 5 rows
      console.log(`Fila ${index}: Valor de fecha cruda:`, fechaCruda, `(Tipo: ${typeof fechaCruda})`);
    }
    if (fechaCruda === null || fechaCruda === undefined) return;

    const fecha = parseExcelDate(fechaCruda);
    if (index < 5) {
      console.log(`Fila ${index}: Resultado de parseExcelDate:`, fecha);
    }

    if (!fecha) return;

    const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    if (!ventasPorMes[mesKey]) ventasPorMes[mesKey] = [];
    ventasPorMes[mesKey].push(row);
  });

  const mesesConVentas = Object.keys(ventasPorMes);
  console.log(`Se encontraron ${mesesConVentas.length} meses con ventas:`, mesesConVentas);

  if (mesesConVentas.length === 0) {
    console.warn("No se encontraron datos de ventas válidos para analizar.");
    return [];
  }

  const mesConMasVentas = mesesConVentas.reduce((a, b) =>
    ventasPorMes[a].length > ventasPorMes[b].length ? a : b
  );
  console.log(`El mes con más ventas es ${mesConMasVentas} con ${ventasPorMes[mesConMasVentas].length} registros.`);
  const datosMesSeleccionado = ventasPorMes[mesConMasVentas];

  const ventasPorProducto: { [key: string]: { cantidad: number, descripcion?: string } } = {};
  
  // Log the mapping being used for sales
  console.log('Mapeo de columnas para ventas:', {
    productoId: mapeo.ventas.productoId,
    cantidad: mapeo.ventas.cantidad,
    descripcion: mapeo.ventas.descripcion || 'No mapeada'
  });

  datosMesSeleccionado.forEach((row, index) => {
    const productoId = String(row[mapeo.ventas.productoId]);
    const cantidad = Number(row[mapeo.ventas.cantidad]);
    
    // Get description if mapping exists and value is not empty
    let descripcion = undefined;
    if (mapeo.ventas.descripcion && row[mapeo.ventas.descripcion]) {
      const rawDesc = String(row[mapeo.ventas.descripcion]).trim();
      descripcion = rawDesc !== '' ? rawDesc : undefined;
    }
    
    if (index < 5) { // Log details for the first 5 rows of the selected month
        console.log(`Fila de venta ${index}:`);
        console.log(`- ID Producto: '${productoId}'`);
        console.log(`- Cantidad: '${row[mapeo.ventas.cantidad]}' (convertido a ${cantidad})`);
        console.log(`- Descripción mapeada: '${mapeo.ventas.descripcion || 'No mapeada'}'`);
        console.log(`- Valor de descripción: '${descripcion || 'VACÍA/NULA'}'`);
    }

    if (productoId && !isNaN(cantidad)) {
      if (!ventasPorProducto[productoId]) {
        ventasPorProducto[productoId] = { 
          cantidad: 0, 
          descripcion: descripcion
        };
      } else {
        // Solo actualizar la descripción si no está vacía y no hay una descripción previa
        if (!ventasPorProducto[productoId].descripcion && descripcion) {
          ventasPorProducto[productoId].descripcion = descripcion;
        }
      }
      ventasPorProducto[productoId].cantidad += cantidad;
    }
  });

  console.log(`Se agruparon ${Object.keys(ventasPorProducto).length} productos únicos del mes seleccionado.`);

  // Log the mapping being used for stock
  console.log('Mapeo de columnas para stock:', {
    productoId: mapeo.stock.productoId,
    cantidad: mapeo.stock.cantidad,
    stockReservado: mapeo.stock.stockReservado || 'No mapeado',
    descripcion: mapeo.stock.descripcion || 'No mapeada'
  });

  const stockPorProducto: { [key: string]: { cantidad: number, stockReservado: number, descripcion?: string } } = {};
  stockData.forEach((row, index) => {
    const productoId = String(row[mapeo.stock.productoId]);
    const cantidad = Number(row[mapeo.stock.cantidad]);
    const stockReservado = Number(mapeo.stock.stockReservado ? (row[mapeo.stock.stockReservado] || 0) : 0);
    
    // Get description if mapping exists and value is not empty
    let descripcion = undefined;
    if (mapeo.stock.descripcion && row[mapeo.stock.descripcion]) {
      const rawDesc = String(row[mapeo.stock.descripcion]).trim();
      descripcion = rawDesc !== '' ? rawDesc : undefined;
    }
    
    if (index < 3) { // Log details for the first 3 rows of stock
        console.log(`Fila de stock ${index}:`);
        console.log(`- ID Producto: '${productoId}'`);
        console.log(`- Cantidad: '${cantidad}'`);
        console.log(`- Stock reservado: '${stockReservado}'`);
        console.log(`- Descripción mapeada: '${mapeo.stock.descripcion || 'No mapeada'}'`);
        console.log(`- Valor RAW de descripción: '${mapeo.stock.descripcion ? row[mapeo.stock.descripcion] : 'NO_COLUMN'}'`);
        console.log(`- Tipo de valor RAW: '${mapeo.stock.descripcion ? typeof row[mapeo.stock.descripcion] : 'N/A'}'`);
        console.log(`- Valor procesado de descripción: '${descripcion || 'VACÍA/NULA'}'`);
        console.log(`- Todas las columnas de esta fila:`, Object.keys(row));
    }
    
    if (productoId && !isNaN(cantidad)) {
      if (!stockPorProducto[productoId]) {
        stockPorProducto[productoId] = {
          cantidad: 0,
          stockReservado: 0,
          descripcion: descripcion
        };
      }
      stockPorProducto[productoId].cantidad += cantidad;
      stockPorProducto[productoId].stockReservado += stockReservado;
      
      // Solo actualizar la descripción si no está vacía y no hay una descripción previa
      if (!stockPorProducto[productoId].descripcion && descripcion) {
        stockPorProducto[productoId].descripcion = descripcion;
      }
    }
  });

  const resultados: ResultadoItem[] = Object.keys(ventasPorProducto).map(productoId => {
    const ventaInfo = ventasPorProducto[productoId];
    const stockInfo = stockPorProducto[productoId];
    const stockDisponible = stockInfo ? stockInfo.cantidad : 0;
    const stockReservado = stockInfo ? stockInfo.stockReservado : 0;
    const stockNeto = Math.max(0, stockDisponible - stockReservado);
    // Las ventas son negativas, las devoluciones positivas. La venta neta es el valor absoluto de la suma.
    const ventaMensual = Math.abs(ventaInfo.cantidad);
    const mesesCobertura = ventaMensual > 0 ? stockNeto / ventaMensual : 999;

    let criticidad: 'alta' | 'media' | 'baja';
    if (mesesCobertura < 4) criticidad = 'alta';
    else if (mesesCobertura === 4) criticidad = 'media';
    else criticidad = 'baja';

    const demandaInsatisfecha = Math.max(0, (ventaMensual * 4) - stockNeto);
    const sugerencia = demandaInsatisfecha > 0
      ? `Comprar ${Math.ceil(demandaInsatisfecha)} unidades para 4 meses de cobertura.`
      : 'Stock adecuado.';

    // Determinar la mejor descripción disponible
    const descripcionFinal = ventaInfo.descripcion || stockInfo?.descripcion || 'Sin descripción';
    
    // Log para depuración si no hay descripción
    if (!ventaInfo.descripcion && !stockInfo?.descripcion) {
      console.warn(`Producto ${productoId} sin descripción en ambos archivos`);
    }
    
    return {
      productoId: productoId,
      descripcion: descripcionFinal,
      venta: ventaMensual,
      stock: stockDisponible,
      stockReservado: stockReservado,
      stockNeto: stockNeto,
      mesesCobertura: Math.round(mesesCobertura),
      demandaInsatisfecha: Math.ceil(demandaInsatisfecha),
      sugerencia: sugerencia,
      criticidad: criticidad,
    };
  });

  console.log(`Análisis finalizado. Se generaron ${resultados.length} resultados.`);
  return resultados.sort((a, b) => a.mesesCobertura - b.mesesCobertura);
}
