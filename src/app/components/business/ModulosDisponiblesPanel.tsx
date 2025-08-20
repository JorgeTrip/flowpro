// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { MODULOS_DISPONIBLES } from '@/app/lib/moduleRegistry';

export function ModulosDisponiblesPanel() {
  const modulosInactivos = MODULOS_DISPONIBLES.filter(m => !m.activo);

  if (modulosInactivos.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Módulos Disponibles Próximamente</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Amplíe las capacidades de FlowPro activando nuevos módulos.</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modulosInactivos.map(modulo => (
          <div key={modulo.id} className="rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{modulo.icono}</span>
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-300">{modulo.nombre}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{modulo.descripcion}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
