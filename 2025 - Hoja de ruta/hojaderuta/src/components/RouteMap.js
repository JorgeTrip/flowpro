import React, { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import '../styles/RouteMap.css';
import { MAP_CONFIG } from '../utils/config';

/**
 * Componente para mostrar el mapa con la ruta optimizada
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.waypoints - Puntos de la ruta (coordenadas)
 * @param {Object} props.route - Información de la ruta
 */
const RouteMap = ({ waypoints, route }) => {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef([]);
  const routeLayerRef = useRef(null);

  // Filtrar waypoints con coordenadas válidas usando useMemo para evitar recálculos innecesarios
  const validWaypoints = useMemo(() => {
    return waypoints ? waypoints.filter(wp => {
      return wp && 
             typeof wp.lat === 'number' && !isNaN(wp.lat) && 
             typeof wp.lng === 'number' && !isNaN(wp.lng);
    }) : [];
  }, [waypoints]);

  useEffect(() => {
    // Inicializar el mapa si no existe
    if (!leafletMap.current) {
      // Crear el mapa centrado en las coordenadas predeterminadas
      leafletMap.current = L.map(mapRef.current).setView(MAP_CONFIG.DEFAULT_CENTER, MAP_CONFIG.DEFAULT_ZOOM);
      
      // Añadir capa de OpenStreetMap
      L.tileLayer(MAP_CONFIG.TILE_LAYER_URL, {
        attribution: MAP_CONFIG.TILE_LAYER_ATTRIBUTION,
        maxZoom: 19
      }).addTo(leafletMap.current);
    }

    // Limpiar marcadores y rutas anteriores
    if (markersRef.current.length > 0) {
      markersRef.current.forEach(marker => {
        if (leafletMap.current) {
          leafletMap.current.removeLayer(marker);
        }
      });
      markersRef.current = [];
    }

    if (routeLayerRef.current && leafletMap.current) {
      leafletMap.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    // Si hay waypoints válidos, mostrar la ruta
    if (validWaypoints.length > 0) {
      // Crear marcadores para cada punto
      validWaypoints.forEach((wp, i) => {
        const isCompanyMarker = i === 0; // El primer punto es la empresa
        
        const marker = L.marker([wp.lat, wp.lng], {
          draggable: false,
          icon: L.divIcon({
            className: isCompanyMarker ? 'company-marker' : 'custom-marker',
            html: isCompanyMarker 
              ? `<div class="marker-company"><i class="fa-building"></i></div>`
              : `<div class="marker-number">${i}</div>`,
            iconSize: [30, 30]
          })
        }).addTo(leafletMap.current);
        
        // Añadir popup con información
        marker.bindPopup(`<b>${wp.name || 'Punto ' + i}</b><br>${wp.address || ''}`);
        
        markersRef.current.push(marker);
      });

      // Dibujar la ruta como una polyline
      if (route && route.geometry) {
        // Usar la geometría proporcionada por la API (formato GeoJSON)
        const lineStyle = {
          color: route.usingFallbackMode ? '#ff6b6b' : '#3388ff',
          weight: 6,
          opacity: 0.7,
          dashArray: route.usingFallbackMode ? '10, 10' : null
        };
        
        // Crear la polyline a partir de la geometría GeoJSON
        routeLayerRef.current = L.geoJSON(route.geometry, {
          style: lineStyle
        }).addTo(leafletMap.current);
        
        // Ajustar el zoom para mostrar toda la ruta
        const bounds = routeLayerRef.current.getBounds();
        leafletMap.current.fitBounds(bounds, { padding: [50, 50] });
      } else {
        // Fallback: Dibujar líneas rectas entre los puntos si no hay geometría
        const routePoints = validWaypoints.map(wp => [wp.lat, wp.lng]);
        
        // Configurar el estilo de la línea según si estamos en modo de respaldo
        const lineStyle = {
          color: route?.usingFallbackMode ? '#ff6b6b' : '#3388ff',
          weight: 6,
          opacity: 0.7,
          dashArray: route?.usingFallbackMode ? '10, 10' : null
        };
        
        routeLayerRef.current = L.polyline(routePoints, lineStyle).addTo(leafletMap.current);
        
        // Ajustar el zoom para mostrar toda la ruta
        const bounds = L.latLngBounds(routePoints);
        leafletMap.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    // Función de limpieza
    return () => {
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => {
          if (leafletMap.current) {
            leafletMap.current.removeLayer(marker);
          }
        });
        markersRef.current = [];
      }

      if (routeLayerRef.current && leafletMap.current) {
        leafletMap.current.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }
    };
  }, [validWaypoints, route]);

  // Actualizar el tamaño del mapa cuando cambia el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      if (leafletMap.current) {
        leafletMap.current.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="route-map-container">
      <h2>Mapa de Ruta</h2>
      <div className="route-map" ref={mapRef}></div>
      {route && (
        <div className="route-info">
          <p><strong>Punto de inicio:</strong> {validWaypoints[0]?.address || 'Empresa'}</p>
          <p><strong>Distancia total:</strong> {route.totalDistance ? `${Number(route.totalDistance).toFixed(2)} km` : (route.distance ? `${Number(route.distance).toFixed(2)} km` : 'Calculando...')}</p>
          <p><strong>Tiempo estimado:</strong> {route.totalDuration ? `${Math.floor(route.totalDuration / 3600)} h ${Math.floor((route.totalDuration % 3600) / 60)} min` : (route.duration || 'Calculando...')}</p>
          <p><strong>Puntos de entrega:</strong> {validWaypoints.length - 1}</p> {/* Restamos 1 porque el primer punto es la empresa */}
          {route.usingFallbackMode && (
            <div className="fallback-warning">
              <p><strong>Nota:</strong> Algunas direcciones no pudieron ser ubicadas con precisión. 
              La ruta mostrada es aproximada y puede no reflejar el recorrido real por calles.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RouteMap;
