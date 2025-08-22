// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useReporteVentasStore } from '@/app/stores/reporteVentasStore';
import { FileUpload } from '@/app/components/shared/FileUpload';

export function UploadStep() {
  const {
    ventasFile,
    setVentasFile,
    setVentasData,
    setIsLoading,
    setError,
    setStep,
  } = useReporteVentasStore();

  const handleFileLoad = (file: File, { data, columns, previewData }: any) => {
    setVentasFile(file);
    setVentasData(data, columns, previewData);
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
          setIsLoading={setIsLoading}
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
