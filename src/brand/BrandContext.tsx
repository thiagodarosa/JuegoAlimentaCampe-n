import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { BRANDS, DEFAULT_BRAND, type BrandConfig, type BrandId } from '../config/brands';

const BrandContext = createContext<BrandConfig>(BRANDS[DEFAULT_BRAND]);

/**
 * Aplica la marca a toda la página: el atributo `data-brand` en <html>
 * activa los colores y tipografías de `global.css`, y se actualizan el
 * título y el color del navegador.
 */
export function BrandProvider({ brand, children }: { brand: BrandId; children: ReactNode }) {
  const config = BRANDS[brand];

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.brand = brand;
    document.title = `¡Alimentá al campeón! · ${config.name}`;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', config.themeColor);
  }, [brand, config]);

  return <BrandContext.Provider value={config}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  return useContext(BrandContext);
}
