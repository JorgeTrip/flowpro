import React from 'react';
import styles from './ResultsPreview.module.css';
import { Typography, Card } from 'antd';

const { Title, Paragraph } = Typography;

const ResultsPreview = ({ systemDataCount, physicalDataCount, comparisonResults }) => {
  return (
    <div className={styles.resultsPreviewContainer}>
      <Title level={3}>Previsualización de Resultados</Title>
      
      <Card title="Datos Cargados" style={{ marginBottom: 20 }}>
        <Paragraph>Registros cargados del sistema: <strong>{systemDataCount || 0}</strong></Paragraph>
        <Paragraph>Registros cargados del inventario físico: <strong>{physicalDataCount || 0}</strong></Paragraph>
      </Card>

      {comparisonResults && comparisonResults.length > 0 && (
        <Card title="Resumen de Comparación">
          <Paragraph>Items con diferencias encontradas: <strong>{comparisonResults.length}</strong></Paragraph>
          {/* Add more summary stats here, e.g., total sobrante, total faltante */}
        </Card>
      )}
      {/* The ComparisonTable component will likely be displayed here or in a dedicated section */}
    </div>
  );
};

export default ResultsPreview;
