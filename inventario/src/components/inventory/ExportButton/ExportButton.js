import React, { useState } from 'react';
import { Button, App } from 'antd'; // Import App
import { FileExcelOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import styles from './ExportButton.module.css';

const ExportButton = ({ data, filename = 'inventario_comparado.xlsx', disabled }) => {
  const [loading, setLoading] = useState(false);
  const { message: messageApi } = App.useApp(); // Get message instance from context

  const handleExport = () => {
    if (!data || data.length === 0) {
      messageApi.warning('No hay datos para exportar.');
      return;
    }
    setLoading(true);
    try {
      // Create a new worksheet
      const worksheet = XLSX.utils.json_to_sheet(data);
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Resultados');

      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, filename);
      messageApi.success('Datos exportados a Excel con éxito.');
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      messageApi.error('Ocurrió un error al exportar los datos.');
    }
    setLoading(false);
  };

  return (
    <Button
      type="primary"
      icon={<FileExcelOutlined />}
      onClick={handleExport}
      disabled={disabled || loading || !data || data.length === 0}
      loading={loading}
      className={styles.exportButton}
    >
      Exportar a Excel
    </Button>
  );
};

export default ExportButton;
