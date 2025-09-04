// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
import { create } from 'zustand';
import { estimarDemanda } from '@/app/lib/demandEstimator';


export type ExcelCellValue = string | number | boolean | Date | null;

export interface ExcelRow {
  [key: string]: ExcelCellValue;
}

interface Configuracion {
  mapeo: {
    ventas: {
      productoId: string;
      cantidad: string;
      fecha: string;
      descripcion?: string;
    };
    stock: {
      productoId: string;
      cantidad: string;
      deposito: string;
      stockReservado?: string;
      descripcion?: string;
    };
  };
}

interface ResultadoItem {
  productoId: string | number;
  descripcion: string;
  venta: number;
  stockCABA: number;
  stockReservadoCABA: number;
  stockNetoCABA: number;
  stockEntreRios: number;
  mesesCobertura: number;
  demandaInsatisfecha: number;
  pedirAEntreRios: string;
  sugerencia: string;
  criticidad: 'alta' | 'media' | 'baja';
}

export interface EstimarDemandaState {
  // State
  step: number;
  ventasFile: File | null;
  stockFile: File | null;
  ventasData: ExcelRow[];
  ventasPreviewData: ExcelRow[];
  ventasColumnas: string[];
  stockData: ExcelRow[];
  stockPreviewData: ExcelRow[];
  stockColumnas: string[];
  configuracion: Configuracion | null;
  resultados: ResultadoItem[] | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setStep: (step: number) => void;
  setVentasFile: (file: File | null) => void;
  setStockFile: (file: File | null) => void;
  setVentasData: (data: ExcelRow[], columnas: string[], previewData: ExcelRow[]) => void;
  setStockData: (data: ExcelRow[], columnas: string[], previewData: ExcelRow[]) => void;
  setConfiguracion: (configuracion: Configuracion) => void;
  setResultados: (resultados: ResultadoItem[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reAnalizar: () => void;
  reset: () => void;
}

const initialState = {
  step: 1,
  ventasFile: null,
  stockFile: null,
  ventasData: [],
  ventasPreviewData: [],
  ventasColumnas: [],
  stockData: [],
  stockPreviewData: [],
  stockColumnas: [],
  configuracion: null,
  resultados: null,
  isLoading: false,
  error: null,
};

export const useEstimarDemandaStore = create<EstimarDemandaState>()((set, get) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setVentasFile: (file) => set({ ventasFile: file }),
  setStockFile: (file) => set({ stockFile: file }),
  setVentasData: (data, columnas, previewData) => set({ ventasData: data, ventasColumnas: columnas, ventasPreviewData: previewData }),
  setStockData: (data, columnas, previewData) => set({ stockData: data, stockColumnas: columnas, stockPreviewData: previewData }),
  setConfiguracion: (configuracion) => set({ configuracion }),
  setResultados: (resultados) => set({ resultados }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reAnalizar: () => {
    const { ventasData, stockData, configuracion } = get();
    if (!ventasData.length || !stockData.length || !configuracion?.mapeo) {
      set({ error: 'No hay datos o configuración para re-analizar.' });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const nuevosResultados = estimarDemanda(ventasData, stockData, configuracion.mapeo);
      set({ resultados: nuevosResultados, isLoading: false });
    } catch (err) {
      console.error('Error durante el re-análisis:', err);
      set({ error: err instanceof Error ? err.message : 'Ocurrió un error al re-analizar.', isLoading: false });
    }
  },
  reset: () => set(initialState),
}));
