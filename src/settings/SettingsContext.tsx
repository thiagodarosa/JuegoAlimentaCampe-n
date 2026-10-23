import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_SETTINGS, type Settings } from '../config/game.config';
import { loadSettings, sanitizeSettings, saveSettings } from './settings';

interface SettingsValue {
  settings: Settings;
  update: (next: Settings) => void;
  restoreDefaults: () => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children, initial }: { children: ReactNode; initial?: Settings }) {
  const [settings, setSettings] = useState<Settings>(() => initial ?? loadSettings());

  const update = useCallback((next: Settings) => {
    const clean = sanitizeSettings(next);
    setSettings(clean);
    saveSettings(clean);
  }, []);

  const restoreDefaults = useCallback(() => update(structuredClone(DEFAULT_SETTINGS)), [update]);

  const value = useMemo(() => ({ settings, update, restoreDefaults }), [settings, update, restoreDefaults]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings() fuera de SettingsProvider');
  return ctx;
}
