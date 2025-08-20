import React, { createContext, useState, useMemo, useEffect, useCallback } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { THEME_LIGHT, THEME_DARK } from '../utils/constants';

// Definición de temas para Ant Design
const antDesignThemes = {
  [THEME_LIGHT]: {
    algorithm: antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      colorSuccess: '#52c41a',
      colorWarning: '#faad14',
      colorError: '#ff4d4f',
      // ... otros tokens para el tema claro si es necesario
    },
  },
  [THEME_DARK]: {
    algorithm: antdTheme.darkAlgorithm,
    token: {
      colorPrimary: '#177ddc', // Un azul un poco más oscuro para dark mode
      colorBgBase: '#141414', // Fondo base oscuro
      colorTextBase: 'rgba(255, 255, 255, 0.85)', // Texto base más claro
      colorSuccess: '#49aa19', // Ajustar colores para dark mode
      colorWarning: '#d89614',
      colorError: '#d32f2f',
      // ... otros tokens para el tema oscuro
    },
  },
};

export const ThemeContext = createContext({
  theme: THEME_LIGHT,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const storedTheme = localStorage.getItem('app-theme');
    return storedTheme === THEME_DARK ? THEME_DARK : THEME_LIGHT;
  });

  useEffect(() => {
    localStorage.setItem('app-theme', currentTheme);
    // Aplicar clase al body para estilos globales si es necesario (fuera de AntD)
    document.body.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const toggleTheme = useCallback(() => {
    setCurrentTheme(prevTheme => (prevTheme === THEME_LIGHT ? THEME_DARK : THEME_LIGHT));
  }, []);

  const antdConfig = useMemo(() => antDesignThemes[currentTheme], [currentTheme]);

  const contextValue = useMemo(() => ({
    theme: currentTheme,
    toggleTheme,
  }), [currentTheme, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider theme={antdConfig}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};
