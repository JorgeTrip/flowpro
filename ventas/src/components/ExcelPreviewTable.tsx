import React from 'react';
import { Table, Spin } from 'antd';
import { Venta } from '../types/Venta';

interface Props {
  data: Venta[];
  loading: boolean;
}

/**
 * Tabla para previsualizar las primeras filas del archivo Excel cargado
 */
const ExcelPreviewTable: React.FC<Props> = ({ data, loading }) => {
  // Definir columnas básicas para la previsualización
  const columns = [
    { title: 'Periodo', dataIndex: 'Periodo', key: 'Periodo' },
    { title: 'Fecha', dataIndex: 'Fecha', key: 'Fecha' },
    { title: 'Tipo comprobante', dataIndex: 'TipoComprobante', key: 'TipoComprobante' },
    { title: 'Nro. comprobante', dataIndex: 'NroComprobante', key: 'NroComprobante' },
    { title: 'Referencia Vendedor', dataIndex: 'ReferenciaVendedor', key: 'ReferenciaVendedor' },
    { title: 'Razon social', dataIndex: 'RazonSocial', key: 'RazonSocial' },
    { title: 'Cliente', dataIndex: 'Cliente', key: 'Cliente' },
    { title: 'Direccion', dataIndex: 'Direccion', key: 'Direccion' },
    { title: 'Articulo', dataIndex: 'Articulo', key: 'Articulo' },
    { title: 'Descripcion', dataIndex: 'Descripcion', key: 'Descripcion' },
    { title: 'Cantidad', dataIndex: 'Cantidad', key: 'Cantidad' },
    { title: 'Total', dataIndex: 'Total', key: 'Total' },
    { title: 'TotalCIVA', dataIndex: 'TotalCIVA', key: 'TotalCIVA' },
    { title: 'Directo/Indirecto', dataIndex: 'DirectoIndirecto', key: 'DirectoIndirecto' },
  ];

  return (
    <>
      <Spin spinning={loading} tip="Cargando...">
        <Table
          size="small"
          columns={columns}
          dataSource={data}
          rowKey={(row, idx = 0) => row.Cliente || row.Articulo || row.Descripcion || idx.toString()}

          pagination={false}
          scroll={{ x: 1200 }}
          style={{ marginBottom: 16 }}
        />
      </Spin>
      {data.length > 0 && (
        <pre style={{ background: '#f6f6f6', color: '#333', fontSize: 13, padding: 10, borderRadius: 4, marginTop: 8 }}>
          {JSON.stringify(data[0], null, 2)}
        </pre>
      )}
    </>
  );
};

export default ExcelPreviewTable;
