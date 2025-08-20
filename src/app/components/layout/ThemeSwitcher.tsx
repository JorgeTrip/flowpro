// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useAppStore } from '@/app/stores/appStore';
import { Moon, Sun } from 'lucide-react';

export function ThemeSwitcher() {
  const configuracionGlobal = useAppStore((state) => state.configuracionGlobal);
  const toggleTheme = useAppStore((state) => state.toggleTheme);

  return (
    <div className="flex items-center justify-between p-4">
      <span className="text-sm text-gray-400">Modo Oscuro</span>
      <button
        onClick={toggleTheme}
        className="relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-700"
      >
        <span className="sr-only">Use setting</span>
        <span
          className={`${configuracionGlobal.tema === 'dark' ? 'translate-x-5' : 'translate-x-0'}
            pointer-events-none relative inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        >
          <span
            className={`${configuracionGlobal.tema === 'dark' ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in'}
              absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
            aria-hidden="true"
          >
            <Sun className="h-4 w-4 text-gray-400" />
          </span>
          <span
            className={`${configuracionGlobal.tema === 'dark' ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out'}
              absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
            aria-hidden="true"
          >
            <Moon className="h-4 w-4 text-indigo-600" />
          </span>
        </span>
      </button>
    </div>
  );
}
