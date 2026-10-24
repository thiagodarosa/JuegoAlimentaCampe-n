import type { CSSProperties, PointerEventHandler } from 'react';
import { useBrand } from '../brand/BrandContext';
import styles from './Logo.module.css';

interface LogoProps {
  className?: string;
  onPointerDown?: PointerEventHandler<HTMLImageElement>;
  onPointerUp?: PointerEventHandler<HTMLImageElement>;
  onPointerLeave?: PointerEventHandler<HTMLImageElement>;
}

/** Logotipo oficial de la marca activa. */
export function Logo({ className, ...handlers }: LogoProps) {
  const brand = useBrand();
  return (
    <img
      src={brand.logo.src}
      alt={brand.name}
      draggable={false}
      data-brand-logo={brand.id}
      style={{ aspectRatio: brand.logo.aspect } as CSSProperties}
      className={[styles.logo, brand.logo.whiteOnDark ? styles.white : '', className].filter(Boolean).join(' ')}
      {...handlers}
    />
  );
}
