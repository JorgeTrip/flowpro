// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useRedistribucionStockStore, ExcelRow } from '@/app/stores/redistribucionStockStore';
import { FileUpload, ProcessedExcelData } from '@/app/components/shared/FileUpload';

export function UploadStep() {
  const {
    stockFile,
    setStockFile,
    setStockData,
    setIsLoading,
    setError,
    setStep,
  } = useRedistribucionStockStore();

  const handleStockLoad = (file: File, { data, columns, previewData }: ProcessedExcelData<ExcelRow>) => {
    setStockFile(file);
    setStockData(data, columns, previewData);
  };

  const handleNextStep = () => {
    if (stockFile) {
      setStep(2);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="space-y-8">
        <FileUpload<ExcelRow>
          title="Cargar Archivo de Stock"
          description="Suba el archivo Excel con el stock de ambos depósitos (Entre Ríos y Buenos Aires) y la rotación mensual de productos."
          file={stockFile}
          onFileLoad={handleStockLoad}
          setIsLoading={setIsLoading}
          setError={setError}
        />
      </div>
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleNextStep}
          disabled={!stockFile}
          className="rounded-md bg-blue-600 px-4 py-2 text-white font-semibold shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
