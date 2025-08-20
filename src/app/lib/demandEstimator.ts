// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados

import { ExcelRow } from '@/app/stores/estimarDemandaStore';

interface Mapeo {
  ventas: { productoId: string; cantidad: string };
  stock: { productoId: string; cantidad: string };
}

export interface ResultadoItem {
  productoId: string | number;
  venta: number;
  stock: number;
  demandaInsatisfecha: number;
  sugerencia: string;
}

export function estimarDemanda(
  ventasData: ExcelRow[],
  stockData: ExcelRow[],
  mapeo: Mapeo
): ResultadoItem[] {
  const stockMap = new Map<string | number, number>();
  stockData.forEach(row => {
    const productoId = row[mapeo.stock.productoId];
    const cantidad = Number(row[mapeo.stock.cantidad]);
    if (productoId && !isNaN(cantidad)) {
      stockMap.set(productoId, cantidad);
    }
  });

  const resultados: ResultadoItem[] = [];

  ventasData.forEach(row => {
    const productoId = row[mapeo.ventas.productoId];
    const venta = Number(row[mapeo.ventas.cantidad]);

    if (productoId && !isNaN(venta)) {
      const stock = stockMap.get(productoId) ?? 0;
      const demandaInsatisfecha = Math.max(0, venta - stock);

      let sugerencia = 'Stock suficiente.';
      if (demandaInsatisfecha > 0) {
        sugerencia = `Se recomienda comprar ${demandaInsatisfecha} unidades para cubrir la demanda.`;
      } else if (stock > venta * 1.2) { // Example: if stock is 20% higher than sales
        sugerencia = 'Posible exceso de stock. Considerar reducir compra.';
      }

      resultados.push({
        productoId,
        venta,
        stock,
        demandaInsatisfecha,
        sugerencia,
      });
    }
  });

  return resultados;
}
