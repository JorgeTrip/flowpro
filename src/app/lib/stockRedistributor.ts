// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
import { ExcelRow } from '@/app/stores/redistribucionStockStore';

interface MapeoRedistribucion {
  productoId: string;
  descripcion?: string;
  stockCABAMateriaPrima: string;
  stockCABAProductoTerminado: string;
  stockEntreRiosMateriaPrima: string;
  stockEntreRiosProductoTerminado: string;
  rotacionMensual: string;
}

interface ResultadoRedistribucion {
  productoId: string | number;
  descripcion: string;
  stockCABATotal: number;
  stockEntreRiosTotal: number;
  rotacionMensual: number;
  accion: 'Pedir a Entre Ríos' | 'Sin stock disponible' | 'Stock suficiente';
  cantidadSugerida: number;
  criticidad: 'alta' | 'media' | 'baja';
}

export function redistribuirStock(
  stockData: ExcelRow[],
  mapeo: MapeoRedistribucion
): ResultadoRedistribucion[] {
  const resultados: ResultadoRedistribucion[] = [];

  for (const fila of stockData) {
    const productoId = fila[mapeo.productoId];
    if (!productoId) continue;

    
    const descripcion = mapeo.descripcion && mapeo.descripcion.trim() && fila[mapeo.descripcion] 
      ? String(fila[mapeo.descripcion]) 
      : String(productoId);
    
    // Obtener valores de stock CABA
    const stockCABAMP = Number(fila[mapeo.stockCABAMateriaPrima] || 0);
    const stockCABAPT = Number(fila[mapeo.stockCABAProductoTerminado] || 0);
    const stockCABATotal = stockCABAMP + stockCABAPT;
    
    // Obtener valores de stock Entre Ríos
    const stockEntreRiosMP = Number(fila[mapeo.stockEntreRiosMateriaPrima] || 0);
    const stockEntreRiosPT = Number(fila[mapeo.stockEntreRiosProductoTerminado] || 0);
    const stockEntreRiosTotal = stockEntreRiosMP + stockEntreRiosPT;
    
    // Obtener rotación mensual
    const rotacionMensual = Number(fila[mapeo.rotacionMensual] || 0);
    
    // Lógica de redistribución
    let accion: 'Pedir a Entre Ríos' | 'Sin stock disponible' | 'Stock suficiente';
    let cantidadSugerida = 0;
    let criticidad: 'alta' | 'media' | 'baja';
    
    if (stockCABATotal < rotacionMensual) {
      // Necesita stock
      const faltante = rotacionMensual - stockCABATotal;
      
      if (stockEntreRiosTotal > 0) {
        accion = 'Pedir a Entre Ríos';
        cantidadSugerida = Math.min(faltante, stockEntreRiosTotal);
        
        // Determinar criticidad basada en el déficit
        const porcentajeDeficit = (faltante / rotacionMensual) * 100;
        if (porcentajeDeficit >= 75) {
          criticidad = 'alta';
        } else if (porcentajeDeficit >= 50) {
          criticidad = 'media';
        } else {
          criticidad = 'baja';
        }
      } else {
        accion = 'Sin stock disponible';
        cantidadSugerida = 0;
        criticidad = 'alta';
      }
    } else {
      accion = 'Stock suficiente';
      cantidadSugerida = 0;
      criticidad = 'baja';
    }

    resultados.push({
      productoId: String(productoId),
      descripcion,
      stockCABATotal,
      stockEntreRiosTotal,
      rotacionMensual,
      accion,
      cantidadSugerida,
      criticidad
    });
  }

  // Ordenar por criticidad y luego por cantidad sugerida
  return resultados.sort((a, b) => {
    const criticidadOrder = { alta: 3, media: 2, baja: 1 };
    const criticidadDiff = criticidadOrder[b.criticidad] - criticidadOrder[a.criticidad];
    if (criticidadDiff !== 0) return criticidadDiff;
    return b.cantidadSugerida - a.cantidadSugerida;
  });
}
