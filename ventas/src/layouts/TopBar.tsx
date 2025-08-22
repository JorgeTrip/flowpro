import React from 'react';
import { Layout, Typography } from 'antd';
import { useTheme } from '../context/ThemeContext';

const { Header } = Layout;
const { Title } = Typography;

/**
 * Barra superior con el título del sistema
 */
const TopBar: React.FC = () => {
  const { darkMode } = useTheme();
  
  return (
    <Header 
      style={{ 
        background: darkMode ? '#1f1f1f' : '#f0f2f5', 
        padding: 0, 
        borderBottom: `1px solid ${darkMode ? '#303030' : '#e8e8e8'}`,
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
        zIndex: 1000,
        height: '70px',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Title 
        level={2} 
        style={{ 
          margin: '0 24px', 
          fontWeight: 600,
          letterSpacing: '-0.5px',
          color: darkMode ? '#f0f2f5' : '#1f1f1f',
          fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          textShadow: darkMode ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none'
        }}
      >
        Generador de Reporte de Ventas
      </Title>
    </Header>
  );
};

export default TopBar;
