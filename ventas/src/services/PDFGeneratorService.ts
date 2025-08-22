import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { ReporteConfig, ComponenteReporte, TipoComponente } from '../types/ReporteConfig';
import { Venta } from '../types/Venta';

/**
 * Servicio para generar PDFs a partir de configuraciones de reportes
 */
export const PDFGeneratorService = {
  /**
   * Genera un PDF a partir de una configuración de reporte
   */
  generarPDF: async (config: ReporteConfig, ventas: Venta[], elementosDOM: Record<string, HTMLElement>): Promise<void> => {
    try {
      // Crear documento PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Agregar título y fecha
      doc.setFontSize(18);
      doc.text(config.nombre, 14, 20);
      
      doc.setFontSize(10);
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-AR')}`, 14, 28);
      
      if (config.descripcion) {
        doc.text(`Descripción: ${config.descripcion}`, 14, 35);
      }
      
      // Filtros aplicados
      const filtrosTexto = [
        `Meses: ${config.mesesSeleccionados.length > 0 ? config.mesesSeleccionados.join(', ') : 'Todos'}`,
        `Mostrar: ${config.mostrarImporte ? 'Importe' : ''}${config.mostrarImporte && config.mostrarCantidad ? ' y ' : ''}${config.mostrarCantidad ? 'Cantidad' : ''}`
      ].join(' | ');
      
      doc.text(filtrosTexto, 14, 42);
      
      // Posición Y actual para ir agregando contenido
      let yPos = 50;
      
      // Ordenar componentes por orden
      const componentesOrdenados = [...config.componentes].sort((a, b) => a.orden - b.orden);
      
      // Agregar cada componente al PDF
      for (const componente of componentesOrdenados) {
        // Verificar si hay espacio suficiente para el componente, si no, nueva página
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        // Agregar título del componente
        doc.setFontSize(12);
        doc.text(componente.titulo, 14, yPos);
        yPos += 8;
        
        // Obtener el elemento DOM correspondiente
        const elementoDOM = elementosDOM[componente.id];
        if (!elementoDOM) {
          console.warn(`No se encontró el elemento DOM para el componente ${componente.id}`);
          continue;
        }
        
        // Convertir el elemento a imagen y agregarlo al PDF
        try {
          const canvas = await html2canvas(elementoDOM, {
            scale: 1,
            logging: false,
            useCORS: true
          });
          
          const imgData = canvas.toDataURL('image/png');
          
          // Calcular dimensiones para mantener la proporción
          const imgWidth = 180;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Verificar si la imagen cabe en la página actual
          if (yPos + imgHeight > 280) {
            doc.addPage();
            yPos = 20;
            doc.setFontSize(12);
            doc.text(componente.titulo + ' (continuación)', 14, yPos);
            yPos += 8;
          }
          
          // Agregar la imagen al PDF
          doc.addImage(imgData, 'PNG', 14, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 15;
        } catch (error) {
          console.error(`Error al convertir el componente ${componente.id} a imagen:`, error);
        }
      }
      
      // Guardar el PDF
      doc.save(`${config.nombre.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      throw error;
    }
  },
  
  /**
   * Genera una vista previa del PDF (retorna un blob URL)
   */
  generarVistaPreviaPDF: async (config: ReporteConfig, ventas: Venta[], elementosDOM: Record<string, HTMLElement>): Promise<string> => {
    try {
      // Crear documento PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Agregar título y fecha
      doc.setFontSize(18);
      doc.text(config.nombre, 14, 20);
      
      doc.setFontSize(10);
      doc.text(`Vista previa generada el: ${new Date().toLocaleDateString('es-AR')}`, 14, 28);
      
      // Posición Y actual para ir agregando contenido
      let yPos = 40;
      
      // Ordenar componentes por orden
      const componentesOrdenados = [...config.componentes].sort((a, b) => a.orden - b.orden);
      
      // Agregar cada componente al PDF
      for (const componente of componentesOrdenados) {
        // Verificar si hay espacio suficiente para el componente, si no, nueva página
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        // Agregar título del componente
        doc.setFontSize(12);
        doc.text(componente.titulo, 14, yPos);
        yPos += 8;
        
        // Obtener el elemento DOM correspondiente
        const elementoDOM = elementosDOM[componente.id];
        if (!elementoDOM) {
          console.warn(`No se encontró el elemento DOM para el componente ${componente.id}`);
          continue;
        }
        
        // Convertir el elemento a imagen y agregarlo al PDF
        try {
          const canvas = await html2canvas(elementoDOM, {
            scale: 1,
            logging: false,
            useCORS: true
          });
          
          const imgData = canvas.toDataURL('image/png');
          
          // Calcular dimensiones para mantener la proporción
          const imgWidth = 180;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Verificar si la imagen cabe en la página actual
          if (yPos + imgHeight > 280) {
            doc.addPage();
            yPos = 20;
            doc.setFontSize(12);
            doc.text(componente.titulo + ' (continuación)', 14, yPos);
            yPos += 8;
          }
          
          // Agregar la imagen al PDF
          doc.addImage(imgData, 'PNG', 14, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 15;
        } catch (error) {
          console.error(`Error al convertir el componente ${componente.id} a imagen:`, error);
        }
      }
      
      // Generar blob URL para vista previa
      const blobPDF = doc.output('blob');
      return URL.createObjectURL(blobPDF);
    } catch (error) {
      console.error('Error al generar vista previa del PDF:', error);
      throw error;
    }
  }
};

export default PDFGeneratorService;
