import type { PointerEventHandler } from 'react';
import logoUrl from '../assets/brand/logo-granplus.png';
import styles from './Logo.module.css';

interface LogoProps {
  /** 'white' recolorea el logotipo oficial para fondos oscuros (versión provisoria). */
  tone?: 'white' | 'wine';
  className?: string;
  onPointerDown?: PointerEventHandler<HTMLImageElement>;
  onPointerUp?: PointerEventHandler<HTMLImageElement>;
  onPointerLeave?: PointerEventHandler<HTMLImageElement>;
}

export function Logo({ tone = 'white', className, ...handlers }: LogoProps) {
  return (
    <img
      src={logoUrl}
      alt="GranPlus"
      draggable={false}
      className={[styles.logo, tone === 'white' ? styles.white : '', className].filter(Boolean).join(' ')}
      {...handlers}
    />
  );
}
