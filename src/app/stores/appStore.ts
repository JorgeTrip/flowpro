// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Notification {
  id: number;
  timestamp: Date;
  message: string;
  type: 'info' | 'warning' | 'error';
}

interface Usuario {
  id: string;
  nombre: string;
  email: string;
}

interface Empresa {
  id: string;
  nombre: string;
  rubro: string;
}

interface AppState {
  usuario: Usuario | null;
  empresa: Empresa | null;
  configuracionGlobal: {
    tema: 'light' | 'dark';
    idioma: 'es' | 'en';
    zona_horaria: string;
  };
  modulosActivos: string[];
  estadosModulos: Record<string, unknown>;
  notificaciones: Notification[];
  alertasSistema: unknown[];
  setUsuario: (usuario: Usuario | null) => void;
  setEmpresa: (empresa: Empresa | null) => void;
  activarModulo: (moduloId: string) => void;
  desactivarModulo: (moduloId: string) => void;
  setEstadoModulo: (moduloId: string, estado: unknown) => void;
  agregarNotificacion: (notificacion: Omit<Notification, 'id' | 'timestamp'>) => void;
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      usuario: null,
      empresa: null,
      configuracionGlobal: {
        tema: 'light',
        idioma: 'es',
        zona_horaria: 'America/Argentina/Buenos_Aires',
      },
      modulosActivos: ['dashboard', 'estimar-demanda'],
      estadosModulos: {},
      notificaciones: [],
      alertasSistema: [],
      setUsuario: (usuario) => set({ usuario }),
      setEmpresa: (empresa) => set({ empresa }),
      activarModulo: (moduloId) =>
        set((state) => ({ modulosActivos: [...new Set([...state.modulosActivos, moduloId])] })),
      desactivarModulo: (moduloId) =>
        set((state) => ({ modulosActivos: state.modulosActivos.filter((id) => id !== moduloId) })),
      setEstadoModulo: (moduloId, estado) =>
        set((state) => ({
          estadosModulos: {
            ...state.estadosModulos,
            [moduloId]: estado,
          },
        })),
      agregarNotificacion: (notificacion) =>
        set((state) => ({
          notificaciones: [
            { id: Date.now(), timestamp: new Date(), ...notificacion },
            ...state.notificaciones,
          ],
        })),
      toggleTheme: () =>
        set((state) => ({
          configuracionGlobal: {
            ...state.configuracionGlobal,
            tema: state.configuracionGlobal.tema === 'light' ? 'dark' : 'light',
          },
        })),
    }),
    {
      name: 'flowpro-storage',
      partialize: (state) => ({
        configuracionGlobal: state.configuracionGlobal,
        modulosActivos: state.modulosActivos,
      }),
    }
  )
);
