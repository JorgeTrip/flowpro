'use client';

import { useAsistenciasStore } from '@/app/stores/asistenciasStore';
import { FileUpload, ProcessedExcelData } from '@/app/components/shared/FileUpload';
import type { ExcelRow } from '@/app/stores/estimarDemandaStore';

export function UploadStep() {
  const {
    fichadasFile,
    setFichadasFile,
    setFichadasData,
    setIsLoading,
    setError,
    setStep,
  } = useAsistenciasStore();

  const handleFichadasLoad = (file: File, { data, columns, previewData }: ProcessedExcelData<ExcelRow>) => {
    setFichadasFile(file);
    setFichadasData(data, columns, previewData);
  };

  const handleNext = () => {
    if (fichadasFile) setStep(2);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="space-y-8">
        <FileUpload<ExcelRow>
          title="1. Cargar planilla de fichadas"
          description="Planilla con columnas: Empleado, Fecha, Hora, Tipo (Entrada/Salida)"
          file={fichadasFile}
          onFileLoad={handleFichadasLoad}
          setIsLoading={setIsLoading}
          setError={setError}
          headerRowIndex={10}
        />
      </div>
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleNext}
          disabled={!fichadasFile}
          className="rounded-md bg-blue-600 px-4 py-2 text-white font-semibold shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
