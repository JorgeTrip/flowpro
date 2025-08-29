// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { ModuleLayout } from '@/app/components/layout/ModuleLayout';
import { useRedistribucionStockStore } from '@/app/stores/redistribucionStockStore';
import { UploadStep } from './components/UploadStep';
import { ConfigStep } from './components/ConfigStep';
import { ResultsStep } from './components/ResultsStep';

const LoadingIndicator = () => (
  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75">
    <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-500 border-t-transparent"></div>
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => (
    <div className="my-4 rounded-md border border-red-200 bg-red-50 p-4 dark:bg-red-900/20 dark:border-red-500/30">
        <p className="text-sm font-medium text-red-800 dark:text-red-400">{message}</p>
    </div>
);

export default function RedistribucionStockPage() {
  const { step, isLoading, error } = useRedistribucionStockStore();

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
      titulo="Redistribución de Stock"
      descripcion="Analice el stock entre depósitos y determine qué productos redistribuir según la rotación mensual."
      breadcrumbs={[{ nombre: 'Dashboard', href: '/' }, { nombre: 'Redistribución Stock' }]}
    >
      <div className="relative">
        {isLoading && <LoadingIndicator />}
        {error && <ErrorMessage message={error} />}
        {renderStep()}
      </div>
    </ModuleLayout>
  );
}
