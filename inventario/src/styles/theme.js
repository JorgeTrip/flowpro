// Este archivo puede exportar las configuraciones de tema para ser usadas
// con Styled Components o para referencia, aunque ThemeContext.js ya maneja el ThemeProvider de AntD.

import { THEME_LIGHT, THEME_DARK } from '../utils/constants';

export const themeConfig = {
  [THEME_LIGHT]: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    // Colores de texto y fondo para componentes personalizados fuera de AntD
    textColor: '#333',
    backgroundColor: '#fff',
    // ...otros estilos para el tema claro
  },
  [THEME_DARK]: {
    colorPrimary: '#177ddc',
    colorSuccess: '#49aa19', // Ligeramente ajustado desde ThemeContext para ejemplo
    colorWarning: '#d89614',
    colorError: '#d32f2f',
    // Colores de texto y fondo para componentes personalizados fuera de AntD
    textColor: 'rgba(255, 255, 255, 0.85)',
    backgroundColor: '#141414',
    // ...otros estilos para el tema oscuro
  }
};

// Ejemplo de cómo podrías usar esto con Styled Components:
/*
import styled, { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { useTheme } from '../hooks/useTheme'; // Suponiendo que useTheme devuelve 'light' o 'dark'

const AppWrapper = ({ children }) => {
  const { theme } = useTheme(); // 'light' o 'dark'
  return (
    <StyledThemeProvider theme={themeConfig[theme]}>
      {children}
    </StyledThemeProvider>
  );
};
*/

// Por ahora, este archivo es principalmente para referencia de los tokens de color
// ya que Ant Design se maneja vía ConfigProvider en ThemeContext.js.
