import React, { useState, useEffect, useRef } from 'react';
import { Table, Radio, Space, Select, Divider, Checkbox, Card } from 'antd';
import { agruparVentasPorMes } from '../../utils/procesamiento';
import { agruparVentasPorMesCantidad } from '../../utils/procesamiento-cantidades';
import { Venta } from '../../types/Venta';
import ExportButton from '../common/ExportButton';

interface Props {
  ventas: Venta[];
}

/**
 * Tabla resumen mensual de ventas (A, X, A+X)
 */
const { Option } = Select;

const ResumenMensualTable: React.FC<Props> = ({ ventas }) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const [mostrarCantidad, setMostrarCantidad] = useState<boolean>(false);
  const [filtroMeses, setFiltroMeses] = useState<'todos' | 'conDatos' | 'seleccionados'>('todos');
  const [mesesSeleccionados, setMesesSeleccionados] = useState<string[]>([]);
  
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const datosImporte = agruparVentasPorMes(ventas);
  const datosCantidad = agruparVentasPorMesCantidad(ventas);
  
  // Identificar meses que tienen datos
  const mesesConDatos = meses.filter(mes => {
    return (datosImporte[mes]?.AX || 0) > 0 || (datosCantidad[mes]?.AX || 0) > 0;
  });
  
  // Inicializar mesesSeleccionados si está vacío
  useEffect(() => {
    if (mesesSeleccionados.length === 0 && mesesConDatos.length > 0) {
      setMesesSeleccionados(mesesConDatos);
    }
  }, [mesesConDatos, mesesSeleccionados.length]);

  // Filtrar los meses según la selección
  const mesesAMostrar = filtroMeses === 'todos' ? meses : 
                      filtroMeses === 'conDatos' ? mesesConDatos : 
                      mesesSeleccionados;
  
  const dataSource = mesesAMostrar.map((mes) => ({
    key: mes,
    mes,
    A: mostrarCantidad ? datosCantidad[mes]?.A || 0 : datosImporte[mes]?.A || 0,
    X: mostrarCantidad ? datosCantidad[mes]?.X || 0 : datosImporte[mes]?.X || 0,
    AX: mostrarCantidad ? datosCantidad[mes]?.AX || 0 : datosImporte[mes]?.AX || 0,
  }));
  
  // Agregar fila total
  const total = dataSource.reduce(
    (acc, row) => ({
      A: acc.A + row.A,
      X: acc.X + row.X,
      AX: acc.AX + row.AX,
    }),
    { A: 0, X: 0, AX: 0 }
  );
  dataSource.push({ key: 'Total', mes: 'Total', ...total });

  const renderValue = (v: number) => {
    if (mostrarCantidad) {
      return v.toLocaleString('es-AR');
    } else {
      return v.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
    }
  };

  const columns = [
    { title: '', dataIndex: 'mes', key: 'mes' },
    { title: 'A', dataIndex: 'A', key: 'A', render: renderValue },
    { title: 'X', dataIndex: 'X', key: 'X', render: renderValue },
    { title: 'A+X', dataIndex: 'AX', key: 'AX', render: renderValue },
  ];

  // Configuración para el nombre del archivo
  const configuracionExport = {
    metrica: mostrarCantidad ? 'cantidad' : 'importe',
    filtro: filtroMeses,
    ...(filtroMeses === 'seleccionados' ? { meses: mesesSeleccionados.length } : {})
  };

  return (
    <Card 
      title="Resumen Mensual" 
      style={{ position: 'relative' }}
      extra={
        <ExportButton
          elementoRef={tableRef}
          nombreArchivo="resumen_mensual"
          titulo="Resumen Mensual"
          configuracion={configuracionExport}
          style={{ position: 'static', top: 'auto', right: 'auto' }}
        />
      }
    >
      <div ref={tableRef}>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Select
              value={filtroMeses}
              style={{ width: 180 }}
              onChange={(value) => {
                setFiltroMeses(value as 'todos' | 'conDatos' | 'seleccionados');
                if (value === 'seleccionados' && mesesSeleccionados.length === 0) {
                  setMesesSeleccionados(mesesConDatos.length > 0 ? mesesConDatos : [meses[0]]);
                }
              }}
            >
              <Option value="todos">Todos los meses</Option>
              <Option value="conDatos">Solo meses con datos</Option>
              <Option value="seleccionados">Meses seleccionados</Option>
            </Select>
            
            {filtroMeses === 'seleccionados' && (
              <Select
                mode="multiple"
                value={mesesSeleccionados}
                style={{ width: 300 }}
                placeholder="Seleccionar meses"
                onChange={(value) => setMesesSeleccionados(value)}
              >
                {meses.map(mes => (
                  <Option key={mes} value={mes}>
                    {mes}
                  </Option>
                ))}
              </Select>
            )}
            
            <Divider type="vertical" />
            
            <Checkbox
              checked={mostrarCantidad}
              onChange={(e) => setMostrarCantidad(e.target.checked)}
            >
              Mostrar cantidad en lugar de importe
            </Checkbox>
          </Space>
        </div>
        
        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          size="small"
          rowClassName={(record) => record.key === 'Total' ? 'total-row' : ''}
        />
      </div>
    </Card>
  );
};

export default ResumenMensualTable;
