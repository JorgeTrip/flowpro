import React, { useState } from 'react';
import axios from 'axios';
import '../styles/ClearDataButton.css';

/**
 * Componente para borrar los datos en caché del servidor
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onDataCleared - Función a ejecutar cuando se borran los datos
 */
const ClearDataButton = ({ onDataCleared }) => {
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  /**
   * Maneja el clic en el botón para borrar los datos
   */
  const handleClearData = async () => {
    try {
      setClearing(true);
      setMessage('');
      setShowMessage(false);
      
      // Limpiar los datos locales primero - esto siempre funcionará
      if (onDataCleared && typeof onDataCleared === 'function') {
        onDataCleared();
      }
      
      // Mostrar mensaje de éxito para los datos locales
      setMessage('✅ Datos locales limpiados correctamente');
      setShowMessage(true);
      
      // Intentar limpiar la caché del servidor, pero no bloquear la experiencia del usuario
      // si el servidor no está disponible
      setTimeout(() => {
        // Usar un timeout para no bloquear la interfaz
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const clearCacheUrl = isLocalhost
          ? 'http://localhost:3001/api/clear-cache'
          : '/api/clear-cache';
          
        axios.get(clearCacheUrl)
          .then(response => {
            if (response.data && response.data.success) {
              console.log('Caché del servidor limpiada:', response.data.message);
              // No actualizamos el mensaje para no confundir al usuario
            }
          })
          .catch(error => {
            // Solo registramos el error pero no lo mostramos al usuario
            console.warn('No se pudo limpiar la caché del servidor:', error.message);
          });
      }, 100);
    } catch (error) {
      console.error('Error al borrar los datos:', error);
      setMessage(`❌ Error: ${error.message || 'No se pudieron borrar los datos'}`);
    } finally {
      setClearing(false);
      setShowMessage(true);
      
      // Ocultar el mensaje después de 5 segundos
      setTimeout(() => {
        setShowMessage(false);
      }, 5000);
    }
  };

  return (
    <div className="clear-data-container">
      <button 
        className="clear-data-button" 
        onClick={handleClearData}
        disabled={clearing}
      >
        {clearing ? 'Borrando...' : 'Borrar datos'}
      </button>
      
      {showMessage && message && (
        <div className="clear-data-message">
          {message}
        </div>
      )}
    </div>
  );
};

export default ClearDataButton;
