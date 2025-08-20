import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, Label, LabelList
} from 'recharts';
import { Select, Typography, Space, Divider, Button, Popover, Checkbox, Switch } from 'antd';
import ExportButton from '../common/ExportButton';
import { FilterOutlined } from '@ant-design/icons';
import { 
  topProductosPorCategoria,
  topProductosPorCategoriaImporte
} from '../../utils/procesamiento-categorias';
import { Venta } from '../../types/Venta';

const { Option } = Select;
const { Text, Title } = Typography;
const { Group: CheckboxGroup } = Checkbox;

interface Props {
  ventas: Venta[];
}

/**
 * Gráfico y tabla para los productos más vendidos por categoría
 */

// Componente personalizado para mostrar etiquetas con múltiples líneas
const CustomizedLabel = (props: any) => {
  const { x, y, width, height, index, value } = props;
  
  // Obtener el elemento de datos correspondiente
  if (!props.data || !props.data[index]) return null;
  const item = props.data[index];
  
  // Formatear valores según si es categoría o producto
  let porcentaje = '';
  let importeFormateado = '';
  let cantidadFormateada = '';
  
  if (item.isCategory) {
    // Para categorías
    porcentaje = `${item.porcentaje || '0.00'}% del total`;
    importeFormateado = item.totalCategoria?.toLocaleString('es-AR', { 
      style: 'currency', 
      currency: 'ARS', 
      maximumFractionDigits: 0 
    }) || '$0';
    cantidadFormateada = item.cantidadCategoria?.toLocaleString('es-AR') || '0';
  } else {
    // Para productos individuales
    porcentaje = `${item.porcentaje || '0.00'}% de la categoría`;
    importeFormateado = item.total?.toLocaleString('es-AR', { 
      style: 'currency', 
      currency: 'ARS', 
      maximumFractionDigits: 0 
    }) || '$0';
    cantidadFormateada = item.cantidad?.toLocaleString('es-AR') || '0';
  }
  
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
        fontSize={item.isCategory ? 13 : 11}
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
        fontSize={item.isCategory ? 11 : 10}
      >
        {`${importeFormateado} | ${cantidadFormateada} u.`}
      </text>
    </g>
  );
};
const TopProductosPorCategoriaChart: React.FC<Props> = ({ ventas }) => {
  const chartRef = useRef<HTMLDivElement>(null);
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
  
  // Preparar datos para el gráfico
  const prepararDatosGrafico = () => {
    const resultado: any[] = [];
    
    // Calcular totales generales para porcentajes
    const totalGeneral = {
      cantidad: dataFiltrada.reduce((sum, cat) => sum + cat.cantidadCategoria, 0),
      importe: dataFiltrada.reduce((sum, cat) => sum + cat.totalCategoria, 0)
    };
    
    dataFiltrada.forEach(categoria => {
      // Añadir el total de la categoría
      resultado.push({
        nombre: `${categoria.categoria} (Total)`,
        value: mostrarCantidad ? categoria.cantidadCategoria : categoria.totalCategoria,
        esTotal: true,
        categoria: categoria.categoria,
        articulo: '',
        descripcion: `Total ${categoria.categoria}`,
        isCategory: true,
        fillColor: "url(#colorBarCategoriaTotal)",
        strokeColor: "#6762a8",
        // Guardar ambos valores para las etiquetas
        cantidadCategoria: categoria.cantidadCategoria,
        totalCategoria: categoria.totalCategoria,
        // Agregar porcentaje sobre el total general
        porcentaje: mostrarCantidad 
          ? ((categoria.cantidadCategoria / totalGeneral.cantidad) * 100).toFixed(2)
          : ((categoria.totalCategoria / totalGeneral.importe) * 100).toFixed(2)
      });
      
      // Añadir cada producto de la categoría
      categoria.productos.forEach(producto => {
        resultado.push({
          nombre: `  ${producto.descripcion}`, // Añadir indentación para diferenciar visualmente
          value: mostrarCantidad ? producto.cantidad : producto.total,
          esTotal: false,
          categoria: categoria.categoria,
          articulo: producto.articulo,
          descripcion: producto.descripcion,
          isCategory: false,
          fillColor: "url(#colorBarProducto)",
          strokeColor: "#6eb58a",
          // Guardar ambos valores para las etiquetas
          cantidad: producto.cantidad,
          total: producto.total,
          // Agregar porcentaje sobre el total de la categoría
          porcentaje: mostrarCantidad 
            ? ((producto.cantidad / categoria.cantidadCategoria) * 100).toFixed(2)
            : ((producto.total / categoria.totalCategoria) * 100).toFixed(2)
        });
      });
    });
    
    return resultado;
  };
  
  const chartData = prepararDatosGrafico();
  
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
      const item = payload[0].payload;
      return (
        <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>{item.descripcion}</p>
          {item.articulo && (
            <p style={{ margin: '5px 0' }}>
              Código: <strong>{item.articulo}</strong>
            </p>
          )}
          <p style={{ margin: '5px 0' }}>
            Categoría: <strong>{item.categoria}</strong>
          </p>
          <p style={{ margin: '5px 0', color: payload[0].color }}>
            {mostrarCantidad ? 'Cantidad: ' : 'Importe: '}
            <strong>{formatValue(payload[0].value)}</strong>
          </p>
          <p style={{ margin: '5px 0' }}>
            Porcentaje: <strong>{item.porcentaje}%</strong> {item.isCategory ? 'del total' : 'de la categoría'}
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
    return alturaBase + (chartData.length * alturaPorElemento);
  };
  
  // Columnas para la tabla
  const columns = [
    {
      title: 'Categoría',
      dataIndex: 'categoria',
      key: 'categoria',
      width: '25%',
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
      width: '40%',
      render: (text: string, record: any) => (
        <span style={{ 
          fontWeight: record.isCategory ? 'bold' : 'normal',
          color: record.isCategory ? '#333' : '#666',
          paddingLeft: record.isCategory ? '0' : '20px'
        }}>
          {record.isCategory ? 'TOTAL CATEGORÍA' : text}
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
    }
  ];
  
  // Preparar datos para la tabla
  const prepararDatosTabla = () => {
    const resultado: any[] = [];
    
    dataFiltrada.forEach(categoria => {
      // Añadir el total de la categoría
      resultado.push({
        key: `cat-${categoria.categoria}`,
        categoria: categoria.categoria,
        descripcion: '',
        articulo: '',
        value: mostrarCantidad ? categoria.cantidadCategoria : categoria.totalCategoria,
        isCategory: true
      });
      
      // Añadir cada producto de la categoría
      categoria.productos.forEach((producto, index) => {
        resultado.push({
          key: `prod-${categoria.categoria}-${producto.articulo}`,
          categoria: index === 0 ? '' : '',
          descripcion: producto.descripcion,
          articulo: producto.articulo,
          value: mostrarCantidad ? producto.cantidad : producto.total,
          isCategory: false
        });
      });
    });
    
    return resultado;
  };
  
  const tableData = prepararDatosTabla();
  
  // Configuración para el nombre del archivo de exportación
  const exportConfig = {
    tipo: 'grafico',
    nombre: 'top_productos_por_categoria',
    top: topPorCategoria,
    modo: mostrarCantidad ? 'cantidad' : 'importe',
    periodo: filtroMeses === 'todos' ? 'todos_los_meses' : 
             filtroMeses === 'conDatos' ? 'solo_con_datos' : mesSeleccionado || 'individual',
    categorias: categoriasSeleccionadas.length
  };
  
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} ref={chartRef}>
      <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
        <ExportButton 
          elementoRef={chartRef} 
          nombreArchivo={exportConfig.nombre}
          titulo={`Top ${topPorCategoria} Productos por Categoría - ${mostrarCantidad ? 'Cantidad' : 'Importe'}`}
          configuracion={{
            top: topPorCategoria,
            modo: mostrarCantidad ? 'cantidad' : 'importe',
            periodo: filtroMeses === 'todos' ? 'todos' : 
                     filtroMeses === 'conDatos' ? 'con_datos' : mesSeleccionado || 'individual',
            categorias: categoriasSeleccionadas.length
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
              <div style={{ width: 500 }}>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                    Categorías ordenadas por {mostrarCantidad ? 'cantidad' : 'importe'} (mayor a menor)
                  </Text>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr',
                    columnGap: '16px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    {/* Ordenamos las categorías por valor de venta */}
                    {data
                      .slice() // Crear una copia para no modificar el original
                      .sort((a, b) => {
                        const valorA = mostrarCantidad ? a.cantidadCategoria : a.totalCategoria;
                        const valorB = mostrarCantidad ? b.cantidadCategoria : b.totalCategoria;
                        return valorB - valorA; // Orden descendente
                      })
                      .map(cat => (
                        <div key={cat.categoria} style={{ marginBottom: 8 }}>
                          <Checkbox
                            checked={categoriasSeleccionadas.includes(cat.categoria)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCategoriasSeleccionadas([...categoriasSeleccionadas, cat.categoria]);
                              } else {
                                setCategoriasSeleccionadas(
                                  categoriasSeleccionadas.filter(c => c !== cat.categoria)
                                );
                              }
                            }}
                          >
                            <span>
                              {cat.categoria}
                              <span style={{ fontSize: '11px', color: '#999', marginLeft: '5px' }}>
                                {mostrarCantidad 
                                  ? `(${cat.cantidadCategoria.toLocaleString('es-AR')} u.)` 
                                  : `(${cat.totalCategoria.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })})`
                                }
                              </span>
                            </span>
                          </Checkbox>
                        </div>
                      ))
                    }
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <Button 
                    size="small" 
                    onClick={() => setCategoriasSeleccionadas([])}
                  >
                    Limpiar
                  </Button>
                  <Space>
                    <Button 
                      onClick={() => setCategoriasSeleccionadas(data.map(cat => cat.categoria))}
                    >
                      Seleccionar todas
                    </Button>
                    <Button 
                      type="primary" 
                      onClick={() => setPopoverVisible(false)}
                    >
                      Aplicar
                    </Button>
                  </Space>
                </div>
              </div>
            }
            title="Seleccionar categorías"
            trigger="click"
            open={popoverVisible}
            onOpenChange={setPopoverVisible}
            placement="bottomRight"
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
      </div>
      
      <div style={{ height: calcularAltura() }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            style={{ width: '100%' }}
            className="top-productos-categoria-chart"
            barCategoryGap={5}
          >
            <defs>
              <linearGradient id="colorBarCategoriaTotal" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8884d8" stopOpacity={1}/>
                <stop offset="75%" stopColor="#7570c0" stopOpacity={1}/>
                <stop offset="100%" stopColor="#6762a8" stopOpacity={1}/>
              </linearGradient>
              <linearGradient id="colorBarProducto" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#98e3b5" stopOpacity={1}/>
                <stop offset="75%" stopColor="#82ca9d" stopOpacity={1}/>
                <stop offset="100%" stopColor="#6eb58a" stopOpacity={1}/>
              </linearGradient>
              <filter id="shadowCategorias" x="-10%" y="-10%" width="120%" height="130%">
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
              width={220}
              tick={({ y, payload }) => {
                const isCategory = chartData[payload.index]?.isCategory;
                return (
                  <text 
                    x={0} 
                    y={y} 
                    dy={4} 
                    textAnchor="start" 
                    fill={isCategory ? "#333" : "#666"}
                    fontWeight={isCategory ? "bold" : "normal"}
                    fontSize={isCategory ? 12 : 11}
                  >
                    {payload.value}
                  </text>
                );
              }}
              interval={0}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="value" 
              name={mostrarCantidad ? "Cantidad" : "Importe"}
              fill="url(#colorBarProducto)"
              stroke="#6eb58a"
              strokeWidth={1}
              radius={[0, 4, 4, 0]}
              barSize={16}
              filter="url(#shadowCategorias)"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={entry.isCategory ? "url(#colorBarCategoriaTotal)" : "url(#colorBarProducto)"}
                  stroke={entry.isCategory ? "#6762a8" : "#6eb58a"}
                />
              ))}
              <LabelList 
                content={<CustomizedLabel data={chartData} />}
                position="right"
                dataKey="value"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <Text type="secondary">
          {`Top ${topPorCategoria} productos más vendidos por categoría (por ${mostrarCantidad ? 'cantidad' : 'importe'})`}
        </Text>
      </div>
      
      <style>
        {`
        .categoria-row {
          background-color: #f0f0ff;
        }
        .producto-row {
          background-color: #ffffff;
        }
        .top-productos-categoria-chart .recharts-cartesian-grid-horizontal line,
        .top-productos-categoria-chart .recharts-cartesian-grid-vertical line {
          stroke: #e0e0e0;
        }
        .top-productos-categoria-chart .recharts-tooltip-wrapper {
          z-index: 1000;
        }
        .top-productos-categoria-chart .recharts-bar-rectangle:hover {
          filter: brightness(0.9);
          cursor: pointer;
        }
        .top-productos-categoria-chart .recharts-layer.recharts-bar-labels {
          font-size: 11px;
        }
        `}
      </style>
    </div>
  );
};

export default TopProductosPorCategoriaChart;
