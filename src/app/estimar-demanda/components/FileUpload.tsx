// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useEstimarDemandaStore } from '@/app/stores/estimarDemandaStore';
import { processExcelFile } from '@/app/lib/excelProcessor';

interface FileUploadProps {
  fileType: 'ventas' | 'stock';
  title: string;
}

export function FileUpload({ fileType, title }: FileUploadProps) {
  const {
    setVentasFile,
    setStockFile,
    setVentasData,
    setStockData,
    setIsLoading,
    setError,
    ventasFile,
    stockFile,
  } = useEstimarDemandaStore();

  const file = fileType === 'ventas' ? ventasFile : stockFile;

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setIsLoading(true);
      setError(null);
      try {
        const { data, columns, previewData } = await processExcelFile(uploadedFile);
        if (fileType === 'ventas') {
          setVentasFile(uploadedFile);
          setVentasData(data, columns, previewData);
        } else {
          setStockFile(uploadedFile);
          setStockData(data, columns, previewData);
        }
      } catch (err: any) {
        setError(`Error al procesar el archivo de ${fileType}: ${err.message || 'Ocurrió un error inesperado.'}`);
      } finally {
        setIsLoading(false);
      }
    }
  }, [fileType, setIsLoading, setError, setVentasFile, setVentasData, setStockFile, setStockData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{title}</h3>
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
        } ${file ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}`}
      >
        <input {...getInputProps()} />
        {file ? (
          <p className="text-lg font-semibold text-green-700 dark:text-green-400">
            Archivo cargado: {file.name}
          </p>
        ) : (
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {isDragActive
              ? 'Suelte el archivo aquí...'
              : 'Arrastre y suelte su archivo Excel aquí, o haga clic para seleccionarlo'}
          </p>
        )}
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Formatos soportados: .xlsx, .xls</p>
      </div>
    </div>
  );
}
