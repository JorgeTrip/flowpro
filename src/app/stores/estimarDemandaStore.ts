// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
import { create } from 'zustand';

export interface ExcelRow {
  [key: string]: string | number;
}

interface EstimarDemandaState {
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
  configuracion: any; // Replace with a proper config type
  resultados: any; // Replace with a proper results type
  isLoading: boolean;
  error: string | null;

  // Actions
  setStep: (step: number) => void;
  setVentasFile: (file: File | null) => void;
  setStockFile: (file: File | null) => void;
  setVentasData: (data: ExcelRow[], columnas: string[], previewData: ExcelRow[]) => void;
  setStockData: (data: ExcelRow[], columnas: string[], previewData: ExcelRow[]) => void;
  setConfiguracion: (config: any) => void;
  setResultados: (resultados: any) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
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

export const useEstimarDemandaStore = create<EstimarDemandaState>()((set) => ({
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
  reset: () => set(initialState),
}));
