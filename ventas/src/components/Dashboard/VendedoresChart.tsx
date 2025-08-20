import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, Label, LabelList
} from 'recharts';
import { Select, Typography, Space, Divider } from 'antd';
import ExportButton from '../common/ExportButton';
import { agruparPorVendedor } from '../../utils/procesamiento';
import { agruparPorVendedorCantidad } from '../../utils/procesamiento-cantidades';
import { Venta } from '../../types/Venta';
import '../../styles/Dashboard.css';

const { Option } = Select;
const { Text } = Typography;

interface Props {
  ventas: Venta[];
}

/**
 * Gráfico de barras para ventas por vendedor
 */
// Componente personalizado para mostrar etiquetas con múltiples líneas
const CustomizedLabel = (props: any) => {
  const { x, y, width, height, index, value } = props;
  
  // Obtener el elemento de datos correspondiente
  if (!props.data || !props.data[index]) return null;
  const item = props.data[index];
  
  // Formatear valores
  const porcentaje = item.porcentaje || '0%';
  const importeFormateado = item.importe?.toLocaleString('es-AR', { 
    style: 'currency', 
    currency: 'ARS', 
    maximumFractionDigits: 0 
  }) || '$0';
  const cantidadFormateada = item.cantidad?.toLocaleString('es-AR') || '0';
  
  return (
    <g>
      {/* Porcentaje en negrita */}
      <text 
        x={x + width + 5} 
        y={y + height / 2 - 8} 
        fill="#333" 
        textAnchor="start" 
        dominantBaseline="middle"
        fontWeight="bold"
        fontSize={13}
      >
        {porcentaje}
      </text>
      
      {/* Importe y unidades en texto normal */}
      <text 
        x={x + width + 5} 
        y={y + height / 2 + 8} 
        fill="#333" 
        textAnchor="start" 
        dominantBaseline="middle"
        fontSize={11}
      >
        {`${importeFormateado} | ${cantidadFormateada} u.`}
      </text>
    </g>
  );
};

// Función para formatear nombres propios (primera letra mayúscula, resto minúscula)
const formatearNombrePropio = (nombre: string): string => {
  if (!nombre) return '';
  
  // Si el nombre tiene múltiples palabras (ej: "JUAN CARLOS")
  if (nombre.includes(' ')) {
    return nombre
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
      .join(' ');
  }
  
  // Nombre simple
  return nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase();
};

const VendedoresChart: React.FC<Props> = ({ ventas }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [mesSeleccionado, setMesSeleccionado] = useState<string>('Total');
  const [mostrarCantidad, setMostrarCantidad] = useState<boolean>(false);
  const [filtroMeses, setFiltroMeses] = useState<'todos' | 'conDatos' | 'individual'>('todos');
  
  // Identificar meses que tienen datos
  const [mesesConDatos, setMesesConDatos] = useState<string[]>([]);
  
  // Definición de meses
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  // Procesar datos de ventas
  const { resultado: datosImporte, vendedores } = agruparPorVendedor(ventas);
  const { resultado: datosCantidad } = agruparPorVendedorCantidad(ventas);
  
  useEffect(() => {
    const mesesDisponibles = meses.filter(mes => {
      let tieneDatos = false;
      vendedores.forEach(vendedor => {
        if ((datosImporte[mes]?.[vendedor]?.AX || 0) > 0 || (datosCantidad[mes]?.[vendedor]?.AX || 0) > 0) {
          tieneDatos = true;
        }
      });
      return tieneDatos;
    });
    setMesesConDatos(mesesDisponibles);
  }, [ventas, datosImporte, datosCantidad, vendedores, meses]);
  
  // Actualizar mesSeleccionado cuando cambia el filtro
  useEffect(() => {
    if (filtroMeses === 'todos') {
      setMesSeleccionado('Total');
    } else if (filtroMeses === 'conDatos' && mesesConDatos.length > 0) {
      setMesSeleccionado('MesesConDatos');
    } else if (filtroMeses === 'individual' && mesesConDatos.length > 0 && mesSeleccionado === 'Total') {
      setMesSeleccionado(mesesConDatos[0]);
    }
  }, [filtroMeses, mesesConDatos, mesSeleccionado]);
  
  // Preparar datos para el gráfico
  let data: Array<{vendedor: string; value: number; porcentaje?: string; importe?: number; cantidad?: number; infoAdicional?: string}> = [];
  
  if (mesSeleccionado === 'Total') {
    // Calcular totales por vendedor
    const totales: Record<string, { AX: number, cantidad: number }> = {};
    
    vendedores.forEach(vendedor => {
      totales[vendedor] = { AX: 0, cantidad: 0 };
      
      meses.forEach(mes => {
        totales[vendedor].AX += datosImporte[mes]?.[vendedor]?.AX || 0;
        totales[vendedor].cantidad += datosCantidad[mes]?.[vendedor]?.AX || 0;
      });
    });
    
    // Calcular el total general para porcentajes
    const totalGeneral = vendedores.reduce((sum, vendedor) => {
      return mostrarCantidad ? 
        sum + totales[vendedor].cantidad : 
        sum + totales[vendedor].AX;
    }, 0);
    
    if (mostrarCantidad) {
      data = vendedores
        .map(vendedor => ({
          vendedor: formatearNombrePropio(vendedor),
          value: totales[vendedor].cantidad,
          porcentaje: ((totales[vendedor].cantidad / totalGeneral) * 100).toFixed(1) + '%',
          importe: totales[vendedor].AX,
          cantidad: totales[vendedor].cantidad,
          infoAdicional: ''
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10); // Mostrar solo los 10 principales vendedores
    } else {
      data = vendedores
        .map(vendedor => ({
          vendedor: formatearNombrePropio(vendedor),
          value: totales[vendedor].AX,
          porcentaje: ((totales[vendedor].AX / totalGeneral) * 100).toFixed(1) + '%',
          importe: totales[vendedor].AX,
          cantidad: totales[vendedor].cantidad,
          infoAdicional: ''
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10); // Mostrar solo los 10 principales vendedores
    }
  } else {
    // Calcular el total general para porcentajes
    const totalGeneral = vendedores.reduce((sum, vendedor) => {
      return mostrarCantidad ? 
        sum + (datosCantidad[mesSeleccionado]?.[vendedor]?.AX || 0) : 
        sum + (datosImporte[mesSeleccionado]?.[vendedor]?.AX || 0);
    }, 0);
    
    if (mostrarCantidad) {
      data = vendedores
        .map(vendedor => {
          const cantidad = datosCantidad[mesSeleccionado]?.[vendedor]?.AX || 0;
          const importe = datosImporte[mesSeleccionado]?.[vendedor]?.AX || 0;
          return {
            vendedor: formatearNombrePropio(vendedor),
            value: cantidad,
            porcentaje: totalGeneral > 0 ? ((cantidad / totalGeneral) * 100).toFixed(1) + '%' : '0%',
            importe: importe,
            cantidad: cantidad,
            infoAdicional: ''
          };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    } else {
      data = vendedores
        .map(vendedor => {
          const importe = datosImporte[mesSeleccionado]?.[vendedor]?.AX || 0;
          const cantidad = datosCantidad[mesSeleccionado]?.[vendedor]?.AX || 0;
          return {
            vendedor: formatearNombrePropio(vendedor),
            value: importe,
            porcentaje: totalGeneral > 0 ? ((importe / totalGeneral) * 100).toFixed(1) + '%' : '0%',
            importe: importe,
            cantidad: cantidad,
            infoAdicional: ''
          };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    }
  }
  
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
          <p style={{ margin: 0 }}><strong>{label}</strong></p>
          <p style={{ margin: '5px 0', color: payload[0].color }}>
            {mostrarCantidad ? 'Cantidad: ' : 'Importe: '}
            <strong>{formatValue(payload[0].value)}</strong>
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Calcular el valor máximo para el dominio del eje X (5% más que el valor máximo)
  const maxValue = Math.max(...data.map(item => item.value)) * 1.3;
  
  // Configuración para el nombre del archivo de exportación
  const exportConfig = {
    tipo: 'grafico',
    nombre: 'top_vendedores',
    periodo: mesSeleccionado === 'Total' ? 'todos_los_meses' : mesSeleccionado,
    modo: mostrarCantidad ? 'cantidad' : 'importe'
  };

  return (
    <div style={{ width: '100%', height: 420, position: 'relative' }} ref={chartRef}>
      <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
        <ExportButton 
          elementoRef={chartRef} 
          nombreArchivo={exportConfig.nombre}
          titulo={`Top Vendedores - ${mostrarCantidad ? 'Cantidad' : 'Importe'}`}
          configuracion={{
            periodo: mesSeleccionado === 'Total' ? 'todos' : mesSeleccionado,
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
              if (value === 'individual' && mesesConDatos.length > 0 && mesSeleccionado === 'Total') {
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
            value={mostrarCantidad ? 'cantidad' : 'importe'}
            style={{ width: 120 }}
            onChange={(value) => setMostrarCantidad(value === 'cantidad')}
          >
            <Option value="importe">Importe</Option>
            <Option value="cantidad">Cantidad</Option>
          </Select>
        </Space>
      </div>
      
      <ResponsiveContainer>
        <BarChart
          data={data.map(item => ({ ...item, key: `vendedor-${item.vendedor}` }))}
          layout="vertical"
          margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
          barCategoryGap={10}
          className="vendedores-chart-3d"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            domain={[0, maxValue]}
            tickFormatter={(value) => {
            // Formatear valores con separadores de miles y notación de millones
            if (mostrarCantidad) {
              return value.toLocaleString('es-AR', { maximumFractionDigits: 0 });
            } else {
              if (value >= 1000000) {
                const valorFormateado = (value / 1000000).toLocaleString('es-AR', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1
                });
                return `$${valorFormateado} mill.`;
              } else {
                return `$${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
              }
            }
          }} />
          <YAxis type="category" dataKey="vendedor" width={110} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <defs>
            <linearGradient id="colorBar" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#9F9AE3" stopOpacity={1}/>
              <stop offset="75%" stopColor="#6F6BB8" stopOpacity={1}/>
              <stop offset="100%" stopColor="#5A57A6" stopOpacity={1}/>
            </linearGradient>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
              <feOffset result="offOut" in="SourceGraphic" dx="3" dy="3" />
              <feColorMatrix result="matrixOut" in="offOut" type="matrix"
                values="0.2 0 0 0 0 0 0.2 0 0 0 0 0 0.2 0 0 0 0 0 1 0" />
              <feGaussianBlur result="blurOut" in="matrixOut" stdDeviation="3" />
              <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
            </filter>
          </defs>
          <Bar 
            dataKey="value" 
            name={mostrarCantidad ? "Cantidad" : "Ventas"} 
            fill="url(#colorBar)"
            stroke="#5A57A6"
            strokeWidth={1}
            radius={[0, 4, 4, 0]}
            barSize={16}
            filter="url(#shadow)"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={`url(#colorBar)`}
              />
            ))}
            <LabelList 
              content={<CustomizedLabel data={data} />}
              position="right"
              dataKey="value"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <Text type="secondary">
          {mostrarCantidad 
            ? 'Top vendedores por cantidad' 
            : 'Top vendedores por importe (ARS)'}
        </Text>
      </div>
    </div>
  );
};

export default VendedoresChart;
