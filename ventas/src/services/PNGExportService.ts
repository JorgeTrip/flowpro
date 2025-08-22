import html2canvas from 'html2canvas';

/**
 * Servicio para exportar elementos DOM a PNG
 */
export const PNGExportService = {
  /**
   * Exporta un elemento DOM a PNG
   * @param elemento - El elemento DOM a exportar
   * @param nombreArchivo - Nombre base del archivo
   * @param configuracion - Configuración actual del componente para incluir en el nombre
   */
  exportarAPNG: async (
    elemento: HTMLElement,
    nombreArchivo: string,
    configuracion: Record<string, any> = {}
  ): Promise<void> => {
    try {
      // Configurar html2canvas para mejor calidad
      const canvas = await html2canvas(elemento, {
        scale: 2, // Mayor resolución
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff',
        removeContainer: true,
        allowTaint: false,
        foreignObjectRendering: false
      });

      // Crear nombre de archivo con configuración
      const configTexto = Object.entries(configuracion)
        .filter(([_, value]) => value !== null && value !== undefined && value !== '')
        .map(([key, value]) => `${key}-${value}`)
        .join('_');
      
      const timestamp = new Date().toISOString().split('T')[0];
      const nombreCompleto = `${nombreArchivo}${configTexto ? '_' + configTexto : ''}_${timestamp}.png`
        .replace(/[^a-z0-9_-]/gi, '_')
        .toLowerCase();

      // Convertir canvas a blob y descargar
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = nombreCompleto;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('Error al exportar a PNG:', error);
      throw new Error('No se pudo exportar la imagen');
    }
  },

  /**
   * Crea un wrapper temporal para exportar solo el contenido sin controles
   * @param contenido - El elemento de contenido a exportar
   * @param titulo - Título del gráfico/tabla
   */
  crearWrapperParaExportacion: (contenido: HTMLElement, titulo: string): HTMLElement => {
    // Crear un contenedor temporal
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      background: white;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: auto;
      height: auto;
    `;

    // Agregar título
    const tituloElement = document.createElement('h3');
    tituloElement.textContent = titulo;
    tituloElement.style.cssText = `
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: #262626;
      text-align: center;
    `;
    wrapper.appendChild(tituloElement);

    // Clonar el contenido
    const contenidoClonado = contenido.cloneNode(true) as HTMLElement;
    wrapper.appendChild(contenidoClonado);

    // Agregar al DOM temporalmente
    document.body.appendChild(wrapper);

    return wrapper;
  },

  /**
   * Limpia el wrapper temporal
   */
  limpiarWrapper: (wrapper: HTMLElement): void => {
    if (wrapper && wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  }
};