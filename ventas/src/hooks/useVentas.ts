import { useState, useEffect } from 'react';
import { Venta } from '../types/Venta';

/**
 * Hook para obtener y manejar los datos de ventas
 */
export const useVentas = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarVentas = async () => {
      try {
        setCargando(true);
        
        // Obtener ventas del localStorage (asumiendo que ya están cargadas)
        const ventasGuardadas = localStorage.getItem('ventas');
        
        if (ventasGuardadas) {
          setVentas(JSON.parse(ventasGuardadas));
        } else {
          // Si no hay ventas en localStorage, podríamos cargarlas de un archivo o API
          // Por ahora, dejamos un array vacío
          setVentas([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error al cargar ventas:', err);
        setError('Error al cargar los datos de ventas');
        setVentas([]);
      } finally {
        setCargando(false);
      }
    };

    cargarVentas();
  }, []);

  return { ventas, cargando, error, setVentas };
};
