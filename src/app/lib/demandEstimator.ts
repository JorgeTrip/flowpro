// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados

import { ExcelRow } from '@/app/stores/estimarDemandaStore';

// Función auxiliar para obtener el color según la criticidad
export function getCriticalityColor(criticidad: 'alta' | 'media' | 'baja'): string {
  switch (criticidad) {
    case 'alta': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    case 'media': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    case 'baja': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    default: return 'text-gray-600 dark:text-gray-400';
  }
}

interface Mapeo {
  ventas: { productoId: string; cantidad: string; fecha: string; descripcion?: string };
  stock: { productoId: string; cantidad: string; stockReservado?: string; descripcion?: string };
}

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
  criticidad: 'alta' | 'media' | 'baja';
}

// Función para parsear fechas de Excel (numéricas o string)
function parseExcelDate(value: any): Date | null {
  if (!value) return null;

  // Si es un número (formato de fecha serial de Excel)
  if (typeof value === 'number') {
    // Excel para Windows cuenta los días desde el 30/12/1899
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Si es un string
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Si ya es un objeto Date
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }

  return null;
}

export function estimarDemanda(
  ventasData: ExcelRow[],
  stockData: ExcelRow[],
  mapeo: Mapeo
): ResultadoItem[] {
  
  // 1. Agrupar ventas por mes y encontrar el mes con más ventas
  const ventasPorMes = new Map<string, { totalVentas: number, data: ExcelRow[] }>();
  
  ventasData.forEach(row => {
    const fechaCruda = row[mapeo.ventas.fecha];
    const fecha = parseExcelDate(fechaCruda);

    if (!fecha) {
      // Opcional: loguear solo una vez para no llenar la consola
      // console.warn(`Formato de fecha no reconocido: ${fechaCruda}`);
      return;
    }
    
    const cantidad = Number(row[mapeo.ventas.cantidad]) || 0;
    if (cantidad > 0) {
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      const mesData = ventasPorMes.get(mesKey) || { totalVentas: 0, data: [] };
      mesData.totalVentas += cantidad;
      mesData.data.push(row);
      ventasPorMes.set(mesKey, mesData);
    }
  });

  console.log(`Se encontraron ${ventasPorMes.size} meses con ventas.`);

  // Encontrar el mejor mes
  let mejorMesData: ExcelRow[] = [];
  let maxVentas = 0;
  ventasPorMes.forEach(({ totalVentas, data }, mes) => {
    console.log(`Mes: ${mes}, Ventas: ${totalVentas}`);
    if (totalVentas > maxVentas) {
      maxVentas = totalVentas;
      mejorMesData = data;
    }
  });

  console.log(`El mejor mes tuvo ${maxVentas} ventas. Usando ${mejorMesData.length} registros para el análisis.`);

  const datosVentasAnalizar = mejorMesData;

  if (datosVentasAnalizar.length === 0) {
    console.warn("No se encontraron datos de ventas válidos para analizar después de agrupar por mes.");
    return []; // Retornar vacío si no hay datos para el mejor mes
  }

  // 2. Mapear stock
  const stockMap = new Map<string | number, { stock: number; stockReservado: number; descripcion: string }>();
  stockData.forEach(row => {
    const productoId = row[mapeo.stock.productoId];
    if (productoId) {
      stockMap.set(productoId, {
        stock: Number(row[mapeo.stock.cantidad]) || 0,
        stockReservado: mapeo.stock.stockReservado ? Number(row[mapeo.stock.stockReservado]) || 0 : 0,
        descripcion: mapeo.stock.descripcion ? String(row[mapeo.stock.descripcion] || '') : ''
      });
    }
  });

  // 3. Agrupar ventas del mejor mes por producto
  const ventasMap = new Map<string | number, { venta: number; descripcion: string }>();
  datosVentasAnalizar.forEach(row => {
    const productoId = row[mapeo.ventas.productoId];
    if (productoId) {
      const cantidad = Number(row[mapeo.ventas.cantidad]) || 0;
      const existing = ventasMap.get(productoId) || { venta: 0, descripcion: '' };
      ventasMap.set(productoId, {
        venta: existing.venta + cantidad,
        descripcion: (mapeo.ventas.descripcion ? String(row[mapeo.ventas.descripcion] || '') : '') || existing.descripcion
      });
    }
  });

  // 4. Procesar resultados
  const resultados: ResultadoItem[] = [];
  ventasMap.forEach(({ venta, descripcion: ventaDescripcion }, productoId) => {
    const stockInfo = stockMap.get(productoId);
    const stock = stockInfo?.stock || 0;
    const stockReservado = stockInfo?.stockReservado || 0;
    const stockNeto = Math.max(0, stock - stockReservado);
    const descripcion = stockInfo?.descripcion || ventaDescripcion || `Producto ${productoId}`;
    
    const ventaMensual = venta;
    const mesesCobertura = ventaMensual > 0 ? Math.round(stockNeto / ventaMensual) : 999;
    
    let criticidad: 'alta' | 'media' | 'baja';
    if (mesesCobertura < 4) criticidad = 'alta';
    else if (mesesCobertura === 4) criticidad = 'media';
    else criticidad = 'baja';
    
    const demandaInsatisfecha = Math.max(0, ventaMensual * 4 - stockNeto);
    
    let sugerencia = '';
    if (criticidad === 'alta') {
      sugerencia = `CRÍTICO: Comprar ${Math.ceil(demandaInsatisfecha)} unidades. Cobertura para ${mesesCobertura} meses.`;
    } else if (criticidad === 'media') {
      sugerencia = `ATENCIÓN: Stock justo para 4 meses. Monitorear.`;
    } else if (mesesCobertura > 12) {
      sugerencia = `Exceso de stock. Cobertura para ${mesesCobertura} meses.`;
    } else {
      sugerencia = `Stock adecuado. Cobertura para ${mesesCobertura} meses.`;
    }

    resultados.push({
      productoId,
      descripcion,
      venta: Math.round(venta),
      stock,
      stockReservado,
      stockNeto,
      mesesCobertura,
      demandaInsatisfecha: Math.round(demandaInsatisfecha),
      sugerencia,
      criticidad,
    });
  });

  // 5. Ordenar resultados
  return resultados.sort((a, b) => {
    const orden = { 'alta': 0, 'media': 1, 'baja': 2 };
    if (a.criticidad !== b.criticidad) {
      return orden[a.criticidad] - orden[b.criticidad];
    }
    return a.mesesCobertura - b.mesesCobertura;
  });
}
