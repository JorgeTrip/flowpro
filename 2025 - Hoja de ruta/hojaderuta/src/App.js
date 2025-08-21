import React, { useState, useEffect } from 'react';
import './styles/App.css';
import FileUploader from './components/FileUploader';
import RouteMap from './components/RouteMap';
import Summary from './components/Summary';
import ProgressBar from './components/ProgressBar';
import Spinner from './components/Spinner';
import ClearDataButton from './components/ClearDataButton';
import ManualLocationFinder from './components/ManualLocationFinder';
import { processExcelData } from './services/excelService';
import { calculateRoute, routeProgressEvents, getFailedAddresses, clearManualCoordinates } from './services/routeService';
import { getFriendlyErrorMessage, ERROR_CODES } from './utils/errorHandler';

/**
 * Componente principal de la aplicación
 * Gestiona el estado global y la lógica principal
 */
function App() {
  // Estado para almacenar los datos procesados del Excel
  const [processedData, setProcessedData] = useState(null);
  // Estado para almacenar la información de la ruta
  const [routeInfo, setRouteInfo] = useState(null);
  // Estado para controlar la carga de datos
  const [loading, setLoading] = useState(false);
  // Estado para el procesamiento del archivo
  const [processingFile, setProcessingFile] = useState(false);
  // Estado para manejar errores
  const [error, setError] = useState(null);
  // Estado para la barra de progreso
  const [progress, setProgress] = useState({
    visible: false,
    percentage: 0,
    message: ''
  });
  // Estado para controlar la visibilidad del buscador de ubicaciones manual
  const [showManualFinder, setShowManualFinder] = useState(false);
  // Estado para almacenar los datos originales del archivo mientras se buscan ubicaciones manualmente
  const [pendingData, setPendingData] = useState(null);

  /**
   * Efecto para suscribirse a los eventos de progreso
   */
  useEffect(() => {
    // Función para manejar los eventos de progreso
    const handleProgressEvent = (event) => {
      const { progress, message } = event.detail;
      
      setProgress({
        visible: true,
        percentage: progress,
        message: message
      });
      
      // Si el progreso es 100%, ocultar la barra después de un tiempo
      if (progress === 100) {
        setTimeout(() => {
          setProgress(prev => ({ ...prev, visible: false }));
        }, 2000);
      }
    };
    
    // Suscribirse al evento de progreso
    routeProgressEvents.addEventListener('routeProgress', handleProgressEvent);
    
    // Limpiar la suscripción al desmontar el componente
    return () => {
      routeProgressEvents.removeEventListener('routeProgress', handleProgressEvent);
    };
  }, []);
  
  /**
   * Maneja la carga y procesamiento del archivo Excel
   * @param {File} file - Archivo Excel cargado por el usuario
   */
  const handleFileUpload = async (file) => {
    try {
      setLoading(true);
      setProcessingFile(true);
      setError(null);
      setProgress({
        visible: true,
        percentage: 0,
        message: 'Iniciando procesamiento del archivo...'
      });
      
      // Verificar el formato del archivo
      const fileExt = file.name.split('.').pop().toLowerCase();
      if (fileExt !== 'xlsx' && fileExt !== 'xls' && fileExt !== 'csv') {
        throw new Error(getFriendlyErrorMessage(ERROR_CODES.FILE_FORMAT));
      }
      
      // Procesar el archivo Excel
      setProgress({
        visible: true,
        percentage: 10,
        message: 'Procesando archivo de datos...'
      });
      const data = await processExcelData(file);
      setProcessingFile(false);
      
      setProgress({
        visible: true,
        percentage: 20,
        message: 'Archivo procesado. Iniciando cálculo de ruta...'
      });
      
      // Si hay direcciones, calcular la ruta
      if (data && data.addresses.length > 0) {
        // Guardar los datos procesados para usarlos después si es necesario
        setPendingData(data);
        
        // Calcular la ruta
        const route = await calculateRoute(data.addresses);
        
        // Verificar si hay direcciones que no pudieron ser geocodificadas correctamente
        const failedAddresses = getFailedAddresses();
        
        if (failedAddresses.length > 0) {
          console.log(`Se detectaron ${failedAddresses.length} direcciones que requieren ubicación manual`);
          // Mostrar el componente de búsqueda manual
          setShowManualFinder(true);
          // No establecer los datos procesados ni la información de la ruta todavía
        } else {
          // No hay direcciones fallidas, establecer los datos y la ruta directamente
          setProcessedData(data);
          setRouteInfo(route);
        }
      } else {
        throw new Error('No se encontraron direcciones válidas en el archivo.');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error en la aplicación:', err);
      
      // Obtener un mensaje de error amigable
      const errorMessage = err.message;
      
      setError(errorMessage);
      setLoading(false);
      setProcessingFile(false);
      setPendingData(null);
    }
  };

  /**
   * Maneja la limpieza de datos
   */
  const handleDataCleared = () => {
    // Limpiar los datos locales
    setProcessedData(null);
    setRouteInfo(null);
    setError(null);
    setPendingData(null);
    setShowManualFinder(false);
    
    console.log('Datos locales limpiados');
  };
  
  /**
   * Maneja la finalización de la búsqueda manual de ubicaciones
   */
  const handleManualLocationComplete = async () => {
    try {
      setLoading(true);
      setShowManualFinder(false);
      
      if (pendingData) {
        setProgress({
          visible: true,
          percentage: 70,
          message: 'Recalculando ruta con ubicaciones manuales...'
        });
        
        // Recalcular la ruta con las ubicaciones manuales
        const route = await calculateRoute(pendingData.addresses);
        
        // Establecer los datos procesados y la información de la ruta
        setProcessedData(pendingData);
        setRouteInfo(route);
        
        setProgress({
          visible: true,
          percentage: 100,
          message: 'Ruta calculada con éxito'
        });
        
        // Limpiar las coordenadas manuales después de recalcular la ruta
        // para que no se utilicen en futuros cálculos
        clearManualCoordinates();
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error al recalcular la ruta:', err);
      setError(err.message);
      setLoading(false);
      // Limpiar las coordenadas manuales en caso de error
      clearManualCoordinates();
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Generador de Hoja de Ruta</h1>
      </header>
      
      <main className="app-content">
        <div className="file-upload-section">
          <FileUploader onFileUpload={handleFileUpload} />
          
          <div className="separator"></div>
          
          <div className="clear-data-section">
            <ClearDataButton onDataCleared={handleDataCleared} />
          </div>
        </div>
        
        {/* Barra de progreso */}
        <ProgressBar 
          visible={progress.visible} 
          progress={progress.percentage} 
          message={progress.message} 
        />
        
        {/* Spinner para procesamiento de archivo */}
        <Spinner 
          visible={(loading || processingFile) && !progress.visible}
          message={processingFile ? "Procesando el archivo..." : "Cargando datos..."}
        />
        
        {error && <div className="error">{error}</div>}
        
        {/* Componente para búsqueda manual de ubicaciones */}
        {showManualFinder && (
          <ManualLocationFinder onComplete={handleManualLocationComplete} />
        )}
        
        {routeInfo && (
          <div className="results-container">
            <RouteMap 
              waypoints={routeInfo.waypoints} 
              route={routeInfo.route} 
            />
            
            <Summary 
              clientSummary={processedData.clientSummary} 
              totalDistance={routeInfo.totalDistance}
              totalOrders={processedData.totalOrders}
              totalAmount={processedData.totalAmount}
            />
          </div>
        )}
      </main>
      
      <footer className="app-footer">
        <p> 2025 - Generador de Hoja de Ruta</p>
      </footer>
    </div>
  );
}

export default App;
