import * as XLSX from 'xlsx';
import { Venta } from '../types/Venta';
import {
  agruparVentasPorMes,
  agruparPorRubro,
  agruparPorZona,
  agruparPorVendedor,
  topProductosMasVendidos,
  topProductosMenosVendidos,
  topClientesPorRubro
} from '../utils/procesamiento';

/**
 * Genera y descarga el archivo Excel del reporte
 */
export function exportarReporteExcel(ventas: Venta[], anio: number = new Date().getFullYear()) {
  const wb = XLSX.utils.book_new();
  const wsData: any[] = [];

  // Título principal
  wsData.push(['Reporte de ventas mensuales']);
  wsData.push([`Año: ${anio}`]);
  wsData.push([]);

  // --- Resumen mensual ---
  wsData.push(['', 'A', 'X', 'A+X']);
  const resumen = agruparVentasPorMes(ventas);
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  meses.forEach(mes => {
    wsData.push([
      mes,
      resumen[mes]?.A || 0,
      resumen[mes]?.X || 0,
      resumen[mes]?.AX || 0
    ]);
  });
  // Total
  wsData.push([
    'Total',
    meses.reduce((acc, mes) => acc + (resumen[mes]?.A || 0), 0),
    meses.reduce((acc, mes) => acc + (resumen[mes]?.X || 0), 0),
    meses.reduce((acc, mes) => acc + (resumen[mes]?.AX || 0), 0)
  ]);
  wsData.push([]);

  // --- Rubro ---
  wsData.push(['', 'Distribuidores', '', '', 'Minoristas', '', '']);
  wsData.push(['', 'A', 'X', 'A+X', 'A', 'X', 'A+X']);
  const rubro = agruparPorRubro(ventas);
  meses.forEach(mes => {
    wsData.push([
      mes,
      rubro[mes]?.Distribuidores?.A || 0,
      rubro[mes]?.Distribuidores?.X || 0,
      rubro[mes]?.Distribuidores?.AX || 0,
      rubro[mes]?.Minoristas?.A || 0,
      rubro[mes]?.Minoristas?.X || 0,
      rubro[mes]?.Minoristas?.AX || 0,
    ]);
  });
  wsData.push([
    'Total',
    meses.reduce((acc, mes) => acc + (rubro[mes]?.Distribuidores?.A || 0), 0),
    meses.reduce((acc, mes) => acc + (rubro[mes]?.Distribuidores?.X || 0), 0),
    meses.reduce((acc, mes) => acc + (rubro[mes]?.Distribuidores?.AX || 0), 0),
    meses.reduce((acc, mes) => acc + (rubro[mes]?.Minoristas?.A || 0), 0),
    meses.reduce((acc, mes) => acc + (rubro[mes]?.Minoristas?.X || 0), 0),
    meses.reduce((acc, mes) => acc + (rubro[mes]?.Minoristas?.AX || 0), 0),
  ]);
  wsData.push([]);

  // --- Zona ---
  wsData.push(['', 'Interior', '', '', 'Retiro de cliente', '', '', 'G.B.A.', '', '', 'CABA', '', '']);
  wsData.push(['', 'A', 'X', 'A+X', 'A', 'X', 'A+X', 'A', 'X', 'A+X', 'A', 'X', 'A+X']);
  const zona = agruparPorZona(ventas);
  meses.forEach(mes => {
    wsData.push([
      mes,
      zona[mes]?.Interior?.A || 0,
      zona[mes]?.Interior?.X || 0,
      zona[mes]?.Interior?.AX || 0,
      zona[mes]?.['Retiro de cliente']?.A || 0,
      zona[mes]?.['Retiro de cliente']?.X || 0,
      zona[mes]?.['Retiro de cliente']?.AX || 0,
      zona[mes]?.['G.B.A.']?.A || 0,
      zona[mes]?.['G.B.A.']?.X || 0,
      zona[mes]?.['G.B.A.']?.AX || 0,
      zona[mes]?.CABA?.A || 0,
      zona[mes]?.CABA?.X || 0,
      zona[mes]?.CABA?.AX || 0,
    ]);
  });
  wsData.push([
    'Total',
    ...['Interior', 'Retiro de cliente', 'G.B.A.', 'CABA'].flatMap(z => [
      meses.reduce((acc, mes) => acc + (zona[mes]?.[z]?.A || 0), 0),
      meses.reduce((acc, mes) => acc + (zona[mes]?.[z]?.X || 0), 0),
      meses.reduce((acc, mes) => acc + (zona[mes]?.[z]?.AX || 0), 0),
    ])
  ]);
  wsData.push([]);

  // --- Vendedor ---
  const agrupadoVendedor = agruparPorVendedor(ventas);
  const vendedores = agrupadoVendedor.vendedores;
  const vendedor = agrupadoVendedor.resultado;
  wsData.push(['', ...vendedores.flatMap(v => [v, '', ''])]);
  wsData.push(['', ...vendedores.flatMap(() => ['A', 'X', 'A+X'])]);
  meses.forEach(mes => {
    wsData.push([
      mes,
      ...vendedores.flatMap(v => [
        vendedor[mes]?.[v]?.A || 0,
        vendedor[mes]?.[v]?.X || 0,
        vendedor[mes]?.[v]?.AX || 0,
      ])
    ]);
  });
  wsData.push([
    'Total',
    ...vendedores.flatMap(v => [
      meses.reduce((acc, mes) => acc + (vendedor[mes]?.[v]?.A || 0), 0),
      meses.reduce((acc, mes) => acc + (vendedor[mes]?.[v]?.X || 0), 0),
      meses.reduce((acc, mes) => acc + (vendedor[mes]?.[v]?.AX || 0), 0),
    ])
  ]);
  wsData.push([]);

  // --- Top productos y clientes ---
  wsData.push(['Top 20 productos más vendidos']);
  wsData.push(['#', 'Producto', 'Descripción', 'Cantidad']);
  topProductosMasVendidos(ventas, 20).forEach((row, idx) => {
    wsData.push([idx + 1, row.articulo, row.descripcion, row.cantidad]);
  });
  wsData.push([]);

  wsData.push(['Top 20 productos menos vendidos']);
  wsData.push(['#', 'Producto', 'Descripción', 'Cantidad']);
  topProductosMenosVendidos(ventas, 20).forEach((row, idx) => {
    wsData.push([idx + 1, row.articulo, row.descripcion, row.cantidad]);
  });
  wsData.push([]);

  wsData.push(['Top 20 clientes minoristas']);
  wsData.push(['#', 'Cliente', 'Total']);
  topClientesPorRubro(ventas, 'Minoristas', 20).forEach((row, idx) => {
    wsData.push([idx + 1, row.cliente, row.total]);
  });
  wsData.push([]);

  wsData.push(['Top 20 clientes distribuidores']);
  wsData.push(['#', 'Cliente', 'Total']);
  topClientesPorRubro(ventas, 'Distribuidores', 20).forEach((row, idx) => {
    wsData.push([idx + 1, row.cliente, row.total]);
  });

  // Crear hoja y aplicar estilos
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Paleta institucional
  const verdeOscuro = '22381e'; // sin # para SheetJS
  const blanco = 'FFFFFF';
  const beige = 'd7c693';

  // Helper para aplicar estilos a un rango
  function styleRange(ws, s, e, style) {
    for (let R = s.r; R <= e.r; ++R) {
      for (let C = s.c; C <= e.c; ++C) {
        const cell = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cell]) continue;
        ws[cell].s = { ...ws[cell].s, ...style };
      }
    }
  }

  // Detectar las filas de cada sección
  let row = 0;
  // Título principal
  ws['A1'].s = {
    font: { bold: true, sz: 18, color: { rgb: verdeOscuro } },
    fill: { fgColor: { rgb: beige } },
    alignment: { horizontal: 'left', vertical: 'center' }
  };
  ws['A2'].s = {
    font: { bold: true, sz: 14, color: { rgb: verdeOscuro } },
    fill: { fgColor: { rgb: beige } },
    alignment: { horizontal: 'left', vertical: 'center' }
  };
  row = 3;

  // Resumen mensual encabezado
  styleRange(ws, { r: row, c: 1 }, { r: row, c: 4 }, {
    font: { bold: true, color: { rgb: blanco } },
    fill: { fgColor: { rgb: verdeOscuro } },
    border: { top: { style: 'thin', color: { rgb: verdeOscuro } }, bottom: { style: 'thin', color: { rgb: verdeOscuro } }, left: { style: 'thin', color: { rgb: verdeOscuro } }, right: { style: 'thin', color: { rgb: verdeOscuro } } },
    alignment: { horizontal: 'center', vertical: 'center' }
  });
  row += 1 + 12 + 1 + 1; // encabezado + 12 meses + total + espacio

  // Rubro encabezado
  styleRange(ws, { r: row, c: 1 }, { r: row + 1, c: 7 }, {
    font: { bold: true, color: { rgb: blanco } },
    fill: { fgColor: { rgb: verdeOscuro } },
    border: { top: { style: 'thin', color: { rgb: verdeOscuro } }, bottom: { style: 'thin', color: { rgb: verdeOscuro } }, left: { style: 'thin', color: { rgb: verdeOscuro } }, right: { style: 'thin', color: { rgb: verdeOscuro } } },
    alignment: { horizontal: 'center', vertical: 'center' }
  });
  row += 2 + 12 + 1 + 1;

  // Zona encabezado
  styleRange(ws, { r: row, c: 1 }, { r: row + 1, c: 13 }, {
    font: { bold: true, color: { rgb: blanco } },
    fill: { fgColor: { rgb: verdeOscuro } },
    border: { top: { style: 'thin', color: { rgb: verdeOscuro } }, bottom: { style: 'thin', color: { rgb: verdeOscuro } }, left: { style: 'thin', color: { rgb: verdeOscuro } }, right: { style: 'thin', color: { rgb: verdeOscuro } } },
    alignment: { horizontal: 'center', vertical: 'center' }
  });
  row += 2 + 12 + 1 + 1;

  // Vendedor encabezado
  // Usar la variable vendedores ya declarada arriba
  styleRange(ws, { r: row, c: 1 }, { r: row + 1, c: 1 + vendedores.length * 3 }, {
    font: { bold: true, color: { rgb: blanco } },
    fill: { fgColor: { rgb: verdeOscuro } },
    border: { top: { style: 'thin', color: { rgb: verdeOscuro } }, bottom: { style: 'thin', color: { rgb: verdeOscuro } }, left: { style: 'thin', color: { rgb: verdeOscuro } }, right: { style: 'thin', color: { rgb: verdeOscuro } } },
    alignment: { horizontal: 'center', vertical: 'center' }
  });
  row += 2 + 12 + 1 + 1;

  // Top productos y clientes
  // (encabezados de cada tabla)
  let tempRow = row;
  for (let i = 0; i < 4; i++) {
    styleRange(ws, { r: tempRow, c: 1 }, { r: tempRow + 1, c: 4 }, {
      font: { bold: true, color: { rgb: blanco } },
      fill: { fgColor: { rgb: verdeOscuro } },
      border: { top: { style: 'thin', color: { rgb: verdeOscuro } }, bottom: { style: 'thin', color: { rgb: verdeOscuro } }, left: { style: 'thin', color: { rgb: verdeOscuro } }, right: { style: 'thin', color: { rgb: verdeOscuro } } },
      alignment: { horizontal: 'center', vertical: 'center' }
    });
    tempRow += 22; // 20 filas + encabezado + espacio
  }

  // Bordes a todas las celdas con datos
  const ref = ws['!ref'] ?? '';
  if (ref) {
    const range = XLSX.utils.decode_range(ref);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cell]) continue;
        ws[cell].s = {
          ...ws[cell].s,
          border: {
            top: { style: 'thin', color: { rgb: verdeOscuro } },
            bottom: { style: 'thin', color: { rgb: verdeOscuro } },
            left: { style: 'thin', color: { rgb: verdeOscuro } },
            right: { style: 'thin', color: { rgb: verdeOscuro } }
          }
        };
      }
    }
  }

  // Ajuste de ancho de columnas
  if (ref) {
    const range = XLSX.utils.decode_range(ref);
    ws['!cols'] = [];
    for (let c = 0; c <= range.e.c; ++c) {
      ws['!cols'].push({ wch: 18 });
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
  XLSX.writeFile(wb, `reporte_ventas_${anio}.xlsx`);
}
