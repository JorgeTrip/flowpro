// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MODULOS_DISPONIBLES, CATEGORIAS_MODULOS, type Modulo } from '@/app/lib/moduleRegistry';
import { clsx } from 'clsx';
import { ThemeSwitcher } from './ThemeSwitcher';

function ModuloNavItem({ modulo }: { modulo: Modulo }) {
  const pathname = usePathname();
  const isActive = pathname === modulo.ruta;

  return (
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
