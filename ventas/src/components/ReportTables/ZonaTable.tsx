import React, { useState, useEffect } from 'react';
import { Table, Radio, Select, Space, Divider } from 'antd';
import { agruparPorZona } from '../../utils/procesamiento';
import { agruparPorZonaCantidad } from '../../utils/procesamiento-cantidades';
import { Venta } from '../../types/Venta';

const { Option } = Select;

interface Props {
  ventas: Venta[];
}

/**
 * Tabla de reporte por Zona (Interior, Retiro de cliente, G.B.A., CABA)
 */
const ZonaTable: React.FC<Props> = ({ ventas }) => {
  const [mostrarCantidad, setMostrarCantidad] = useState<boolean>(false);
  const [filtroMeses, setFiltroMeses] = useState<'todos' | 'conDatos' | 'individual'>('todos');
  const [mesSeleccionado, setMesSeleccionado] = useState<string | null>(null);
  const [mesesConDatos, setMesesConDatos] = useState<string[]>([]);
  
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const zonas = ['Interior', 'Retiro de cliente', 'G.B.A.', 'CABA'];
  const datosImporte = agruparPorZona(ventas);
  const datosCantidad = agruparPorZonaCantidad(ventas);
  
  // Identificar meses que tienen datos
  useEffect(() => {
    const mesesDisponibles = meses.filter(mes => {
      let tieneDatos = false;
      zonas.forEach(zona => {
        if ((datosImporte[mes]?.[zona]?.AX || 0) > 0 || (datosCantidad[mes]?.[zona]?.AX || 0) > 0) {
          tieneDatos = true;
        }
      });
      return tieneDatos;
    });
    setMesesConDatos(mesesDisponibles);
    
    // Si estamos en modo individual pero no hay mes seleccionado, seleccionar el primero disponible
    if (filtroMeses === 'individual' && !mesSeleccionado && mesesDisponibles.length > 0) {
      setMesSeleccionado(mesesDisponibles[0]);
    }
  }, [ventas, filtroMeses, mesSeleccionado]);
  
  const renderValue = (v: number) => {
    if (mostrarCantidad) {
      return v.toLocaleString('es-AR');
    } else {
      return v.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
    }
  };

  // Determinar qué meses mostrar según el filtro seleccionado
  const mesesAMostrar = () => {
    if (filtroMeses === 'todos') {
      return meses;
    } else if (filtroMeses === 'conDatos') {
      return mesesConDatos;
    } else if (filtroMeses === 'individual' && mesSeleccionado) {
      return [mesSeleccionado];
    }
    return meses; // Por defecto, mostrar todos los meses
  };
  
  const dataSource = mesesAMostrar().map((mes) => {
    const zonaValues = zonas.reduce((acc, zona) => {
      acc[zona] = mostrarCantidad ? datosCantidad[mes]?.[zona]?.AX || 0 : datosImporte[mes]?.[zona]?.AX || 0;
      return acc;
    }, {} as Record<string, number>);
    
    const total = zonas.reduce((sum, zona) => sum + (zonaValues[zona] || 0), 0);
    
    return {
      key: mes,
      mes,
      ...zonaValues,
      total
    };
  });

  // Fila total
  const totalPorZona = zonas.reduce((acc, zona) => {
    acc[zona] = dataSource.reduce((sum, row) => sum + (row[zona] || 0), 0);
    return acc;
  }, {} as Record<string, number>);
  
  const totalGeneral = dataSource.reduce((sum, row) => sum + (row.total || 0), 0);
  
  dataSource.push({ 
    key: 'Total', 
    mes: 'Total', 
    ...totalPorZona,
    total: totalGeneral
  });

  const columns = [
    { title: '', dataIndex: 'mes', key: 'mes' },
    ...zonas.map(zona => ({
      title: zona,
      dataIndex: zona,
      key: zona,
      render: renderValue,
    })),
    { 
      title: 'Total', 
      dataIndex: 'total', 
      key: 'total',
      render: renderValue
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
          
          <Radio.Group 
            value={mostrarCantidad ? 'cantidad' : 'importe'} 
            onChange={(e) => setMostrarCantidad(e.target.value === 'cantidad')}
          >
            <Radio.Button value="importe">Importe</Radio.Button>
            <Radio.Button value="cantidad">Cantidad</Radio.Button>
          </Radio.Group>
        </Space>
      </div>
      <Table
        title={() => <b>{mostrarCantidad ? 'Cantidades por Zona' : 'Ventas por Zona'}</b>}
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        bordered
        size="small"
        style={{ marginBottom: 32, maxWidth: 700 }}
      />
    </>
  );
};

export default ZonaTable;
