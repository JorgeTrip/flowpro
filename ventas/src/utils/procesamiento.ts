import { Venta } from '../types/Venta';
import { agruparPorZonaCantidad } from './procesamiento-cantidades';
import { toSentenceCase, normalizeForComparison, normalizeVendedorName } from './textUtils';

/**
 * Agrupa ventas por mes y tipo de comprobante (A, X, A+X)
 */
export function agruparVentasPorMes(ventas: Venta[]) {
  // Devuelve un objeto { [mes]: { A: total, X: total, AX: total } }
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
      const [dd, mm, yyyy] = v.Fecha.split('/');
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

/**
 * Agrupa ventas por rubro (Distribuidores/Minoristas) y mes
 */
export function agruparPorRubro(ventas: Venta[]) {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
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
    let mesIdx = -1;
    if (typeof v.Fecha === 'string' && v.Fecha.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [dd, mm, yyyy] = v.Fecha.split('/');
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

/**
 * Agrupa ventas por zona y mes según las reglas del usuario
 */
export function agruparPorZona(ventas: Venta[]) {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
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
    let mesIdx = -1;
    if (typeof v.Fecha === 'string' && v.Fecha.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [dd, mm, yyyy] = v.Fecha.split('/');
      mesIdx = parseInt(mm, 10) - 1;
    } else {
      const fecha = new Date(v.Fecha);
      mesIdx = fecha.getMonth();
    }
    const mes = meses[mesIdx] || '';
    if (!mes) return;
    let zona = '';
    const descZona = v.DescripcionZona ? normalizeForComparison(v.DescripcionZona) : '';
    const tipo = v.TipoComprobante?.startsWith('X') ? 'X' : 'A';
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

/**
 * Agrupa ventas por vendedor y mes
 * Devuelve: { [mes]: { [vendedor]: { A, X, AX } } }
 */
export function agruparPorVendedor(ventas: Venta[]) {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
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
    let mesIdx = -1;
    if (typeof v.Fecha === 'string' && v.Fecha.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [dd, mm, yyyy] = v.Fecha.split('/');
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

/**
 * Top N productos más vendidos (por cantidad)
 * filtroMes = 'todos' | 'conDatos' | mes específico (ej: 'Enero')
 * mesesConDatos = array de meses que tienen datos (usado cuando filtroMes = 'conDatos')
 */
export function topProductosMasVendidos(
  ventas: Venta[], 
  n: number = 20, 
  filtroMes: string = 'todos',
  mesesConDatos: string[] = []
) {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Filtrar ventas por mes seleccionado
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

  const map: Record<string, { cantidad: number, descripcion: string }> = {};
  ventasFiltradas.forEach(v => {
    if (!v.Articulo) return;
    if (!map[v.Articulo]) {
      map[v.Articulo] = { cantidad: 0, descripcion: v.Descripcion };
    }
    map[v.Articulo].cantidad += v.Cantidad;
  });
  return Object.entries(map)
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, n)
    .map(([articulo, data]) => ({ articulo, descripcion: data.descripcion, cantidad: data.cantidad }));
}

/**
 * Top N productos menos vendidos (por cantidad, excluyendo los de cantidad 0)
 * filtroMes = 'todos' | 'conDatos' | mes específico (ej: 'Enero')
 * mesesConDatos = array de meses que tienen datos (usado cuando filtroMes = 'conDatos')
 */
export function topProductosMenosVendidos(
  ventas: Venta[], 
  n: number = 20,
  filtroMes: string = 'todos',
  mesesConDatos: string[] = []
) {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Filtrar ventas por mes seleccionado
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

  const map: Record<string, { cantidad: number, descripcion: string }> = {};
  ventasFiltradas.forEach(v => {
    if (!v.Articulo) return;
    if (!map[v.Articulo]) {
      map[v.Articulo] = { cantidad: 0, descripcion: v.Descripcion };
    }
    map[v.Articulo].cantidad += v.Cantidad;
  });
  return Object.entries(map)
    .filter(([_, data]) => data.cantidad > 0)
    .sort((a, b) => a[1].cantidad - b[1].cantidad)
    .slice(0, n)
    .map(([articulo, data]) => ({ articulo, descripcion: data.descripcion, cantidad: data.cantidad }));
}

/**
 * Top/Bottom N clientes minoristas/distribuidores (por importe total o cantidad)
 * tipo = 'Minoristas' | 'Distribuidores'
 * metrica = 'importe' | 'cantidad'
 * orden = 'mas' | 'menos'
 * filtroMes = 'todos' | 'conDatos' | mes específico (ej: 'Enero')
 * mesesConDatos = array de meses que tienen datos (usado cuando filtroMes = 'conDatos')
 */
export function topClientesPorRubro(
  ventas: Venta[], 
  tipo: 'Minoristas' | 'Distribuidores', 
  n: number = 20,
  metrica: 'importe' | 'cantidad' = 'importe',
  orden: 'mas' | 'menos' = 'mas',
  filtroMes: string = 'todos',
  mesesConDatos: string[] = []
) {
  const mapImporte: Record<string, number> = {};
  const mapCantidad: Record<string, number> = {};
  
  // Determinar qué ventas filtrar según el mes seleccionado
  const ventasFiltradas = ventas.filter(v => {
    // Si no hay filtro de mes, incluir todas las ventas
    if (filtroMes === 'todos') return true;
    
    // Obtener el mes de la venta
    let mesVenta = '';
    if (typeof v.Fecha === 'string' && v.Fecha.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [dd, mm, yyyy] = v.Fecha.split('/');
      const mesIdx = parseInt(mm, 10) - 1;
      const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      mesVenta = meses[mesIdx] || '';
    } else {
      const fecha = new Date(v.Fecha);
      const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
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
  
  ventasFiltradas.forEach(v => {
    const esDistribuidor = v.DescRubro === 'DISTRIBUIDOR';
    if ((tipo === 'Distribuidores' && !esDistribuidor) || (tipo === 'Minoristas' && esDistribuidor)) return;
    if (!v.Cliente) return;
    
    // Importe según comprobante
    const importe = v.NroComprobante.startsWith('A') ? v.TotalCIVA : v.Total;
    mapImporte[v.Cliente] = (mapImporte[v.Cliente] || 0) + importe;
    
    // Cantidad
    mapCantidad[v.Cliente] = (mapCantidad[v.Cliente] || 0) + v.Cantidad;
  });
  
  const map = metrica === 'importe' ? mapImporte : mapCantidad;
  
  // Filtrar clientes con valores mayores a 0
  const entries = Object.entries(map).filter(([_, value]) => value > 0);
  
  // Ordenar según el parámetro orden
  const sortedEntries = orden === 'mas'
    ? entries.sort((a, b) => b[1] - a[1])
    : entries.sort((a, b) => a[1] - b[1]);
  
  // Tomar los primeros N clientes
  return sortedEntries
    .slice(0, n)
    .map(([cliente, total]) => ({
      cliente,
      total
    }));
}
