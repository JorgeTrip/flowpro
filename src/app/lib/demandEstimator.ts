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

export function estimarDemanda(
  ventasData: ExcelRow[],
  stockData: ExcelRow[],
  mapeo: Mapeo
): ResultadoItem[] {
  // 1. Encontrar el mes con más ventas
  const ventasPorMes = new Map<string, { totalVentas: number, data: ExcelRow[] }>();
  ventasData.forEach(row => {
    const fechaStr = row[mapeo.ventas.fecha];
    const cantidad = Number(row[mapeo.ventas.cantidad]) || 0;
    if (fechaStr && cantidad > 0) {
      try {
        const fecha = new Date(fechaStr);
        if (isNaN(fecha.getTime())) return; // Ignorar fechas inválidas
        const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        
        const mesData = ventasPorMes.get(mesKey) || { totalVentas: 0, data: [] };
        mesData.totalVentas += cantidad;
        mesData.data.push(row);
        ventasPorMes.set(mesKey, mesData);
      } catch (e) {
        console.warn(`Formato de fecha inválido: ${fechaStr}`);
      }
    }
  });

  let mejorMesData: ExcelRow[] = [];
  let maxVentas = 0;
  ventasPorMes.forEach(({ totalVentas, data }) => {
    if (totalVentas > maxVentas) {
      maxVentas = totalVentas;
      mejorMesData = data;
    }
  });

  // Si no hay datos de ventas válidos, usar todos los datos
  const datosVentasAnalizar = mejorMesData.length > 0 ? mejorMesData : ventasData;
  // Crear mapas para stock y descripciones
  const stockMap = new Map<string | number, { stock: number; stockReservado: number; descripcion: string }>();
  
  stockData.forEach(row => {
    const productoId = row[mapeo.stock.productoId];
    const stock = Number(row[mapeo.stock.cantidad]) || 0;
    const stockReservado = mapeo.stock.stockReservado ? Number(row[mapeo.stock.stockReservado]) || 0 : 0;
    const descripcion = mapeo.stock.descripcion ? String(row[mapeo.stock.descripcion] || '') : '';
    
    if (productoId) {
      stockMap.set(productoId, { stock, stockReservado, descripcion });
    }
  });

  // 2. Agrupar ventas del mejor mes por producto
  const ventasMap = new Map<string | number, { venta: number; descripcion: string }>();
  
  datosVentasAnalizar.forEach(row => {
    const productoId = row[mapeo.ventas.productoId];
    const cantidad = Number(row[mapeo.ventas.cantidad]) || 0;
    const descripcion = mapeo.ventas.descripcion ? String(row[mapeo.ventas.descripcion] || '') : '';
    
    if (productoId && cantidad > 0) {
      const existing = ventasMap.get(productoId);
      ventasMap.set(productoId, {
        venta: (existing?.venta || 0) + cantidad,
        descripcion: descripcion || existing?.descripcion || ''
      });
    }
  });

  const resultados: ResultadoItem[] = [];

  // Procesar cada producto
  ventasMap.forEach(({ venta, descripcion: ventaDescripcion }, productoId) => {
    const stockInfo = stockMap.get(productoId);
    const stock = stockInfo?.stock || 0;
    const stockReservado = stockInfo?.stockReservado || 0;
    const stockNeto = Math.max(0, stock - stockReservado);
    const descripcion = stockInfo?.descripcion || ventaDescripcion || `Producto ${productoId}`;
    
    // La 'venta' ya es la venta mensual porque filtramos por el mejor mes
    const ventaMensual = venta;
    
    // Calcular meses de cobertura
    const mesesCobertura = ventaMensual > 0 ? Math.round(stockNeto / ventaMensual) : 999;
    
    // Determinar criticidad basada en el umbral de 4 meses
    let criticidad: 'alta' | 'media' | 'baja';
    if (mesesCobertura < 4) {
      criticidad = 'alta';
    } else if (mesesCobertura === 4) {
      criticidad = 'media';
    } else {
      criticidad = 'baja';
    }
    
    // Calcular demanda insatisfecha basada en stock neto
    const demandaInsatisfecha = Math.max(0, ventaMensual * 4 - stockNeto);
    
    // Generar sugerencia
    let sugerencia = '';
    if (mesesCobertura < 4) {
      const faltante = Math.ceil(ventaMensual * 4 - stockNeto);
      sugerencia = `CRÍTICO: Comprar ${faltante} unidades. Stock para ${mesesCobertura} meses.`;
    } else if (mesesCobertura === 4) {
      sugerencia = `ATENCIÓN: Stock justo para 4 meses. Monitorear.`;
    } else if (mesesCobertura > 12) {
      sugerencia = `Exceso de stock. Stock para ${mesesCobertura} meses.`;
    } else {
      sugerencia = `Stock adecuado para ${mesesCobertura} meses.`;
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

  // Ordenar por criticidad (más crítico primero)
  return resultados.sort((a, b) => {
    if (a.criticidad !== b.criticidad) {
      const orden = { 'alta': 0, 'media': 1, 'baja': 2 };
      return orden[a.criticidad] - orden[b.criticidad];
    }
    return a.mesesCobertura - b.mesesCobertura;
  });
}
