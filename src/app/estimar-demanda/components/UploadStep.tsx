// 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
// 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useEstimarDemandaStore, ExcelRow } from '@/app/stores/estimarDemandaStore';
import { FileUpload, ProcessedExcelData } from '@/app/components/shared/FileUpload';

export function UploadStep() {
  const {
    ventasFile,
    stockFile,
    setVentasFile,
    setStockFile,
    setVentasData,
    setStockData,
    setIsLoading,
    setError,
    setStep,
  } = useEstimarDemandaStore();

  const handleVentasLoad = (file: File, { data, columns, previewData }: ProcessedExcelData<ExcelRow>) => {
    setVentasFile(file);
    setVentasData(data, columns, previewData);
  };

  const handleStockLoad = (file: File, { data, columns, previewData }: ProcessedExcelData<ExcelRow>) => {
    setStockFile(file);
    setStockData(data, columns, previewData);
  };

  const handleNextStep = () => {
    if (ventasFile && stockFile) {
      setStep(2);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="space-y-8">
        <FileUpload<ExcelRow>
          title="1. Cargar Archivo de Ventas"
          file={ventasFile}
          onFileLoad={handleVentasLoad}
          setIsLoading={setIsLoading}
          setError={setError}
        />
        <FileUpload<ExcelRow>
          title="2. Cargar Archivo de Stock"
          file={stockFile}
          onFileLoad={handleStockLoad}
          setIsLoading={setIsLoading}
          setError={setError}
        />
      </div>
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleNextStep}
          disabled={!ventasFile || !stockFile}
          className="rounded-md bg-blue-600 px-4 py-2 text-white font-semibold shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

