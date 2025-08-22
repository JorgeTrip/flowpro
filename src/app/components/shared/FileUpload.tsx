// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { processExcelFile } from '@/app/lib/excelProcessor';
// Este componente es genérico y no importa un tipo de fila específico.

export interface ProcessedExcelData<T> {
  data: T[];
  columns: string[];
  previewData: T[];
}

interface FileUploadProps<T> {
  title: string;
  file: File | null;
  onFileLoad: (file: File, data: ProcessedExcelData<T>) => void;
  setIsLoading?: (loading: boolean) => void;
  setError?: (error: string | null) => void;
}

export function FileUpload<T>({ title, file, onFileLoad, setIsLoading, setError }: FileUploadProps<T>) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      // Add safety check for setIsLoading
      if (typeof setIsLoading === 'function') {
        setIsLoading(true);
      }
      if (typeof setError === 'function') {
        setError(null);
      }
      try {
        const processedData = await processExcelFile(uploadedFile);
        onFileLoad(uploadedFile, processedData as ProcessedExcelData<T>);
      } catch (error: unknown) {
        if (typeof setError === 'function') {
          setError(`Error al procesar el archivo: ${error instanceof Error ? error.message : 'Ocurrió un error inesperado.'}`);
        }
      } finally {
        if (typeof setIsLoading === 'function') {
          setIsLoading(false);
        }
      }
    }
  }, [onFileLoad, setIsLoading, setError]);

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
