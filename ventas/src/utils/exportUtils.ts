import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

export const exportComponentAsPng = async (element: HTMLElement, fileName: string) => {
  try {
    // Ocultar temporalmente los controles que no deben aparecer en la imagen
    const originalDisplay = element.style.display;
    element.style.display = 'block';
    
    // Crear el canvas con html2canvas
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // Mayor resolución
      logging: false,
      useCORS: true,
      allowTaint: true,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      width: element.scrollWidth,
      height: element.scrollHeight,
    } as any); // Usamos 'as any' para evitar problemas con los tipos de html2canvas
    
    // Restaurar el estado original del elemento
    element.style.display = originalDisplay;
    
    // Convertir el canvas a blob y descargar
    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `${fileName}.png`);
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error al exportar el componente:', error);
    return false;
  }
};

export const generateExportFileName = (baseName: string, config: Record<string, any> = {}) => {
  const configStr = Object.entries(config)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}_${value}`)
    .join('_');
    
  const cleanBaseName = baseName.toLowerCase().replace(/\s+/g, '_');
  const cleanConfigStr = configStr.toLowerCase().replace(/[^a-z0-9_]/gi, '');
  
  return cleanConfigStr 
    ? `${cleanBaseName}_${cleanConfigStr}` 
    : cleanBaseName;
};
