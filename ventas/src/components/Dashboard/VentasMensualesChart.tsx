import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';
import '../../styles/Dashboard.css';
import { agruparVentasPorMes } from '../../utils/procesamiento';
import { agruparVentasPorMesCantidad } from '../../utils/procesamiento-cantidades';
import { Venta } from '../../types/Venta';
import { Typography, Select, Space, Divider } from 'antd';
import ExportButton from '../common/ExportButton';

const { Text } = Typography;
const { Option } = Select;

interface Props {
  ventas: Venta[];
}

/**
 * Gráfico de barras para ventas mensuales (A, X, A+X)
 */
const VentasMensualesChart: React.FC<Props> = ({ ventas }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [metrica, setMetrica] = useState<'importe' | 'cantidad'>('importe');
  const [filtroMeses, setFiltroMeses] = useState<'todos' | 'conDatos' | 'individual'>('conDatos');
  const [mesSeleccionado, setMesSeleccionado] = useState<string | null>(null);
  
  const datosImporte = agruparVentasPorMes(ventas);
  const datosCantidad = agruparVentasPorMesCantidad(ventas);
  
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Identificar meses que tienen datos
  const [mesesConDatos, setMesesConDatos] = useState<string[]>([]);
  
  useEffect(() => {
    const mesesDisponibles = meses.filter(mes => {
      const datosI = datosImporte[mes];
      const datosC = datosCantidad[mes];
      return (datosI && (datosI.A > 0 || datosI.X > 0)) || (datosC && (datosC.A > 0 || datosC.X > 0));
    });
    setMesesConDatos(mesesDisponibles);
  }, [ventas]);

  // Determinar qué meses mostrar según el filtro seleccionado
  const mesesAMostrar = () => {
    if (filtroMeses === 'todos') {
      return meses;
    } else if (filtroMeses === 'conDatos') {
      return mesesConDatos;
    } else if (filtroMeses === 'individual' && mesSeleccionado) {
      return [mesSeleccionado];
    }
    return mesesConDatos; // Por defecto, mostrar meses con datos
  };
  
  const dataSource = mesesAMostrar().map((mes) => ({
    key: `mes-${mes}`,
    mes,
    A: datosImporte[mes]?.A || 0,
    X: datosImporte[mes]?.X || 0,
    AX: datosImporte[mes]?.AX || 0,
    cantidadA: datosCantidad[mes]?.A || 0,
    cantidadX: datosCantidad[mes]?.X || 0,
    cantidadAX: datosCantidad[mes]?.AX || 0,
  }));

  // Formatear valores para el tooltip y etiquetas
  const formatCurrency = (value: number, compacto: boolean = false) => {
    // Función auxiliar para formatear con separadores de miles
    const formatearConSeparadores = (valor: number, decimales: number = 1): string => {
      return valor.toLocaleString('es-AR', {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales
      });
    };
    
    if (compacto) {
      if (value >= 1000000) {
        // Para millones, dividimos por 1,000,000 y usamos 'mill.'
        const valorFormateado = formatearConSeparadores(value / 1000000);
        return `$${valorFormateado} mill.`;
      } else if (value >= 1000) {
        // Para miles, mostramos el número completo con separadores
        const valorFormateado = formatearConSeparadores(value, 0);
        return `$${valorFormateado}`;
      } else {
        // Para números pequeños, sin decimales
        const valorFormateado = formatearConSeparadores(value, 0);
        return `$${valorFormateado}`;
      }
    } else {
      return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
    }
  };
  
  const formatQuantity = (value: number, compacto: boolean = false) => {
    // Función auxiliar para formatear con separadores de miles
    const formatearConSeparadores = (valor: number, decimales: number = 1): string => {
      return valor.toLocaleString('es-AR', {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales
      });
    };
    
    if (compacto) {
      if (value >= 1000000) {
        // Para millones, dividimos por 1,000,000 y usamos 'mill.'
        const valorFormateado = formatearConSeparadores(value / 1000000);
        return `${valorFormateado} mill.`;
      } else if (value >= 1000) {
        // Para miles, mostramos el número completo con separadores
        const valorFormateado = formatearConSeparadores(value, 0);
        return `${valorFormateado}`;
      } else {
        // Para números pequeños, sin decimales
        const valorFormateado = formatearConSeparadores(value, 0);
        return `${valorFormateado}`;
      }
    } else {
      return value.toLocaleString('es-AR');
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', maxWidth: '250px' }}>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color, margin: '5px 0' }}>
              <span>{entry.name}: </span>
              <span style={{ fontWeight: 'bold' }}>
                {entry.name.includes('cantidad') 
                  ? formatQuantity(entry.value) 
                  : formatCurrency(entry.value)}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Configuración para el nombre del archivo
  const configuracionExport = {
    metrica,
    filtro: filtroMeses,
    ...(filtroMeses === 'individual' && mesSeleccionado ? { mes: mesSeleccionado } : {})
  };

  return (
    <div ref={chartRef} style={{ width: '100%', height: 480, position: 'relative' }}>
      <ExportButton
        elementoRef={chartRef}
        nombreArchivo="ventas_mensuales"
        titulo="Ventas Mensuales"
        configuracion={configuracionExport}
      />
      
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
            value={metrica}
            style={{ width: 120 }}
            onChange={(value) => setMetrica(value as 'importe' | 'cantidad')}
          >
            <Option value="importe">Importe</Option>
            <Option value="cantidad">Cantidad</Option>
          </Select>
        </Space>
      </div>
      <ResponsiveContainer>
        <BarChart
          data={dataSource}
          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
          className="ventas-mensuales-chart-3d"
          barCategoryGap={5} // Espacio entre barras del mismo mes
          barGap={8} // Espacio entre barras de diferentes meses
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="mes" 
            angle={-45}
            textAnchor="end"
            height={70}
            interval={0}
          />
          <YAxis 
            tickFormatter={(value) => metrica === 'importe' ? formatCurrency(value, true) : formatQuantity(value, true)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {metrica === 'importe' ? (
            <>
              <Bar dataKey="A" fill="#8884d8" name="A" />
              <Bar dataKey="X" fill="#82ca9d" name="X" />
              <Bar dataKey="AX" fill="#ffc658" name="A+X" />
            </>
          ) : (
            <>
              <Bar dataKey="cantidadA" fill="#8884d8" name="A (cantidad)" />
              <Bar dataKey="cantidadX" fill="#82ca9d" name="X (cantidad)" />
              <Bar dataKey="cantidadAX" fill="#ffc658" name="A+X (cantidad)" />
            </>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VentasMensualesChart;
