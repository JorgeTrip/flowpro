import { create } from 'zustand';
import type { ExcelRow } from '@/app/stores/estimarDemandaStore';

export type TimeHHMM = string; // formato "HH:mm"

export interface AsistenciaConfig {
  mapeo: {
    empleado: string;
    fecha: string;
    hora: string;
    tipo: string; // Entrada/Salida
  } | null;
  defaults: {
    entrada: TimeHHMM;
    salida: TimeHHMM; // por defecto 17:00
    almuerzoInicio: TimeHHMM; // inicio franja
    almuerzoFin: TimeHHMM; // fin franja
    almuerzoDuracionMin: number; // minutos
    francos: number[]; // 0=Dom ... 6=Sab
  };
  horariosPorEmpleado: Record<string, Partial<{
    entrada: TimeHHMM;
    salida: TimeHHMM;
    almuerzoInicio: TimeHHMM;
    almuerzoFin: TimeHHMM;
    almuerzoDuracionMin: number;
    francosExtra: number[];
  }>>;
}

export interface AttendanceEvent {
  empleado: string;
  fecha: string; // YYYY-MM-DD
  hora: TimeHHMM; // HH:mm
  tipo: 'Entrada' | 'Salida';
}

export interface DayAnalysisRow {
  empleado: string;
  fecha: string;
  horaEntrada?: TimeHHMM;
  horaSalida?: TimeHHMM;
  entradaProgramada: TimeHHMM;
  salidaProgramada: TimeHHMM;
  tardanzaMin: number; // > 0 si llegó tarde
  retiroAnticipadoMin: number; // > 0 si se fue antes
  almuerzoInicio?: TimeHHMM;
  almuerzoFin?: TimeHHMM;
  almuerzoDuracionMin?: number;
  almuerzoFueraFranja: boolean;
  almuerzoExcedido: boolean;
  ausente: boolean;
}

export interface AsistenciasState {
  // Stepper
  step: number;

  // Excel
  fichadasFile: File | null;
  fichadasData: ExcelRow[];
  fichadasPreviewData: ExcelRow[];
  fichadasColumnas: string[];

  // Configuración
  config: AsistenciaConfig;

  // Derivados básicos
  empleados: string[]; // únicos a partir de fichadas
  eventos: AttendanceEvent[]; // normalizados tras configurar mapeo

  // Estado UI
  isLoading: boolean;
  error: string | null;

  // Actions
  setStep: (step: number) => void;
  setFichadasFile: (file: File | null) => void;
  setFichadasData: (data: ExcelRow[], columnas: string[], previewData: ExcelRow[]) => void;
  setMapeo: (mapeo: AsistenciaConfig['mapeo']) => void;
  setDefaultConfig: (defaults: Partial<AsistenciaConfig['defaults']>) => void;
  setHorarioEmpleado: (empleado: string, cambios: Partial<AsistenciaConfig['horariosPorEmpleado'][string]>) => void;
  normalizarEventos: () => void;
  recomputarEmpleados: () => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

function toHHMMFromAny(value: unknown): TimeHHMM | undefined {
  if (!value && value !== 0) return undefined;
  const s = String(value).trim();
  // intentos comunes: HH:mm, H:mm, HH:mm:ss
  const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (m) {
    const h = String(m[1]).padStart(2, '0');
    const mm = String(m[2]).padStart(2, '0');
    const hi = parseInt(h, 10);
    const mi = parseInt(mm, 10);
    if (hi >= 0 && hi < 24 && mi >= 0 && mi < 60) return `${h}:${mm}`;
  }
  // ISO
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const h = String(d.getHours()).padStart(2, '0');
      const m2 = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m2}`;
    }
  }
  // Excel serial as decimal fraction of day? Not covered; fallback undefined
  return undefined;
}

function toYYYYMMDDFromAny(value: unknown): string | undefined {
  if (!value && value !== 0) return undefined;
  const s = String(value).trim();
  // ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.slice(0, 10);
  }
  // dd/mm/yyyy
  const m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (m) {
    const dd = String(m[1]).padStart(2, '0');
    const mm = String(m[2]).padStart(2, '0');
    let yyyy = m[3];
    if (yyyy.length === 2) yyyy = `20${yyyy}`;
    return `${yyyy}-${mm}-${dd}`;
  }
  return undefined;
}

function minutesOfDay(hhmm: TimeHHMM): number {
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  return h * 60 + m;
}

function dayOfWeekFromYYYYMMDD(fecha: string): number {
  const parts = fecha.split('-').map((x) => parseInt(x, 10));
  const y = parts[0] || 1970;
  const m = (parts[1] || 1) - 1;
  const d = parts[2] || 1;
  const dt = new Date(y, m, d);
  return dt.getDay(); // 0=Dom ... 6=Sab
}

const initialState: Omit<AsistenciasState, 'setStep' | 'setFichadasFile' | 'setFichadasData' | 'setMapeo' | 'setDefaultConfig' | 'setHorarioEmpleado' | 'normalizarEventos' | 'recomputarEmpleados' | 'setIsLoading' | 'setError' | 'reset'> = {
  step: 1,
  fichadasFile: null,
  fichadasData: [],
  fichadasPreviewData: [],
  fichadasColumnas: [],
  config: {
    mapeo: null,
    defaults: {
      entrada: '08:00',
      salida: '17:00',
      almuerzoInicio: '12:00',
      almuerzoFin: '15:30',
      almuerzoDuracionMin: 45,
      francos: [0, 6],
    },
    horariosPorEmpleado: {},
  },
  empleados: [],
  eventos: [],
  isLoading: false,
  error: null,
};

export const useAsistenciasStore = create<AsistenciasState>()((set, get) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setFichadasFile: (file) => set({ fichadasFile: file, step: 1 }),
  setFichadasData: (data, columnas, previewData) => set({ fichadasData: data, fichadasColumnas: columnas, fichadasPreviewData: previewData }),
  setMapeo: (mapeo) => set((state) => ({ config: { ...state.config, mapeo } })),
  setDefaultConfig: (defaults) => set((state) => ({ config: { ...state.config, defaults: { ...state.config.defaults, ...defaults } } })),
  setHorarioEmpleado: (empleado, cambios) => set((state) => ({
    config: {
      ...state.config,
      horariosPorEmpleado: {
        ...state.config.horariosPorEmpleado,
        [empleado]: { ...(state.config.horariosPorEmpleado[empleado] || {}), ...cambios },
      },
    },
  })),
  recomputarEmpleados: () => {
    const { fichadasData, config } = get();
    const empleadoCol = config.mapeo?.empleado || '';
    const setEmpleadoSet = new Set<string>();
    fichadasData.forEach((row) => {
      const raw = row[empleadoCol];
      const name = String(raw ?? '').trim();
      if (name) setEmpleadoSet.add(name);
    });
    set({ empleados: Array.from(setEmpleadoSet).sort() });
  },
  normalizarEventos: () => {
    const { fichadasData, config } = get();
    const map = config.mapeo;
    if (!map) return;

    const grupos = new Map<string, { empleado: string; fecha: string; horas: TimeHHMM[] }>();

    fichadasData.forEach((row) => {
      const empleado = String(row[map.empleado] ?? '').trim();
      const fechaStr = toYYYYMMDDFromAny(row[map.fecha]);
      const horaStr = toHHMMFromAny(row[map.hora]);
      if (!empleado || !fechaStr || !horaStr) return;
      const key = `${empleado}|${fechaStr}`;
      if (!grupos.has(key)) grupos.set(key, { empleado, fecha: fechaStr, horas: [] });
      grupos.get(key)!.horas.push(horaStr);
    });

    const eventos: AttendanceEvent[] = [];

    for (const { empleado, fecha, horas } of grupos.values()) {
      horas.sort();
      const perEmp = config.horariosPorEmpleado[empleado] || {};
      const entradaProg = perEmp.entrada || config.defaults.entrada;
      const salidaProg = perEmp.salida || config.defaults.salida;
      const almInicio = perEmp.almuerzoInicio || config.defaults.almuerzoInicio;
      const almFin = perEmp.almuerzoFin || config.defaults.almuerzoFin;

      const n = horas.length;
      const asignados: ('Entrada' | 'Salida')[] = new Array(n);

      if (n === 1) {
        const t = horas[0];
        const dIn = Math.abs(minutesOfDay(t) - minutesOfDay(entradaProg));
        const dOut = Math.abs(minutesOfDay(t) - minutesOfDay(salidaProg));
        asignados[0] = dIn <= dOut ? 'Entrada' : 'Salida';
      } else if (n === 2) {
        asignados[0] = 'Entrada';
        asignados[1] = 'Salida';
      } else if (n === 3) {
        asignados[0] = 'Entrada';
        asignados[2] = 'Salida';
        const t2 = horas[1];
        const dStart = Math.abs(minutesOfDay(t2) - minutesOfDay(almInicio));
        const dEnd = Math.abs(minutesOfDay(t2) - minutesOfDay(almFin));
        asignados[1] = dStart <= dEnd ? 'Salida' : 'Entrada';
      } else {
        // n >= 4, alternar salida/entrada en el medio
        asignados[0] = 'Entrada';
        asignados[n - 1] = 'Salida';
        for (let i = 1; i <= n - 2; i++) {
          asignados[i] = i % 2 === 1 ? 'Salida' : 'Entrada';
        }
      }

      for (let i = 0; i < n; i++) {
        eventos.push({ empleado, fecha, hora: horas[i], tipo: asignados[i] });
      }
    }

    eventos.sort((a, b) => a.empleado.localeCompare(b.empleado) || a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
    set({ eventos });
  },
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));

export function analizarDia(
  eventos: AttendanceEvent[],
  empleado: string,
  fecha: string,
  cfg: AsistenciaConfig
): DayAnalysisRow {
  const perEmp = cfg.horariosPorEmpleado[empleado] || {};
  const entradaProg = perEmp.entrada || cfg.defaults.entrada;
  const salidaProg = perEmp.salida || cfg.defaults.salida;
  const almInicio = perEmp.almuerzoInicio || cfg.defaults.almuerzoInicio;
  const almFin = perEmp.almuerzoFin || cfg.defaults.almuerzoFin;
  const almDurDef = perEmp.almuerzoDuracionMin ?? cfg.defaults.almuerzoDuracionMin;

  const todays = eventos.filter(e => e.empleado === empleado && e.fecha === fecha);
  const dow = dayOfWeekFromYYYYMMDD(fecha);
  const francosSet = new Set<number>([...(cfg.defaults.francos || []), ...((perEmp.francosExtra || []) as number[])]);
  const esFranco = francosSet.has(dow);
  const ausente = todays.length === 0 && !esFranco;
  const entradas = todays.filter(e => e.tipo === 'Entrada').map(e => e.hora);
  const salidas = todays.filter(e => e.tipo === 'Salida').map(e => e.hora);

  const firstIn = entradas[0];
  const lastOut = salidas[salidas.length - 1];

  const tardanzaMin = firstIn ? Math.max(0, minutesOfDay(firstIn) - minutesOfDay(entradaProg)) : 0;
  const retiroAnticipadoMin = lastOut ? Math.max(0, minutesOfDay(salidaProg) - minutesOfDay(lastOut)) : 0;

  // Buscar almuerzo: primer par salida->entrada dentro de franja
  let almSalida: TimeHHMM | undefined;
  let almEntrada: TimeHHMM | undefined;
  for (const s of salidas) {
    if (minutesOfDay(s) >= minutesOfDay(almInicio) && minutesOfDay(s) <= minutesOfDay(almFin)) {
      almSalida = s;
      // buscar la primera entrada posterior
      almEntrada = entradas.find((h) => minutesOfDay(h) > minutesOfDay(s));
      break;
    }
  }

  const almuerzoDuracionMin = almSalida && almEntrada ? (minutesOfDay(almEntrada) - minutesOfDay(almSalida)) : undefined;
  const almuerzoFueraFranja = !!(
    (almSalida && (minutesOfDay(almSalida) < minutesOfDay(almInicio) || minutesOfDay(almSalida) > minutesOfDay(almFin))) ||
    (almEntrada && (minutesOfDay(almEntrada) < minutesOfDay(almInicio) || minutesOfDay(almEntrada) > minutesOfDay(almFin)))
  );
  const almuerzoExcedido = almuerzoDuracionMin !== undefined ? almuerzoDuracionMin > almDurDef : false;

  return {
    empleado,
    fecha,
    horaEntrada: firstIn,
    horaSalida: lastOut,
    entradaProgramada: entradaProg,
    salidaProgramada: salidaProg,
    tardanzaMin,
    retiroAnticipadoMin,
    almuerzoInicio: almSalida,
    almuerzoFin: almEntrada,
    almuerzoDuracionMin,
    almuerzoFueraFranja,
    almuerzoExcedido,
    ausente,
  };
}
