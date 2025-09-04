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
    deposito: string;
    stockReservado?: string;
    descripcion?: string;
  };
}

export type Criticidad = 'alta' | 'media' | 'baja';

export interface ResultadoItem {
  productoId: string | number;
  descripcion: string;
  venta: number;
  stockCABA: number;
  stockReservadoCABA: number;
  stockNetoCABA: number;
  stockEntreRios: number;
  mesesCobertura: number;
  demandaInsatisfecha: number;
  pedirAEntreRios: string;
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
    deposito: mapeo.stock.deposito,
    stockReservado: mapeo.stock.stockReservado || 'No mapeado',
    descripcion: mapeo.stock.descripcion || 'No mapeada'
  });

  const stockPorProducto: { [key: string]: { 
    stockCABA: number, 
    stockReservadoCABA: number, 
    stockEntreRios: number, 
    descripcion?: string 
  } } = {};
  
  stockData.forEach((row, index) => {
    const productoId = String(row[mapeo.stock.productoId]);
    const cantidad = Number(row[mapeo.stock.cantidad]);
    const deposito = String(row[mapeo.stock.deposito]).toLowerCase().trim();
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
        console.log(`- Depósito: '${deposito}'`);
        console.log(`- Stock reservado: '${stockReservado}'`);
        console.log(`- Descripción mapeada: '${mapeo.stock.descripcion || 'No mapeada'}'`);
        console.log(`- Valor procesado de descripción: '${descripcion || 'VACÍA/NULA'}'`);
    }
    
    if (productoId && !isNaN(cantidad)) {
      if (!stockPorProducto[productoId]) {
        stockPorProducto[productoId] = {
          stockCABA: 0,
          stockReservadoCABA: 0,
          stockEntreRios: 0,
          descripcion: descripcion
        };
      }
      
      // Determinar si es CABA o Entre Ríos basado en el valor del depósito
      const esCABA = deposito.includes('caba') || deposito.includes('capital') || deposito.includes('buenos aires');
      const esEntreRios = deposito.includes('entre') && (deposito.includes('rios') || deposito.includes('ríos'));
      
      if (esCABA) {
        stockPorProducto[productoId].stockCABA += cantidad;
        stockPorProducto[productoId].stockReservadoCABA += stockReservado;
      } else if (esEntreRios) {
        stockPorProducto[productoId].stockEntreRios += cantidad;
      } else {
        // Cualquier otro depósito es ignorado y no forma parte del cálculo
        console.warn(`Depósito '${deposito}' para producto ${productoId} no es CABA ni Entre Ríos. Ignorando registro.`);
        return; // Salir del forEach para este registro
      }
      
      // Solo actualizar la descripción si no está vacía y no hay una descripción previa
      if (!stockPorProducto[productoId].descripcion && descripcion) {
        stockPorProducto[productoId].descripcion = descripcion;
      }
    }
  });

  const resultados: ResultadoItem[] = Object.keys(ventasPorProducto).map(productoId => {
    const ventaInfo = ventasPorProducto[productoId];
    const stockInfo = stockPorProducto[productoId];
    
    const stockCABA = stockInfo ? stockInfo.stockCABA : 0;
    const stockReservadoCABA = stockInfo ? stockInfo.stockReservadoCABA : 0;
    const stockNetoCABA = Math.max(0, stockCABA - stockReservadoCABA);
    const stockEntreRios = stockInfo ? stockInfo.stockEntreRios : 0;
    
    // Las ventas son negativas, las devoluciones positivas. La venta neta es el valor absoluto de la suma.
    const ventaMensual = Math.abs(ventaInfo.cantidad);
    const mesesCoberturaCABA = ventaMensual > 0 ? stockNetoCABA / ventaMensual : 999;

    // Calcular criticidad y lógica de pedido a Entre Ríos
    let criticidad: 'alta' | 'media' | 'baja';
    let pedirAEntreRios: string;
    let sugerencia: string;
    
    if (mesesCoberturaCABA >= 4) {
      // Stock de CABA suficiente
      criticidad = 'baja';
      pedirAEntreRios = 'No necesario';
      sugerencia = 'Stock CABA adecuado.';
    } else {
      // Stock de CABA insuficiente, verificar Entre Ríos
      const demandaInsatisfecha = Math.max(0, (ventaMensual * 4) - stockNetoCABA);
      const stockEntreRiosParaTresMeses = ventaMensual * 3;
      
      if (stockEntreRios >= stockEntreRiosParaTresMeses) {
        // Hay stock suficiente en Entre Ríos
        criticidad = 'media';
        const cantidadAPedir = Math.min(demandaInsatisfecha, stockEntreRios);
        pedirAEntreRios = `${Math.ceil(cantidadAPedir)} unidades`;
        sugerencia = `Pedir ${Math.ceil(cantidadAPedir)} unidades de Entre Ríos para completar 4 meses de cobertura.`;
      } else if (stockEntreRios > 0) {
        // Hay algo de stock en Entre Ríos pero no suficiente
        criticidad = 'alta';
        pedirAEntreRios = `${stockEntreRios} unidades (insuficiente)`;
        const faltante = demandaInsatisfecha - stockEntreRios;
        sugerencia = `Pedir ${stockEntreRios} unidades de Entre Ríos y comprar ${Math.ceil(faltante)} unidades adicionales.`;
      } else {
        // No hay stock en Entre Ríos
        criticidad = 'alta';
        pedirAEntreRios = 'Sin stock disponible en ambos';
        sugerencia = `Comprar ${Math.ceil(demandaInsatisfecha)} unidades para 4 meses de cobertura.`;
      }
    }

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
      stockCABA: stockCABA,
      stockReservadoCABA: stockReservadoCABA,
      stockNetoCABA: stockNetoCABA,
      stockEntreRios: stockEntreRios,
      mesesCobertura: Math.round(mesesCoberturaCABA),
      demandaInsatisfecha: Math.max(0, (ventaMensual * 4) - stockNetoCABA),
      pedirAEntreRios: pedirAEntreRios,
      sugerencia: sugerencia,
      criticidad: criticidad,
    };
  });

  console.log(`Análisis finalizado. Se generaron ${resultados.length} resultados.`);
  
  // Ordenar por criticidad (alta primero) y luego por meses de cobertura
  return resultados.sort((a, b) => {
    const criticalityOrder = { 'alta': 0, 'media': 1, 'baja': 2 };
    const aCriticality = criticalityOrder[a.criticidad];
    const bCriticality = criticalityOrder[b.criticidad];
    
    if (aCriticality !== bCriticality) {
      return aCriticality - bCriticality;
    }
    
    return a.mesesCobertura - b.mesesCobertura;
  });
}
