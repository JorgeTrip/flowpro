import React, { useState, useRef, useEffect } from 'react';
import './ResizableComponent.css';

interface ResizableComponentProps {
  children: React.ReactNode;
  minHeight?: number;
  minWidth?: number;
  defaultHeight?: number;
  defaultWidth?: number;
  isPrintMode?: boolean;
  componentId?: string; // ID único para guardar dimensiones en localStorage
}

const ResizableComponent: React.FC<ResizableComponentProps> = ({
  children,
  minHeight = 200,
  minWidth = 300,
  defaultHeight = 400,
  defaultWidth = 800,
  isPrintMode = false,
  componentId
}) => {
  // Intentar recuperar las dimensiones guardadas del localStorage si hay un componentId
  const getSavedDimensions = () => {
    if (!componentId) return { height: defaultHeight, width: defaultWidth };
    
    try {
      const savedHeight = localStorage.getItem(`component-height-${componentId}`);
      const savedWidth = localStorage.getItem(`component-width-${componentId}`);
      return { 
        height: savedHeight ? parseInt(savedHeight, 10) : defaultHeight,
        width: savedWidth ? parseInt(savedWidth, 10) : defaultWidth
      };
    } catch (e) {
      return { height: defaultHeight, width: defaultWidth };
    }
  };
  
  const savedDimensions = getSavedDimensions();
  const [height, setHeight] = useState(savedDimensions.height);
  const [width, setWidth] = useState(savedDimensions.width);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null>(null);
  const componentRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // Manejar el inicio del redimensionamiento
  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, direction: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw') => {
    e.preventDefault();
    e.stopPropagation();
    
    // Capturar las posiciones iniciales
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    startHeightRef.current = height;
    startWidthRef.current = width;
    
    // Actualizar el estado de redimensionamiento
    setIsResizing(true);
    setResizeDirection(direction);
    
    // Añadir eventos globales para manejar el redimensionamiento
    document.addEventListener('mousemove', handleResizeMove, { capture: true });
    document.addEventListener('mouseup', handleResizeEnd, { capture: true });
  };

  // Manejar el movimiento durante el redimensionamiento
  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !resizeDirection) return;
    
    // Prevenir comportamiento predeterminado y propagación
    e.preventDefault();
    e.stopPropagation();
    
    // Calcular deltas desde la posición inicial
    const deltaX = e.clientX - startXRef.current;
    const deltaY = e.clientY - startYRef.current;
    
    // Calcular nuevas dimensiones basadas en la dirección de redimensionamiento
    let newHeight = height;
    let newWidth = width;
    
    // Ajustar altura según la dirección
    if (resizeDirection.includes('n')) {
      // Redimensionar desde arriba (invertir delta)
      newHeight = Math.max(minHeight, startHeightRef.current - deltaY);
    } else if (resizeDirection.includes('s')) {
      // Redimensionar desde abajo
      newHeight = Math.max(minHeight, startHeightRef.current + deltaY);
    }
    
    // Ajustar ancho según la dirección
    if (resizeDirection.includes('w')) {
      // Redimensionar desde la izquierda (invertir delta)
      newWidth = Math.max(minWidth, startWidthRef.current - deltaX);
    } else if (resizeDirection.includes('e')) {
      // Redimensionar desde la derecha
      newWidth = Math.max(minWidth, startWidthRef.current + deltaX);
    }
    
    // Actualizar dimensiones inmediatamente
    setHeight(newHeight);
    setWidth(newWidth);
  };

  // Manejar el final del redimensionamiento
  const handleResizeEnd = (e?: MouseEvent) => {
    if (!isResizing) return;
    
    // Prevenir comportamiento predeterminado si hay evento
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Actualizar estado
    setIsResizing(false);
    setResizeDirection(null);
    
    // Guardar las dimensiones en localStorage si hay un componentId
    if (componentId) {
      try {
        localStorage.setItem(`component-height-${componentId}`, height.toString());
        localStorage.setItem(`component-width-${componentId}`, width.toString());
      } catch (e) {
        console.error('Error al guardar dimensiones en localStorage:', e);
      }
    }
    
    // Eliminar eventos globales
    document.removeEventListener('mousemove', handleResizeMove, { capture: true });
    document.removeEventListener('mouseup', handleResizeEnd, { capture: true });
  };

  // Limpiar los event listeners cuando el componente se desmonta o cambia el estado de redimensionamiento
  useEffect(() => {
    // Si el componente se desmonta mientras está redimensionando, limpiar los listeners
    return () => {
      if (isResizing) {
        document.removeEventListener('mousemove', handleResizeMove, { capture: true });
        document.removeEventListener('mouseup', handleResizeEnd, { capture: true });
      }
    };
  }, [isResizing]);

  return (
    <div 
      ref={componentRef}
      className={`resizable-component ${isResizing ? `resizing-${resizeDirection}` : ''}`}
      style={{ 
        height: `${height}px`,
        width: `${width}px`,
        position: 'relative',
        marginBottom: '16px',
        overflow: 'hidden'
      }}
    >
      <div 
        className="resizable-content" 
        style={{ 
          height: '100%', 
          width: '100%',
          overflow: 'auto' // Permitir scroll si el contenido es mayor que el contenedor
        }}
      >
        {children}
      </div>
      
      {!isPrintMode && (
        <>
          {/* Controlador sur (abajo) */}
          <div 
            className="resize-handle resize-s"
            onMouseDown={(e) => handleResizeStart(e, 's')}
            style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              width: '100%',
              height: '10px',
              cursor: 'ns-resize',
              zIndex: 10,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <div 
              style={{
                width: '50px',
                height: '4px',
                backgroundColor: '#1890ff',
                borderRadius: '2px',
                transition: 'width 0.2s ease'
              }}
            />
          </div>
          
          {/* Controlador este (derecha) */}
          <div 
            className="resize-handle resize-e"
            onMouseDown={(e) => handleResizeStart(e, 'e')}
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              width: '10px',
              height: '100%',
              cursor: 'ew-resize',
              zIndex: 10,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <div 
              style={{
                width: '4px',
                height: '50px',
                backgroundColor: '#1890ff',
                borderRadius: '2px',
                transition: 'height 0.2s ease'
              }}
            />
          </div>
          
          {/* Controlador sureste (esquina inferior derecha) */}
          <div 
            className="resize-handle resize-se"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
            style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: '20px',
              height: '20px',
              cursor: 'nwse-resize',
              zIndex: 11
            }}
          >
            <div 
              style={{
                position: 'absolute',
                bottom: '3px',
                right: '3px',
                width: '10px',
                height: '10px',
                backgroundColor: '#1890ff',
                borderRadius: '2px',
                transition: 'width 0.2s ease, height 0.2s ease'
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ResizableComponent;
