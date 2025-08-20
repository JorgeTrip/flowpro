import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Venta } from '../types/Venta';

interface VentasContextType {
  ventas: Venta[];
  setVentas: (ventas: Venta[]) => void;
}

const VentasContext = createContext<VentasContextType | undefined>(undefined);

export const VentasProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ventas, setVentas] = useState<Venta[]>([]);

  // Cargar ventas del localStorage al iniciar
  useEffect(() => {
    const cargarVentasDesdeLocalStorage = () => {
      try {
        const ventasGuardadas = localStorage.getItem('ventas');
        if (ventasGuardadas) {
          const ventasParsed = JSON.parse(ventasGuardadas);
          setVentas(ventasParsed);
          console.log(`Datos cargados desde localStorage: ${ventasParsed.length} registros`);
        } else {
          console.log('No hay datos de ventas en localStorage');
        }
      } catch (error) {
        console.error('Error al cargar ventas desde localStorage:', error);
      }
    };

    cargarVentasDesdeLocalStorage();
  }, []);

  // Guardar ventas en localStorage cuando cambien
  useEffect(() => {
    if (ventas.length > 0) {
      try {
        // Verificar si ya hay datos en localStorage antes de intentar guardar
        const ventasActuales = localStorage.getItem('ventas');
        const ventasActualesParsed = ventasActuales ? JSON.parse(ventasActuales) : [];
        const yaHayDatos = ventasActualesParsed.length > 0;
        
        // Intentar guardar los datos completos
        localStorage.setItem('ventas', JSON.stringify(ventas));
        console.log(`Datos guardados en localStorage: ${ventas.length} registros`);
      } catch (error) {
        console.error('Error al guardar ventas en localStorage:', error);
        
        // Si hay un error de cuota excedida, intentar guardar una versión reducida
        if (error instanceof DOMException && 
            (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          console.log('Cuota de localStorage excedida. Intentando guardar versión reducida...');
          
          try {
            // Verificar si ya hay datos en localStorage
            const ventasActuales = localStorage.getItem('ventas');
            const ventasActualesParsed = ventasActuales ? JSON.parse(ventasActuales) : [];
            const yaHayDatos = ventasActualesParsed.length > 0;
            
            if (yaHayDatos) {
              // Si ya hay datos, mantenerlos y notificar al usuario
              console.log(`Se mantienen los datos existentes: ${ventasActualesParsed.length} registros`);
              
              // Calcular registros no guardados (la diferencia entre lo que se intentó guardar y lo que ya había)
              const registrosNoGuardados = ventas.length - ventasActualesParsed.length;
              const porcentajeGuardado = Math.round((ventasActualesParsed.length / ventas.length) * 100);
              
              // Solo mostrar alerta si hay una diferencia significativa
              if (registrosNoGuardados > 0 && ventasActualesParsed.length < ventas.length) {
                alert(`Almacenamiento limitado: Se mantienen ${ventasActualesParsed.length} de ${ventas.length} registros.

• Registros disponibles: ${ventasActualesParsed.length} (${porcentajeGuardado}%)
• Registros no guardados: ${registrosNoGuardados} (${100-porcentajeGuardado}%)

No hay suficiente espacio para guardar todos los registros nuevos, pero se mantienen los datos existentes.

Se recomienda exportar sus datos completos para evitar pérdida de información.`);
              }
              return; // Salir del método ya que mantenemos los datos existentes
            }
            
            // Si no hay datos previos, intentar guardar una versión reducida (solo los últimos 3 meses)
            const fechaActual = new Date();
            const tresMesesAtras = new Date();
            tresMesesAtras.setMonth(fechaActual.getMonth() - 3);
            
            const ventasReducidas = ventas.filter(venta => {
              const fechaVenta = new Date(venta.Fecha);
              return fechaVenta >= tresMesesAtras;
            });
            
            // Intentar guardar la versión reducida
            if (ventasReducidas.length > 0) {
              localStorage.setItem('ventas', JSON.stringify(ventasReducidas));
              console.log(`Datos reducidos guardados en localStorage: ${ventasReducidas.length} registros`);
              
              // Calcular registros no guardados
              const registrosNoGuardados = ventas.length - ventasReducidas.length;
              const porcentajeGuardado = Math.round((ventasReducidas.length / ventas.length) * 100);
              
              // Mostrar alerta al usuario con información detallada
              alert(`Almacenamiento limitado: Se guardaron ${ventasReducidas.length} de ${ventas.length} registros.

• Registros guardados: ${ventasReducidas.length} (${porcentajeGuardado}%)
• Registros no guardados: ${registrosNoGuardados} (${100-porcentajeGuardado}%)

Solo se pudieron guardar los datos de los últimos 3 meses. Los registros más antiguos no fueron almacenados.

Se recomienda exportar sus datos completos para evitar pérdida de información.`);
            }
          } catch (reducedError) {
            console.error('Error al guardar versión reducida:', reducedError);
            
            // Verificar si ya hay datos en localStorage a pesar del error
            try {
              const ventasActuales = localStorage.getItem('ventas');
              const ventasActualesParsed = ventasActuales ? JSON.parse(ventasActuales) : [];
              
              if (ventasActualesParsed.length > 0) {
                // Si hay datos existentes, notificar que se mantienen
                const registrosNoGuardados = ventas.length - ventasActualesParsed.length;
                const porcentajeGuardado = Math.round((ventasActualesParsed.length / ventas.length) * 100);
                
                alert(`No se pudieron guardar nuevos datos, pero se mantienen ${ventasActualesParsed.length} registros existentes.

• Registros disponibles: ${ventasActualesParsed.length} (${porcentajeGuardado}%)
• Registros no guardados: ${registrosNoGuardados} (${100-porcentajeGuardado}%)

El navegador no tiene suficiente espacio para los nuevos datos. Se mantienen los datos existentes.`);
                return;
              }
            } catch (e) {
              console.error('Error al verificar datos existentes:', e);
            }
            
            // Si no hay datos existentes o no se pudieron verificar
            alert(`Error de almacenamiento: No se pudo guardar ninguno de los ${ventas.length} registros.

• Registros intentados: ${ventas.length}
• Registros guardados: 0 (0%)
• Registros no guardados: ${ventas.length} (100%)

El navegador no tiene suficiente espacio de almacenamiento. Se recomienda exportar sus datos o reducir la cantidad de información cargada.`);
          }
        }
      }
    }
  }, [ventas]);

  return (
    <VentasContext.Provider value={{ ventas, setVentas }}>
      {children}
    </VentasContext.Provider>
  );
};

export const useVentas = () => {
  const context = useContext(VentasContext);
  if (!context) throw new Error('useVentas debe usarse dentro de VentasProvider');
  return context;
};
