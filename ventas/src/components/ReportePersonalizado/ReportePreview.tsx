import React, { useRef, useState } from 'react';
import { Empty, Card, Button, Space, Tooltip } from 'antd';
import { DeleteOutlined, EditOutlined, DragOutlined } from '@ant-design/icons';
import { useDrag, useDrop } from 'react-dnd';
import ResizableComponent from './ResizableComponent';
import './ReportePreview.css';
import { ReporteConfig, ComponenteReporte, TipoComponente } from '../../types/ReporteConfig';
import { Venta } from '../../types/Venta';
import VentasMensualesChart from '../Dashboard/VentasMensualesChart';
import VentasPorRubroChart from '../Dashboard/VentasPorRubroChart';
import VentasPorZonaChart from '../Dashboard/VentasPorZonaChart';
import TopProductosChart from '../Dashboard/TopProductosChart';
import TopClientesChart from '../Dashboard/TopClientesChart';
import VendedoresChart from '../Dashboard/VendedoresChart';
import ResumenMensualTable from '../ReportTables/ResumenMensualTable';
import RubroTable from '../ReportTables/RubroTable';
import ZonaTable from '../ReportTables/ZonaTable';
import VendedorTable from '../ReportTables/VendedorTable';
import TopProductosTable from '../ReportTables/TopProductosTable';
import TopClientesTable from '../ReportTables/TopClientesTable';

// Tipo para el ítem arrastrable
interface DragItem {
  index: number;
  id: string;
  type: string;
}

// Componente para un ítem arrastrable
const DraggableItem = ({ 
  componente, 
  index, 
  onEliminar, 
  onEditar, 
  moveItem, 
  children,
  registrarRef,
  isPrintMode = false
}) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'componente',
    item: { type: 'componente', id: componente.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const [, drop] = useDrop({
    accept: 'componente',
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // No reemplazar elementos consigo mismos
      if (dragIndex === hoverIndex) {
        return;
      }
      
      // Determinar rectángulo en pantalla
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Obtener punto medio vertical
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Determinar posición del mouse
      const clientOffset = monitor.getClientOffset();
      
      // Obtener píxeles hasta el top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;
      
      // Solo realizar el movimiento cuando el mouse ha cruzado la mitad de la altura del elemento
      // Cuando se arrastra hacia abajo, solo mover cuando el cursor está por debajo del 50%
      // Cuando se arrastra hacia arriba, solo mover cuando el cursor está por encima del 50%
      
      // Arrastrar hacia abajo
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      
      // Arrastrar hacia arriba
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      
      // Ejecutar el movimiento
      moveItem(dragIndex, hoverIndex);
      
      // Nota: estamos mutando el monitor item aquí!
      // Generalmente no es una buena idea, pero es una manera fácil de
      // coordinar con otros manejadores de eventos del drop
      // que podrían estar manejando el mismo item
      item.index = hoverIndex;
    },
  });
  
  const opacity = isDragging ? 0.5 : 1;
  
  // Inicializar drag & drop
  drag(drop(ref));
  
  // Registrar la referencia para el PDF
  React.useEffect(() => {
    if (ref.current) {
      registrarRef(componente.id, ref.current);
    }
  }, [componente.id, registrarRef]);
  
  // Calcular dimensiones predeterminadas basadas en el tipo de componente
  const getDefaultDimensions = () => {
    // Valores predeterminados para diferentes tipos de componentes
    if (componente.tipo.includes('TABLA')) {
      return { height: 500, width: 800 }; // Dimensiones para tablas
    } else if (componente.tipo === 'TOP_PRODUCTOS' || componente.tipo === 'TOP_CLIENTES') {
      return { height: 450, width: 850 }; // Dimensiones para gráficos de barras horizontales
    } else if (componente.tipo === 'VENTAS_POR_RUBRO' || componente.tipo === 'VENTAS_POR_ZONA') {
      return { height: 450, width: 600 }; // Dimensiones para gráficos circulares
    } else {
      return { height: 400, width: 800 }; // Dimensiones predeterminadas para otros gráficos
    }
  };
  
  const defaultDimensions = getDefaultDimensions();

  return (
    <div ref={ref} style={{ opacity, marginBottom: isPrintMode ? 0 : 16 }}>
      <ResizableComponent 
        defaultHeight={defaultDimensions.height}
        defaultWidth={defaultDimensions.width}
        minHeight={200}
        minWidth={300}
        isPrintMode={isPrintMode}
        componentId={componente.id}
      >
        <Card
          size="small"
          title={
            !isPrintMode ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <DragOutlined style={{ marginRight: 8, cursor: 'move' }} />
                {componente.titulo}
              </div>
            ) : null
          }
          extra={
            !isPrintMode ? (
              <Space>
                <Tooltip title="Editar">
                  <Button 
                    icon={<EditOutlined />} 
                    size="small" 
                    onClick={() => onEditar(componente)}
                  />
                </Tooltip>
                <Tooltip title="Eliminar">
                  <Button 
                    icon={<DeleteOutlined />} 
                    size="small" 
                    danger
                    onClick={() => onEliminar(componente.id)}
                  />
                </Tooltip>
              </Space>
            ) : null
          }
          style={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            ...(isPrintMode ? { border: 'none', borderRadius: 0 } : {})
          }}
          bodyStyle={{
            flex: 1,
            overflow: 'hidden',
            padding: isPrintMode ? 0 : undefined
          }}
          headStyle={{
            display: isPrintMode ? 'none' : undefined
          }}
        >
          <div style={{ height: '100%', overflow: 'hidden' }}>
            {children}
          </div>
        </Card>
      </ResizableComponent>
    </div>
  );
};

interface Props {
  config: ReporteConfig;
  ventas: Venta[];
  onReordenar: (componentes: ComponenteReporte[]) => void;
  onEliminar: (id: string) => void;
  onEditar: (componente: ComponenteReporte) => void;
  registrarRef: (id: string, ref: HTMLElement | null) => void;
  isPrintMode?: boolean;
}

/**
 * Componente para mostrar la vista previa del reporte
 */
export const ReportePreview: React.FC<Props> = ({ 
  config, 
  ventas, 
  onReordenar, 
  onEliminar, 
  onEditar,
  registrarRef,
  isPrintMode = false
}) => {
  // Verificar si hay datos de ventas
  React.useEffect(() => {
    if (ventas.length === 0) {
      console.log('No hay datos de ventas disponibles para la vista previa');
    } else {
      console.log(`Datos de ventas disponibles: ${ventas.length} registros`);
    }
  }, [ventas]);

  // Filtrar ventas por meses seleccionados si es necesario
  const ventasFiltradas = React.useMemo(() => {
    // Si no hay ventas, devolver array vacío
    if (!ventas || ventas.length === 0) {
      return [];
    }
    
    if (config.mesesSeleccionados.length === 0) {
      return ventas;
    }
    
    const mesesIndices = config.mesesSeleccionados.map(mes => {
      const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      return meses.indexOf(mes);
    });
    
    return ventas.filter(venta => {
      const fecha = new Date(venta.Fecha);
      const mes = fecha.getMonth();
      return mesesIndices.includes(mes);
    });
  }, [ventas, config.mesesSeleccionados]);
  
  // Mover un componente
  const moveItem = React.useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const componentes = [...config.componentes];
      const draggedItem = componentes[dragIndex];
      
      // Eliminar el elemento arrastrado
      componentes.splice(dragIndex, 1);
      // Insertar el elemento arrastrado en la nueva posición
      componentes.splice(hoverIndex, 0, draggedItem);
      
      onReordenar(componentes);
    },
    [config.componentes, onReordenar],
  );
  
  // Renderizar un componente según su tipo
  const renderComponente = (componente: ComponenteReporte) => {
    // Si no hay datos de ventas, mostrar un mensaje
    if (!ventasFiltradas || ventasFiltradas.length === 0) {
      return (
        <Empty 
          description="No hay datos disponibles para mostrar" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    // Definir la key para forzar re-render cuando cambian los datos
    const componentKey = `${componente.id}-${ventasFiltradas.length}`;

    switch (componente.tipo) {
      case TipoComponente.VENTAS_MENSUALES:
        return <VentasMensualesChart key={componentKey} ventas={ventasFiltradas} />;
      case TipoComponente.VENTAS_POR_RUBRO:
        return <VentasPorRubroChart key={componentKey} ventas={ventasFiltradas} />;
      case TipoComponente.VENTAS_POR_ZONA:
        return <VentasPorZonaChart key={componentKey} ventas={ventasFiltradas} />;
      case TipoComponente.TOP_PRODUCTOS:
        return <TopProductosChart key={componentKey} ventas={ventasFiltradas} tipo="mas" />;
      case TipoComponente.TOP_CLIENTES:
        return <TopClientesChart key={componentKey} ventas={ventasFiltradas} tipo="Distribuidores" />;
      case TipoComponente.VENDEDORES:
        return <VendedoresChart key={componentKey} ventas={ventasFiltradas} />;
      case TipoComponente.TABLA_RESUMEN_MENSUAL:
        return <ResumenMensualTable key={componentKey} ventas={ventasFiltradas} />;
      case TipoComponente.TABLA_RUBRO:
        return <RubroTable key={componentKey} ventas={ventasFiltradas} />;
      case TipoComponente.TABLA_ZONA:
        return <ZonaTable key={componentKey} ventas={ventasFiltradas} />;
      case TipoComponente.TABLA_VENDEDOR:
        return <VendedorTable key={componentKey} ventas={ventasFiltradas} />;
      case TipoComponente.TABLA_TOP_PRODUCTOS:
        return <TopProductosTable key={componentKey} ventas={ventasFiltradas} tipo="mas" />;
      case TipoComponente.TABLA_TOP_CLIENTES:
        return <TopClientesTable key={componentKey} ventas={ventasFiltradas} tipo="Distribuidores" />;
      default:
        return <Empty description="Componente no reconocido" />;
    }
  };
  
  // Si no hay componentes, mostrar mensaje vacío
  if (config.componentes.length === 0) {
    return (
      <Empty 
        description="Agrega componentes desde el panel izquierdo" 
        style={{ margin: '40px 0' }}
      />
    );
  }
  
  // Ordenar componentes por orden
  const componentesOrdenados = [...config.componentes].sort((a, b) => a.orden - b.orden);
  
  return (
    <div className={isPrintMode ? 'print-mode' : ''}>
      {componentesOrdenados.map((componente, index) => (
        <DraggableItem
          key={componente.id}
          componente={componente}
          index={index}
          onEliminar={onEliminar}
          onEditar={onEditar}
          moveItem={moveItem}
          registrarRef={registrarRef}
          isPrintMode={isPrintMode}
        >
          {renderComponente(componente)}
        </DraggableItem>
      ))}
    </div>
  );
};
