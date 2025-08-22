export interface ReporteConfig {
  id: string;
  nombre: string;
  descripcion?: string;
  fechaCreacion: string;
  componentes: ComponenteReporte[];
  mesesSeleccionados: string[];
  mostrarImporte: boolean;
  mostrarCantidad: boolean;
}

export interface ComponenteReporte {
  id: string;
  tipo: TipoComponente;
  titulo: string;
  orden: number;
  configuracion?: Record<string, any>;
}

export enum TipoComponente {
  VENTAS_MENSUALES = 'ventasMensuales',
  VENTAS_POR_RUBRO = 'ventasPorRubro',
  VENTAS_POR_ZONA = 'ventasPorZona',
  TOP_PRODUCTOS = 'topProductos',
  TOP_CLIENTES = 'topClientes',
  VENDEDORES = 'vendedores',
  TABLA_RESUMEN_MENSUAL = 'tablaResumenMensual',
  TABLA_RUBRO = 'tablaRubro',
  TABLA_ZONA = 'tablaZona',
  TABLA_VENDEDOR = 'tablaVendedor',
  TABLA_TOP_PRODUCTOS = 'tablaTopProductos',
  TABLA_TOP_CLIENTES = 'tablaTopClientes'
}
