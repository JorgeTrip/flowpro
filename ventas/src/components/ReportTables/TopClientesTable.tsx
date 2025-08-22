import React, { useState, useEffect } from 'react';
import { Table, Typography, Radio, Select, Space, Divider, Switch } from 'antd';
import { Venta } from '../../types/Venta';
import { topClientesPorRubro } from '../../utils/procesamiento';

interface Props {
  ventas: Venta[];
  tipo: 'Minoristas' | 'Distribuidores';
}

/**
 * Tabla de top clientes minoristas/distribuidores
 */
const { Option } = Select;

const { Text } = Typography;

const TopClientesTable: React.FC<Props> = ({ ventas, tipo }) => {
  const [numClientes, setNumClientes] = useState<number>(20);
  const [metrica, setMetrica] = useState<'importe' | 'cantidad'>('importe');
  const [orden, setOrden] = useState<'mas' | 'menos'>('mas');
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
      // Obtener datos para este mes
      const datosDelMes = topClientesPorRubro(ventas, tipo, 1, 'importe', 'mas', mes);
      return datosDelMes.length > 0;
    });
    setMesesConDatos(mesesDisponibles);
    
    // Si estamos en modo individual pero no hay mes seleccionado, seleccionar el primero disponible
    if (filtroMeses === 'individual' && !mesSeleccionado && mesesDisponibles.length > 0) {
      setMesSeleccionado(mesesDisponibles[0]);
    }
  }, [ventas, tipo, filtroMeses, mesSeleccionado, meses]);
  
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
  
  // Obtener datos según el tipo de visualización, métrica, orden y el filtro de mes
  const data = topClientesPorRubro(
    ventas, 
    tipo, 
    numClientes, 
    metrica, 
    orden, 
    filtroMesActual(), 
    mesesConDatos
  );

  return (
    <div style={{ maxWidth: 300, marginRight: 16, display: 'inline-block', verticalAlign: 'top' }}>
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
            value={numClientes.toString()}
            style={{ width: 120 }}
            onChange={(value) => setNumClientes(parseInt(value))}
          >
            <Option value="5">Top 5</Option>
            <Option value="10">Top 10</Option>
            <Option value="20">Top 20</Option>
          </Select>
          
          <Select
            value={metrica}
            style={{ width: 120 }}
            onChange={(value) => setMetrica(value as 'importe' | 'cantidad')}
          >
            <Option value="importe">Importe</Option>
            <Option value="cantidad">Cantidad</Option>
          </Select>
          
          <Space align="center">
            <Text>Orden:</Text>
            <Switch
              checkedChildren="Más"
              unCheckedChildren="Menos"
              checked={orden === 'mas'}
              onChange={(checked) => setOrden(checked ? 'mas' : 'menos')}
            />
          </Space>
        </Space>
      </div>
      <Table
        title={() => <b>{tipo === 'Minoristas' ? `Top ${numClientes} clientes minoristas` : `Top ${numClientes} clientes distribuidores`} ({metrica === 'cantidad' ? 'Cantidades' : 'Importes'})</b>}
        size="small"
        columns={[
          { title: '#', dataIndex: 'idx', key: 'idx', render: (_: any, __: any, idx: number) => idx + 1 },
          { title: 'Cliente', dataIndex: 'cliente', key: 'cliente' },
          { 
            title: metrica === 'cantidad' ? 'Cantidad' : 'Total', 
            dataIndex: 'total', 
            key: 'total', 
            render: (v: number) => metrica === 'cantidad' ? 
              v.toLocaleString('es-AR') : 
              v.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }) 
          },
        ]}
        dataSource={data.map((row: any, idx: number) => ({ ...row, idx, key: row.cliente || `client-${idx}` }))}
        pagination={false}
        bordered
        rowKey={(row) => row.cliente}
      />
    </div>
  );
};

export default TopClientesTable;
