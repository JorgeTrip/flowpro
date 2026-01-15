'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAsistenciasStore } from '@/app/stores/asistenciasStore';
import DataPreviewTable from '@/app/estimar-demanda/components/DataPreviewTable';
import type { ExcelRow } from '@/app/stores/estimarDemandaStore';

const SelectAsignacion = ({ label, columnas, value, onChange }: { label: string; columnas: string[]; value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 block w-full max-w-xs rounded-md border-gray-300 bg-white py-2 pl-3 pr-10 text-base shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
    >
      <option value="">Seleccionar columna...</option>
      {columnas.map((col) => (
        <option key={col} value={col}>
          {col}
        </option>
      ))}
    </select>
  </div>
);

export function ConfigStep() {
  const {
    fichadasFile,
    fichadasColumnas,
    fichadasPreviewData,
    config,
    setStep,
    setMapeo,
    setDefaultConfig,
    recomputarEmpleados,
    normalizarEventos,
  } = useAsistenciasStore();

  const [mapeo, setMapeoLocal] = useState<{ empleado: string; fecha: string; hora: string; tipo: string }>({ empleado: '', fecha: '', hora: '', tipo: '' });

  useEffect(() => {
    if (Array.isArray(fichadasColumnas) && fichadasColumnas.length && !mapeo.empleado && !mapeo.fecha && !mapeo.hora && !mapeo.tipo) {
      const cols = fichadasColumnas.map((c) => String(c ?? '').toLowerCase());
      const findCol = (keywords: string[]) => {
        for (const kw of keywords) {
          const idx = cols.findIndex((c) => (c || '').includes(kw));
          if (idx >= 0) return fichadasColumnas[idx];
        }
        return '';
      };
      const auto = {
        empleado: findCol(['empleado', 'colaborador', 'persona', 'nombre', 'apellido']),
        fecha: findCol(['fecha', 'dia', 'día']),
        hora: findCol(['hora', 'tiempo', 'time']),
        tipo: findCol(['tipo', 'evento', 'mov', 'entrada', 'salida']),
      };
      setMapeoLocal(auto);
    }
  }, [fichadasColumnas, mapeo.empleado, mapeo.fecha, mapeo.hora, mapeo.tipo]);

  const isReady = useMemo(() => !!(mapeo.empleado && mapeo.fecha && mapeo.hora && mapeo.tipo), [mapeo]);

  const highlighted = useMemo(() => [mapeo.empleado, mapeo.fecha, mapeo.hora, mapeo.tipo].filter(Boolean) as string[], [mapeo]);

  const defaults = config.defaults;
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const francos = defaults.francos || [];

  const toggleFranco = (idx: number) => {
    const set = new Set(francos);
    if (set.has(idx)) set.delete(idx); else set.add(idx);
    setDefaultConfig({ francos: Array.from(set).sort((a, b) => a - b) });
  };

  const handleContinuar = () => {
    if (!isReady) return;
    setMapeo(mapeo);
    recomputarEmpleados();
    normalizarEventos();
    setStep(3);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Paso 2: Configurar mapeo y horarios</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Asigne columnas de la planilla y configure horarios por defecto y por empleado.</p>

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          {fichadasFile && fichadasPreviewData.length > 0 && (
            <DataPreviewTable title="Previsualización de Fichadas" previewData={fichadasPreviewData as ExcelRow[]} columns={fichadasColumnas} highlightedColumns={highlighted} />
          )}
        </div>
        <div className="grid grid-cols-1 gap-6">
          <SelectAsignacion label="Empleado" columnas={fichadasColumnas} value={mapeo.empleado} onChange={(v) => setMapeoLocal((p) => ({ ...p, empleado: v === 'Seleccionar columna...' ? '' : v }))} />
          <SelectAsignacion label="Fecha" columnas={fichadasColumnas} value={mapeo.fecha} onChange={(v) => setMapeoLocal((p) => ({ ...p, fecha: v === 'Seleccionar columna...' ? '' : v }))} />
          <SelectAsignacion label="Hora" columnas={fichadasColumnas} value={mapeo.hora} onChange={(v) => setMapeoLocal((p) => ({ ...p, hora: v === 'Seleccionar columna...' ? '' : v }))} />
          <SelectAsignacion label="Tipo (Entrada/Salida)" columnas={fichadasColumnas} value={mapeo.tipo} onChange={(v) => setMapeoLocal((p) => ({ ...p, tipo: v === 'Seleccionar columna...' ? '' : v }))} />
        </div>
      </div>

      <div className="mt-8 rounded-md border border-gray-200 p-6 dark:border-gray-700">
        <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200">Horarios por defecto</h4>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Entrada</label>
            <input type="time" value={defaults.entrada} onChange={(e) => setDefaultConfig({ entrada: e.target.value })} className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Salida</label>
            <input type="time" value={defaults.salida} onChange={(e) => setDefaultConfig({ salida: e.target.value })} className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Almuerzo inicio</label>
            <input type="time" value={defaults.almuerzoInicio} onChange={(e) => setDefaultConfig({ almuerzoInicio: e.target.value })} className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Almuerzo fin</label>
            <input type="time" value={defaults.almuerzoFin} onChange={(e) => setDefaultConfig({ almuerzoFin: e.target.value })} className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duración (min)</label>
            <input type="number" min={0} value={defaults.almuerzoDuracionMin} onChange={(e) => setDefaultConfig({ almuerzoDuracionMin: Number(e.target.value) || 0 })} className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
          <div className="md:col-span-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Francos</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {dias.map((d, idx) => (
                <label key={idx} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={francos.includes(idx)} onChange={() => toggleFranco(idx)} /> {d}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-md border border-gray-200 p-6 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200">Horarios por empleado</h4>
          <button onClick={() => { setMapeo(mapeo); recomputarEmpleados(); }} className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">Cargar empleados</button>
        </div>

        <EmpleadosTable />
      </div>

      <div className="mt-8 flex items-center justify-end gap-3">
        <button onClick={() => setStep(1)} className="rounded-md bg-gray-200 px-4 py-2 font-semibold text-gray-800 transition-colors hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500">Volver</button>
        <button onClick={handleContinuar} disabled={!isReady} className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-500">Continuar</button>
      </div>
    </div>
  );
}

function EmpleadosTable() {
  const { empleados, config, setHorarioEmpleado } = useAsistenciasStore();

  if (!empleados.length) {
    return <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">No hay empleados detectados aún. Cargue la planilla y presione &quot;Cargar empleados&quot;.</p>;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">Empleado</th>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">Entrada</th>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">Salida</th>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">Almuerzo Inicio</th>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">Almuerzo Fin</th>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">Duración (min)</th>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">Francos extra</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {empleados.map((emp) => {
            const per = config.horariosPorEmpleado[emp] || {};
            return (
              <tr key={emp} className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700">
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{emp}</td>
                <td className="px-4 py-2">
                  <input type="time" value={per.entrada ?? ''} onChange={(e) => setHorarioEmpleado(emp, { entrada: e.target.value })} className="w-32 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </td>
                <td className="px-4 py-2">
                  <input type="time" value={per.salida ?? ''} onChange={(e) => setHorarioEmpleado(emp, { salida: e.target.value })} className="w-32 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </td>
                <td className="px-4 py-2">
                  <input type="time" value={per.almuerzoInicio ?? ''} onChange={(e) => setHorarioEmpleado(emp, { almuerzoInicio: e.target.value })} className="w-36 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </td>
                <td className="px-4 py-2">
                  <input type="time" value={per.almuerzoFin ?? ''} onChange={(e) => setHorarioEmpleado(emp, { almuerzoFin: e.target.value })} className="w-36 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </td>
                <td className="px-4 py-2">
                  <input type="number" min={0} value={per.almuerzoDuracionMin ?? ''} onChange={(e) => setHorarioEmpleado(emp, { almuerzoDuracionMin: Number(e.target.value) || 0 })} className="w-36 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </td>
                <td className="px-4 py-2">
                  <select
                    value={per.francosExtra && per.francosExtra.length ? String(per.francosExtra[0]) : ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setHorarioEmpleado(emp, { francosExtra: v === '' ? [] : [parseInt(v, 10)] });
                    }}
                    className="w-32 md:w-36 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Ninguno</option>
                    {[0,1,2,3,4,5,6]
                      .filter((d) => !(config.defaults.francos || []).includes(d))
                      .map((d) => (
                        <option key={d} value={d}>{['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d]}</option>
                      ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
