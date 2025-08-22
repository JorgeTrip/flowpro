// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
import { create } from 'zustand';
import { CellValue } from 'read-excel-file';
import { generarReporte, ReporteResultados } from '@/app/lib/reportGenerator';
import { Venta } from '@/app/reporte-de-ventas/lib/types';

export type { CellValue };

export interface ExcelRow {
  [key: string]: CellValue;
}

// Configuración específica para el reporte de ventas
interface Configuracion {
  mapeo: {
    [key in keyof Venta]?: string;
  };
}

export interface ReporteVentasState {
  // State
  step: number;
  ventasFile: File | null;
  ventasData: ExcelRow[];
  ventasPreviewData: ExcelRow[];
  ventasColumnas: string[];
  configuracion: Configuracion | null;
  resultados: ReporteResultados | null;
  isGenerating: boolean;
  error: string | null;

  // Actions
  setStep: (step: number) => void;
  setVentasFile: (file: File | null) => void;
  setVentasData: (data: ExcelRow[], columnas: string[], previewData: ExcelRow[]) => void;
  setConfiguracion: (configuracion: Configuracion) => void;
  setResultados: (resultados: ReporteResultados | null) => void;
  setIsGenerating: (generating: boolean) => void;
  setError: (error: string | null) => void;
  generarReporte: () => void;
  reset: () => void;
}

const initialState: Omit<ReporteVentasState, 'setStep' | 'setVentasFile' | 'setVentasData' | 'setConfiguracion' | 'setResultados' | 'setIsGenerating' | 'setError' | 'generarReporte' | 'reset'> = {
  step: 1,
  ventasFile: null,
  ventasData: [],
  ventasPreviewData: [],
  ventasColumnas: [],
  configuracion: null,
  resultados: null,
  isGenerating: false,
  error: null,
};

export const useReporteVentasStore = create<ReporteVentasState>()((set, get) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setVentasFile: (file) => set({ ventasFile: file, resultados: null, step: 1 }),
  setVentasData: (data, columnas, previewData) => set({ ventasData: data, ventasColumnas: columnas, ventasPreviewData: previewData }),
  setConfiguracion: (configuracion) => set({ configuracion }),
  setResultados: (resultados) => set({ resultados }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setError: (error) => set({ error }),
  generarReporte: () => {
    const { ventasData, configuracion } = get();
    if (!ventasData.length || !configuracion?.mapeo) {
      set({ error: 'No hay datos o configuración para generar el reporte.' });
      return;
    }

    set({ isGenerating: true, error: null });

    // Simula un pequeño retraso para que la UI de carga sea visible
    setTimeout(() => {
      try {
        const mapeo = configuracion.mapeo;
        const ventasProcesadas: Venta[] = ventasData.map(row => {
          const venta: Venta = {
            Periodo: String(row[mapeo.Periodo!] || ''),
            Fecha: String(row[mapeo.Fecha!] || ''),
            TipoComprobante: String(row[mapeo.TipoComprobante!] || ''),
            NroComprobante: String(row[mapeo.NroComprobante!] || ''),
            ReferenciaVendedor: String(row[mapeo.ReferenciaVendedor!] || ''),
            RazonSocial: String(row[mapeo.RazonSocial!] || ''),
            Cliente: String(row[mapeo.Cliente!] || ''),
            Direccion: String(row[mapeo.Direccion!] || ''),
            Articulo: String(row[mapeo.Articulo!] || ''),
            Descripcion: String(row[mapeo.Descripcion!] || ''),
            Cantidad: Number(row[mapeo.Cantidad!] || 0),
            PrecioUnitario: Number(row[mapeo.PrecioUnitario!] || 0),
            PrecioTotal: Number(row[mapeo.PrecioTotal!] || 0),
            Total: Number(row[mapeo.Total!] || 0),
            TotalCIVA: Number(row[mapeo.TotalCIVA!] || 0),
            DirectoIndirecto: String(row[mapeo.DirectoIndirecto!] || ''),
            DescRubro: String(row[mapeo.DescRubro!] || ''),
            DescripcionZona: String(row[mapeo.DescripcionZona!] || ''),
          };
          return venta;
        });

        const nuevosResultados = generarReporte(ventasProcesadas);
        set({ resultados: nuevosResultados, isGenerating: false, step: 3 });
      } catch (err) {
        console.error('Error durante la generación del reporte:', err);
        set({ error: err instanceof Error ? err.message : 'Ocurrió un error al generar el reporte.', isGenerating: false });
      }
    }, 500); // 500ms de retraso
  },
  reset: () => set(initialState),
}));
