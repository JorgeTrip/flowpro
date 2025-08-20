import React from 'react';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  return (
    <aside className={styles.sidebar}>
      <nav>
        <ul>
          {/* Navigation links will go here */}
          <li>📁 Carga de Planillas</li>
          <li>👁️ Previsualización de Resultados</li>
          <li>📊 Análisis de Diferencias</li>
          <li>⚙️ Configuración</li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
