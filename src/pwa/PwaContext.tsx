import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Estado del Service Worker. La actualización nunca se aplica sola: la
 * promotora la confirma desde su panel, así no interrumpe una partida.
 */

interface PwaValue {
  offlineReady: boolean;
  needRefresh: boolean;
  online: boolean;
  applyUpdate: () => void;
  checkForUpdate: () => Promise<void>;
}

const PwaContext = createContext<PwaValue>({
  offlineReady: false,
  needRefresh: false,
  online: true,
  applyUpdate: () => {},
  checkForUpdate: async () => {},
});

export function PwaProvider({ children }: { children: ReactNode }) {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | undefined>();
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      setRegistration(reg);
    },
  });
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // Al recuperar la conexión se busca una versión nueva (se instala recién al confirmarla).
  useEffect(() => {
    if (online) void registration?.update().catch(() => {});
  }, [online, registration]);

  const value: PwaValue = {
    offlineReady: offlineReady || (typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller),
    needRefresh,
    online,
    applyUpdate: () => void updateServiceWorker(true),
    checkForUpdate: async () => {
      await registration?.update().catch(() => {});
    },
  };

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  return useContext(PwaContext);
}
