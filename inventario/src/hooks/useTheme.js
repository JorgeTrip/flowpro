import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext'; // Asegúrate que la ruta sea correcta

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Ejemplo de cómo podría ser el ThemeProvider si no se usa directamente el de Ant Design
// Este es un hook más genérico, la implementación específica del ThemeContext y Provider
// definirá cómo se cambia y consume el tema.

// Si solo se usa para obtener el contexto, el hook de arriba es suficiente.
// Si se quiere encapsular lógica de cambio de tema, se podría expandir:
/*
const useThemeManager = () => {
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme };
};

export default useThemeManager; // O exportar useTheme según la necesidad
*/
