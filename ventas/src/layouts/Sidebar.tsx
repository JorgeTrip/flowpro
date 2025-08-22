import React from 'react';
import { Layout, Menu, Button, Tooltip } from 'antd';
import { FileAddOutlined, BarChartOutlined, DashboardOutlined, BulbOutlined, MoonOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const { Sider } = Layout;

/**
 * Sidebar de navegación lateral con botón de modo oscuro/claro
 */
const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleTheme } = useTheme();

  return (
    <Sider width={200} style={{ background: darkMode ? '#141414' : '#fff', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        style={{ flex: 1, borderRight: 0 }}
        items={[
          {
            key: '/carga',
            icon: <FileAddOutlined />,
            label: 'Carga de archivo',
            onClick: () => navigate('/carga'),
          },
          {
            key: '/reporte',
            icon: <BarChartOutlined />,
            label: 'Reporte',
            onClick: () => navigate('/reporte'),
          },
          {
            key: '/dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
            onClick: () => navigate('/dashboard'),
          },
          {
            key: '/reporte-personalizado',
            icon: <FileTextOutlined />,
            label: 'Reportes Personalizados',
            onClick: () => navigate('/reporte-personalizado'),
          },
        ]}
      />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <Tooltip title={darkMode ? 'Modo claro' : 'Modo oscuro'}>
          <Button
            shape="circle"
            icon={darkMode ? <BulbOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
          />
        </Tooltip>
      </div>
    </Sider>
  );
};

export default Sidebar;
