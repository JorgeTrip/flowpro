import React, { useContext, useState } from 'react';
import { App as AntdApp } from 'antd'; // Ensure AntdApp is imported here as well if not already at the top
import { Layout as AntLayout, Breadcrumb, Menu, Typography, Row, Col, Card, Space, Button, Alert, ConfigProvider } from 'antd'; 
import { UploadOutlined, EyeOutlined, BarChartOutlined, SettingOutlined, ExperimentOutlined, ClearOutlined } from '@ant-design/icons';
import './App.css';

import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import { AppProvider, AppContext } from './context/AppContext';

// import CustomHeader from './components/common/Header/Header'; // Not used directly in this AntD structure
// import CustomSidebar from './components/common/Sidebar/Sidebar'; // Not used directly, AntD Sider is used
import ThemeToggle from './components/common/ThemeToggle/ThemeToggle';
import ExcelUploader from './components/fileUpload/ExcelUploader/ExcelUploader';
import UploadStatus from './components/fileUpload/UploadStatus/UploadStatus';
import ComparisonTable from './components/inventory/ComparisonTable/ComparisonTable';
import ExportButton from './components/inventory/ExportButton/ExportButton';
import ResultsPreview from './components/inventory/ResultsPreview/ResultsPreview';

import { APP_TITLE, FILE_TYPE_SYSTEM, FILE_TYPE_PHYSICAL } from './utils/constants';

const { Content, Footer, Sider } = AntLayout;
const { Title, Paragraph } = Typography;

// Main application content component
const MainApp = () => {
  const { notification: appNotification } = AntdApp.useApp(); // Ant Design hook for context
  const { theme } = useContext(ThemeContext); // Removed toggleTheme as it's in ThemeToggle
  const {
    handleFileProcessed,
    performComparison,
    clearData,
    comparisonResults,
    loading,
    error,
    systemDataCount,
    physicalDataCount,
    expectedSystemSheets,
    expectedPhysicalSheets,
    stockLocation,
    setStockLocation,
    systemFileRawData, // for disabling buttons
    physicalFileRawData // for disabling buttons
  } = useContext(AppContext);

  const [currentView, setCurrentView] = useState('carga'); // 'carga', 'previsualizacion', 'analisis', 'configuracion'
  const [systemUploadStatus, setSystemUploadStatus] = useState(null);
  const [physicalUploadStatus, setPhysicalUploadStatus] = useState(null);

  // Updated to include fileName from ExcelUploader
  const onSystemFileProcessed = (data, fileType, totalRecords, fileName) => { 
    handleFileProcessed(data, fileType, totalRecords, fileName); // Pass fileName if AppContext needs it
    setSystemUploadStatus({ status: 'success', message: `Archivo '${fileName}' de sistema procesado.`, count: totalRecords });
    appNotification.success({
      message: 'Archivo de Sistema Cargado',
      description: `Se procesaron ${totalRecords} registros del archivo '${fileName}'.`,
    });
  };

  // Updated to include fileName from ExcelUploader
  const onPhysicalFileProcessed = (data, fileType, totalRecords, fileName) => { 
    handleFileProcessed(data, fileType, totalRecords, fileName); // Pass fileName if AppContext needs it
    setPhysicalUploadStatus({ status: 'success', message: `Archivo '${fileName}' físico procesado.`, count: totalRecords });
    appNotification.success({
      message: 'Archivo Físico Cargado',
      description: `Se procesaron ${totalRecords} registros del inventario físico '${fileName}'.`,
    });
  };
  
  const handleCompare = () => {
    performComparison();
    // Notification for comparison result (success/error) will be handled by AppContext or here based on `error` state after performComparison
    if (systemDataCount > 0 && physicalDataCount > 0) { // Only switch view if data was present
        setCurrentView('analisis'); 
        appNotification.info({
            message: 'Comparación Realizada',
            description: 'Resultados disponibles en la pestaña Análisis de Diferencias.',
        });
    } else {
        appNotification.warn({
            message: 'Faltan Archivos',
            description: 'Por favor, cargue ambos archivos de inventario antes de comparar.',
        });
    }
  };

  const handleClearData = () => {
    clearData();
    setSystemUploadStatus(null);
    setPhysicalUploadStatus(null);
    setCurrentView('carga');
    appNotification.info({
        message: 'Datos Limpiados',
        description: 'Se han borrado los datos cargados y los resultados.'
    });
  };

  const menuItems = [
    { key: 'carga', icon: <UploadOutlined />, label: 'Carga de Planillas' },
    { key: 'previsualizacion', icon: <EyeOutlined />, label: 'Previsualización' },
    { key: 'analisis', icon: <BarChartOutlined />, label: 'Análisis de Diferencias' },
    { key: 'configuracion', icon: <SettingOutlined />, label: 'Configuración' },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'carga':
        return (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card title="Paso 1: Cargar Planilla del Sistema">
              <ExcelUploader
                onFileProcessed={onSystemFileProcessed}
                expectedSheets={expectedSystemSheets}
                title="Arrastra o selecciona la planilla del SISTEMA"
                description={`Hojas esperadas: ${expectedSystemSheets.join(', ')}`}
                fileType={FILE_TYPE_SYSTEM}
              />
              {systemUploadStatus && <UploadStatus {...systemUploadStatus} />}
            </Card>
            <Card title="Paso 2: Cargar Planilla de Inventario Físico">
              <ExcelUploader
                onFileProcessed={onPhysicalFileProcessed}
                expectedSheets={expectedPhysicalSheets} 
                title="Arrastra o selecciona la planilla del INVENTARIO FÍSICO"
                description={`Hojas esperadas: ${expectedPhysicalSheets.join(', ')} (o todas si no se especifican)`}
                fileType={FILE_TYPE_PHYSICAL}
              />
              {physicalUploadStatus && <UploadStatus {...physicalUploadStatus} />}
            </Card>
            <Row justify="start" gutter={16}>
                <Col>
                    <Button 
                        type="primary" 
                        icon={<ExperimentOutlined />} 
                        onClick={handleCompare} 
                        disabled={!systemFileRawData || !physicalFileRawData || loading}
                        loading={loading}
                        size="large"
                    >
                        Comparar Inventarios
                    </Button>
                </Col>
                <Col>
                    <Button 
                        icon={<ClearOutlined />} 
                        onClick={handleClearData}
                        disabled={!systemFileRawData && !physicalFileRawData && comparisonResults.length === 0}
                        size="large"
                        danger
                    >
                        Limpiar Datos
                    </Button>
                </Col>
            </Row>
            {error && <Alert message={`Error: ${error}`} type="error" showIcon style={{marginTop: '16px'}}/>}
          </Space>
        );
      case 'previsualizacion':
        return (
            <ResultsPreview 
                systemDataCount={systemDataCount} 
                physicalDataCount={physicalDataCount} 
                comparisonResults={comparisonResults} 
            />
        );
      case 'analisis':
        return (
          <Card title={`Resultados de la Comparación de Inventario (${stockLocation})`}>
            {error && <Alert message={`Error en la comparación: ${error}`} type="error" showIcon style={{marginBottom: '16px'}}/>}
            <Paragraph>
              Mostrando diferencias entre el stock del sistema (ubicación: <strong>{stockLocation}</strong>) y el stock físico.
            </Paragraph>
            <ExportButton data={comparisonResults} filename={`comparacion_inventario_${stockLocation}.xlsx`} disabled={comparisonResults.length === 0 || loading} />
            <ComparisonTable data={comparisonResults} loading={loading} />
          </Card>
        );
      case 'configuracion':
        return (
            <Card title="Configuración">
                <Paragraph>Seleccionar ubicación del stock de sistema a comparar:</Paragraph>
                <Space style={{marginBottom: '20px'}}>
                    <Button type={stockLocation === 'ENTRE RIOS' ? 'primary' : 'default'} onClick={() => setStockLocation('ENTRE RIOS')}>ENTRE RÍOS</Button>
                    <Button type={stockLocation === 'CABA' ? 'primary' : 'default'} onClick={() => setStockLocation('CABA')}>CABA</Button>
                </Space>
                <Paragraph>Tema de la Aplicación:</Paragraph>
                <ThemeToggle />
            </Card>
        );
      default:
        return <Title level={2}>Seleccione una opción del menú</Title>;
    }
  };

  return (
    <ConfigProvider theme={{
      token: {
        colorPrimary: theme === 'dark' ? '#1890ff' : '#1890ff', // Example: keep primary color consistent or adjust
      },
      algorithm: theme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    }}>
      <AntdApp>
        <AntLayout style={{ minHeight: '100vh' }}>
          <Sider collapsible>
            <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', lineHeight: '32px', color: 'white', borderRadius: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {APP_TITLE}
            </div>
            <Menu theme="dark" selectedKeys={[currentView]} mode="inline" items={menuItems} onClick={({ key }) => setCurrentView(key)} />
          </Sider>
          <AntLayout className="site-layout">
            <AntLayout.Header style={{ padding: '0 16px', background: theme === 'dark' ? '#141414' : '#fff', borderBottom: theme === 'dark' ? '1px solid #303030' : '1px solid #f0f0f0' }}> 
              <Row justify="space-between" align="middle">
                <Col>
                    <Breadcrumb 
                        style={{ margin: '0' }} 
                        items={[
                            { title: APP_TITLE },
                            { title: menuItems.find(item => item.key === currentView)?.label }
                        ]}
                    />
                </Col>
                {/* ThemeToggle is now in Configuración view 
                <Col>
                    <Space>
                        <Typography.Text style={{color: theme === 'dark' ? 'white': 'black'}}>Modo: </Typography.Text>
                        <ThemeToggle />
                    </Space>
                </Col>*/}
              </Row>
            </AntLayout.Header>
            <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
              <div style={{ padding: 24, minHeight: '75vh', background: theme === 'dark' ? '#1f1f1f' : '#fff', borderRadius: '8px' }}>
                {renderContent()}
              </div>
            </Content>
            <Footer style={{ textAlign: 'center', background: theme === 'dark' ? '#141414' : '#f0f2f5', color: theme === 'dark' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)', padding: '12px 50px' }}>
              {APP_TITLE} {new Date().getFullYear()} - Windsurf Engineering Team
            </Footer>
          </AntLayout>
        </AntLayout>
      </AntdApp>
    </ConfigProvider>
  );
};

// ... (rest of the existing imports and MainApp component code remains the same)

function App() {
  return (
    <AntdApp> {/* Wrap with AntdApp */}
      <ThemeProvider>
        <AppProvider>
          <MainApp />
        </AppProvider>
      </ThemeProvider>
    </AntdApp>
  );
}

export default App;

