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
  description?: string;
  file: File | null;
  onFileLoad: (file: File, data: ProcessedExcelData<T>) => void;
  setIsLoading?: (loading: boolean) => void;
  setError?: (error: string | null) => void;
  headerRowIndex?: number;
  sheetIndex?: number;
}

export function FileUpload<T>({ title, description, file, onFileLoad, setIsLoading, setError, headerRowIndex, sheetIndex }: FileUploadProps<T>) {
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
        // Bloquear .xls: ExcelJS no soporta .xls en navegador
        const isXls = /\.xls$/i.test(uploadedFile.name) && !/\.xlsx$/i.test(uploadedFile.name);
        if (isXls) {
          if (typeof setError === 'function') {
            setError('El formato .xls no es soportado. Por favor, guarde/exporte el archivo como .xlsx e intente nuevamente.');
          }
          throw new Error('Formato .xls no soportado en navegador');
        }
        const processedData = await processExcelFile(uploadedFile, { headerRowIndex, sheetIndex });
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
  }, [onFileLoad, setIsLoading, setError, headerRowIndex, sheetIndex]);

  const onDropRejected = useCallback(() => {
    if (typeof setError === 'function') {
      setError('Formato no permitido. Cargue un archivo .xlsx (.xls no es soportado en el navegador).');
    }
    if (typeof setIsLoading === 'function') {
      setIsLoading(false);
    }
  }, [setError, setIsLoading]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
  });

  return (
    <div className="w-full">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
        {description && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>}
      </div>
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
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Formato soportado: .xlsx (.xls no soportado en navegador)</p>
      </div>
    </div>
  );
}
