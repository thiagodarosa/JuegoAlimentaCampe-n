// Reemplazo de 'virtual:pwa-register/react' para las pruebas unitarias.
export function useRegisterSW() {
  const noop = () => {};
  return {
    needRefresh: [false, noop] as const,
    offlineReady: [false, noop] as const,
    updateServiceWorker: async () => {},
  };
}
