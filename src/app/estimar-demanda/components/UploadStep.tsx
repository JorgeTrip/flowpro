// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useEstimarDemandaStore } from '@/app/stores/estimarDemandaStore';
import { FileUpload } from './FileUpload';

export function UploadStep() {
  const { ventasFile, stockFile, setStep } = useEstimarDemandaStore();

  const handleNextStep = () => {
    if (ventasFile && stockFile) {
      setStep(2);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="space-y-8">
        <FileUpload fileType="ventas" title="1. Cargar Archivo de Ventas del Año Anterior" />
        <FileUpload fileType="stock" title="2. Cargar Archivo de Stock Actual" />
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

