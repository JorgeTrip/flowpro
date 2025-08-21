import React from 'react';
import '../styles/Summary.css';
import { exportToPdf } from '../services/exportService';
import { exportToExcel } from '../services/excelService';
import { downloadBlob } from '../utils/helpers';
import { COMPANY_INFO } from '../utils/config';

/**
 * Componente para mostrar el resumen de pedidos agrupados por razón social
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.clientSummary - Resumen de pedidos por cliente
 * @param {number} props.totalDistance - Distancia total del recorrido en metros
 * @param {number} props.totalOrders - Total de pedidos
 * @param {number} props.totalAmount - Monto total de los pedidos
 */
const Summary = ({ clientSummary, totalDistance, totalOrders, totalAmount }) => {
  /**
   * Maneja la exportación de la hoja de ruta a PDF
   */
  const handleExportPdf = async () => {
    try {
      const data = {
        clientSummary,
        totalOrders,
        totalAmount
      };
      
      const routeInfo = {
        route: {
          totalDistance,
          totalTime: totalDistance / 13.89 // Estimación aproximada: 50 km/h = 13.89 m/s
        }
      };
      
      const pdfBlob = await exportToPdf(data, routeInfo);
      downloadBlob(pdfBlob, 'hoja_de_ruta.html'); // En una implementación real sería .pdf
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      alert('Error al exportar a PDF: ' + error.message);
    }
  };

  /**
   * Maneja la exportación de la hoja de ruta a Excel
   */
  const handleExportExcel = () => {
    try {
      const data = {
        clientSummary,
        totalOrders,
        totalAmount
      };
      
      const routeInfo = {
        totalDistance
      };
      
      const excelBlob = exportToExcel(data, routeInfo);
      downloadBlob(excelBlob, 'hoja_de_ruta.xlsx');
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Error al exportar a Excel: ' + error.message);
    }
  };

  return (
    <div className="summary-container">
      <h2>Resumen de Pedidos</h2>
      
      <div className="summary-totals">
        <div className="summary-total-item">
          <div className="total-label">Distancia Total</div>
          <div className="total-value">{(totalDistance / 1000).toFixed(2)} km</div>
        </div>
        
        <div className="summary-total-item">
          <div className="total-label">Total Pedidos</div>
          <div className="total-value">{totalOrders}</div>
        </div>
        
        <div className="summary-total-item">
          <div className="total-label">Importe Total</div>
          <div className="total-value">${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>
      
      <div className="client-list">
        <h3>Detalle de la Ruta</h3>
        
        <div className="client-table-container">
          <table className="client-table">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Razón Social</th>
                <th>Dirección</th>
                <th>Pedidos</th>
                <th>Importe</th>
              </tr>
            </thead>
            <tbody>
              {/* Punto de inicio: la empresa */}
              <tr className="company-row">
                <td>0</td>
                <td>{COMPANY_INFO.NAME}</td>
                <td>{COMPANY_INFO.ADDRESS}</td>
                <td>-</td>
                <td>-</td>
              </tr>
              
              {/* Puntos de entrega: clientes */}
              {Object.entries(clientSummary).map(([clientName, data], index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{clientName}</td>
                  <td>{data.address}</td>
                  <td>{data.orderCount}</td>
                  <td>${data.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="export-section">
        <div className="export-buttons">
          <button className="export-btn pdf-btn" onClick={handleExportPdf}>
            <span className="export-icon">📄</span> Exportar a PDF
          </button>
          <button className="export-btn excel-btn" onClick={handleExportExcel}>
            <span className="export-icon">📊</span> Exportar a Excel
          </button>
        </div>
        <p className="export-info">Descarga la hoja de ruta completa en el formato que prefieras</p>
      </div>
    </div>
  );
};

export default Summary;
