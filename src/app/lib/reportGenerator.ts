// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados

import { Venta } from '../reporte-de-ventas/lib/types';
import { normalizeForComparison } from '../reporte-de-ventas/lib/textUtils';

// Define la estructura para los resultados del reporte final
export interface ReporteResultados {
  // Por importe
  ventasPorMes: Record<string, { A: number; X: number; AX: number }>;
  ventasPorRubro: Record<string, Record<string, { A: number; X: number; AX: number }>>;
  ventasPorZona: Record<string, Record<string, { A: number; X: number; AX: number }>>;
  ventasPorVendedor: {
    resultado: Record<string, Record<string, { A: number; X: number; AX: number }>>;
    vendedores: string[];
  };
  // Por cantidad
  cantidadesPorMes: Record<string, { A: number; X: number; AX: number }>;
  cantidadesPorRubro: Record<string, Record<string, { A: number; X: number; AX: number }>>;
  cantidadesPorZona: Record<string, Record<string, { A: number; X: number; AX: number }>>;
  cantidadesPorVendedor: {
      resultado: Record<string, Record<string, { A: number; X: number; AX: number }>>;
      vendedores: string[];
  };
  // Tops
  topProductosMasVendidos: { articulo: string; descripcion: string; cantidad: number }[];
  topProductosMasVendidosPorImporte: { articulo: string; descripcion: string; total: number }[];
  topProductosMenosVendidos: { articulo: string; descripcion: string; cantidad: number }[];
  topProductosPorCategoriaPorCantidad: { categoria: string; cantidadCategoria: number; totalCategoria: number; productos: { articulo: string; descripcion: string; cantidad: number; total: number; }[] }[];
  topProductosPorCategoriaPorImporte: { categoria: string; cantidadCategoria: number; totalCategoria: number; productos: { articulo: string; descripcion: string; cantidad: number; total: number; }[] }[];
  topClientesMinoristas: { cliente: string; total: number }[];
  topClientesDistribuidores: { cliente: string; total: number }[];
  topClientesMinoristasPorCantidad: { cliente: string; total: number }[];
  topClientesDistribuidoresPorCantidad: { cliente: string; total: number }[];
}

/**
 * Genera un reporte completo a partir de los datos de ventas.
 */
export function generarReporte(ventas: Venta[]): ReporteResultados {
  console.log("=== INICIANDO GENERACIÓN DE REPORTE DE VENTAS ===");
  console.log(`📊 Total de ventas recibidas: ${ventas.length}`);
  
  // Log de las primeras 3 ventas para verificar estructura
  if (ventas.length > 0) {
    console.log("🔍 Estructura de las primeras 3 ventas:");
    ventas.slice(0, 3).forEach((venta, index) => {
      console.log(`  Venta ${index + 1}:`, {
        Fecha: venta.Fecha,
        Cliente: venta.Cliente,
        Articulo: venta.Articulo,
        Descripcion: venta.Descripcion,
        'Descripcion length': venta.Descripcion?.length || 0,
        'Descripcion type': typeof venta.Descripcion,
        Cantidad: venta.Cantidad,
        PrecioTotal: venta.PrecioTotal,
        DescripcionZona: venta.DescripcionZona,
        ReferenciaVendedor: venta.ReferenciaVendedor,
        DescRubro: venta.DescRubro,
        DirectoIndirecto: venta.DirectoIndirecto
      });
    });
    
    // Verificar si hay alguna venta con descripción no vacía
    const ventasConDescripcion = ventas.filter(v => v.Descripcion && v.Descripcion.trim().length > 0);
    console.log(`🔍 Ventas con descripción no vacía: ${ventasConDescripcion.length} de ${ventas.length}`);
    if (ventasConDescripcion.length > 0) {
      console.log("🔍 Ejemplo de venta con descripción:", {
        Articulo: ventasConDescripcion[0].Articulo,
        Descripcion: ventasConDescripcion[0].Descripcion
      });
    }
  }

  const mesesConDatos = obtenerMesesConDatos(ventas);
  console.log(`📅 Meses con datos encontrados: ${mesesConDatos.length}`, mesesConDatos);

  const resultado: ReporteResultados = { 
    // Por importe
    ventasPorMes: agruparVentasPorMes(ventas),
    ventasPorRubro: agruparPorRubro(ventas),
    ventasPorZona: agruparPorZona(ventas),
    ventasPorVendedor: agruparPorVendedor(ventas),
    // Por cantidad
    cantidadesPorMes: agruparVentasPorMesCantidad(ventas),
    cantidadesPorRubro: agruparPorRubroCantidad(ventas),
    cantidadesPorZona: agruparPorZonaCantidad(ventas),
    cantidadesPorVendedor: agruparPorVendedorCantidad(ventas),
    // Tops
    topProductosMasVendidos: topProductosMasVendidos(ventas, 20, 'conDatos', mesesConDatos),
    topProductosMasVendidosPorImporte: topProductosMasVendidosImporte(ventas, 20, 'conDatos', mesesConDatos),
    topProductosMenosVendidos: topProductosMenosVendidos(ventas, 20, 'conDatos', mesesConDatos),
    topProductosPorCategoriaPorCantidad: topProductosPorCategoria(ventas, 5, 'conDatos', mesesConDatos, 'cantidad'),
    topProductosPorCategoriaPorImporte: topProductosPorCategoria(ventas, 5, 'conDatos', mesesConDatos, 'importe'),
    topClientesMinoristas: topClientesPorRubro(ventas, 'Minoristas', 20, 'importe', 'mas', 'conDatos', mesesConDatos),
    topClientesDistribuidores: topClientesPorRubro(ventas, 'Distribuidores', 20, 'importe', 'mas', 'conDatos', mesesConDatos),
    topClientesMinoristasPorCantidad: topClientesPorRubro(ventas, 'Minoristas', 20, 'cantidad', 'mas', 'conDatos', mesesConDatos),
    topClientesDistribuidoresPorCantidad: topClientesPorRubro(ventas, 'Distribuidores', 20, 'cantidad', 'mas', 'conDatos', mesesConDatos),
  };

  console.log("📊 Resultados de la agregación final:");
  console.log("  - Ventas por Mes (primeros 3):", Object.fromEntries(Object.entries(resultado.ventasPorMes).slice(0, 3)));
  console.log("  - Ventas por Rubro (primeros 3):", Object.fromEntries(Object.entries(resultado.ventasPorRubro).slice(0, 3)));
  console.log("  - Top Clientes Minoristas (primeros 3):", resultado.topClientesMinoristas.slice(0, 3));
  console.log("  - Top Productos Mas Vendidos (primeros 3):", resultado.topProductosMasVendidos.slice(0, 3));
  console.log("  - Top Productos Mas Vendidos Por Importe (primeros 3):", resultado.topProductosMasVendidosPorImporte.slice(0, 3));
  console.log("  - Top Productos por Categoría (Cantidad) (primera categoría):", resultado.topProductosPorCategoriaPorCantidad.slice(0, 1));
  console.log("=== FINALIZANDO GENERACIÓN DE REPORTE DE VENTAS ===");

  return resultado;
}

// Función auxiliar para obtener los meses que tienen datos
function obtenerMesesConDatos(ventas: Venta[]): string[] {
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const mesesSet = new Set<string>();
    ventas.forEach(v => {
        let mesIdx = -1;
        if (typeof v.Fecha === 'string' && v.Fecha.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            const [, mm] = v.Fecha.split('/');
            mesIdx = parseInt(mm, 10) - 1;
        } else {
            const fecha = new Date(v.Fecha);
            mesIdx = fecha.getMonth();
        }
        if (mesIdx >= 0 && mesIdx < 12) {
            mesesSet.add(meses[mesIdx]);
        }
    });
    return Array.from(mesesSet);
}


// --- Funciones de procesamiento por cantidad ---

function agruparVentasPorMesCantidad(ventas: Venta[]) {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const resultado: Record<string, { A: number; X: number; AX: number }> = {};
  meses.forEach(mes => {
    resultado[mes] = { A: 0, X: 0, AX: 0 };
  });
  
  ventas.forEach(v => {
    let mesIdx = -1;
    if (typeof v.Fecha === 'string' && v.Fecha.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [, mm] = v.Fecha.split('/');
        mesIdx = parseInt(mm, 10) - 1;
    } else {
        const fecha = new Date(v.Fecha);
        mesIdx = fecha.getMonth();
    }
    const mes = meses[mesIdx] || '';
    if (!mes) return;
    
    if (v.NroComprobante.startsWith('A')) {
      resultado[mes].A += v.Cantidad;
      resultado[mes].AX += v.Cantidad;
    } else if (v.NroComprobante.startsWith('X')) {
      resultado[mes].X += v.Cantidad;
      resultado[mes].AX += v.Cantidad;
    }
  });
  
  return resultado;
}

function agruparPorRubroCantidad(ventas: Venta[]) {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const resultado: Record<string, Record<string, { A: number; X: number; AX: number }>> = {};
  
  meses.forEach(mes => {
    resultado[mes] = {
      Distribuidores: { A: 0, X: 0, AX: 0 },
      Minoristas: { A: 0, X: 0, AX: 0 }
    };
  });
  
  ventas.forEach(v => {
    let mesIdx = -1;
    if (typeof v.Fecha === 'string' && v.Fecha.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [, mm] = v.Fecha.split('/');
        mesIdx = parseInt(mm, 10) - 1;
    } else {
        const fecha = new Date(v.Fecha);
        mesIdx = fecha.getMonth();
    }
    const mes = meses[mesIdx] || '';
    if (!mes) return;
    
    const rubro = v.DescRubro === 'DISTRIBUIDOR' ? 'Distribuidores' : 'Minoristas';
    
    if (v.NroComprobante.startsWith('A')) {
      resultado[mes][rubro].A += v.Cantidad;
      resultado[mes][rubro].AX += v.Cantidad;
    } else if (v.NroComprobante.startsWith('X')) {
      resultado[mes][rubro].X += v.Cantidad;
      resultado[mes][rubro].AX += v.Cantidad;
    }
  });
  
  return resultado;
}

function agruparPorZonaCantidad(ventas: Venta[]) {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const resultado: Record<string, Record<string, { A: number; X: number; AX: number }>> = {};
  
  meses.forEach(mes => {
    resultado[mes] = {
      Interior: { A: 0, X: 0, AX: 0 },
      'Retiro de cliente': { A: 0, X: 0, AX: 0 },
      "G.B.A.": { A: 0, X: 0, AX: 0 },
      CABA: { A: 0, X: 0, AX: 0 }
    };
  });
  
  ventas.forEach(v => {
    let mesIdx = -1;
    if (typeof v.Fecha === 'string' && v.Fecha.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [, mm] = v.Fecha.split('/');
        mesIdx = parseInt(mm, 10) - 1;
    } else {
        const fecha = new Date(v.Fecha);
        mesIdx = fecha.getMonth();
    }
    const mes = meses[mesIdx] || '';
    if (!mes) return;
    
    let zona = '';
    const descZona = v.DescripcionZona ? normalizeForComparison(v.DescripcionZona) : '';
    if (descZona.includes('provincia')) zona = 'G.B.A.';
    else if (descZona.includes('c.a.b.a.')) zona = 'CABA';
    else if (descZona.includes('expreso')) zona = 'Interior';
    else if (normalizeForComparison(v.DescripcionZona || '') === 'hierbas del oasis - la boca') zona = 'Retiro de cliente';
    else return;
    
    if (v.NroComprobante.startsWith('A')) {
      resultado[mes][zona].A += v.Cantidad;
      resultado[mes][zona].AX += v.Cantidad;
    } else if (v.NroComprobante.startsWith('X')) {
      resultado[mes][zona].X += v.Cantidad;
      resultado[mes][zona].AX += v.Cantidad;
    }
  });
  
  return resultado;
}

function agruparPorVendedorCantidad(ventas: Venta[]) {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const vendedores = Array.from(new Set(ventas.map(v => v.ReferenciaVendedor).filter(Boolean)));
  const resultado: Record<string, Record<string, { A: number; X: number; AX: number }>> = {};
  
  meses.forEach(mes => {
    resultado[mes] = {};
    vendedores.forEach(vend => {
      resultado[mes][vend] = { A: 0, X: 0, AX: 0 };
    });
  });
  
  ventas.forEach(v => {
    let mesIdx = -1;
    if (typeof v.Fecha === 'string' && v.Fecha.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [, mm] = v.Fecha.split('/');
        mesIdx = parseInt(mm, 10) - 1;
    } else {
        const fecha = new Date(v.Fecha);
        mesIdx = fecha.getMonth();
    }
    const mes = meses[mesIdx] || '';
    if (!mes) return;
    
    const vend = v.ReferenciaVendedor;
    if (!vend) return;

    if (!resultado[mes][vend]) {
      resultado[mes][vend] = { A: 0, X: 0, AX: 0 };
    }
    if (v.NroComprobante.startsWith('A')) {
      resultado[mes][vend].A += v.Cantidad;
      resultado[mes][vend].AX += v.Cantidad;
    } else if (v.NroComprobante.startsWith('X')) {
      resultado[mes][vend].X += v.Cantidad;
      resultado[mes][vend].AX += v.Cantidad;
    }
  });
  
  return { resultado, vendedores };
}

// --- Funciones de procesamiento por importe ---


function agruparVentasPorMes(ventas: Venta[]) {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const resultado: Record<string, { A: number; X: number; AX: number }> = {};
  meses.forEach(mes => {
    resultado[mes] = { A: 0, X: 0, AX: 0 };
  });
  ventas.forEach(v => {
    let mesIdx = -1;
    if (typeof v.Fecha === 'string' && v.Fecha.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [, mm] = v.Fecha.split('/');
      mesIdx = parseInt(mm, 10) - 1;
    } else {
      const fecha = new Date(v.Fecha);
      mesIdx = fecha.getMonth();
    }
    const mes = meses[mesIdx] || '';
    if (!mes) return;
    if (v.NroComprobante.startsWith('A')) {
      resultado[mes].A += v.TotalCIVA;
      resultado[mes].AX += v.TotalCIVA;
    } else if (v.NroComprobante.startsWith('X')) {
      resultado[mes].X += v.Total;
      resultado[mes].AX += v.Total;
    }
  });
  return resultado;
}

function agruparPorRubro(ventas: Venta[]) {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const resultado: Record<string, Record<string, { A: number; X: number; AX: number }>> = {};
  meses.forEach(mes => {
    resultado[mes] = {
      Distribuidores: { A: 0, X: 0, AX: 0 },
      Minoristas: { A: 0, X: 0, AX: 0 }
    };
  });
  ventas.forEach(v => {
    let mesIdx = -1;
    if (typeof v.Fecha === 'string' && v.Fecha.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [, mm] = v.Fecha.split('/');
      mesIdx = parseInt(mm, 10) - 1;
    } else {
      const fecha = new Date(v.Fecha);
      mesIdx = fecha.getMonth();
    }
    const mes = meses[mesIdx] || '';
    if (!mes) return;
    const rubro = v.DescRubro === 'DISTRIBUIDOR' ? 'Distribuidores' : 'Minoristas';
    if (v.NroComprobante.startsWith('A')) {
      resultado[mes][rubro].A += v.TotalCIVA;
      resultado[mes][rubro].AX += v.TotalCIVA;
    } else if (v.NroComprobante.startsWith('X')) {
      resultado[mes][rubro].X += v.Total;
      resultado[mes][rubro].AX += v.Total;
    }
  });
  return resultado;
}

function agruparPorZona(ventas: Venta[]) {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const resultado: Record<string, Record<string, { A: number; X: number; AX: number }>> = {};
  meses.forEach(mes => {
    resultado[mes] = {
      Interior: { A: 0, X: 0, AX: 0 },
      'Retiro de cliente': { A: 0, X: 0, AX: 0 },
      "G.B.A.": { A: 0, X: 0, AX: 0 },
      CABA: { A: 0, X: 0, AX: 0 }
    };
  });
  ventas.forEach(v => {
    let mesIdx = -1;
    if (typeof v.Fecha === 'string' && v.Fecha.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [, mm] = v.Fecha.split('/');
      mesIdx = parseInt(mm, 10) - 1;
    } else {
      const fecha = new Date(v.Fecha);
      mesIdx = fecha.getMonth();
    }
    const mes = meses[mesIdx] || '';
    if (!mes) return;
    let zona = '';
    const descZona = v.DescripcionZona ? normalizeForComparison(v.DescripcionZona) : '';
    if (descZona.includes('provincia')) zona = 'G.B.A.';
    else if (descZona.includes('c.a.b.a.')) zona = 'CABA';
    else if (descZona.includes('expreso')) zona = 'Interior';
    else if (normalizeForComparison(v.DescripcionZona || '') === 'hierbas del oasis - la boca') zona = 'Retiro de cliente';
    else return;
    if (v.NroComprobante.startsWith('A')) {
      resultado[mes][zona].A += v.TotalCIVA;
      resultado[mes][zona].AX += v.TotalCIVA;
    } else if (v.NroComprobante.startsWith('X')) {
      resultado[mes][zona].X += v.Total;
      resultado[mes][zona].AX += v.Total;
    }
  });
  return resultado;
}

function topProductosMasVendidosImporte(
  ventas: Venta[], 
  n: number = 20, 
  filtroMes: string = 'todos',
  mesesConDatos: string[] = []
) {
  const ventasFiltradas = filtrarVentasPorMes(ventas, filtroMes, mesesConDatos);
  const map: Record<string, { total: number, descripcion: string }> = {};
  ventasFiltradas.forEach(v => {
    if (!v.Articulo) return;
    if (!map[v.Articulo]) {
      map[v.Articulo] = { total: 0, descripcion: v.Descripcion || '' };
    }
    map[v.Articulo].total += v.PrecioTotal;
    // Actualizar descripción si la actual está vacía y la nueva no
    if (!map[v.Articulo].descripcion && v.Descripcion) {
      map[v.Articulo].descripcion = v.Descripcion;
    }
  });
  
  const resultado = Object.entries(map)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, n)
    .map(([articulo, data]) => ({ articulo, descripcion: data.descripcion, total: data.total }));
    
  console.log('🔍 topProductosMasVendidosImporte - primeros 3 resultados:', resultado.slice(0, 3));
  return resultado;
}

// Mapeo de categorías según el código de artículo
const categorias: Record<string, string> = {
  '13': 'ACEITE DE OLIVA',
  '01': 'ACEITE ESENCIAL',
  '22': 'ACEITE OLIVA/ACETO',
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
 * Obtiene la categoría de un artículo según su código
 */
function obtenerCategoria(codigoArticulo: string): string {
  if (!codigoArticulo) return 'OTROS';
  
  // Buscar el patrón de 2 dígitos al inicio del código
  const match = codigoArticulo.match(/^(\d{2})/i);
  if (match && match[1]) {
    return categorias[match[1]] || 'OTROS';
  }
  
  // Si no hay 2 dígitos al inicio, intentar extraer los primeros 2 caracteres
  const prefijo = codigoArticulo.substring(0, 2);
  return categorias[prefijo] || 'OTROS';
}

function topProductosPorCategoria(
  ventas: Venta[],
  n: number = 5,
  filtroMes: string = 'todos',
  mesesConDatos: string[] = [],
  sortBy: 'cantidad' | 'importe' = 'cantidad'
) {
  console.log('🔍 topProductosPorCategoria - Iniciando función');
  console.log('🔍 topProductosPorCategoria - ventas.length:', ventas.length);
  console.log('🔍 topProductosPorCategoria - filtroMes:', filtroMes);
  console.log('🔍 topProductosPorCategoria - sortBy:', sortBy);
  
  const ventasFiltradas = filtrarVentasPorMes(ventas, filtroMes, mesesConDatos);
  console.log('🔍 topProductosPorCategoria - ventasFiltradas.length:', ventasFiltradas.length);

  const categoriasMap: Record<string, { 
    productos: Record<string, { articulo: string; descripcion: string; cantidad: number; total: number; }>,
    cantidadCategoria: number;
    totalCategoria: number;
  }> = {};

  ventasFiltradas.forEach(v => {
    if (!v.Articulo) return;
    
    // Obtener categoría del artículo usando el código
    const categoria = obtenerCategoria(v.Articulo);
    
    if (!categoriasMap[categoria]) {
      categoriasMap[categoria] = { productos: {}, cantidadCategoria: 0, totalCategoria: 0 };
    }

    const producto = categoriasMap[categoria].productos[v.Articulo];
    if (!producto) {
      categoriasMap[categoria].productos[v.Articulo] = { 
        articulo: v.Articulo, 
        descripcion: v.Descripcion, 
        cantidad: 0, 
        total: 0 
      };
    }

    const importe = v.NroComprobante.startsWith('A') ? v.TotalCIVA : v.Total;
    categoriasMap[categoria].productos[v.Articulo].cantidad += v.Cantidad;
    categoriasMap[categoria].productos[v.Articulo].total += importe;
    categoriasMap[categoria].cantidadCategoria += v.Cantidad;
    categoriasMap[categoria].totalCategoria += importe;
  });

  console.log('🔍 topProductosPorCategoria - categoriasMap keys:', Object.keys(categoriasMap));
  console.log('🔍 topProductosPorCategoria - categoriasMap:', categoriasMap);

  const resultado = Object.entries(categoriasMap).map(([categoria, data]) => {
    const productosArray = Object.values(data.productos);
    const sortedProductos = [...productosArray].sort((a, b) => {
      if (sortBy === 'cantidad') {
        return b.cantidad - a.cantidad;
      }
      return b.total - a.total;
    }).slice(0, n);

    return {
      categoria,
      cantidadCategoria: data.cantidadCategoria,
      totalCategoria: data.totalCategoria,
      productos: sortedProductos
    };
  }).sort((a, b) => {
    if (sortBy === 'cantidad') {
      return b.cantidadCategoria - a.cantidadCategoria;
    }
    return b.totalCategoria - a.totalCategoria;
  });

  console.log('🔍 topProductosPorCategoria - resultado final:', resultado);
  console.log('🔍 topProductosPorCategoria - resultado.length:', resultado.length);

  return resultado;
}

function agruparPorVendedor(ventas: Venta[]) {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const vendedores = Array.from(new Set(ventas.map(v => v.ReferenciaVendedor).filter(Boolean)));
  const resultado: Record<string, Record<string, { A: number; X: number; AX: number }>> = {};
  meses.forEach(mes => {
    resultado[mes] = {};
    vendedores.forEach(vend => {
      resultado[mes][vend] = { A: 0, X: 0, AX: 0 };
    });
  });
  ventas.forEach(v => {
    let mesIdx = -1;
    if (typeof v.Fecha === 'string' && v.Fecha.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [, mm] = v.Fecha.split('/');
      mesIdx = parseInt(mm, 10) - 1;
    } else {
      const fecha = new Date(v.Fecha);
      mesIdx = fecha.getMonth();
    }
    const mes = meses[mesIdx] || '';
    if (!mes) return;
    const vend = v.ReferenciaVendedor;
    if (!vend) return;
    if (v.NroComprobante.startsWith('A')) {
      resultado[mes][vend].A += v.TotalCIVA;
      resultado[mes][vend].AX += v.TotalCIVA;
    } else if (v.NroComprobante.startsWith('X')) {
      resultado[mes][vend].X += v.Total;
      resultado[mes][vend].AX += v.Total;
    }
  });
  return { resultado, vendedores };
}

function topProductosMasVendidos(
  ventas: Venta[], 
  n: number = 20, 
  filtroMes: string = 'todos',
  mesesConDatos: string[] = []
) {
  const ventasFiltradas = filtrarVentasPorMes(ventas, filtroMes, mesesConDatos);
  const map: Record<string, { cantidad: number, descripcion: string }> = {};
  ventasFiltradas.forEach(v => {
    if (!v.Articulo) return;
    if (!map[v.Articulo]) {
      map[v.Articulo] = { cantidad: 0, descripcion: v.Descripcion || '' };
    }
    map[v.Articulo].cantidad += v.Cantidad;
    // Actualizar descripción si la actual está vacía y la nueva no
    if (!map[v.Articulo].descripcion && v.Descripcion) {
      map[v.Articulo].descripcion = v.Descripcion;
    }
  });
  
  const resultado = Object.entries(map)
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, n)
    .map(([articulo, data]) => ({ articulo, descripcion: data.descripcion, cantidad: data.cantidad }));
    
  console.log('🔍 topProductosMasVendidos - primeros 3 resultados:', resultado.slice(0, 3));
  return resultado;
}

function topProductosMenosVendidos(
  ventas: Venta[], 
  n: number = 20,
  filtroMes: string = 'todos',
  mesesConDatos: string[] = []
) {
  const ventasFiltradas = filtrarVentasPorMes(ventas, filtroMes, mesesConDatos);
  const map: Record<string, { cantidad: number, descripcion: string }> = {};
  ventasFiltradas.forEach(v => {
    if (!v.Articulo) return;
    if (!map[v.Articulo]) {
      map[v.Articulo] = { cantidad: 0, descripcion: v.Descripcion };
    }
    map[v.Articulo].cantidad += v.Cantidad;
  });
  return Object.entries(map)
    .filter(([, data]) => data.cantidad > 0)
    .sort((a, b) => a[1].cantidad - b[1].cantidad)
    .slice(0, n)
    .map(([articulo, data]) => ({ articulo, descripcion: data.descripcion, cantidad: data.cantidad }));
}

function topClientesPorRubro(
  ventas: Venta[], 
  tipo: 'Minoristas' | 'Distribuidores', 
  n: number = 20,
  metrica: 'importe' | 'cantidad' = 'importe',
  orden: 'mas' | 'menos' = 'mas',
  filtroMes: string = 'todos',
  mesesConDatos: string[] = []
) {
  const ventasFiltradas = filtrarVentasPorMes(ventas, filtroMes, mesesConDatos);
  const mapImporte: Record<string, number> = {};
  const mapCantidad: Record<string, number> = {};
  
  ventasFiltradas.forEach(v => {
    const esDistribuidor = v.DescRubro === 'DISTRIBUIDOR';
    if ((tipo === 'Distribuidores' && !esDistribuidor) || (tipo === 'Minoristas' && esDistribuidor)) return;
    if (!v.Cliente) return;
    
    const importe = v.NroComprobante.startsWith('A') ? v.TotalCIVA : v.Total;
    mapImporte[v.Cliente] = (mapImporte[v.Cliente] || 0) + importe;
    mapCantidad[v.Cliente] = (mapCantidad[v.Cliente] || 0) + v.Cantidad;
  });
  
  const map = metrica === 'importe' ? mapImporte : mapCantidad;
  
  const entries = Object.entries(map).filter(([_, value]) => value > 0);
  
  const sortedEntries = orden === 'mas'
    ? entries.sort((a, b) => b[1] - a[1])
    : entries.sort((a, b) => a[1] - b[1]);
  
  return sortedEntries
    .slice(0, n)
    .map(([cliente, total]) => ({
      cliente,
      total
    }));
}

// Función auxiliar para filtrar ventas por mes
function filtrarVentasPorMes(
  ventas: Venta[],
  filtroMes: string,
  mesesConDatos: string[]
): Venta[] {
  if (filtroMes === 'todos') return ventas;

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return ventas.filter(v => {
    let mesVenta = '';
    if (typeof v.Fecha === 'string' && v.Fecha.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [, mm] = v.Fecha.split('/');
      const mesIdx = parseInt(mm, 10) - 1;
      mesVenta = meses[mesIdx] || '';
    } else {
      const fecha = new Date(v.Fecha);
      mesVenta = meses[fecha.getMonth()] || '';
    }
    
    if (filtroMes === 'conDatos') {
      return mesesConDatos.includes(mesVenta);
    } else {
      return mesVenta === filtroMes;
    }
  });
}
