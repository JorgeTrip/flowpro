import React, { useRef, useState } from 'react';
import '../styles/FileUploader.css';

/**
 * Componente para cargar archivos Excel
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onFileUpload - Función que se ejecuta cuando se carga un archivo
 */
const FileUploader = ({ onFileUpload }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  /**
   * Maneja el evento de arrastrar un archivo sobre la zona de carga
   * @param {Event} e - Evento de arrastre
   */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  /**
   * Maneja el evento de soltar un archivo en la zona de carga
   * @param {Event} e - Evento de soltar
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  /**
   * Maneja el evento de cambio en el input de archivo
   * @param {Event} e - Evento de cambio
   */
  const handleChange = (e) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  /**
   * Procesa el archivo seleccionado
   * @param {File} file - Archivo a procesar
   */
  const handleFile = (file) => {
    // Verificar que sea un archivo Excel o CSV
    if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.type === 'application/vnd.ms-excel' ||
        file.type === 'text/csv' ||
        file.name.endsWith('.xlsx') || 
        file.name.endsWith('.xls') ||
        file.name.endsWith('.csv')) {
      
      setSelectedFile(file);
      onFileUpload(file);
    } else {
      alert('Por favor, seleccione un archivo Excel válido (.xlsx, .xls) o CSV (.csv)');
    }
  };

  /**
   * Abre el diálogo de selección de archivo
   */
  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="file-uploader">
      <h2>Cargar archivo Excel</h2>
      
      <div 
        className={`drop-zone ${dragActive ? 'active' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".xlsx,.xls,.csv" 
          onChange={handleChange}
          className="file-input"
        />
        
        {selectedFile ? (
          <div className="file-info">
            <div className="file-icon">📄</div>
            <div className="file-name">{selectedFile.name}</div>
            <button 
              className="change-file-btn"
              onClick={onButtonClick}
            >
              Cambiar archivo
            </button>
          </div>
        ) : (
          <div className="drop-content">
            <div className="upload-icon">📁</div>
            <p>Arrastre su archivo Excel aquí o</p>
            <button 
              className="select-file-btn"
              onClick={onButtonClick}
            >
              Seleccionar archivo
            </button>
            <p className="file-format-info">Formatos aceptados: .xlsx, .xls, .csv</p>
          </div>
        )}
      </div>
      
      <div className="instructions">
        <h3>Instrucciones:</h3>
        <ol>
          <li>Cargue un archivo Excel con el formato especificado</li>
          <li>La aplicación procesará los datos y agrupará los pedidos por razón social</li>
          <li>Se generará una ruta optimizada utilizando OpenStreetMap</li>
          <li>Se mostrará el mapa con la ruta y un resumen de los pedidos</li>
        </ol>
      </div>
    </div>
  );
};

export default FileUploader;
