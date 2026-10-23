import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/figtree/latin-400.css';
import '@fontsource/figtree/latin-500.css';
import '@fontsource/figtree/latin-600.css';
import '@fontsource/figtree/latin-700.css';
import '@fontsource/figtree/latin-800.css';
import '@fontsource/figtree/latin-900.css';
import './styles/global.css';
import { App } from './app/App';
import { PwaProvider } from './pwa/PwaContext';
import { SettingsProvider } from './settings/SettingsContext';

const root = document.getElementById('root');
if (!root) throw new Error('No se encontró #root');

createRoot(root).render(
  <StrictMode>
    <SettingsProvider>
      <PwaProvider>
        <App />
      </PwaProvider>
    </SettingsProvider>
  </StrictMode>,
);
