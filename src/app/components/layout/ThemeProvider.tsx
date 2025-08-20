// © 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados
'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/app/stores/appStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((state) => state.configuracionGlobal.tema);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const root = window.document.documentElement;
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme, mounted]);

  return <>{children}</>;
}
