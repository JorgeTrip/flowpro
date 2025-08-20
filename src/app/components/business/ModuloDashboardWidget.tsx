// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
import type { Modulo } from '@/app/lib/moduleRegistry';
import Link from 'next/link';

export function ModuloDashboardWidget({ modulo }: { modulo: Modulo }) {
  return (
    <Link 
      href={modulo.ruta} 
      className="group relative block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 overflow-hidden"
    >
      {/* LED Diffuse Glow Effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-400/20 via-cyan-400/15 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-000"></div>
      <div className="absolute inset-0 rounded-lg shadow-[inset_0_0_30px_rgba(59,130,246,0.3)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-500"></div>
      
      <div className="relative flex items-center space-x-4">
        <span className="text-3xl">{modulo.icono}</span>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{modulo.nombre}</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{modulo.descripcion}</p>
        </div>
      </div>
    </Link>
  );
}
