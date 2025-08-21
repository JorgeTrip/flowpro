import React from 'react';
import '../styles/Spinner.css';

/**
 * Componente de spinner para indicar carga
 * @param {Object} props - Propiedades del componente
 * @param {string} props.message - Mensaje a mostrar junto al spinner
 * @param {boolean} props.visible - Si el spinner debe mostrarse
 * @returns {JSX.Element} - Componente de spinner
 */
const Spinner = ({ message, visible }) => {
  if (!visible) return null;
  
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
      {message && <div className="spinner-message">{message}</div>}
    </div>
  );
};

export default Spinner;
