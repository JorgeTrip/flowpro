import React from 'react';
import '../styles/Dashboard.css';
import { Card, Row, Col, Empty, Tabs } from 'antd';
import { useVentas } from '../context/VentasContext';
import {
  VentasMensualesChart,
  VentasPorRubroChart,
  VentasPorZonaChart,
  TopProductosChart,
  TopClientesChart,
  VendedoresChart,
  TopProductosPorCategoriaChart
} from '../components/Dashboard';
import ResumenMensualTable from '../components/ReportTables/ResumenMensualTable';
import RubroTable from '../components/ReportTables/RubroTable';
import ZonaTable from '../components/ReportTables/ZonaTable';
import VendedorTable from '../components/ReportTables/VendedorTable';
import TopProductosTable from '../components/ReportTables/TopProductosTable';
import TopClientesTable from '../components/ReportTables/TopClientesTable';
import TopProductosPorCategoriaTable from '../components/ReportTables/TopProductosPorCategoriaTable';

/**
 * Página del dashboard de ventas
 * Muestra gráficos interactivos y tablas de datos para análisis gerencial
 */
const DashboardPage: React.FC = () => {
  const { ventas } = useVentas();
  
  const items = [
    {
      key: '1',
      label: 'Gráficos',
      children: (
        <>
          {ventas.length > 0 ? (
            <div className="dashboard-container">
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card title="Ventas Mensuales" className="dashboard-card">
                    <VentasMensualesChart ventas={ventas} />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Ventas por Vendedor" className="dashboard-card">
                    <VendedoresChart ventas={ventas} />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Ventas por Rubro" className="dashboard-card">
                    <VentasPorRubroChart ventas={ventas} />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Ventas por Zona" className="dashboard-card">
                    <VentasPorZonaChart ventas={ventas} />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Productos Más/Menos Vendidos" className="dashboard-card">
                    <TopProductosChart ventas={ventas} />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Clientes Principales" className="dashboard-card">
                    <TopClientesChart ventas={ventas} />
                  </Card>
                </Col>
                <Col xs={24} lg={24}>
                  <Card title="Top Ventas por Categoría de Producto" className="dashboard-card">
                    <TopProductosPorCategoriaChart ventas={ventas} />
                  </Card>
                </Col>
              </Row>
            </div>
          ) : (
            <Empty description="No hay datos cargados" />
          )}
        </>
      ),
    },
    {
      key: '2',
      label: 'Tablas',
      children: (
        <>
          {ventas.length > 0 ? (
            <div className="dashboard-container">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <ResumenMensualTable ventas={ventas} />
                </Col>
                <Col xs={24} md={12}>
                  <RubroTable ventas={ventas} />
                </Col>
                <Col xs={24} md={12}>
                  <ZonaTable ventas={ventas} />
                </Col>
                <Col xs={24} md={12}>
                  <VendedorTable ventas={ventas} />
                </Col>
              </Row>
              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} md={12}>
                  <TopProductosTable ventas={ventas} tipo="mas" />
                </Col>
                <Col xs={24} md={12}>
                  <TopProductosTable ventas={ventas} tipo="menos" />
                </Col>
                <Col xs={24} md={12}>
                  <TopClientesTable ventas={ventas} tipo="Minoristas" />
                </Col>
                <Col xs={24} md={12}>
                  <TopClientesTable ventas={ventas} tipo="Distribuidores" />
                </Col>
                <Col xs={24} md={24}>
                  <TopProductosPorCategoriaTable ventas={ventas} />
                </Col>
              </Row>
            </div>
          ) : (
            <Empty description="No hay datos cargados" />
          )}
        </>
      ),
    },
  ];

  return (
    <Card title="Dashboard de Ventas" style={{ maxWidth: 1400, margin: '32px auto' }}>
      <Tabs defaultActiveKey="1" items={items} />
    </Card>
  );
};

export default DashboardPage;
