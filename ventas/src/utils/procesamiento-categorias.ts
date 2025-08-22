import { Venta } from '../types/Venta';

// Constantes comunes
const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Mapeo de categorías según el código de artículo
const categorias: Record<string, string> = {
  '13': 'ACEITE DE OLIVA',
  '01': 'ACEITE ESENCIAL',
  '22': 'ACEITE OLIVA/ACETO', // Combinamos ambas categorías ya que comparten código
  '03': 'AZUCAR',
  '21': 'BLEND',
  '04': 'CARAMELOS',
  '05': 'COSMETICA',
  '06': 'EDULCORANTE',
  '24': 'GIN TONIC',
  '07': 'HIERBAS FRACCIONADA',
  '08': 'INFUSIONES',
  '09': 'JALEA - PROPOLEO',
  '10': 'LEVADURA',
  '20': 'LINEA MUJERES',
  '11': 'MERMELADA',
  '12': 'MIEL',
  '16': 'S. FRASCO',
  '14': 'SAHUMERIO',
  '15': 'SALSA DE SOJA',
  '17': 'TINTURA MADRE',
  '02': 'TM ANDINO',
  '18': 'VARIOS',
  '19': 'YERBA MATE'
};

/**
 * Obtiene el índice del mes a partir de una fecha
 */
function obtenerIndiceMes(fecha: string): number {
  let mesIdx = -1;
  if (typeof fecha === 'string' && fecha.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [dd, mm, yyyy] = fecha.split('/');
    mesIdx = parseInt(mm, 10) - 1;
  } else {
    const fechaObj = new Date(fecha);
    mesIdx = fechaObj.getMonth();
  }
  return mesIdx;
}

/**
 * Obtiene la categoría de un artículo según su código
 */
function obtenerCategoria(codigoArticulo: string): string {
  if (!codigoArticulo) return 'OTROS';
  
  // Intentar extraer los primeros 2 dígitos del código
  let prefijo = '';
  
  // Buscar el patrón de 2 dígitos al inicio del código
  const match = codigoArticulo.match(/^(\d{2})/i);
  if (match && match[1]) {
    prefijo = match[1];
  } else {
    // Si no hay 2 dígitos al inicio, intentar extraer los primeros 2 caracteres
    prefijo = codigoArticulo.substring(0, 2);
  }
  
  return categorias[prefijo] || 'OTROS';
}

/**
 * Top N productos más vendidos por categoría (por cantidad)
 * filtroMes = 'todos' | 'conDatos' | mes específico (ej: 'Enero')
 * mesesConDatos = array de meses que tienen datos (usado cuando filtroMes = 'conDatos')
 * topPorCategoria = número de productos a mostrar por categoría
 */
export function topProductosPorCategoria(
  ventas: Venta[], 
  topPorCategoria: number = 5,
  filtroMes: string = 'todos',
  mesesConDatos: string[] = []
) {
  // Determinar qué ventas filtrar según el mes seleccionado
  const ventasFiltradas = ventas.filter(v => {
    // Si no hay filtro de mes, incluir todas las ventas
    if (filtroMes === 'todos') return true;
    
    // Obtener el mes de la venta
    let mesVenta = '';
    if (typeof v.Fecha === 'string' && v.Fecha.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [dd, mm, yyyy] = v.Fecha.split('/');
      const mesIdx = parseInt(mm, 10) - 1;
      mesVenta = meses[mesIdx] || '';
    } else {
      const fecha = new Date(v.Fecha);
      mesVenta = meses[fecha.getMonth()] || '';
    }
    
    // Filtrar según el tipo de filtro
    if (filtroMes === 'conDatos') {
      return mesesConDatos.includes(mesVenta);
    } else {
      // Filtro por mes específico
      return mesVenta === filtroMes;
    }
  });

  // Agrupar por categoría y luego por artículo
  const categoriaMap: Record<string, {
    totalCategoria: number,
    cantidadCategoria: number,
    productos: Record<string, {
      articulo: string,
      descripcion: string,
      cantidad: number,
      total: number
    }>
  }> = {};

  // Procesar cada venta
  ventasFiltradas.forEach(v => {
    if (!v.Articulo) return;
    
    // Obtener categoría del artículo
    const categoria = obtenerCategoria(v.Articulo);
    
    // Inicializar categoría si no existe
    if (!categoriaMap[categoria]) {
      categoriaMap[categoria] = {
        totalCategoria: 0,
        cantidadCategoria: 0,
        productos: {}
      };
    }
    
    // Inicializar producto si no existe
    if (!categoriaMap[categoria].productos[v.Articulo]) {
      categoriaMap[categoria].productos[v.Articulo] = {
        articulo: v.Articulo,
        descripcion: v.Descripcion,
        cantidad: 0,
        total: 0
      };
    }
    
    // Sumar cantidad y total
    const importe = v.NroComprobante.startsWith('A') ? v.TotalCIVA : v.Total;
    categoriaMap[categoria].productos[v.Articulo].cantidad += v.Cantidad;
    categoriaMap[categoria].productos[v.Articulo].total += importe;
    
    // Actualizar totales de la categoría
    categoriaMap[categoria].cantidadCategoria += v.Cantidad;
    categoriaMap[categoria].totalCategoria += importe;
  });

  // Convertir a array y ordenar categorías por total
  const resultado = Object.entries(categoriaMap)
    .filter(([categoria, _]) => categoria !== 'OTROS') // Filtrar la categoría OTROS
    .map(([categoria, data]) => {
      // Convertir productos a array y ordenar por cantidad
      const productosArray = Object.values(data.productos)
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, topPorCategoria);
      
      return {
        categoria,
        totalCategoria: data.totalCategoria,
        cantidadCategoria: data.cantidadCategoria,
        productos: productosArray
      };
    })
    .sort((a, b) => b.cantidadCategoria - a.cantidadCategoria);

  return resultado;
}

/**
 * Top N productos más vendidos por categoría (por importe)
 * filtroMes = 'todos' | 'conDatos' | mes específico (ej: 'Enero')
 * mesesConDatos = array de meses que tienen datos (usado cuando filtroMes = 'conDatos')
 * topPorCategoria = número de productos a mostrar por categoría
 */
export function topProductosPorCategoriaImporte(
  ventas: Venta[], 
  topPorCategoria: number = 5,
  filtroMes: string = 'todos',
  mesesConDatos: string[] = []
) {
  // Determinar qué ventas filtrar según el mes seleccionado
  const ventasFiltradas = ventas.filter(v => {
    // Si no hay filtro de mes, incluir todas las ventas
    if (filtroMes === 'todos') return true;
    
    // Obtener el mes de la venta
    let mesVenta = '';
    if (typeof v.Fecha === 'string' && v.Fecha.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [dd, mm, yyyy] = v.Fecha.split('/');
      const mesIdx = parseInt(mm, 10) - 1;
      mesVenta = meses[mesIdx] || '';
    } else {
      const fecha = new Date(v.Fecha);
      mesVenta = meses[fecha.getMonth()] || '';
    }
    
    // Filtrar según el tipo de filtro
    if (filtroMes === 'conDatos') {
      return mesesConDatos.includes(mesVenta);
    } else {
      // Filtro por mes específico
      return mesVenta === filtroMes;
    }
  });

  // Agrupar por categoría y luego por artículo
  const categoriaMap: Record<string, {
    totalCategoria: number,
    cantidadCategoria: number,
    productos: Record<string, {
      articulo: string,
      descripcion: string,
      cantidad: number,
      total: number
    }>
  }> = {};

  // Procesar cada venta
  ventasFiltradas.forEach(v => {
    if (!v.Articulo) return;
    
    // Obtener categoría del artículo
    const categoria = obtenerCategoria(v.Articulo);
    
    // Inicializar categoría si no existe
    if (!categoriaMap[categoria]) {
      categoriaMap[categoria] = {
        totalCategoria: 0,
        cantidadCategoria: 0,
        productos: {}
      };
    }
    
    // Inicializar producto si no existe
    if (!categoriaMap[categoria].productos[v.Articulo]) {
      categoriaMap[categoria].productos[v.Articulo] = {
        articulo: v.Articulo,
        descripcion: v.Descripcion,
        cantidad: 0,
        total: 0
      };
    }
    
    // Sumar cantidad y total
    const importe = v.NroComprobante.startsWith('A') ? v.TotalCIVA : v.Total;
    categoriaMap[categoria].productos[v.Articulo].cantidad += v.Cantidad;
    categoriaMap[categoria].productos[v.Articulo].total += importe;
    
    // Actualizar totales de la categoría
    categoriaMap[categoria].cantidadCategoria += v.Cantidad;
    categoriaMap[categoria].totalCategoria += importe;
  });

  // Convertir a array y ordenar categorías por importe total
  const resultado = Object.entries(categoriaMap)
    .filter(([categoria, _]) => categoria !== 'OTROS') // Filtrar la categoría OTROS
    .map(([categoria, data]) => {
      // Convertir productos a array y ordenar por importe
      const productosArray = Object.values(data.productos)
        .sort((a, b) => b.total - a.total)
        .slice(0, topPorCategoria);
      
      return {
        categoria,
        totalCategoria: data.totalCategoria,
        cantidadCategoria: data.cantidadCategoria,
        productos: productosArray
      };
    })
    .sort((a, b) => b.totalCategoria - a.totalCategoria);

  return resultado;
}
