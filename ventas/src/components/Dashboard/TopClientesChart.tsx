import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Select, Typography, Space, Switch, Divider } from 'antd';
import { topClientesPorRubro } from '../../utils/procesamiento';
import { Venta } from '../../types/Venta';
import ExportButton from '../common/ExportButton';

const { Option } = Select;
const { Text } = Typography;

interface Props {
  ventas: Venta[];
  tipo?: 'Distribuidores' | 'Minoristas';
}

/**
 * Gráfico de barras para los clientes principales
 */
const TopClientesChart: React.FC<Props> = ({ ventas, tipo: tipoInicial }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [tipoClienteInterno, setTipoClienteInterno] = useState<'Minoristas' | 'Distribuidores'>('Distribuidores');
  const [numClientes, setNumClientes] = useState<number>(10);
  const [metrica, setMetrica] = useState<'importe' | 'cantidad'>('importe');
  const [orden, setOrden] = useState<'mas' | 'menos'>('mas');
  const [filtroMeses, setFiltroMeses] = useState<'todos' | 'conDatos' | 'individual'>('todos');
  const [mesSeleccionado, setMesSeleccionado] = useState<string | null>(null);
  const [mesesConDatos, setMesesConDatos] = useState<string[]>([]);
  
  // Usar el tipo proporcionado como prop o el estado interno
  const tipoCliente = tipoInicial || tipoClienteInterno;
  
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  // Identificar meses que tienen datos
  useEffect(() => {
    // Verificar cada mes para ver si tiene datos
    const mesesDisponibles = meses.filter(mes => {
      // Obtener datos para este mes
      const datosDelMes = topClientesPorRubro(ventas, tipoCliente, 1, metrica, orden, mes);
      return datosDelMes.length > 0;
    });
    setMesesConDatos(mesesDisponibles);
    
    // Si estamos en modo individual pero no hay mes seleccionado, seleccionar el primero disponible
    if (filtroMeses === 'individual' && !mesSeleccionado && mesesDisponibles.length > 0) {
      setMesSeleccionado(mesesDisponibles[0]);
    }
  }, [ventas, tipoCliente, metrica, orden, filtroMeses, mesSeleccionado]);
  
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
  
  // Obtener datos según el tipo de cliente, métrica, orden y filtro de mes seleccionados
  const data: Array<{cliente: string; total: number}> = topClientesPorRubro(
    ventas, 
    tipoCliente, 
    numClientes, 
    metrica, 
    orden, 
    filtroMesActual(), 
    mesesConDatos
  );
  
  // Formatear datos para el gráfico - ahora mostramos el nombre completo
  const chartData = data.map(item => ({
    key: `cliente-${item.cliente}`,
    nombre: item.cliente, // Mostrar el nombre completo sin truncar
    value: item.total,
    tooltipNombre: item.cliente
  }));
  
  // Formatear valores para el tooltip
  const formatValue = (value: number) => {
    if (metrica === 'importe') {
      return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
    } else {
      return value.toLocaleString('es-AR') + ' unidades';
    }
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc' }}>
          <p style={{ margin: 0 }}><strong>{payload[0].payload.tooltipNombre}</strong></p>
          <p style={{ margin: '5px 0', color: payload[0].color }}>
            {metrica === 'importe' ? 'Importe: ' : 'Cantidad: '}
            <strong>{formatValue(payload[0].value)}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  // Configuración para el nombre del archivo
  const configuracionExport = {
    tipo: tipoCliente,
    metrica,
    orden,
    cantidad: numClientes,
    filtro: filtroMeses,
    ...(filtroMeses === 'individual' && mesSeleccionado ? { mes: mesSeleccionado } : {})
  };

  return (
    <div ref={chartRef} style={{ width: '100%', height: 480, position: 'relative' }}>
      <ExportButton
        elementoRef={chartRef}
        nombreArchivo="top_clientes"
        titulo={`Clientes Principales - ${tipoCliente}`}
        configuracion={configuracionExport}
      />
      
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap', gap: '8px' }}>
        <Space wrap>
          {!tipoInicial && (
            <>
              <Select
                value={tipoClienteInterno}
                style={{ width: 140 }}
                onChange={(value) => setTipoClienteInterno(value as 'Minoristas' | 'Distribuidores')}
              >
                <Option value="Distribuidores">Distribuidores</Option>
                <Option value="Minoristas">Minoristas</Option>
              </Select>
              <Divider type="vertical" />
            </>
          )}
          
          <Select
            value={numClientes}
            style={{ width: 100 }}
            onChange={(value) => setNumClientes(value)}
          >
            <Option value={5}>Top 5</Option>
            <Option value={10}>Top 10</Option>
            <Option value={15}>Top 15</Option>
            <Option value={20}>Top 20</Option>
          </Select>
          
          <Select
            value={metrica}
            style={{ width: 120 }}
            onChange={(value) => setMetrica(value as 'importe' | 'cantidad')}
          >
            <Option value="importe">Importe</Option>
            <Option value="cantidad">Cantidad</Option>
          </Select>
          
          <Select
            value={orden}
            style={{ width: 120 }}
            onChange={(value) => setOrden(value as 'mas' | 'menos')}
          >
            <Option value="mas">Más vendidos</Option>
            <Option value="menos">Menos vendidos</Option>
          </Select>
          
          <Divider type="vertical" />
          
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
        </Space>
      </div>
      
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="nombre" 
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={(value) => {
              if (metrica === 'importe') {
                if (value >= 1000000) {
                  return `$${(value / 1000000).toFixed(1)}M`;
                } else if (value >= 1000) {
                  return `$${(value / 1000).toFixed(0)}K`;
                } else {
                  return `$${value}`;
                }
              } else {
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(1)}K`;
                } else {
                  return value.toString();
                }
              }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopClientesChart;
