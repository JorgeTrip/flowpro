// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
import type { Modulo } from '@/app/lib/moduleRegistry';
import Link from 'next/link';

export function ModuloDashboardWidget({ modulo }: { modulo: Modulo }) {
  return (
    <Link href={modulo.ruta} className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
      <div className="flex items-center space-x-4">
        <span className="text-3xl">{modulo.icono}</span>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{modulo.nombre}</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{modulo.descripcion}</p>
        </div>
      </div>
    </Link>
  );
}
