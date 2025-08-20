import * as XLSX from 'xlsx';
import { Venta } from '../types/Venta';

/**
 * Lee un archivo Excel y lo transforma en un array de objetos Venta
 * @param file Archivo Excel
 */
export async function readExcelFile(file: File): Promise<Venta[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      // Crear un mapeo flexible de encabezados
      const normalize = (str: string) => str
        .toLowerCase()
        .normalize('NFD').replace(/\p{Diacritic}/gu, '') // quita tildes
        .replace(/[^a-z0-9]/g, ''); // quita espacios y caracteres especiales
      const headerMap: Record<string, string> = {};
      if (json[0]) {
        Object.keys(json[0]).forEach((col) => {
          const norm = normalize(col);
          // Mapea encabezados conocidos a las claves internas
          if (norm.includes('fecha')) headerMap['Fecha'] = col;
          if (norm.includes('tipocomprobante')) headerMap['TipoComprobante'] = col;
          if (norm.includes('nrocomprobante') || norm.includes('nrocomprob')) headerMap['NroComprobante'] = col;
          if (norm.includes('nombrevendedor')) headerMap['NombreVendedor'] = col;
          if (norm.includes('razonsocial')) headerMap['RazonSocial'] = col;
          if (norm.includes('articulo')) headerMap['Articulo'] = col;
          if (norm.includes('descripcion') && !norm.includes('zona') && !norm.includes('rubro')) headerMap['Descripcion'] = col;
          if (norm.includes('cantidad')) headerMap['Cantidad'] = col;
          if (norm === 'total') headerMap['Total'] = col;
          if (norm.includes('totalciva') || norm.includes('totaliva')) headerMap['TotalCIVA'] = col;
          if (norm.includes('directoindirecto')) headerMap['DirectoIndirecto'] = col;
          if (norm.includes('descrubro')) headerMap['DescRubro'] = col;
          if (norm.includes('descripcionzona')) headerMap['DescripcionZona'] = col;
        });
      }
      const ventas: Venta[] = json.map((row) => {
        // Fecha como string DD/MM/YYYY y objeto Date
        let fechaStr = '';
        let fechaObj: Date | null = null;
        const rawFecha = row[headerMap['Fecha']];
        if (typeof rawFecha === 'number') {
          const excelEpoch = new Date(Date.UTC(1899, 11, 30));
          fechaObj = new Date(excelEpoch.getTime() + (rawFecha * 86400000));
          const dd = String(fechaObj.getUTCDate()).padStart(2, '0');
          const mm = String(fechaObj.getUTCMonth() + 1).padStart(2, '0');
          const yyyy = fechaObj.getUTCFullYear();
          fechaStr = `${dd}/${mm}/${yyyy}`;
        } else if (typeof rawFecha === 'string' && rawFecha) {
          fechaStr = rawFecha;
          // Intentar parsear formato DD/MM/YYYY
          const [dd, mm, yyyy] = rawFecha.split(/[\/\-]/);
          if (dd && mm && yyyy) {
            fechaObj = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
          }
        }
        // Periodo: MM/YYYY
        let periodo = '';
        if (fechaObj) {
          const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
          const anio = fechaObj.getFullYear();
          periodo = `${mes}/${anio}`;
        }
        return {
          Periodo: periodo,
          Fecha: fechaStr,
          TipoComprobante: row[headerMap['TipoComprobante']] || '',
          NroComprobante: row[headerMap['NroComprobante']] || '',
          ReferenciaVendedor: row[headerMap['NombreVendedor']] || '',
          RazonSocial: row[headerMap['RazonSocial']] || '',
          Cliente: row[headerMap['RazonSocial']] || '',
          Direccion: row[headerMap['DescripcionZona']] || '',
          Articulo: row[headerMap['Articulo']] || '',
          Descripcion: row[headerMap['Descripcion']] || '',
          Cantidad: Number(row[headerMap['Cantidad']]) || 0,
          Total: Number(row[headerMap['Total']]) || 0,
          TotalCIVA: Number(row[headerMap['TotalCIVA']]) || 0,
          DirectoIndirecto: row[headerMap['DirectoIndirecto']] || '',
          DescRubro: row[headerMap['DescRubro']] || '',
          DescripcionZona: row[headerMap['DescripcionZona']] || '',
        };
      });
      resolve(ventas);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
