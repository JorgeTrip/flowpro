// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
import React from 'react';

interface BreadcrumbItem {
  nombre: string;
  href?: string;
}

interface ModuleLayoutProps {
  titulo: string;
  descripcion: string;
  children: React.ReactNode;
  acciones?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  configuracion?: React.ReactNode;
}

export function ModuleLayout({ 
  titulo, 
  descripcion, 
  children, 
  acciones = null,
  breadcrumbs = [],
  configuracion = null 
}: ModuleLayoutProps) {
  return (
    <div className="container mx-auto max-w-7xl space-y-8">
      {/* Header universal de módulos */}
      <div className="border-b pb-6">
        {breadcrumbs.length > 0 && (
          <nav className="mb-4">
            <ol className="flex space-x-2 text-sm text-gray-500">
              {breadcrumbs.map((item, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && <span className="mx-2">/</span>}
                  <span>{item.nombre}</span>
                </li>
              ))}
            </ol>
          </nav>
        )}
        
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{titulo}</h1>
            <p className="mt-2 text-lg text-gray-600">{descripcion}</p>
          </div>
          
          {acciones && (
            <div className="flex shrink-0 space-x-3">{acciones}</div>
          )}
        </div>
      </div>

      {/* Área de configuración opcional */}
      {configuracion && (
        <div className="rounded-lg border bg-gray-50 p-4">
          {configuracion}
        </div>
      )}

      {/* Contenido principal del módulo */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}
