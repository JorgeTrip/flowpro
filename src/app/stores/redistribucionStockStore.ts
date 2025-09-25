// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
import { create } from 'zustand';
import { redistribuirStock } from '@/app/lib/stockRedistributor';

export type ExcelCellValue = string | number | boolean | Date | null;

export interface ExcelRow {
  [key: string]: ExcelCellValue;
}

interface Configuracion {
  mapeo: {
    productoId: string;
    descripcion?: string;
    stockCABAMateriaPrima: string;
    stockCABAProductoTerminado: string;
    stockEntreRiosMateriaPrima: string;
    stockEntreRiosProductoTerminado: string;
    rotacionMensual: string;
  };
}

export interface ResultadoItem {
  productoId: string | number;
  descripcion: string;
  // Stocks CABA
  stockCABAMateriaPrima: number;
  stockCABAProductoTerminado: number;
  stockCABATotal: number;
  // Stocks Entre Ríos
  stockEntreRiosMateriaPrima: number;
  stockEntreRiosProductoTerminado: number;
  stockEntreRiosTotal: number;
  // Datos de rotación y análisis
  rotacionMensual: number;
  accion: 'Pedir a Entre Ríos' | 'Sin stock disponible' | 'Stock suficiente';
  cantidadSugerida: number;
  criticidad: 'alta' | 'media' | 'baja';
}
export interface RedistribucionStockState {
  // State
  step: number;
  stockFile: File | null;
  stockData: ExcelRow[];
  stockPreviewData: ExcelRow[];
  stockColumnas: string[];
  configuracion: Configuracion | null;
  resultados: ResultadoItem[] | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setStep: (step: number) => void;
  setStockFile: (file: File | null) => void;
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
  stockFile: null,
  stockData: [],
  stockPreviewData: [],
  stockColumnas: [],
  configuracion: null,
  resultados: null,
  isLoading: false,
  error: null,
};

export const useRedistribucionStockStore = create<RedistribucionStockState>()((set, get) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setStockFile: (file) => set({ stockFile: file }),
  setStockData: (data, columnas, previewData) => set({ stockData: data, stockColumnas: columnas, stockPreviewData: previewData }),
  setConfiguracion: (configuracion) => set({ configuracion }),
  setResultados: (resultados) => set({ resultados }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reAnalizar: () => {
    const { stockData, configuracion } = get();
    if (!stockData.length || !configuracion?.mapeo) {
      set({ error: 'No hay datos o configuración para re-analizar.' });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const nuevosResultados = redistribuirStock(stockData, configuracion.mapeo);
      set({ resultados: nuevosResultados, isLoading: false });
    } catch (err) {
      console.error('Error durante el re-análisis:', err);
      set({ error: err instanceof Error ? err.message : 'Ocurrió un error al re-analizar.', isLoading: false });
    }
  },
  reset: () => set(initialState),
}));
