// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { MODULOS_DISPONIBLES, CATEGORIAS_MODULOS, type Modulo } from '@/app/lib/moduleRegistry';
import { clsx } from 'clsx';
import { ThemeSwitcher } from './ThemeSwitcher';

function ModuloNavItem({ modulo }: { modulo: Modulo }) {
  const pathname = usePathname();
  const isActive = pathname === modulo.ruta;
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const itemRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (itemRef.current && modulo.tooltip) {
      const rect = itemRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: rect.right + 8, // 8px margin from the right edge
        y: rect.top
      });
    }
  };

  return (
    <div className="group relative" ref={itemRef} onMouseEnter={handleMouseEnter}>
      <Link
        href={modulo.ruta}
        className={clsx(
          'group relative flex items-center space-x-3 rounded-md p-2 text-sm font-medium overflow-hidden transition-colors duration-200',
          isActive
            ? 'text-blue-700 dark:text-blue-300'
            : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
        )}
      >
        {/* Active State Background */}
        {isActive && (
          <div className="absolute inset-0 rounded-md bg-gradient-to-br from-blue-400/10 via-cyan-400/8 to-blue-500/10"></div>
        )}
        
        {/* LED Diffuse Glow Effect */}
        <div className="absolute inset-0 rounded-md bg-gradient-to-br from-blue-400/20 via-cyan-400/15 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-000"></div>
        <div className="absolute inset-0 rounded-md shadow-[inset_0_0_30px_rgba(59,130,246,0.3)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-500"></div>
        
        <span className="relative text-lg">{modulo.icono}</span>
        <span className="relative">{modulo.nombre}</span>
      </Link>
      
      {/* Tooltip */}
      {modulo.tooltip && (
        <div 
          className="fixed z-[9999] w-80 rounded-lg bg-gray-900 p-4 text-sm text-white shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 delay-300"
          style={{ 
            left: `${tooltipPosition.x}px`, 
            top: `${tooltipPosition.y}px` 
          }}
        >
          <div className="absolute left-0 top-4 -ml-1 h-2 w-2 rotate-45 bg-gray-900"></div>
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

export function Sidebar() {
  const modulosPorCategoria = MODULOS_DISPONIBLES
    .filter(modulo => modulo.activo)
    .reduce((acc: Record<string, Modulo[]>, modulo) => {
      const categoria = modulo.categoria;
      if (!acc[categoria]) {
        acc[categoria] = [];
      }
      acc[categoria].push(modulo);
      return acc;
    }, {});

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Módulos FlowPro</h2>
      </div>
      <div className="flex-grow overflow-y-auto px-6">
        {Object.entries(modulosPorCategoria).map(([categoria, modulos]) => (
          <div key={categoria} className="mb-6">
            <h3 className={`mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400`}>
              {CATEGORIAS_MODULOS[categoria as keyof typeof CATEGORIAS_MODULOS].nombre}
            </h3>
            <nav className="space-y-1">
              {modulos.map((modulo) => (
                <ModuloNavItem key={modulo.id} modulo={modulo} />
              ))}
            </nav>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 p-6 dark:border-gray-700">
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Próximamente:</p>
        <div className="space-y-2">
        {MODULOS_DISPONIBLES
            .filter(m => !m.activo)
            .slice(0, 3)
            .map(modulo => (
              <div key={modulo.id} className="flex items-center space-x-2 p-2 text-gray-400 dark:text-gray-500">
                <span className="text-base">{modulo.icono}</span>
                <span className="text-sm">{modulo.nombre}</span>
              </div>
            ))}
        </div>
      </div>
      <div className="mt-auto border-t border-gray-200 dark:border-gray-700">
        <ThemeSwitcher />
      </div>
    </aside>
  );
}
