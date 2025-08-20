import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'antd/dist/reset.css';
import { VentasProvider } from './context/VentasContext';
import { ThemeProvider } from './context/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <VentasProvider>
        <App />
      </VentasProvider>
    </ThemeProvider>
  </React.StrictMode>
);
