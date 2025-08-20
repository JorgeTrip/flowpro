import { Venta } from '../types/Venta';
import { normalizeForComparison, normalizeVendedorName } from './textUtils';

// Constantes comunes
const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

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
 * Agrupa cantidades vendidas por mes y tipo de comprobante (A, X, A+X)
 */
export function agruparVentasPorMesCantidad(ventas: Venta[]) {
  // Devuelve un objeto { [mes]: { A: total, X: total, AX: total } }
  const resultado: Record<string, { A: number; X: number; AX: number }> = {};
  meses.forEach(mes => {
    resultado[mes] = { A: 0, X: 0, AX: 0 };
  });
  
  ventas.forEach(v => {
    const mesIdx = obtenerIndiceMes(v.Fecha);
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

/**
 * Agrupa cantidades vendidas por rubro (Distribuidores/Minoristas) y mes
 */
export function agruparPorRubroCantidad(ventas: Venta[]) {
  const rubros = ['Distribuidores', 'Minoristas'];
  // resultado[mes][rubro] = { A, X, AX }
  const resultado: Record<string, Record<string, { A: number; X: number; AX: number }>> = {};
  
  meses.forEach(mes => {
    resultado[mes] = {
      Distribuidores: { A: 0, X: 0, AX: 0 },
      Minoristas: { A: 0, X: 0, AX: 0 }
    };
  });
  
  ventas.forEach(v => {
    const mesIdx = obtenerIndiceMes(v.Fecha);
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

/**
 * Agrupa cantidades vendidas por zona y mes según las reglas del usuario
 */
export function agruparPorZonaCantidad(ventas: Venta[]) {
  const zonas = ['Interior', 'Retiro de cliente', 'G.B.A.', 'CABA'];
  // resultado[mes][zona] = { A, X, AX }
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
    const mesIdx = obtenerIndiceMes(v.Fecha);
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

/**
 * Agrupa cantidades vendidas por vendedor y mes
 * Devuelve: { [mes]: { [vendedor]: { A, X, AX } } }
 */
export function agruparPorVendedorCantidad(ventas: Venta[]) {
  // Obtener lista única de vendedores
  const vendedores = Array.from(new Set(ventas.map(v => v.ReferenciaVendedor).filter(Boolean)));
  // resultado[mes][vendedor] = { A, X, AX }
  const resultado: Record<string, Record<string, { A: number; X: number; AX: number }>> = {};
  
  meses.forEach(mes => {
    resultado[mes] = {};
    vendedores.forEach(vend => {
      resultado[mes][vend] = { A: 0, X: 0, AX: 0 };
    });
  });
  
  ventas.forEach(v => {
    const mesIdx = obtenerIndiceMes(v.Fecha);
    const mes = meses[mesIdx] || '';
    if (!mes) return;
    
    const vendedor = v.ReferenciaVendedor ? normalizeVendedorName(v.ReferenciaVendedor) : 'Sin Vendedor';
    
    // Inicializar si no existe
    if (!resultado[mes][vendedor]) {
      resultado[mes][vendedor] = { A: 0, X: 0, AX: 0 };
    }
    if (v.NroComprobante.startsWith('A')) {
      resultado[mes][vendedor].A += v.Cantidad;
      resultado[mes][vendedor].AX += v.Cantidad;
    } else if (v.NroComprobante.startsWith('X')) {
      resultado[mes][vendedor].X += v.Cantidad;
      resultado[mes][vendedor].AX += v.Cantidad;
    }
  });
  
  return { resultado, vendedores };
}

/**
 * Top N productos más vendidos por importe
 * filtroMes = 'todos' | 'conDatos' | mes específico (ej: 'Enero')
 * mesesConDatos = array de meses que tienen datos (usado cuando filtroMes = 'conDatos')
 */
export function topProductosMasVendidosImporte(
  ventas: Venta[], 
  n: number = 20,
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

  const map: Record<string, { total: number, descripcion: string, cantidad: number }> = {};
  ventasFiltradas.forEach(v => {
    if (!v.Articulo) return;
    if (!map[v.Articulo]) {
      map[v.Articulo] = { total: 0, descripcion: v.Descripcion, cantidad: 0 };
    }
    // Importe según comprobante
    const importe = v.NroComprobante.startsWith('A') ? v.TotalCIVA : v.Total;
    map[v.Articulo].total += importe;
    map[v.Articulo].cantidad += v.Cantidad;
  });
  return Object.entries(map)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, n)
    .map(([articulo, data]) => ({ 
      articulo, 
      descripcion: data.descripcion, 
      total: data.total,
      cantidad: data.cantidad 
    }));
}
