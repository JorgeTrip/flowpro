import React from 'react';
import { Card, Button, Empty } from 'antd';
import { useVentas } from '../context/VentasContext';
import ResumenMensualTable from '../components/ReportTables/ResumenMensualTable';
import RubroTable from '../components/ReportTables/RubroTable';
import ZonaTable from '../components/ReportTables/ZonaTable';
import VendedorTable from '../components/ReportTables/VendedorTable';
import TopProductosTable from '../components/ReportTables/TopProductosTable';
import TopClientesTable from '../components/ReportTables/TopClientesTable';
import { exportarReporteExcel } from '../services/exportService';

/**
 * Página del reporte de ventas
 * Aquí se mostrarán las tablas procesadas y el botón de exportar a Excel
 */
const ReportPage: React.FC = () => {
  const { ventas } = useVentas();

  return (
    <Card title="Reporte de ventas mensuales" style={{ maxWidth: 1200, margin: '32px auto' }}>
      {ventas.length > 0 ? (
        <>
          <ResumenMensualTable ventas={ventas} />
          <RubroTable ventas={ventas} />
          <ZonaTable ventas={ventas} />
          <VendedorTable ventas={ventas} />
          <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 32 }}>
            <TopProductosTable ventas={ventas} tipo="mas" />
            <TopProductosTable ventas={ventas} tipo="menos" />
            <TopClientesTable ventas={ventas} tipo="Minoristas" />
            <TopClientesTable ventas={ventas} tipo="Distribuidores" />
          </div>
        </>
      ) : (
        <Empty description="No hay datos cargados" />
      )}
      <Button
        type="primary"
        style={{ marginTop: 24 }}
        onClick={() => exportarReporteExcel(ventas)}
        disabled={ventas.length === 0}
      >
        Exportar a Excel
      </Button>
    </Card>
  );
};

export default ReportPage;
