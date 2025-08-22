// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useReporteVentasStore, ExcelRow } from '@/app/stores/reporteVentasStore';
import { FileUpload } from '@/app/components/shared/FileUpload';

interface FileLoadData {
  data: ExcelRow[];
  columns: string[];
  previewData: ExcelRow[];
}

export function UploadStep() {
  const {
    ventasFile,
    setVentasFile,
    setVentasData,
    setIsGenerating,
    setError,
    setStep,
  } = useReporteVentasStore();

  const handleFileLoad = (file: File, fileData: any) => {
    setVentasFile(file);
    setVentasData(fileData.data, fileData.columns, fileData.previewData);
  };

  const handleNextStep = () => {
    if (ventasFile) {
      setStep(2);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="space-y-8">
        <FileUpload
          title="1. Cargar Archivo de Ventas"
          file={ventasFile}
          onFileLoad={handleFileLoad}
          setIsLoading={setIsGenerating}
          setError={setError}
        />
      </div>
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleNextStep}
          disabled={!ventasFile}
          className="rounded-md bg-blue-600 px-4 py-2 text-white font-semibold shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
