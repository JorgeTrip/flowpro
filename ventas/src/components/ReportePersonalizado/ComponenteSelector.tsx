import React from 'react';
import { List, Button, Tooltip, Typography, Divider } from 'antd';
import {
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  TableOutlined,
  UserOutlined,
  ShopOutlined
} from '@ant-design/icons';
import { TipoComponente } from '../../types/ReporteConfig';

const { Title } = Typography;

interface Props {
  onSeleccionarComponente: (tipo: TipoComponente) => void;
}

/**
 * Componente para seleccionar el tipo de componente a agregar al reporte
 */
export const ComponenteSelector: React.FC<Props> = ({ onSeleccionarComponente }) => {
  // Definición de los gráficos disponibles
  const graficosDisponibles = [
    {
      tipo: TipoComponente.VENTAS_MENSUALES,
      titulo: 'Ventas Mensuales',
      descripcion: 'Gráfico de barras con ventas mensuales',
      icono: <BarChartOutlined />
    },
    {
      tipo: TipoComponente.VENTAS_POR_RUBRO,
      titulo: 'Ventas por Rubro',
      descripcion: 'Gráfico circular con ventas por rubro',
      icono: <PieChartOutlined />
    },
    {
      tipo: TipoComponente.VENTAS_POR_ZONA,
      titulo: 'Ventas por Zona',
      descripcion: 'Gráfico circular con ventas por zona',
      icono: <PieChartOutlined />
    },
    {
      tipo: TipoComponente.TOP_PRODUCTOS,
      titulo: 'Top Productos',
      descripcion: 'Gráfico de barras con los productos más vendidos',
      icono: <BarChartOutlined />
    },
    {
      tipo: TipoComponente.TOP_CLIENTES,
      titulo: 'Top Clientes',
      descripcion: 'Gráfico de barras con los clientes principales',
      icono: <BarChartOutlined />
    },
    {
      tipo: TipoComponente.VENDEDORES,
      titulo: 'Vendedores',
      descripcion: 'Gráfico de barras con ventas por vendedor',
      icono: <UserOutlined />
    }
  ];

  // Definición de las tablas disponibles
  const tablasDisponibles = [
    {
      tipo: TipoComponente.TABLA_RESUMEN_MENSUAL,
      titulo: 'Tabla Resumen Mensual',
      descripcion: 'Tabla con resumen de ventas mensuales',
      icono: <TableOutlined />
    },
    {
      tipo: TipoComponente.TABLA_RUBRO,
      titulo: 'Tabla por Rubro',
      descripcion: 'Tabla con ventas por rubro',
      icono: <TableOutlined />
    },
    {
      tipo: TipoComponente.TABLA_ZONA,
      titulo: 'Tabla por Zona',
      descripcion: 'Tabla con ventas por zona',
      icono: <TableOutlined />
    },
    {
      tipo: TipoComponente.TABLA_VENDEDOR,
      titulo: 'Tabla por Vendedor',
      descripcion: 'Tabla con ventas por vendedor',
      icono: <TableOutlined />
    },
    {
      tipo: TipoComponente.TABLA_TOP_PRODUCTOS,
      titulo: 'Tabla Top Productos',
      descripcion: 'Tabla con los productos más vendidos',
      icono: <ShopOutlined />
    },
    {
      tipo: TipoComponente.TABLA_TOP_CLIENTES,
      titulo: 'Tabla Top Clientes',
      descripcion: 'Tabla con los clientes principales',
      icono: <UserOutlined />
    }
  ];

  // Interfaz para los items de componentes
  interface ComponenteItem {
    tipo: TipoComponente;
    titulo: string;
    descripcion: string;
    icono: React.ReactNode;
  }

  const renderComponentList = (items: ComponenteItem[], title: string) => (
    <>
      <Title level={4} style={{ marginTop: 16, marginBottom: 8 }}>{title}</Title>
      <Divider style={{ margin: '8px 0 16px' }} />
      <List
        size="small"
        grid={{ gutter: 16, column: 2 }}
        dataSource={items}
        renderItem={item => (
          <List.Item>
            <Tooltip title={item.descripcion}>
              <Button 
                icon={item.icono} 
                onClick={() => onSeleccionarComponente(item.tipo)}
                style={{ width: '100%', textAlign: 'left' }}
              >
                {item.titulo}
              </Button>
            </Tooltip>
          </List.Item>
        )}
      />
    </>
  );

  return (
    <div>
      {renderComponentList(graficosDisponibles, 'Gráficos')}
      {renderComponentList(tablasDisponibles, 'Tablas')}
    </div>
  );
};
