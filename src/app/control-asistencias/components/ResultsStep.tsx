'use client';

import { useMemo, useState } from 'react';
import { useAsistenciasStore, analizarDia, DayAnalysisRow } from '@/app/stores/asistenciasStore';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

function isoDow(iso: string): number {
  if (!iso) return 0;
  const [y, m, d] = iso.split('-').map((x) => parseInt(x, 10));
  const dt = new Date(y || 1970, (m || 1) - 1, d || 1);
  return dt.getDay();
}

export function ResultsStep() {
  const { setStep, empleados, eventos, config } = useAsistenciasStore();
  const [empleadoSel, setEmpleadoSel] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [openDash, setOpenDash] = useState(false);
  const [openGlobal, setOpenGlobal] = useState(false);
  const [openAus, setOpenAus] = useState(false);

  const empleadosOptions = useMemo(() => ['(Todos)', ...empleados], [empleados]);

  const allFechas = useMemo(() => Array.from(new Set(eventos.map((e) => e.fecha))).sort(), [eventos]);
  const fullRangeDates = useMemo(() => {
    if (allFechas.length === 0) return [] as string[];
    const start = allFechas[0];
    const end = allFechas[allFechas.length - 1];
    const a = new Date(start);
    const b = new Date(end);
    const out: string[] = [];
    const cur = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    while (cur <= b) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      out.push(`${y}-${m}-${d}`);
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }, [allFechas]);

  const selectedDates = useMemo(() => {
    if (!dateFrom && !dateTo) return [] as string[];
    const start = dateFrom || dateTo;
    const end = dateTo || dateFrom;
    if (!start) return [] as string[];
    if (start === end) return [start];
    const a = new Date(start);
    const b = new Date(end);
    const s = a <= b ? a : b;
    const e = a <= b ? b : a;
    const out: string[] = [];
    const cur = new Date(s.getFullYear(), s.getMonth(), s.getDate());
    while (cur <= e) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      out.push(`${y}-${m}-${d}`);
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }, [dateFrom, dateTo]);

  const analisisEmpleado: DayAnalysisRow[] = useMemo(() => {
    const emp = empleadoSel && empleadoSel !== '(Todos)' ? empleadoSel : empleados[0];
    if (!emp || !config?.mapeo) return [];
    const francos = config.defaults.francos || [];
    let fechas: string[] = [];
    const base = selectedDates.length > 0 ? selectedDates : fullRangeDates;
    fechas = base.filter((f) => !francos.includes(isoDow(f)));
    return fechas.map((f) => analizarDia(eventos, emp, f, config));
  }, [empleadoSel, empleados, eventos, config, selectedDates, fullRangeDates]);

  // KPIs
  const kpis = useMemo(() => {
    const total = analisisEmpleado.length;
    const tardes = analisisEmpleado.filter((d) => d.tardanzaMin > 0).length;
    const retiros = analisisEmpleado.filter((d) => d.retiroAnticipadoMin > 0).length;
    const almFuera = analisisEmpleado.filter((d) => d.almuerzoFueraFranja).length;
    const almExced = analisisEmpleado.filter((d) => d.almuerzoExcedido).length;
    const ausentes = analisisEmpleado.filter((d) => d.ausente).length;
    const promTarde = Math.round(
      analisisEmpleado.reduce((acc, x) => acc + (x.tardanzaMin || 0), 0) / (total || 1)
    );
    return { total, tardes, retiros, almFuera, almExced, promTarde, ausentes };
  }, [analisisEmpleado]);

  // Filtros globales
  const [filtroTarde, setFiltroTarde] = useState(true);
  const [filtroRetiro, setFiltroRetiro] = useState(true);
  const [filtroAlmFranja, setFiltroAlmFranja] = useState(true);
  const [filtroAlmExced, setFiltroAlmExced] = useState(true);

  const violacionesGlobales = useMemo(() => {
    if (!config?.mapeo) return [] as DayAnalysisRow[];
    const setPairs = new Set<string>();
    const rows: DayAnalysisRow[] = [];
    empleados.forEach((emp) => {
      const francos = config.defaults.francos || [];
      const base = selectedDates.length > 0 ? selectedDates : fullRangeDates;
      const fechas = base.filter((f) => !francos.includes(isoDow(f)));
      fechas.forEach((f) => {
        const row = analizarDia(eventos, emp, f, config);
        const key = `${emp}|${f}`;
        if (!setPairs.has(key)) {
          setPairs.add(key);
          rows.push(row);
        }
      });
    });
    return rows.filter((r) =>
      (filtroTarde && r.tardanzaMin > 0) ||
      (filtroRetiro && r.retiroAnticipadoMin > 0) ||
      (filtroAlmFranja && r.almuerzoFueraFranja) ||
      (filtroAlmExced && r.almuerzoExcedido)
    ).sort((a, b) => a.empleado.localeCompare(b.empleado) || a.fecha.localeCompare(b.fecha));
  }, [config, empleados, eventos, filtroTarde, filtroRetiro, filtroAlmFranja, filtroAlmExced, selectedDates, fullRangeDates]);

  const ausenciasDetalle = useMemo(() => {
    if (!config?.mapeo) return [] as { empleado: string; cantidad: number; fechas: string[] }[];
    const francos = config.defaults.francos || [];
    const baseBase = selectedDates.length > 0 ? selectedDates : fullRangeDates;
    const baseFechas = baseBase.filter((f) => !francos.includes(isoDow(f)));
    const out: { empleado: string; cantidad: number; fechas: string[] }[] = [];
    empleados.forEach((emp) => {
      const faltas: string[] = [];
      baseFechas.forEach((f) => {
        const row = analizarDia(eventos, emp, f, config);
        if (row.ausente) faltas.push(f);
      });
      if (faltas.length > 0) out.push({ empleado: emp, cantidad: faltas.length, fechas: faltas.sort() });
    });
    return out.sort((a, b) => a.empleado.localeCompare(b.empleado));
  }, [config, empleados, eventos, selectedDates, allFechas, fullRangeDates]);

  const formatMin = (m?: number) => (m !== undefined ? `${m} min` : '-');
  const dayName = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map((x) => parseInt(x, 10));
    const dt = new Date(y, (m || 1) - 1, d || 1);
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return dias[dt.getDay()];
  };
  const renderFecha = (f: string) => `${f} (${dayName(f)})`;

  // Export: Dashboard por empleado (tabla diaria)
  const exportDashboardExcel = async () => {
    const emp = empleadoSel && empleadoSel !== '(Todos)' ? empleadoSel : empleados[0];
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`Dashboard - ${emp || 'Empleado'}`);
    ws.columns = [
      { header: 'Fecha', key: 'fecha', width: 14 },
      { header: 'Día', key: 'dia', width: 8 },
      { header: 'Entrada prog.', key: 'entProg', width: 14 },
      { header: 'Entrada real', key: 'entReal', width: 14 },
      { header: 'Tardanza (min)', key: 'tard', width: 14 },
      { header: 'Salida prog.', key: 'salProg', width: 14 },
      { header: 'Salida real', key: 'salReal', width: 14 },
      { header: 'Retiro ant. (min)', key: 'retiro', width: 18 },
      { header: 'Alm. salida', key: 'almOut', width: 14 },
      { header: 'Alm. entrada', key: 'almIn', width: 14 },
      { header: 'Duración alm. (min)', key: 'almDur', width: 20 },
      { header: 'Alm. fuera franja', key: 'almFranja', width: 20 },
      { header: 'Alm. excedido', key: 'almExc', width: 16 },
      { header: 'Ausente', key: 'aus', width: 10 },
    ];
    analisisEmpleado.forEach((r) => {
      ws.addRow({
        fecha: r.fecha,
        dia: dayName(r.fecha),
        entProg: r.entradaProgramada,
        entReal: r.horaEntrada || '-',
        tard: r.tardanzaMin || 0,
        salProg: r.salidaProgramada,
        salReal: r.horaSalida || '-',
        retiro: r.retiroAnticipadoMin || 0,
        almOut: r.almuerzoInicio || '-',
        almIn: r.almuerzoFin || '-',
        almDur: r.almuerzoDuracionMin ?? '-',
        almFranja: r.almuerzoFueraFranja ? 'Sí' : 'No',
        almExc: r.almuerzoExcedido ? 'Sí' : 'No',
        aus: r.ausente ? 'Sí' : 'No',
      });
    });
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `asistencias-dashboard-${emp || 'empleado'}.xlsx`);
  };

  // Export: Desvíos globales
  const exportGlobalExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Desvíos');
    ws.columns = [
      { header: 'Empleado', key: 'emp', width: 28 },
      { header: 'Fecha', key: 'fecha', width: 14 },
      { header: 'Día', key: 'dia', width: 8 },
      { header: 'Desvío', key: 'desvio', width: 22 },
      { header: 'Programado', key: 'prog', width: 20 },
      { header: 'Real', key: 'real', width: 20 },
      { header: 'Minutos', key: 'min', width: 10 },
    ];
    violacionesGlobales.forEach((r) => {
      const desvio = r.tardanzaMin > 0
        ? 'Llegada tarde'
        : r.retiroAnticipadoMin > 0
        ? 'Salida antes'
        : r.almuerzoFueraFranja
        ? 'Almuerzo fuera franja'
        : 'Almuerzo excedido';
      let programado = '-';
      let real = '-';
      let minutos: number | undefined = undefined;
      if (desvio === 'Llegada tarde') {
        programado = r.entradaProgramada;
        real = r.horaEntrada || '-';
        minutos = r.tardanzaMin;
      } else if (desvio === 'Salida antes') {
        programado = r.salidaProgramada;
        real = r.horaSalida || '-';
        minutos = r.retiroAnticipadoMin;
      } else if (desvio === 'Almuerzo fuera franja') {
        programado = `${config.defaults.almuerzoInicio} - ${config.defaults.almuerzoFin}`;
        real = `${r.almuerzoInicio || '-'} - ${r.almuerzoFin || '-'}`;
        minutos = r.almuerzoDuracionMin;
      } else if (desvio === 'Almuerzo excedido') {
        programado = `${config.defaults.almuerzoDuracionMin} min`;
        real = r.almuerzoDuracionMin !== undefined ? `${r.almuerzoDuracionMin} min` : '-';
        minutos = r.almuerzoDuracionMin;
      }
      ws.addRow({ emp: r.empleado, fecha: r.fecha, dia: dayName(r.fecha), desvio, prog: programado, real, min: minutos ?? 0 });
    });
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `asistencias-desvios.xlsx`);
  };

  // Export: Detalle de ausencias
  const exportAusenciasExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Ausencias');
    ws.columns = [
      { header: 'Empleado', key: 'emp', width: 28 },
      { header: 'Cantidad', key: 'cant', width: 10 },
      { header: 'Fechas', key: 'fechas', width: 60 },
    ];
    ausenciasDetalle.forEach((a) => {
      const fechas = a.fechas.map((f) => `${f} (${dayName(f)})`).join(', ');
      ws.addRow({ emp: a.empleado, cant: a.cantidad, fechas });
    });
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `asistencias-ausencias.xlsx`);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-start">
        <button onClick={() => setStep(2)} className="rounded-md bg-gray-200 px-4 py-2 font-semibold text-gray-800 transition-colors hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500">Volver</button>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Rango de fechas</div>
            <div className="mt-2 flex items-center gap-2">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-md border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              <span className="text-gray-500">a</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-md border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">Limpiar</button>
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Si solo completás una fecha, se filtrará solo ese día.</div>
          </div>
        </div>
      </div>
      {/* Dashboard por empleado */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard por empleado</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Compare fichadas versus horario asignado.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 dark:text-gray-300">Empleado</label>
            <select
              value={empleadoSel || (empleadosOptions[0] || '')}
              onChange={(e) => setEmpleadoSel(e.target.value)}
              className="rounded-md border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {empleadosOptions.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <button onClick={() => setOpenDash((v) => !v)} className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">{openDash ? 'Contraer' : 'Desplegar'}</button>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={exportDashboardExcel} className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-green-700">Exportar Excel</button>
        </div>
        {openDash && (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-6">
          <Kpi title="Días" value={kpis.total} />
          <Kpi title="Llegadas tarde" value={kpis.tardes} />
          <Kpi title="Retiros anticipados" value={kpis.retiros} />
          <Kpi title="Almuerzo fuera franja" value={kpis.almFuera} />
          <Kpi title="Almuerzo excedido" value={kpis.almExced} />
          <Kpi title="Prom. tardanza" value={formatMin(kpis.promTarde)} />
        </div>
        )}

        {openDash && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <div className="text-sm text-red-800 dark:text-red-200 font-medium">Días ausentes (excluye francos): {kpis.ausentes}</div>
        </div>
        )}

        {openDash && (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <Th>Fecha</Th>
                <Th>Entrada prog.</Th>
                <Th>Entrada real</Th>
                <Th>Tardanza</Th>
                <Th>Salida prog.</Th>
                <Th>Salida real</Th>
                <Th>Retiro anticip.</Th>
                <Th>Alm. salida</Th>
                <Th>Alm. entrada</Th>
                <Th>Duración alm.</Th>
                <Th>Fuera franja</Th>
                <Th>Excedido</Th>
                <Th>Ausente</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {analisisEmpleado.map((r) => (
                <tr key={`${r.empleado}-${r.fecha}`} className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700">
                  <Td className={classNames(r.ausente ? 'text-red-700 dark:text-red-300 font-medium' : '')}>{renderFecha(r.fecha)}</Td>
                  <Td>{r.entradaProgramada}</Td>
                  <Td className={classNames(r.tardanzaMin > 0 ? 'text-red-600 dark:text-red-400 font-medium' : '', r.ausente ? 'line-through opacity-60' : '')}>{r.horaEntrada || '-'}</Td>
                  <Td className={classNames(r.tardanzaMin > 0 ? 'text-red-600 dark:text-red-400 font-medium' : '')}>{formatMin(r.tardanzaMin)}</Td>
                  <Td>{r.salidaProgramada}</Td>
                  <Td className={classNames(r.retiroAnticipadoMin > 0 ? 'text-orange-600 dark:text-orange-400 font-medium' : '', r.ausente ? 'line-through opacity-60' : '')}>{r.horaSalida || '-'}</Td>
                  <Td className={classNames(r.retiroAnticipadoMin > 0 ? 'text-orange-600 dark:text-orange-400 font-medium' : '')}>{formatMin(r.retiroAnticipadoMin)}</Td>
                  <Td>{r.almuerzoInicio || '-'}</Td>
                  <Td>{r.almuerzoFin || '-'}</Td>
                  <Td>{r.almuerzoDuracionMin !== undefined ? `${r.almuerzoDuracionMin} min` : '-'}</Td>
                  <Td className={classNames(r.almuerzoFueraFranja ? 'text-yellow-700 dark:text-yellow-300 font-medium' : '')}>{r.almuerzoFueraFranja ? 'Sí' : 'No'}</Td>
                  <Td className={classNames(r.almuerzoExcedido ? 'text-yellow-700 dark:text-yellow-300 font-medium' : '')}>{r.almuerzoExcedido ? 'Sí' : 'No'}</Td>
                  <Td className={classNames(r.ausente ? 'text-red-700 dark:text-red-300 font-medium' : '')}>{r.ausente ? 'Sí' : 'No'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Filtros globales */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Empleados con desvíos</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Filtrar por llegadas tarde, retiros anticipados y almuerzo fuera de condiciones.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={filtroTarde} onChange={(e) => setFiltroTarde(e.target.checked)} /> Tarde
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={filtroRetiro} onChange={(e) => setFiltroRetiro(e.target.checked)} /> Salida antes
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={filtroAlmFranja} onChange={(e) => setFiltroAlmFranja(e.target.checked)} /> Alm. fuera franja
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={filtroAlmExced} onChange={(e) => setFiltroAlmExced(e.target.checked)} /> Alm. excedido
            </label>
            <button onClick={() => setOpenGlobal((v) => !v)} className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">{openGlobal ? 'Contraer' : 'Desplegar'}</button>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={exportGlobalExcel} className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-green-700">Exportar Excel</button>
        </div>
        {openGlobal && (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <Th>Empleado</Th>
                <Th>Fecha</Th>
                <Th>Desvío</Th>
                <Th>Programado</Th>
                <Th>Real</Th>
                <Th>Minutos</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {violacionesGlobales.map((r) => {
                const desvio = r.tardanzaMin > 0
                  ? 'Llegada tarde'
                  : r.retiroAnticipadoMin > 0
                  ? 'Salida antes'
                  : r.almuerzoFueraFranja
                  ? 'Almuerzo fuera franja'
                  : 'Almuerzo excedido';

                let programado = '-';
                let real = '-';
                let minutos: number | undefined = undefined;
                if (desvio === 'Llegada tarde') {
                  programado = r.entradaProgramada;
                  real = r.horaEntrada || '-';
                  minutos = r.tardanzaMin;
                } else if (desvio === 'Salida antes') {
                  programado = r.salidaProgramada;
                  real = r.horaSalida || '-';
                  minutos = r.retiroAnticipadoMin;
                } else if (desvio === 'Almuerzo fuera franja') {
                  programado = `${config.defaults.almuerzoInicio} - ${config.defaults.almuerzoFin}`;
                  real = `${r.almuerzoInicio || '-'} - ${r.almuerzoFin || '-'}`;
                  minutos = r.almuerzoDuracionMin;
                } else if (desvio === 'Almuerzo excedido') {
                  programado = `${config.defaults.almuerzoDuracionMin} min`;
                  real = r.almuerzoDuracionMin !== undefined ? `${r.almuerzoDuracionMin} min` : '-';
                  minutos = r.almuerzoDuracionMin;
                }

                return (
                  <tr key={`${r.empleado}-${r.fecha}-${desvio}`} className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700">
                    <Td>{r.empleado}</Td>
                    <Td>{renderFecha(r.fecha)}</Td>
                    <Td>{desvio}</Td>
                    <Td>{programado}</Td>
                    <Td>{real}</Td>
                    <Td>{minutos !== undefined ? `${minutos} min` : '-'}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Detalle de ausencias</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Días laborables sin fichadas por empleado.</p>
          </div>
          <button onClick={() => setOpenAus((v) => !v)} className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">{openAus ? 'Contraer' : 'Desplegar'}</button>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={exportAusenciasExcel} className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-green-700">Exportar Excel</button>
        </div>
        {openAus && (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <Th>Empleado</Th>
                <Th>Cantidad</Th>
                <Th>Fechas</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {ausenciasDetalle.map((a) => (
                <tr key={a.empleado} className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700">
                  <Td>{a.empleado}</Td>
                  <Td>{a.cantidad}</Td>
                  <Td>{a.fechas.map((f) => renderFecha(f)).join(', ')}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-900">
      <div className="text-sm text-gray-600 dark:text-gray-400">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={classNames("px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300", className)}>
      {children}
    </th>
  );
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={classNames("px-4 py-2 text-sm text-gray-900 dark:text-gray-100", className)}>{children}</td>;
}
