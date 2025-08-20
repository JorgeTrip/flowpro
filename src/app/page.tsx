// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { ModuleLayout } from '@/app/components/layout/ModuleLayout';
import { ModuloDashboardWidget } from '@/app/components/business/ModuloDashboardWidget';
import { ModulosDisponiblesPanel } from '@/app/components/business/ModulosDisponiblesPanel';
import { MODULOS_DISPONIBLES } from '@/app/lib/moduleRegistry';

export default function DashboardPage() {
  const modulosActivos = MODULOS_DISPONIBLES.filter(m => m.activo);

  return (
    <ModuleLayout
      titulo="Dashboard Principal"
      descripcion="Bienvenido a FlowPro. Seleccione un módulo para comenzar."
      breadcrumbs={[{ nombre: 'Dashboard' }]}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modulosActivos.map(modulo => (
          <ModuloDashboardWidget key={modulo.id} modulo={modulo} />
        ))}
      </div>

      <ModulosDisponiblesPanel />
    </ModuleLayout>
  );
}

