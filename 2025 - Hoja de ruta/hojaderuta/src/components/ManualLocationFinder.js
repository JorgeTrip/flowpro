import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { getFailedAddresses, saveManualLocation } from '../services/routeService';
import './ManualLocationFinder.css';

// Corregir el problema de los íconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Componente para manejar los eventos del mapa
// Función de utilidad para agregar retraso
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function MapClickHandler({ onLocationSelect }) {
  const map = useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      
      // Implementar reintentos con retraso exponencial
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          // Agregar retraso entre intentos
          if (attempts > 0) {
            const backoffDelay = Math.pow(2, attempts) * 1000;
            console.log(`[DEBUG] Reintento ${attempts}/${maxAttempts} para geocodificación inversa. Esperando ${backoffDelay}ms...`);
            await delay(backoffDelay);
          }
          
          // Realizar geocodificación inversa para obtener la dirección del punto seleccionado
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
              timeout: 10000, // 10 segundos de timeout
              headers: {
                'User-Agent': 'HojaDeRuta/1.0 (https://hojaderuta.app)'
              }
            }
          );
          
          if (response.data && response.data.display_name) {
            // Pasar tanto las coordenadas como la dirección encontrada
            onLocationSelect(lat, lng, response.data.display_name, response.data);
            return; // Salir de la función si es exitoso
          } else {
            console.warn('[WARN] La API de geocodificación inversa no devolvió un nombre de dirección');
            // Si no hay más intentos, usar solo las coordenadas
            if (attempts >= maxAttempts - 1) {
              onLocationSelect(lat, lng, `Punto en (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
              return;
            }
          }
          
          // Incrementar intentos si no se encontró un nombre de dirección
          attempts++;
          
        } catch (error) {
          attempts++;
          console.error(`[ERROR] Intento ${attempts}/${maxAttempts} fallido para geocodificación inversa: ${error.message}`);
          
          // Si se agotaron los intentos, usar solo las coordenadas
          if (attempts >= maxAttempts) {
            onLocationSelect(lat, lng, `Punto en (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
            return;
          }
        }
      }
    },
  });
  return null;
}

const ManualLocationFinder = ({ onComplete }) => {
  const [failedAddresses, setFailedAddresses] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([-34.6037, -58.3816]); // Buenos Aires por defecto
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [foundAddress, setFoundAddress] = useState('');
  const mapRef = useRef(null);

  useEffect(() => {
    // Cargar las direcciones fallidas
    const addresses = getFailedAddresses();
    setFailedAddresses(addresses);
    
    // Si no hay direcciones fallidas, completar inmediatamente
    if (addresses.length === 0) {
      onComplete();
    } else {
      // Inicializar con la primera dirección
      setSearchQuery(addresses[0]?.address || '');
      
      // Si hay coordenadas de respaldo, centrar el mapa allí
      if (addresses[0]?.fallbackCoordinates) {
        setMapCenter([
          addresses[0].fallbackCoordinates.lat,
          addresses[0].fallbackCoordinates.lng
        ]);
        setSelectedLocation(addresses[0].fallbackCoordinates);
      }
    }
  }, [onComplete]);

  const handleLocationSelect = (lat, lng, address, addressData) => {
    setSelectedLocation({ lat, lng });
    
    // Si se encontró una dirección, actualizarla
    if (address) {
      setFoundAddress(address);
      // También actualizar el campo de búsqueda con la dirección encontrada
      setSearchQuery(address);
    } else {
      setFoundAddress('');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setFoundAddress('Buscando ubicación...');
    
    // Implementar reintentos con retraso exponencial
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        // Agregar retraso entre intentos
        if (attempts > 0) {
          const backoffDelay = Math.pow(2, attempts) * 1000;
          console.log(`[DEBUG] Reintento ${attempts}/${maxAttempts} para búsqueda de ubicación. Esperando ${backoffDelay}ms...`);
          await delay(backoffDelay);
          setFoundAddress(`Reintentando búsqueda (${attempts}/${maxAttempts})...`);
        }
        
        // Buscar la dirección usando Nominatim
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
          {
            timeout: 10000, // 10 segundos de timeout
            headers: {
              'User-Agent': 'HojaDeRuta/1.0 (https://hojaderuta.app)'
            }
          }
        );
        
        if (response.data && response.data.length > 0) {
          const result = response.data[0];
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);
          
          // Actualizar el centro del mapa y la ubicación seleccionada
          setMapCenter([lat, lng]);
          setSelectedLocation({ lat, lng });
          
          // Centrar el mapa en la nueva ubicación
          if (mapRef.current) {
            mapRef.current.setView([lat, lng], 15);
          }
          
          // Actualizar la dirección encontrada
          setFoundAddress(result.display_name);
          break; // Salir del bucle si es exitoso
        } else {
          // No se encontraron resultados
          console.warn(`[WARN] No se encontraron resultados para la búsqueda: "${searchQuery}"`);
          
          // Si no hay más intentos, mostrar mensaje final
          if (attempts >= maxAttempts - 1) {
            setFoundAddress('No se encontraron resultados para esta búsqueda. Intente con otra dirección o haga clic en el mapa.');
            setSelectedLocation(null);
          }
          
          // Incrementar intentos
          attempts++;
        }
      } catch (error) {
        attempts++;
        console.error(`[ERROR] Intento ${attempts}/${maxAttempts} fallido para búsqueda de ubicación: ${error.message}`);
        
        // Si se agotaron los intentos, mostrar mensaje final
        if (attempts >= maxAttempts) {
          setFoundAddress('Error al buscar la dirección. Intente hacer clic directamente en el mapa.');
          setSelectedLocation(null);
        }
      }
    }
    
    setIsLoading(false);
  };

  const handleSaveAndContinue = () => {
    if (!selectedLocation) {
      alert('Por favor, seleccione una ubicación en el mapa');
      return;
    }
    
    // Guardar la ubicación manual
    saveManualLocation(currentIndex, selectedLocation.lat, selectedLocation.lng);
    
    // Pasar a la siguiente dirección o finalizar
    if (currentIndex < failedAddresses.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setSearchQuery(failedAddresses[nextIndex]?.address || '');
      
      // Si hay coordenadas de respaldo, centrar el mapa allí
      if (failedAddresses[nextIndex]?.fallbackCoordinates) {
        const coords = failedAddresses[nextIndex].fallbackCoordinates;
        setMapCenter([coords.lat, coords.lng]);
        setSelectedLocation(coords);
        
        // Centrar el mapa en la nueva ubicación
        if (mapRef.current) {
          mapRef.current.setView([coords.lat, coords.lng], 15);
        }
      } else {
        setSelectedLocation(null);
      }
    } else {
      // Todas las direcciones han sido procesadas
      onComplete();
    }
  };

  const handleSkipAll = () => {
    // Saltar todas las direcciones restantes y continuar
    onComplete();
  };

  // Si no hay direcciones fallidas, no mostrar nada
  if (failedAddresses.length === 0) {
    return null;
  }

  const currentAddress = failedAddresses[currentIndex];

  return (
    <div className="manual-location-finder">
      <div className="manual-location-header">
        <h2>Ubicación manual requerida</h2>
        <p>
          No pudimos encontrar automáticamente la ubicación exacta para {failedAddresses.length} direcciones.
          Por favor, ayúdanos a ubicarlas manualmente.
        </p>
        <div className="progress-indicator">
          Dirección {currentIndex + 1} de {failedAddresses.length}
        </div>
      </div>

      <div className="manual-location-content">
        <div className="address-details">
          <h3>Detalles de la dirección</h3>
          
          <div className="address-field">
            <label>Dirección original:</label>
            <div className="address-value">{currentAddress?.address || 'N/A'}</div>
          </div>
          
          {currentAddress?.originalData && typeof currentAddress.originalData === 'object' && (
            <>
              {Object.entries(currentAddress.originalData).map(([key, value]) => {
                // Cambiar "name" por "Razón Social"
                let displayKey = key;
                if (key === 'name') {
                  displayKey = 'Razón Social';
                }
                
                return key !== 'address' && (
                  <div className="address-field" key={key}>
                    <label>{displayKey}:</label>
                    <div className="address-value">{value}</div>
                  </div>
                );
              })}
            </>
          )}
          
          {currentAddress?.error && (
            <div className="address-field error">
              <label>Error:</label>
              <div className="address-value">{currentAddress.error}</div>
            </div>
          )}
          
          <div className="search-box">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar ubicación..."
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
          
          {foundAddress && (
            <div className="found-address">
              <h4>Dirección encontrada:</h4>
              <p>{foundAddress}</p>
            </div>
          )}
          
          {selectedLocation && (
            <div className="selected-coordinates">
              <div>Latitud: {selectedLocation.lat.toFixed(6)}</div>
              <div>Longitud: {selectedLocation.lng.toFixed(6)}</div>
              
              {foundAddress && (
                <div className="found-address">
                  <h4>Dirección encontrada:</h4>
                  <div>{foundAddress}</div>
                </div>
              )}
            </div>
          )}
          
          <div className="action-buttons">
            <button 
              onClick={handleSaveAndContinue}
              className="save-button"
              disabled={!selectedLocation}
            >
              {currentIndex < failedAddresses.length - 1 
                ? 'Guardar y continuar' 
                : 'Guardar y finalizar'}
            </button>
            <button 
              onClick={handleSkipAll}
              className="skip-button"
            >
              Omitir todo y continuar
            </button>
          </div>
        </div>
        
        <div className="map-container">
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            whenCreated={map => { mapRef.current = map; }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onLocationSelect={handleLocationSelect} />
            {selectedLocation && (
              <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default ManualLocationFinder;
