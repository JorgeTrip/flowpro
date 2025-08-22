import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, ConfigProvider, theme as antdTheme } from 'antd';
import Sidebar from './layouts/Sidebar';
import TopBar from './layouts/TopBar';
import UploadPage from './pages/UploadPage';
import ReportPage from './pages/ReportPage';
import DashboardPage from './pages/DashboardPage';
import ReportePersonalizadoPage from './pages/ReportePersonalizadoPage';
import { useTheme } from './context/ThemeContext';

const { Content } = Layout;

const App: React.FC = () => {
  const { darkMode } = useTheme();
  return (
    <ConfigProvider theme={{ algorithm: darkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm }}>
      <Router>
        <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <TopBar />
          <Layout style={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
            <Sidebar />
            <Layout>
              <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
                <Routes>
                  <Route path="/" element={<Navigate to="/carga" />} />
                  <Route path="/carga" element={<UploadPage />} />
                  <Route path="/reporte" element={<ReportPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/reporte-personalizado" element={<ReportePersonalizadoPage />} />
                </Routes>
              </Content>
            </Layout>
          </Layout>
        </Layout>
      </Router>
    </ConfigProvider>
  );
};

export default App;
