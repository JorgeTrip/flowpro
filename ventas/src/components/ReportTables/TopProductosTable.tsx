import React, { useState, useEffect } from 'react';
import { Table, Typography, Select, Space, Divider, Switch } from 'antd';
import { topProductosMasVendidos, topProductosMenosVendidos } from '../../utils/procesamiento';
import { topProductosMasVendidosImporte } from '../../utils/procesamiento-cantidades';
import { Venta } from '../../types/Venta';

interface Props {
  ventas: Venta[];
  tipo: 'mas' | 'menos';
}

/**
 * Tabla de top productos más o menos vendidos
 */
const { Option } = Select;

const { Text } = Typography;

const TopProductosTable: React.FC<Props> = ({ ventas, tipo }) => {
  const [mostrarCantidad, setMostrarCantidad] = useState<boolean>(true);
  const [numProductos, setNumProductos] = useState<number>(20);
  const [filtroMeses, setFiltroMeses] = useState<'todos' | 'conDatos' | 'individual'>('todos');
  const [mesSeleccionado, setMesSeleccionado] = useState<string | null>(null);
  const [mesesConDatos, setMesesConDatos] = useState<string[]>([]);
  
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  // Identificar meses que tienen datos
  useEffect(() => {
    // Verificar cada mes para ver si tiene datos
    const mesesDisponibles = meses.filter(mes => {
      // Para simplificar, consideramos que un mes tiene datos si hay al menos una venta en ese mes
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

  // Obtener datos según el tipo, modo de visualización y filtro de mes
  let data: Array<any> = [];
  if (tipo === 'mas') {
    if (mostrarCantidad) {
      // Pasamos el filtro de mes y los meses con datos
      data = topProductosMasVendidos(ventas, numProductos, filtroMesActual(), mesesConDatos);
    } else {
      // Ahora la función de importe acepta parámetros de filtro de mes
      data = topProductosMasVendidosImporte(
        ventas, 
        numProductos, 
        filtroMesActual(), 
        mesesConDatos
      );
    }
  } else {
    // Para los menos vendidos, solo mostramos por cantidad
    // Pasamos el filtro de mes y los meses con datos
    data = topProductosMenosVendidos(ventas, numProductos, filtroMesActual(), mesesConDatos);
    if (!mostrarCantidad) {
      setMostrarCantidad(true);
    }
  }

  const columns = [
    { title: '#', dataIndex: 'idx', key: 'idx', render: (_: any, __: any, idx: number) => idx + 1 },
    { title: 'Código', dataIndex: 'articulo', key: 'articulo' },
    { title: 'Descripción', dataIndex: 'descripcion', key: 'descripcion' },
    { 
      title: mostrarCantidad ? 'Cantidad' : 'Importe', 
      dataIndex: mostrarCantidad ? 'cantidad' : 'total', 
      key: mostrarCantidad ? 'cantidad' : 'total', 
      render: (v: number) => mostrarCantidad ? 
        v.toLocaleString('es-AR') : 
        v.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }) 
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16 }}>
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
            value={numProductos.toString()}
            style={{ width: 120 }}
            onChange={(value) => setNumProductos(parseInt(value))}
          >
            <Option value="5">Top 5</Option>
            <Option value="10">Top 10</Option>
            <Option value="20">Top 20</Option>
          </Select>
          
          {/* Control para cambiar entre cantidad e importe */}
          <Select
            value={mostrarCantidad ? 'cantidad' : 'importe'}
            style={{ width: 120 }}
            onChange={(value) => setMostrarCantidad(value === 'cantidad')}
            disabled={tipo === 'menos'} // Deshabilitar para menos vendidos
          >
            <Option value="cantidad">Cantidad</Option>
            <Option value="importe">Importe</Option>
          </Select>
        </Space>
      </div>
      <Table
        title={() => <b>{tipo === 'mas' ? `Top ${numProductos} productos más vendidos` : `Top ${numProductos} productos menos vendidos`} ({mostrarCantidad ? 'Cantidades' : 'Importes'})</b>}
        columns={columns}
        dataSource={data.map((row: any, idx: number) => ({ ...row, idx, key: row.articulo || `item-${idx}` }))}
        pagination={false}
        bordered
        size="small"
        style={{ marginBottom: 32, width: '48%', display: 'inline-block', marginRight: '2%' }}
      />
    </>
  );
};

export default TopProductosTable;
