import React from 'react';
import { Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { PNGExportService } from '../../services/PNGExportService';

interface Props {
  elementoRef: React.RefObject<HTMLDivElement>;
  nombreArchivo: string;
  titulo: string;
  configuracion?: Record<string, any>;
  size?: 'small' | 'middle' | 'large';
  style?: React.CSSProperties;
}

/**
 * Botón para exportar gráficos y tablas a PNG
 */
const ExportButton: React.FC<Props> = ({ 
  elementoRef, 
  nombreArchivo, 
  titulo, 
  configuracion = {}, 
  size = 'small',
  style = {}
}) => {
  const handleExport = async () => {
    if (!elementoRef.current) {
      message.error('No se pudo encontrar el elemento a exportar');
      return;
    }

    try {
      message.loading('Exportando imagen...', 0.5);
      
      // Buscar el contenido del gráfico/tabla (excluyendo controles)
      const contenido = elementoRef.current.querySelector('.recharts-wrapper, .ant-table-wrapper, .recharts-responsive-container') as HTMLElement;
      
      if (!contenido) {
        message.error('No se pudo encontrar el contenido a exportar');
        return;
      }

      // Crear wrapper temporal para exportación
      const wrapper = PNGExportService.crearWrapperParaExportacion(contenido, titulo);
      
      try {
        await PNGExportService.exportarAPNG(wrapper, nombreArchivo, configuracion);
        message.success('Imagen exportada correctamente');
      } finally {
        // Limpiar wrapper temporal
        PNGExportService.limpiarWrapper(wrapper);
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      message.error('Error al exportar la imagen');
    }
  };

  return (
    <Button
      type="text"
      size={size}
      icon={<DownloadOutlined />}
      onClick={handleExport}
      title="Exportar a PNG"
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 10,
        ...style
      }}
    >
      PNG
    </Button>
  );
};

export default ExportButton;