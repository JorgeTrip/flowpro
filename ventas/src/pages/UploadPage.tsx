import React, { useState } from 'react';
import { Button, Card, message } from 'antd';
import ExcelPreviewTable from '../components/ExcelPreviewTable';
import { readExcelFile } from '../services/excelService';
import { Venta } from '../types/Venta';
import { useNavigate } from 'react-router-dom';
import { useVentas } from '../context/VentasContext';

/**
 * Página para cargar y previsualizar el archivo Excel
 */
const UploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setVentas } = useVentas();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setLoading(true);
      try {
        const data = await readExcelFile(selectedFile);
        setPreviewData(data.slice(0, 10));
        setFile(selectedFile);
        setVentas(data); // Guardar todas las ventas en el contexto global
      } catch (err) {
        message.error('Error al leer el archivo Excel.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleContinue = () => {
    if (file && previewData.length > 0) {
      navigate('/reporte');
    } else {
      message.warning('Debe cargar un archivo válido antes de continuar.');
    }
  };

  return (
    <Card title="Carga de archivo Excel" style={{ maxWidth: 900, margin: '32px auto' }}>
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        style={{ marginBottom: 16 }}
      />
      <ExcelPreviewTable data={previewData} loading={loading} />
      <Button
        type="primary"
        onClick={handleContinue}
        disabled={!file || previewData.length === 0}
        style={{ marginTop: 24 }}
      >
        Continuar
      </Button>
    </Card>
  );
};

export default UploadPage;
