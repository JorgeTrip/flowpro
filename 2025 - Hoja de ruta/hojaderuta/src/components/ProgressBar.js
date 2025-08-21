import React from 'react';
import '../styles/ProgressBar.css';

/**
 * Componente de barra de progreso con mensaje
 * @param {Object} props - Propiedades del componente
 * @param {number} props.progress - Progreso de 0 a 100
 * @param {string} props.message - Mensaje descriptivo
 * @param {boolean} props.visible - Si la barra debe mostrarse
 * @returns {JSX.Element} - Componente de barra de progreso
 */
const ProgressBar = ({ progress, message, visible }) => {
  if (!visible) return null;
  
  return (
    <div className="progress-container">
      <div className="progress-bar-wrapper">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="progress-message">
        {message}
      </div>
      <div className="progress-percentage">
        {Math.round(progress)}%
      </div>
    </div>
  );
};

export default ProgressBar;
