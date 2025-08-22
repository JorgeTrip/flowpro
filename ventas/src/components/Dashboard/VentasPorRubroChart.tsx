import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector 
} from 'recharts';
import { Select, Typography, Space, Slider, Row, Col, Divider } from 'antd';
import { agruparPorRubro } from '../../utils/procesamiento';
import { agruparPorRubroCantidad } from '../../utils/procesamiento-cantidades';
import { Venta } from '../../types/Venta';

const { Option } = Select;
const { Text } = Typography;

interface Props {
  ventas: Venta[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

/**
 * Gráfico de torta para ventas por rubro (Distribuidores/Minoristas)
 */
const VentasPorRubroChart: React.FC<Props> = ({ ventas }) => {
  const [mesSeleccionado, setMesSeleccionado] = useState<string>('Total');
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [mostrarCantidad, setMostrarCantidad] = useState<boolean>(false);
  const [distanciaEtiquetas, setDistanciaEtiquetas] = useState<number>(1.8); // Valor inicial del factor de distancia
  const [mesesConDatos, setMesesConDatos] = useState<string[]>([]);
  const [filtroMeses, setFiltroMeses] = useState<'todos' | 'conDatos' | 'individual'>('todos');
  
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const datosImporte = agruparPorRubro(ventas);
  const datosCantidad = agruparPorRubroCantidad(ventas);
  
  // Identificar meses que tienen datos
  useEffect(() => {
    const mesesDisponibles = meses.filter(mes => {
      const tieneDistribuidores = (datosImporte[mes]?.Distribuidores?.AX || 0) > 0 || 
                                 (datosCantidad[mes]?.Distribuidores?.AX || 0) > 0;
      const tieneMinoristas = (datosImporte[mes]?.Minoristas?.AX || 0) > 0 || 
                             (datosCantidad[mes]?.Minoristas?.AX || 0) > 0;
      return tieneDistribuidores || tieneMinoristas;
    });
    setMesesConDatos(mesesDisponibles);
  }, [ventas]);
  
  // Actualizar mesSeleccionado cuando cambia el filtro
  useEffect(() => {
    if (filtroMeses === 'todos') {
      setMesSeleccionado('Total');
    } else if (filtroMeses === 'conDatos' && mesesConDatos.length > 0) {
      setMesSeleccionado('MesesConDatos');
    }
  }, [filtroMeses, mesesConDatos]);
  
  // Preparar datos para el gráfico
  let data: Array<{name: string; value: number; percentage?: string}> = [];
  
  if (mesSeleccionado === 'Total') {
    // Calcular totales por rubro para todos los meses
    const totales = {
      Distribuidores: { AX: 0, cantidad: 0 },
      Minoristas: { AX: 0, cantidad: 0 }
    };
    
    meses.forEach(mes => {
      totales.Distribuidores.AX += datosImporte[mes]?.Distribuidores?.AX || 0;
      totales.Minoristas.AX += datosImporte[mes]?.Minoristas?.AX || 0;
      totales.Distribuidores.cantidad += datosCantidad[mes]?.Distribuidores?.AX || 0;
      totales.Minoristas.cantidad += datosCantidad[mes]?.Minoristas?.AX || 0;
    });
    
    if (mostrarCantidad) {
      data = [
        { name: 'Distribuidores', value: totales.Distribuidores.cantidad },
        { name: 'Minoristas', value: totales.Minoristas.cantidad }
      ];
    } else {
      data = [
        { name: 'Distribuidores', value: totales.Distribuidores.AX },
        { name: 'Minoristas', value: totales.Minoristas.AX }
      ];
    }
  } else if (mesSeleccionado === 'MesesConDatos') {
    // Calcular totales por rubro solo para meses con datos
    const totales = {
      Distribuidores: { AX: 0, cantidad: 0 },
      Minoristas: { AX: 0, cantidad: 0 }
    };
    
    mesesConDatos.forEach(mes => {
      totales.Distribuidores.AX += datosImporte[mes]?.Distribuidores?.AX || 0;
      totales.Minoristas.AX += datosImporte[mes]?.Minoristas?.AX || 0;
      totales.Distribuidores.cantidad += datosCantidad[mes]?.Distribuidores?.AX || 0;
      totales.Minoristas.cantidad += datosCantidad[mes]?.Minoristas?.AX || 0;
    });
    
    if (mostrarCantidad) {
      data = [
        { name: 'Distribuidores', value: totales.Distribuidores.cantidad },
        { name: 'Minoristas', value: totales.Minoristas.cantidad }
      ];
    } else {
      data = [
        { name: 'Distribuidores', value: totales.Distribuidores.AX },
        { name: 'Minoristas', value: totales.Minoristas.AX }
      ];
    }
  } else {
    // Mes individual seleccionado
    if (mostrarCantidad) {
      data = [
        { name: 'Distribuidores', value: datosCantidad[mesSeleccionado]?.Distribuidores?.AX || 0 },
        { name: 'Minoristas', value: datosCantidad[mesSeleccionado]?.Minoristas?.AX || 0 }
      ];
    } else {
      data = [
        { name: 'Distribuidores', value: datosImporte[mesSeleccionado]?.Distribuidores?.AX || 0 },
        { name: 'Minoristas', value: datosImporte[mesSeleccionado]?.Minoristas?.AX || 0 }
      ];
    }
  }
  
  // Calcular porcentajes y guardar valores originales
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Obtener los totales tanto en importe como en cantidad para cada rubro
  const totalesCompletos = {
    Distribuidores: { importe: 0, cantidad: 0 },
    Minoristas: { importe: 0, cantidad: 0 }
  };
  
  if (mesSeleccionado === 'Total') {
    meses.forEach(mes => {
      totalesCompletos.Distribuidores.importe += datosImporte[mes]?.Distribuidores?.AX || 0;
      totalesCompletos.Minoristas.importe += datosImporte[mes]?.Minoristas?.AX || 0;
      totalesCompletos.Distribuidores.cantidad += datosCantidad[mes]?.Distribuidores?.AX || 0;
      totalesCompletos.Minoristas.cantidad += datosCantidad[mes]?.Minoristas?.AX || 0;
    });
  } else if (mesSeleccionado === 'MesesConDatos') {
    mesesConDatos.forEach(mes => {
      totalesCompletos.Distribuidores.importe += datosImporte[mes]?.Distribuidores?.AX || 0;
      totalesCompletos.Minoristas.importe += datosImporte[mes]?.Minoristas?.AX || 0;
      totalesCompletos.Distribuidores.cantidad += datosCantidad[mes]?.Distribuidores?.AX || 0;
      totalesCompletos.Minoristas.cantidad += datosCantidad[mes]?.Minoristas?.AX || 0;
    });
  } else {
    totalesCompletos.Distribuidores.importe = datosImporte[mesSeleccionado]?.Distribuidores?.AX || 0;
    totalesCompletos.Minoristas.importe = datosImporte[mesSeleccionado]?.Minoristas?.AX || 0;
    totalesCompletos.Distribuidores.cantidad = datosCantidad[mesSeleccionado]?.Distribuidores?.AX || 0;
    totalesCompletos.Minoristas.cantidad = datosCantidad[mesSeleccionado]?.Minoristas?.AX || 0;
  }
  
  data = data.map(item => {
    const porcentaje = total > 0 ? (item.value / total * 100).toFixed(2) : '0.00';
    return {
      ...item,
      percentage: porcentaje,
      importeTotal: totalesCompletos[item.name].importe,
      cantidadTotal: totalesCompletos[item.name].cantidad
    };
  });
  
  // Formatear valores para el tooltip
  const formatValue = (value: number) => {
    if (mostrarCantidad) {
      return value.toLocaleString('es-AR');
    } else {
      return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
    }
  };
  
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  const onPieLeave = () => {
    setActiveIndex(undefined);
  };
  
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
    
    // Obtener el valor complementario (si estamos mostrando cantidad, obtener importe y viceversa)
    const valorComplementario = mostrarCantidad ? 
      payload.importeTotal : 
      payload.cantidadTotal;
    
    // Formatear el valor complementario
    const valorComplementarioFormateado = mostrarCantidad ? 
      valorComplementario.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }) : 
      valorComplementario.toLocaleString('es-AR');
    
    return (
      <g>
        <text x={cx} y={cy} dy={-30} textAnchor="middle" fill={fill}>
          {payload.name}
        </text>
        <text x={cx} y={cy} dy={-10} textAnchor="middle" fill="#333">
          {`${formatValue(payload.value)}`}
        </text>
        <text x={cx} y={cy} dy={10} textAnchor="middle" fill="#999">
          {`${(percent * 100).toFixed(2)}%`}
        </text>
        <text x={cx} y={cy} dy={30} textAnchor="middle" fill="#666" fontSize="12">
          {`(${mostrarCantidad ? 'Importe: ' : 'Cantidad: '}${valorComplementarioFormateado})`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };
  
  // Función para formatear números de forma compacta
  const formatearNumeroCompacto = (num: number, esMoneda: boolean) => {
    if (num >= 1000000) {
      return esMoneda
        ? `$${(num / 1000000).toFixed(1)}M`
        : `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return esMoneda
        ? `$${(num / 1000).toFixed(1)}K`
        : `${(num / 1000).toFixed(1)}K`;
    } else {
      return esMoneda
        ? `$${num.toFixed(0)}`
        : `${num.toFixed(0)}`;
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      // Obtener el valor complementario (si estamos mostrando cantidad, obtener importe y viceversa)
      const valorPrincipal = payload[0].value;
      const valorComplementario = mostrarCantidad ? 
        payload[0].payload.importeTotal : 
        payload[0].payload.cantidadTotal;
      
      // Formatear los valores (usar formato completo para el tooltip)
      const valorPrincipalFormateado = formatValue(valorPrincipal);
      const valorComplementarioFormateado = mostrarCantidad ? 
        valorComplementario.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }) : 
        valorComplementario.toLocaleString('es-AR');
      
      return (
        <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', maxWidth: '250px' }}>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>{payload[0].name}</p>
          <p style={{ margin: '5px 0', color: payload[0].color }}>
            {mostrarCantidad ? 'Cantidad: ' : 'Importe: '}
            <strong>{valorPrincipalFormateado}</strong>
          </p>
          <p style={{ margin: '5px 0' }}>
            {mostrarCantidad ? 'Importe: ' : 'Cantidad: '}
            <strong>{valorComplementarioFormateado}</strong>
          </p>
          <p style={{ margin: 0 }}>
            Porcentaje: <strong>{payload[0].payload.percentage}%</strong>
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div style={{ width: '100%', height: 470 }}>
      <div style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={24} md={16}>
            <Space wrap>
              <Select
                value={filtroMeses}
                style={{ width: 180 }}
                onChange={(value) => setFiltroMeses(value)}
              >
                <Option value="todos">Todos los meses</Option>
                <Option value="conDatos">Solo meses con datos</Option>
                <Option value="individual">Seleccionar mes</Option>
              </Select>
              
              {filtroMeses === 'individual' && (
                <Select
                  value={mesSeleccionado}
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
          </Col>
          <Col xs={24} sm={24} md={8}>
            <div style={{ padding: '0 10px' }}>
              <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                Distancia de etiquetas
              </Typography.Text>
              <Slider
                min={1}
                max={6}
                step={0.5}
                value={distanciaEtiquetas}
                onChange={(value) => setDistanciaEtiquetas(value)}
                tooltip={{ formatter: (value) => `${value}` }}
              />
            </div>
          </Col>
        </Row>
      </div>
      <ResponsiveContainer>
        <PieChart width={400} height={300}>
          <defs>
            <filter id="shadow3D" x="-10%" y="-10%" width="120%" height="130%">
              <feOffset result="offOut" in="SourceGraphic" dx="0" dy="3" />
              <feColorMatrix result="matrixOut" in="offOut" type="matrix"
                values="0.2 0 0 0 0 0 0.2 0 0 0 0 0 0.2 0 0 0 0 0 1 0" />
              <feGaussianBlur result="blurOut" in="matrixOut" stdDeviation="3" />
              <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
            </filter>
            <linearGradient id="colorDistribuidores" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0099ff" stopOpacity={1}/>
              <stop offset="75%" stopColor="#0088ee" stopOpacity={1}/>
              <stop offset="100%" stopColor="#0077dd" stopOpacity={1}/>
            </linearGradient>
            <linearGradient id="colorMinoristas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00ddbb" stopOpacity={1}/>
              <stop offset="75%" stopColor="#00ccaa" stopOpacity={1}/>
              <stop offset="100%" stopColor="#00bb99" stopOpacity={1}/>
            </linearGradient>
          </defs>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            startAngle={90}
            endAngle={-270}
            filter="url(#shadow3D)"
            className="ventas-rubro-chart-3d"
            label={props => {
              const { cx, cy, midAngle, innerRadius, outerRadius, name, percentage, value, importeTotal, cantidadTotal } = props;
              
              // Usar el gradiente correspondiente según el tipo de cliente
              const fill = name === 'Distribuidores' ? 'url(#colorDistribuidores)' : 'url(#colorMinoristas)';
              
              // Usar el valor actual que se está mostrando en el gráfico
              const valorMostrado = value;
              const valorComplementario = mostrarCantidad ? importeTotal : cantidadTotal;
              
              // Formatear los valores de forma compacta
              const formatearNumeroCompacto = (num: number, esMoneda: boolean) => {
                // Función auxiliar para formatear con separadores de miles
                const formatearConSeparadores = (valor: number, decimales: number = 1): string => {
                  return valor.toLocaleString('es-AR', {
                    minimumFractionDigits: decimales,
                    maximumFractionDigits: decimales
                  });
                };
                
                if (num >= 1000000) {
                  // Para millones, dividimos por 1,000,000 y usamos 'mill.'
                  const valorFormateado = formatearConSeparadores(num / 1000000);
                  return esMoneda
                    ? `$${valorFormateado} mill.`
                    : `${valorFormateado} mill.`;
                } else if (num >= 1000) {
                  // Para miles, mostramos el número completo con separadores
                  const valorFormateado = formatearConSeparadores(num, 0);
                  return esMoneda
                    ? `$${valorFormateado}`
                    : `${valorFormateado}`;
                } else {
                  // Para números pequeños, sin decimales
                  const valorFormateado = formatearConSeparadores(num, 0);
                  return esMoneda
                    ? `$${valorFormateado}`
                    : `${valorFormateado}`;
                }
              };
              
              const valorMostradoFormateado = formatearNumeroCompacto(valorMostrado, !mostrarCantidad);
              const valorComplementarioFormateado = formatearNumeroCompacto(valorComplementario, mostrarCantidad);
              
              // Posicionar horizontalmente a los costados de la torta
              // Sabemos que siempre hay exactamente 2 elementos: Distribuidores y Minoristas
              // Distribuidores siempre es el primer elemento (index 0) y Minoristas el segundo (index 1)
              
              // Determinar si es el primer elemento (Distribuidores) o el segundo (Minoristas)
              const esDistribuidores = name === 'Distribuidores';
              
              // Calcular posición horizontal fija en lugar de usar ángulos
              // Esto asegura que las etiquetas siempre estén a los lados, sin importar el tamaño de cada segmento
              // Factor de distancia más conservador para evitar que las etiquetas desborden el panel
              const factorDistancia = 0.8 + (distanciaEtiquetas * 0.4); // Usar el deslizador para ajustar distancia
              const x = esDistribuidores ? cx - (outerRadius * factorDistancia) : cx + (outerRadius * factorDistancia);
              const y = cy; // Centrado verticalmente
              
              // Alineación del texto según el lado
              const textAnchor = esDistribuidores ? 'end' : 'start';
              
              // No necesitamos agregar líneas conectoras adicionales ya que la torta ya las tiene
              
              return (
                <g>
                  
                  {/* Primera línea en NEGRITA: Nombre y porcentaje */}
                  <text 
                    x={x} 
                    y={y - 10} 
                    fill={fill || '#333'} 
                    textAnchor={textAnchor} 
                    dominantBaseline="central"
                    fontWeight="bold"
                    fontSize="14"
                  >
                    {name}: {typeof percentage === 'number' ? percentage.toFixed(2) : percentage}%
                  </text>
                  
                  {/* Segunda línea NORMAL: Valor principal */}
                  <text 
                    x={x} 
                    y={y + 10} 
                    fill={fill || '#666'} 
                    textAnchor={textAnchor} 
                    dominantBaseline="central"
                    fontSize="12"
                  >
                    {mostrarCantidad ? 'Cant: ' : '$: '}{valorMostradoFormateado}
                  </text>
                  
                  {/* Tercera línea NORMAL: Valor complementario */}
                  <text 
                    x={x} 
                    y={y + 30} 
                    fill={fill || '#666'} 
                    textAnchor={textAnchor} 
                    dominantBaseline="central"
                    fontSize="12"
                  >
                    {mostrarCantidad ? '$: ' : 'Cant: '}{valorComplementarioFormateado}
                  </text>
                </g>
              );
            }}
            labelLine={{
              stroke: "#666",
              strokeWidth: 1
            }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <Text type="secondary">
          {mostrarCantidad 
            ? 'Distribución de cantidades vendidas por rubro' 
            : 'Distribución de ventas por rubro (ARS)'}
        </Text>
      </div>
    </div>
  );
};

export default VentasPorRubroChart;
