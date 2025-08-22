/**
 * Tipos para una venta individual y sus campos relevantes
 */
export interface Venta {
  Periodo: string;
  Fecha: string;
  TipoComprobante: string;
  NroComprobante: string;
  ReferenciaVendedor: string;
  RazonSocial: string;
  Cliente: string;
  Direccion: string;
  Articulo: string;
  Descripcion: string;
  Cantidad: number;
  Total: number;
  TotalCIVA: number;
  DirectoIndirecto: string;
  DescRubro: string;
  DescripcionZona: string;
}
