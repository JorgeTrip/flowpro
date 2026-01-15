'use client';

import { ModuleLayout } from '@/app/components/layout/ModuleLayout';
import { useAsistenciasStore } from '@/app/stores/asistenciasStore';
import { UploadStep } from '@/app/control-asistencias/components/UploadStep';
import { ConfigStep } from '@/app/control-asistencias/components/ConfigStep';
import { ResultsStep } from '@/app/control-asistencias/components/ResultsStep';

export default function ControlAsistenciasPage() {
  const { step, isLoading, error } = useAsistenciasStore();

  const renderStep = () => {
    switch (step) {
      case 1:
        return <UploadStep />;
      case 2:
        return <ConfigStep />;
      case 3:
        return <ResultsStep />;
      default:
        return <UploadStep />;
    }
  };

  return (
    <ModuleLayout
      titulo="Control de Asistencias"
      descripcion="Importe fichadas desde Excel, configure horarios y analice puntualidad."
      breadcrumbs={[{ nombre: 'Dashboard', href: '/' }, { nombre: 'Control de Asistencias' }]}
    >
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75 dark:bg-gray-900/75">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        )}
        {error && (
          <div className="my-4 rounded-md border border-red-200 bg-red-50 p-4 dark:bg-red-900/20 dark:border-red-500/30">
            <p className="text-sm font-medium text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}
        {renderStep()}
      </div>
    </ModuleLayout>
  );
}
