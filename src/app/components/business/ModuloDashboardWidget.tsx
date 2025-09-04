// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
import type { Modulo } from '@/app/lib/moduleRegistry';
import Link from 'next/link';

export function ModuloDashboardWidget({ modulo }: { modulo: Modulo }) {
  return (
    <div className="group relative">
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
      
      {/* Tooltip */}
      {modulo.tooltip && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-96 rounded-lg bg-gray-900 p-4 text-sm text-white shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 delay-300">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 -mt-1 h-2 w-2 rotate-45 bg-gray-900"></div>
          <h4 className="font-semibold text-blue-300 mb-2">{modulo.nombre}</h4>
          <p className="mb-3 text-gray-200">{modulo.tooltip.descripcion}</p>
          <div className="border-t border-gray-700 pt-2">
            <p className="text-xs text-gray-400 font-medium mb-1">Archivos requeridos:</p>
            <p className="text-xs text-gray-300">{modulo.tooltip.inputRequerido}</p>
          </div>
        </div>
      )}
    </div>
  );
}
