import { formatCurrency, formatDistance, formatTime } from '../utils/helpers';
import { COMPANY_INFO } from '../utils/config';

/**
 * Genera un documento PDF con la hoja de ruta
 * @param {Object} data - Datos procesados del Excel
 * @param {Object} routeInfo - Información de la ruta
 * @returns {Promise<Blob>} - Archivo PDF generado
 */
export const exportToPdf = async (data, routeInfo) => {
  // Esta función es un placeholder para la implementación real de exportación a PDF
  // En una implementación real, se utilizaría una biblioteca como jsPDF o html2pdf
  
  // Simulamos la creación de un PDF mediante la generación de HTML que luego se convertiría a PDF
  const html = generateRouteHtml(data, routeInfo);
  
  // En una implementación real, aquí convertiríamos el HTML a PDF
  // Por ahora, devolvemos un Blob con el HTML para simular la funcionalidad
  return new Blob([html], { type: 'text/html' });
};

/**
 * Genera el HTML para la hoja de ruta
 * @param {Object} data - Datos procesados del Excel
 * @param {Object} routeInfo - Información de la ruta
 * @returns {string} - HTML generado
 */
const generateRouteHtml = (data, routeInfo) => {
  const { clientSummary, totalOrders, totalAmount } = data;
  const { totalDistance, totalTime } = routeInfo.route;
  
  // Generar fila para la empresa (punto de inicio)
  const companyRow = `
    <tr class="company-row">
      <td>0</td>
      <td>${COMPANY_INFO.NAME}</td>
      <td>${COMPANY_INFO.ADDRESS}</td>
      <td>-</td>
      <td>-</td>
    </tr>
  `;
  
  // Generar filas de la tabla de clientes
  const clientRows = Object.entries(clientSummary).map(([clientName, clientData], index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${clientName}</td>
      <td>${clientData.address}</td>
      <td>${clientData.orderCount}</td>
      <td>${formatCurrency(clientData.totalAmount)}</td>
    </tr>
  `).join('');
  
  // Generar el HTML completo
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hoja de Ruta</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          color: #2c3e50;
        }
        .header p {
          margin: 5px 0;
          color: #7f8c8d;
        }
        .summary {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-item h3 {
          margin: 0;
          font-size: 14px;
          color: #7f8c8d;
        }
        .summary-item p {
          margin: 5px 0 0;
          font-size: 18px;
          font-weight: bold;
          color: #2c3e50;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f8f9fa;
          font-weight: bold;
          color: #2c3e50;
        }
        tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        .footer {
          text-align: center;
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #7f8c8d;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Hoja de Ruta</h1>
        <p>Generada el ${new Date().toLocaleDateString('es-AR', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>
      
      <div class="summary">
        <div class="summary-item">
          <h3>Distancia Total</h3>
          <p>${formatDistance(totalDistance)}</p>
        </div>
        <div class="summary-item">
          <h3>Tiempo Estimado</h3>
          <p>${formatTime(totalTime)}</p>
        </div>
        <div class="summary-item">
          <h3>Total Pedidos</h3>
          <p>${totalOrders}</p>
        </div>
        <div class="summary-item">
          <h3>Importe Total</h3>
          <p>${formatCurrency(totalAmount)}</p>
        </div>
      </div>
      
      <h2>Detalle de la Ruta</h2>
      <table>
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
          ${companyRow}
          ${clientRows}
          <tr>
            <td colspan="3" style="text-align: right; font-weight: bold;">TOTAL</td>
            <td style="font-weight: bold;">${totalOrders}</td>
            <td style="font-weight: bold;">${formatCurrency(totalAmount)}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} - Generador de Hoja de Ruta</p>
      </div>
    </body>
    </html>
  `;
};
