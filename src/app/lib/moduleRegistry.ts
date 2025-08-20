// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados

export interface Modulo {
  id: string;
  nombre: string;
  ruta: string;
  icono: string;
  descripcion: string;
  activo: boolean;
  categoria: keyof typeof CATEGORIAS_MODULOS;
}

export const MODULOS_DISPONIBLES: Modulo[] = [
  {
    id: 'dashboard',
    nombre: 'Dashboard',
    ruta: '/',
    icono: '🏠',
    descripcion: 'Vista general',
    activo: true,
    categoria: 'general'
  },
  {
    id: 'estimar-demanda',
    nombre: 'Estimar Demanda',
    ruta: '/estimar-demanda',
    icono: '📈',
    descripcion: 'Análisis demanda vs stock',
    activo: true,
    categoria: 'inventario'
  },
  {
    id: 'gestion-ventas',
    nombre: 'Gestión Ventas',
    ruta: '/gestion-ventas',
    icono: '💰',
    descripcion: 'CRM y seguimiento ventas',
    activo: false, // Se activa cuando se implemente
    categoria: 'ventas'
  },
  {
    id: 'contabilidad',
    nombre: 'Contabilidad',
    ruta: '/contabilidad',
    icono: '📊',
    descripcion: 'Gestión contable y reportes',
    activo: false,
    categoria: 'finanzas'
  },
  {
    id: 'recursos-humanos',
    nombre: 'RRHH',
    ruta: '/recursos-humanos',
    icono: '👥',
    descripcion: 'Gestión de personal',
    activo: false,
    categoria: 'personal'
  }
];

export const CATEGORIAS_MODULOS = {
  general: { nombre: 'General', color: 'blue' },
  inventario: { nombre: 'Inventario', color: 'green' },
  ventas: { nombre: 'Ventas', color: 'purple' },
  finanzas: { nombre: 'Finanzas', color: 'amber' },
  personal: { nombre: 'Personal', color: 'red' }
} as const;
