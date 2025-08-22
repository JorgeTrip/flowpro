import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Select, Typography, Space, Switch, Divider } from 'antd';
import ExportButton from '../common/ExportButton';
import { 
  topProductosMasVendidos, 
  topProductosMenosVendidos
} from '../../utils/procesamiento';
import { topProductosMasVendidosImporte } from '../../utils/procesamiento-cantidades';
import { Venta } from '../../types/Venta';

const { Option } = Select;
const { Text } = Typography;

interface Props {
  ventas: Venta[];
  tipo?: 'mas' | 'menos';
}

/**
 * Gráfico de barras para los productos más/menos vendidos
 */
const TopProductosChart: React.FC<Props> = ({ ventas, tipo: tipoInicial = 'mas' }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [mostrarCantidad, setMostrarCantidad] = useState<boolean>(true);
  const [numProductos, setNumProductos] = useState<number>(10);
  const [tipoInterno, setTipoInterno] = useState<'mas' | 'menos'>(tipoInicial);
  const [filtroMeses, setFiltroMeses] = useState<'todos' | 'conDatos' | 'individual'>('todos');
  const [mesSeleccionado, setMesSeleccionado] = useState<string | null>(null);
  const [mesesConDatos, setMesesConDatos] = useState<string[]>([]);
  
  // Usar el tipo proporcionado como prop o el estado interno
  const tipo = tipoInicial || tipoInterno;
  
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
  
  // Obtener datos según el tipo y el filtro de mes
  let data: Array<{articulo: string; descripcion: string; cantidad: number; total?: number}> = [];
  
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
      // Si se selecciona importe, forzamos a mostrar cantidad para los menos vendidos
      setMostrarCantidad(true);
    }
  }
  
  // Formatear datos para el gráfico - ahora mostramos el nombre completo
  const chartData = data.map(item => ({
    key: `producto-${item.articulo}`,
    nombre: item.descripcion || item.articulo, // Mostrar el nombre completo sin truncar
    value: mostrarCantidad ? item.cantidad : item.total,
    tooltipNombre: item.descripcion || item.articulo,
    codigo: item.articulo
  }));
  
  // Formatear valores para el tooltip
  const formatValue = (value: number) => {
    if (mostrarCantidad) {
      return value.toLocaleString('es-AR');
    } else {
      return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
    }
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc' }}>
          <p style={{ margin: 0 }}><strong>{payload[0].payload.tooltipNombre}</strong></p>
          <p style={{ margin: '5px 0' }}>
            Código: <strong>{payload[0].payload.codigo}</strong>
          </p>
          <p style={{ margin: '5px 0', color: payload[0].color }}>
            {mostrarCantidad ? 'Cantidad: ' : 'Importe: '}
            <strong>{formatValue(payload[0].value)}</strong>
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Calcular la altura adecuada según la cantidad de elementos
  const calcularAltura = () => {
    // Base de 250px + 25px por cada elemento
    const alturaBase = 250;
    const alturaPorElemento = 25;
    return alturaBase + (numProductos * alturaPorElemento);
  };
  
  // Configuración para el nombre del archivo de exportación
  const exportConfig = {
    tipo: 'grafico',
    nombre: tipo === 'mas' ? 'top_productos_mas_vendidos' : 'top_productos_menos_vendidos',
    modo: mostrarCantidad ? 'cantidad' : 'importe',
    periodo: filtroMesActual() === 'todos' ? 'todos_los_meses' : 
             filtroMesActual() === 'conDatos' ? 'solo_con_datos' : filtroMesActual()
  };

  return (
    <div style={{ width: '100%', height: calcularAltura(), position: 'relative' }} ref={chartRef}>
      <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
        <ExportButton 
          elementoRef={chartRef} 
          nombreArchivo={exportConfig.nombre}
          titulo={`${tipo === 'mas' ? 'Top Productos Más Vendidos' : 'Top Productos Menos Vendidos'} - ${mostrarCantidad ? 'Cantidad' : 'Importe'}`}
          configuracion={{
            periodo: filtroMesActual(),
            tipo: mostrarCantidad ? 'cantidad' : 'importe'
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
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
          
          {/* Switch para alternar entre más/menos vendidos */}
          <Space align="center">
            <Text>Orden:</Text>
            <Switch
              checkedChildren="Más"
              unCheckedChildren="Menos"
              checked={tipo === 'mas'}
              onChange={(checked) => {
                setTipoInterno(checked ? 'mas' : 'menos');
                if (!checked && !mostrarCantidad) {
                  // Forzar cantidad para los menos vendidos
                  setMostrarCantidad(true);
                }
              }}
              disabled={!!tipoInicial} // Deshabilitar si se proporciona un tipo como prop
            />
          </Space>
        </Space>
      </div>
      
      <div style={{ height: 'calc(100% - 70px)' }}> {/* Contenedor del gráfico */}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            style={{ width: '100%' }}
            className="top-productos-chart-3d"
          >
            <defs>
              <linearGradient id="colorBarProductosMas" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#98e3b5" stopOpacity={1}/>
                <stop offset="75%" stopColor="#82ca9d" stopOpacity={1}/>
                <stop offset="100%" stopColor="#6eb58a" stopOpacity={1}/>
              </linearGradient>
              <linearGradient id="colorBarProductosMenos" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ffaa7a" stopOpacity={1}/>
                <stop offset="75%" stopColor="#ff8042" stopOpacity={1}/>
                <stop offset="100%" stopColor="#e6703b" stopOpacity={1}/>
              </linearGradient>
              <filter id="shadowProductos" x="-10%" y="-10%" width="120%" height="130%">
                <feOffset result="offOut" in="SourceGraphic" dx="3" dy="3" />
                <feColorMatrix result="matrixOut" in="offOut" type="matrix"
                  values="0.2 0 0 0 0 0 0.2 0 0 0 0 0 0.2 0 0 0 0 0 1 0" />
                <feGaussianBlur result="blurOut" in="matrixOut" stdDeviation="3" />
                <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              tickFormatter={(value) => {
                // Formatear valores con separadores de miles y notación de millones
                if (!mostrarCantidad) {
                  if (value >= 1000000) {
                    const valorFormateado = (value / 1000000).toLocaleString('es-AR', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1
                    });
                    return `$${valorFormateado} mill.`;
                  } else {
                    return `$${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
                  }
                } else {
                  return value.toLocaleString('es-AR', { maximumFractionDigits: 0 });
                }
              }}
            />
            <YAxis 
              type="category" 
              dataKey="nombre" 
              width={180} // Aumentar el ancho para los rótulos
              tick={{ fontSize: 11 }} // Mantener el tamaño de fuente reducido
              interval={0} // Mostrar todos los rótulos
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="value" 
              name={mostrarCantidad ? "Cantidad" : "Importe"} 
              fill={tipo === 'mas' ? "url(#colorBarProductosMas)" : "url(#colorBarProductosMenos)"}
              stroke={tipo === 'mas' ? "#6eb58a" : "#e6703b"}
              strokeWidth={1}
              radius={[0, 4, 4, 0]}
              barSize={16}
              filter="url(#shadowProductos)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <Text type="secondary">
          {`${tipo === 'mas' ? 'Top' : 'Bottom'} ${numProductos} productos ${tipo === 'mas' ? 'más vendidos' : 'menos vendidos'} por ${mostrarCantidad ? 'cantidad' : 'importe'}`}
        </Text>
      </div>
    </div>
  );
};

export default TopProductosChart;
