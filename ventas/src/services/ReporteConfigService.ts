import { ReporteConfig } from '../types/ReporteConfig';

const STORAGE_KEY = 'reporteConfigs';

/**
 * Servicio para manejar la persistencia de configuraciones de reportes
 */
export const ReporteConfigService = {
  /**
   * Obtiene todas las configuraciones guardadas
   */
  obtenerConfiguraciones: (): ReporteConfig[] => {
    try {
      const configsJson = localStorage.getItem(STORAGE_KEY);
      return configsJson ? JSON.parse(configsJson) : [];
    } catch (error) {
      console.error('Error al obtener configuraciones:', error);
      return [];
    }
  },

  /**
   * Guarda una nueva configuración
   */
  guardarConfiguracion: (config: ReporteConfig): boolean => {
    try {
      const configs = ReporteConfigService.obtenerConfiguraciones();
      
      // Si ya existe una configuración con el mismo ID, la actualizamos
      const index = configs.findIndex(c => c.id === config.id);
      if (index >= 0) {
        configs[index] = config;
      } else {
        configs.push(config);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
      return true;
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      return false;
    }
  },

  /**
   * Elimina una configuración por su ID
   */
  eliminarConfiguracion: (id: string): boolean => {
    try {
      const configs = ReporteConfigService.obtenerConfiguraciones();
      const nuevasConfigs = configs.filter(c => c.id !== id);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevasConfigs));
      return true;
    } catch (error) {
      console.error('Error al eliminar configuración:', error);
      return false;
    }
  },

  /**
   * Obtiene una configuración por su ID
   */
  obtenerConfiguracionPorId: (id: string): ReporteConfig | null => {
    try {
      const configs = ReporteConfigService.obtenerConfiguraciones();
      return configs.find(c => c.id === id) || null;
    } catch (error) {
      console.error('Error al obtener configuración por ID:', error);
      return null;
    }
  },

  /**
   * Exporta todas las configuraciones a un archivo JSON
   */
  exportarConfiguraciones: (): void => {
    try {
      const configs = ReporteConfigService.obtenerConfiguraciones();
      const configsJson = JSON.stringify(configs, null, 2);
      
      const blob = new Blob([configsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-configs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Limpieza
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    } catch (error) {
      console.error('Error al exportar configuraciones:', error);
    }
  },

  /**
   * Importa configuraciones desde un archivo JSON
   */
  importarConfiguraciones: async (archivo: File): Promise<boolean> => {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const contenido = e.target?.result as string;
            const configs = JSON.parse(contenido) as ReporteConfig[];
            
            // Validar que sea un array de configuraciones válidas
            if (!Array.isArray(configs)) {
              throw new Error('El archivo no contiene un array de configuraciones');
            }
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
            resolve(true);
          } catch (error) {
            console.error('Error al procesar el archivo:', error);
            reject(error);
          }
        };
        
        reader.onerror = (error) => {
          console.error('Error al leer el archivo:', error);
          reject(error);
        };
        
        reader.readAsText(archivo);
      });
    } catch (error) {
      console.error('Error al importar configuraciones:', error);
      return false;
    }
  }
};

export default ReporteConfigService;
