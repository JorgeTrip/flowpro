import React, { useState, useEffect } from 'react';
import { Card, Table, Select, Space, Divider, Switch, Typography, Button, Popover, Checkbox } from 'antd';
import { FilterOutlined } from '@ant-design/icons';

import { 
  topProductosPorCategoria,
  topProductosPorCategoriaImporte
} from '../../utils/procesamiento-categorias';
import { Venta } from '../../types/Venta';

const { Option } = Select;
const { Text } = Typography;
const { Group: CheckboxGroup } = Checkbox;

interface Props {
  ventas: Venta[];
}

/**
 * Tabla de productos más vendidos por categoría
 */
const TopProductosPorCategoriaTable: React.FC<Props> = ({ ventas }) => {
  const [mostrarCantidad, setMostrarCantidad] = useState<boolean>(true);
  const [topPorCategoria, setTopPorCategoria] = useState<number>(3);
  const [filtroMeses, setFiltroMeses] = useState<'todos' | 'conDatos' | 'individual'>('todos');
  const [mesSeleccionado, setMesSeleccionado] = useState<string | null>(null);
  const [mesesConDatos, setMesesConDatos] = useState<string[]>([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);
  const [popoverVisible, setPopoverVisible] = useState<boolean>(false);
  const [ordenAscendente, setOrdenAscendente] = useState<boolean>(false); // Por defecto, orden descendente (mayor a menor)
  
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  // Identificar meses que tienen datos
  useEffect(() => {
    // Verificar cada mes para ver si tiene datos
    const mesesDisponibles = meses.filter(mes => {
      // Consideramos que un mes tiene datos si hay al menos una venta en ese mes
      return ventas.some(v => {
        let mesVenta = '';
        if (typeof v.Fecha === 'string' && v.Fecha.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          const [dd, mm, yyyy] = v.Fecha.split('/');
          const mesIdx = parseInt(mm, 10) - 1;
          mesVenta = meses[mesIdx] || '';
        } else {
          const fecha = new Date(v.Fecha);
          mesVenta = meses[fecha.getMonth()] || '';
        }
        return mesVenta === mes;
      });
    });
    setMesesConDatos(mesesDisponibles);
    
    // Si estamos en modo individual pero no hay mes seleccionado, seleccionar el primero disponible
    if (filtroMeses === 'individual' && !mesSeleccionado && mesesDisponibles.length > 0) {
      setMesSeleccionado(mesesDisponibles[0]);
    }
  }, [ventas, filtroMeses, mesSeleccionado, meses]);
  
  // Determinar qué filtro de mes usar
  const filtroMesActual = () => {
    if (filtroMeses === 'todos') {
      return 'todos';
    } else if (filtroMeses === 'conDatos') {
      return 'conDatos';
    } else if (filtroMeses === 'individual' && mesSeleccionado) {
      return mesSeleccionado;
    }
    return 'todos'; // Por defecto, mostrar todos los meses
  };
  
  // Obtener datos según el tipo de métrica (cantidad o importe)
  const data = mostrarCantidad
    ? topProductosPorCategoria(ventas, topPorCategoria, filtroMesActual(), mesesConDatos)
    : topProductosPorCategoriaImporte(ventas, topPorCategoria, filtroMesActual(), mesesConDatos);
  
  // Si hay categorías seleccionadas, filtrar solo esas categorías
  let dataFiltrada = categoriasSeleccionadas.length > 0
    ? data.filter(item => categoriasSeleccionadas.includes(item.categoria))
    : data;
    
  // Aplicar ordenamiento según la selección del usuario
  dataFiltrada = [...dataFiltrada].sort((a, b) => {
    const valorA = mostrarCantidad ? a.cantidadCategoria : a.totalCategoria;
    const valorB = mostrarCantidad ? b.cantidadCategoria : b.totalCategoria;
    return ordenAscendente ? valorA - valorB : valorB - valorA;
  });
  
  // Formatear valores para la tabla
  const formatValue = (value: number) => {
    if (mostrarCantidad) {
      return value.toLocaleString('es-AR');
    } else {
      return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
    }
  };
  
  // Preparar datos para la tabla
  const prepararDatosTabla = () => {
    const resultado: any[] = [];
    
    // Calcular el total general para los porcentajes
    const totalGeneral = dataFiltrada.reduce((sum, cat) => {
      return mostrarCantidad 
        ? sum + cat.cantidadCategoria 
        : sum + cat.totalCategoria;
    }, 0);
    
    dataFiltrada.forEach(categoria => {
      // Calcular el porcentaje de la categoría sobre el total general
      const valorCategoria = mostrarCantidad ? categoria.cantidadCategoria : categoria.totalCategoria;
      const porcentajeCategoria = totalGeneral > 0 
        ? ((valorCategoria / totalGeneral) * 100).toFixed(1) 
        : '0.0';
      
      // Añadir el total de la categoría
      resultado.push({
        key: `cat-${categoria.categoria}`,
        categoria: categoria.categoria,
        descripcion: 'TOTAL CATEGORÍA',
        articulo: '',
        value: valorCategoria,
        porcentaje: porcentajeCategoria,
        porcentajeLabel: `${porcentajeCategoria}% del total`,
        isCategory: true
      });
      
      // Añadir cada producto de la categoría
      categoria.productos.forEach((producto, index) => {
        // Calcular el porcentaje del producto sobre su categoría
        const valorProducto = mostrarCantidad ? producto.cantidad : producto.total;
        const porcentajeProducto = valorCategoria > 0 
          ? ((valorProducto / valorCategoria) * 100).toFixed(1) 
          : '0.0';
        
        resultado.push({
          key: `prod-${categoria.categoria}-${producto.articulo}`,
          categoria: '',
          descripcion: producto.descripcion,
          articulo: producto.articulo,
          value: valorProducto,
          porcentaje: porcentajeProducto,
          porcentajeLabel: `${porcentajeProducto}% de la categoría`,
          isCategory: false
        });
      });
    });
    
    return resultado;
  };
  
  const tableData = prepararDatosTabla();
  
  // Columnas para la tabla
  const columns = [
    {
      title: 'Categoría',
      dataIndex: 'categoria',
      key: 'categoria',
      width: '20%',
      render: (text: string, record: any) => (
        <span style={{ 
          fontWeight: record.isCategory ? 'bold' : 'normal',
          color: record.isCategory ? '#333' : '#666'
        }}>
          {text}
        </span>
      )
    },
    {
      title: 'Producto',
      dataIndex: 'descripcion',
      key: 'descripcion',
      width: '30%',
      render: (text: string, record: any) => (
        <span style={{ 
          fontWeight: record.isCategory ? 'bold' : 'normal',
          color: record.isCategory ? '#333' : '#666',
          paddingLeft: record.isCategory ? '0' : '20px'
        }}>
          {text}
        </span>
      )
    },
    {
      title: 'Código',
      dataIndex: 'articulo',
      key: 'articulo',
      width: '15%',
      render: (text: string) => text || '-'
    },
    {
      title: mostrarCantidad ? 'Cantidad' : 'Importe',
      dataIndex: 'value',
      key: 'value',
      width: '20%',
      align: 'right' as 'right',
      render: (value: number, record: any) => (
        <span style={{ 
          fontWeight: record.isCategory ? 'bold' : 'normal',
          color: record.isCategory ? '#333' : '#666'
        }}>
          {formatValue(value)}
        </span>
      )
    },
    {
      title: 'Porcentaje',
      dataIndex: 'porcentaje',
      key: 'porcentaje',
      width: '15%',
      align: 'right' as 'right',
      render: (value: string, record: any) => (
        <div>
          <span style={{ 
            fontWeight: record.isCategory ? 'bold' : 'normal',
            color: record.isCategory ? '#333' : '#666'
          }}>
            {value}%
          </span>
          <br />
          <span style={{ 
            fontSize: '11px', 
            color: '#999'
          }}>
            {record.isCategory ? 'del total' : 'de la categoría'}
          </span>
        </div>
      )
    }
  ];
  
  return (
    <Card 
      title="Top Ventas por Categoría de Producto" 
      className="report-table-card"
      extra={
        <Space wrap>
          <Select
            value={filtroMeses}
            style={{ width: 180 }}
            onChange={(value) => {
              setFiltroMeses(value);
              if (value === 'individual' && mesesConDatos.length > 0 && !mesSeleccionado) {
                setMesSeleccionado(mesesConDatos[0]);
              }
            }}
          >
            <Option value="todos">Todos los meses</Option>
            <Option value="conDatos">Solo meses con datos</Option>
            <Option value="individual">Seleccionar mes</Option>
          </Select>
          
          {filtroMeses === 'individual' && (
            <Select
              value={mesSeleccionado || (mesesConDatos.length > 0 ? mesesConDatos[0] : meses[0])}
              style={{ width: 150 }}
              onChange={(value) => setMesSeleccionado(value)}
            >
              {meses.map(mes => (
                <Option key={mes} value={mes} disabled={!mesesConDatos.includes(mes)}>
                  {mes}{!mesesConDatos.includes(mes) ? ' (sin datos)' : ''}
                </Option>
              ))}
            </Select>
          )}
          
          <Divider type="vertical" />
          
          <Select
            value={topPorCategoria.toString()}
            style={{ width: 120 }}
            onChange={(value) => setTopPorCategoria(parseInt(value))}
          >
            <Option value="1">Top 1</Option>
            <Option value="2">Top 2</Option>
            <Option value="3">Top 3</Option>
            <Option value="4">Top 4</Option>
            <Option value="5">Top 5</Option>
          </Select>
          
          <Select
            value={mostrarCantidad ? 'cantidad' : 'importe'}
            style={{ width: 120 }}
            onChange={(value) => setMostrarCantidad(value === 'cantidad')}
          >
            <Option value="cantidad">Cantidad</Option>
            <Option value="importe">Importe</Option>
          </Select>
          
          <Popover
            content={
              <div style={{ width: 250 }}>
                <div style={{ marginBottom: 8 }}>
                  <CheckboxGroup
                    options={data.map(cat => ({ label: cat.categoria, value: cat.categoria }))}
                    value={categoriasSeleccionadas}
                    onChange={(values) => setCategoriasSeleccionadas(values as string[])}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <Button 
                    size="small" 
                    onClick={() => setCategoriasSeleccionadas([])}
                  >
                    Limpiar
                  </Button>
                  <Button 
                    type="primary" 
                    size="small" 
                    onClick={() => setPopoverVisible(false)}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            }
            title="Seleccionar categorías"
            trigger="click"
            open={popoverVisible}
            onOpenChange={setPopoverVisible}
          >
            <Button style={{ width: 180 }} icon={<FilterOutlined />}>
              {categoriasSeleccionadas.length === 0 ? 'Todas las categorías' : 
               categoriasSeleccionadas.length === 1 ? categoriasSeleccionadas[0] : 
               `${categoriasSeleccionadas.length} categorías`}
            </Button>
          </Popover>
          
          <Divider type="vertical" />
          
          <Space align="center">
            <Text>Orden:</Text>
            <Switch
              checkedChildren="Ascendente"
              unCheckedChildren="Descendente"
              checked={ordenAscendente}
              onChange={(checked) => setOrdenAscendente(checked)}
            />
          </Space>
        </Space>
      }
    >
      <Table 
        columns={columns} 
        dataSource={tableData}
        pagination={false}
        size="small"
        rowClassName={(record) => record.isCategory ? 'categoria-row' : 'producto-row'}
      />
      
      <style>
        {`
        .categoria-row {
          background-color: #f0f0ff;
        }
        .producto-row {
          background-color: #ffffff;
        }
        .ant-table-row:hover > td {
          background-color: #f5f5f5 !important;
        }
        .categoria-row:hover > td {
          background-color: #e6e6ff !important;
        }
        `}
      </style>
    </Card>
  );
};

export default TopProductosPorCategoriaTable;
