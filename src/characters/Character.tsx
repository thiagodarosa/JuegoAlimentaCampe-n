import type { ReactNode } from 'react';
import type { CatLook, DogLook, Look } from '../config/breeds';
import styles from './Character.module.css';

/**
 * Personajes ilustrados originales (SVG). Todas las razas comparten la misma
 * base por especie y cambian orejas, hocico, pelaje y patrón, para mantener
 * una estética consistente y archivos livianos.
 */

export type Expression = 'neutral' | 'happy' | 'surprised' | 'celebrate';

interface CharacterProps {
  look: Look;
  expression?: Expression;
  /** Texto accesible; si se omite, el SVG es decorativo. */
  label?: string;
  className?: string;
  /** Cambiar este valor reinicia la animación de reacción. */
  reactionKey?: number;
}

/** Bandana y medalla del personaje: toman los colores de la marca activa (ver global.css). */
const SCARF = { fill: 'var(--c-scarf, #6A0032)' };
const SCARF_LINE = { stroke: 'var(--c-scarf-dark, #4D0225)' };
const TAG = { fill: 'var(--c-tag, #F3C879)', stroke: 'var(--c-tag-stroke, #C99A4B)' };
const INK = '#2B1418';
const BLUSH = '#F07C86';

export function Character({ look, expression = 'neutral', label, className, reactionKey }: CharacterProps) {
  const reaction =
    expression === 'happy' ? styles.happy : expression === 'surprised' ? styles.oops : expression === 'celebrate' ? styles.celebrate : '';
  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')} data-expression={expression}>
      <svg
        key={reactionKey}
        className={[styles.svg, reaction].join(' ')}
        viewBox="0 0 200 200"
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
      >
        {look.species === 'perro' ? <Dog look={look} expr={expression} /> : <Cat look={look} expr={expression} />}
      </svg>
    </div>
  );
}

/** Dibuja el contenido y su reflejo horizontal (para orejas, mejillas, etc.). */
function Mirror({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <g transform="matrix(-1 0 0 1 200 0)">{children}</g>
    </>
  );
}

function Body({ fur, outline }: { fur: string; outline?: string }) {
  return (
    <>
      <ellipse cx="100" cy="198" rx="58" ry="36" fill={fur} {...contour(outline)} />
      <path d="M56 160 Q100 178 144 160 L100 198 Z" style={SCARF} />
      <path d="M56 160 Q100 178 144 160" fill="none" style={SCARF_LINE} strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="184" r="7.5" style={TAG} strokeWidth="1.5" />
    </>
  );
}

/**
 * Contorno fino para pelajes muy claros (siamés, persa): mantiene la
 * silueta visible sobre fondos claros sin cambiar el dibujo.
 */
function contour(color?: string) {
  return color ? { stroke: color, strokeWidth: 3, strokeLinejoin: 'round' as const } : {};
}

/* ---------------------------------- Ojos ---------------------------------- */

function DogEyes({ expr, color }: { expr: Expression; color: string }) {
  if (expr === 'happy' || expr === 'celebrate') {
    return (
      <Mirror>
        <path d="M69 93 Q78 82 87 93" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
      </Mirror>
    );
  }
  if (expr === 'surprised') {
    return (
      <Mirror>
        <circle cx="78" cy="90" r="11" fill="#fff" stroke={color} strokeWidth="2.5" />
        <circle cx="78" cy="91" r="5" fill={color} />
      </Mirror>
    );
  }
  return (
    <Mirror>
      <circle cx="78" cy="90" r="8.5" fill={color} />
      <circle cx="80.5" cy="86.5" r="2.8" fill="#fff" />
    </Mirror>
  );
}

function CatEyes({ expr, color }: { expr: Expression; color: string }) {
  if (expr === 'happy' || expr === 'celebrate') {
    return (
      <Mirror>
        <path d="M68 94 Q78 83 88 94" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      </Mirror>
    );
  }
  if (expr === 'surprised') {
    return (
      <Mirror>
        <ellipse cx="78" cy="91" rx="12.5" ry="13" fill={color} stroke={INK} strokeWidth="2" />
        <circle cx="78" cy="92" r="6.5" fill={INK} />
        <circle cx="81" cy="87" r="2.6" fill="#fff" />
      </Mirror>
    );
  }
  return (
    <Mirror>
      <ellipse cx="78" cy="92" rx="10.5" ry="11.5" fill={color} stroke={INK} strokeWidth="2" />
      <ellipse cx="78" cy="92" rx="3.2" ry="8.5" fill={INK} />
      <circle cx="81" cy="88" r="2.4" fill="#fff" />
    </Mirror>
  );
}

/* --------------------------------- Bocas ---------------------------------- */

function Mouth({ expr, y }: { expr: Expression; y: number }) {
  if (expr === 'happy' || expr === 'celebrate') {
    const w = expr === 'celebrate' ? 17 : 14;
    const d = expr === 'celebrate' ? 26 : 22;
    return (
      <>
        <path d={`M${100 - w} ${y + 3} Q100 ${y + d} ${100 + w} ${y + 3} Z`} fill="#5A1A22" />
        <ellipse cx="100" cy={y + d * 0.55} rx={w * 0.55} ry="6.5" fill="#F27D8C" />
      </>
    );
  }
  if (expr === 'surprised') {
    return <ellipse cx="100" cy={y + 11} rx="6" ry="7.5" fill="#5A1A22" />;
  }
  return (
    <path
      d={`M100 ${y} v6 M89 ${y + 5} Q94.5 ${y + 12} 100 ${y + 6} Q105.5 ${y + 12} 111 ${y + 5}`}
      fill="none"
      stroke={INK}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/* ---------------------------------- Perro --------------------------------- */

function Dog({ look, expr }: { look: DogLook; expr: Expression }) {
  const { fur, furShade, muzzle, nose, eye, ear, earColor, snout } = look;
  const headRx = snout === 'flat' ? 66 : 60;
  const noseY = snout === 'long' ? 120 : snout === 'flat' ? 112 : 115;

  const erectEar = (
    <path d="M52 76 Q40 26 66 30 Q84 36 86 62 Z" fill={earColor} stroke={furShade} strokeWidth="2" />
  );
  const batEar = (
    <>
      <path d="M50 78 Q30 20 62 22 Q86 28 86 64 Z" fill={earColor} />
      <path d="M56 66 Q46 34 64 34 Q78 38 78 60 Z" fill="#E9A9A0" />
    </>
  );
  const semiEar = (
    <>
      <path d="M50 74 Q44 34 64 30 Q84 34 84 60 Z" fill={earColor} />
      <path d="M52 44 Q60 26 72 34 Q64 46 52 44 Z" fill={furShade} />
    </>
  );
  const floppyEar = (len: number) => (
    <path
      d={`M50 64 Q22 ${80 + len * 0.2} 30 ${120 + len} Q40 ${140 + len} 56 ${124 + len} Q66 96 66 70 Z`}
      fill={earColor}
    />
  );
  const curlyEar = (
    <g fill={earColor}>
      <circle cx="40" cy="96" r="15" />
      <circle cx="36" cy="118" r="15" />
      <circle cx="44" cy="138" r="14" />
      <circle cx="50" cy="80" r="13" />
    </g>
  );

  return (
    <>
      <Body fur={fur} />

      {/* Orejas detrás de la cabeza */}
      {ear === 'bat' && <Mirror>{batEar}</Mirror>}
      {ear === 'semi' && <Mirror>{semiEar}</Mirror>}
      {ear === 'mixed' && erectEar}

      {/* Cabeza */}
      <ellipse cx="100" cy="98" rx={headRx} ry="56" fill={fur} />
      <ellipse cx="100" cy="132" rx={headRx - 14} ry="22" fill={furShade} opacity="0.35" />
      {look.topknot && (
        <g fill={fur} stroke={furShade} strokeWidth="2">
          <circle cx="78" cy="52" r="17" />
          <circle cx="122" cy="52" r="17" />
          <circle cx="88" cy="38" r="17" />
          <circle cx="112" cy="38" r="17" />
          <circle cx="100" cy="46" r="19" />
        </g>
      )}
      {look.blaze && <path d="M93 44 Q100 38 107 44 L114 112 L86 112 Z" fill={look.blaze} />}
      {look.eyePatch && <ellipse cx="124" cy="88" rx="21" ry="19" fill={look.eyePatch} />}

      {/* Hocico */}
      {snout === 'long' && <ellipse cx="100" cy="132" rx="28" ry="28" fill={muzzle} />}
      {snout === 'normal' && <ellipse cx="100" cy="128" rx="34" ry="24" fill={muzzle} />}
      {snout === 'flat' && (
        <>
          <ellipse cx="100" cy="124" rx="38" ry="22" fill={look.mask ?? muzzle} />
          <path d="M80 104 Q90 100 96 106 M120 104 Q110 100 104 106" fill="none" stroke={furShade} strokeWidth="3" strokeLinecap="round" />
        </>
      )}

      {/* Orejas delante de la cabeza */}
      {ear === 'floppy' && <Mirror>{floppyEar(0)}</Mirror>}
      {ear === 'long' && <Mirror>{floppyEar(26)}</Mirror>}
      {ear === 'curly' && <Mirror>{curlyEar}</Mirror>}
      {ear === 'mixed' && <g transform="matrix(-1 0 0 1 200 0)">{floppyEar(0)}</g>}

      <Mirror>
        <ellipse cx="62" cy="116" rx="9" ry="6" fill={BLUSH} opacity="0.35" />
      </Mirror>
      <DogEyes expr={expr} color={eye} />

      {/* Nariz */}
      <path
        d={`M87 ${noseY - 6} Q100 ${noseY - 14} 113 ${noseY - 6} Q109 ${noseY + 5} 100 ${noseY + 6} Q91 ${noseY + 5} 87 ${noseY - 6} Z`}
        fill={nose}
      />
      <ellipse cx="95" cy={noseY - 7} rx="4" ry="2" fill="#fff" opacity="0.45" />
      <Mouth expr={expr} y={noseY + 6} />
    </>
  );
}

/* ---------------------------------- Gato ---------------------------------- */

/** Contorno de pelo esponjoso: círculo con picos suaves. */
function fluffyPath(cx: number, cy: number, rx: number, ry: number, spikes: number, depth: number) {
  const pts: string[] = [];
  for (let i = 0; i <= spikes * 2; i++) {
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    const k = i % 2 === 0 ? 1 : 1 - depth;
    pts.push(`${(cx + Math.cos(a) * rx * k).toFixed(1)} ${(cy + Math.sin(a) * ry * k).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}

function Cat({ look, expr }: { look: CatLook; expr: Expression }) {
  const { fur, furShade, muzzle, nose, eye, ear, earInner, pattern, patternColor = furShade, outline } = look;
  const line = contour(outline);
  const earFill = pattern === 'points' ? patternColor : fur;
  const headRx = look.round ? 68 : 62;
  const headRy = look.round ? 58 : 54;

  const earShape =
    ear === 'small' ? (
      <>
        <path d="M50 74 L56 38 L86 56 Z" fill={earFill} {...line} />
        <path d="M58 66 L61 46 L78 57 Z" fill={earInner} />
      </>
    ) : ear === 'tufted' ? (
      <>
        <path d="M44 80 L48 10 L90 52 Z" fill={earFill} {...line} />
        <path d="M54 68 L55 30 L80 54 Z" fill={earInner} />
        <path d="M48 12 L44 0 M48 12 L52 1" stroke={patternColor} strokeWidth="2.5" strokeLinecap="round" />
      </>
    ) : (
      <>
        <path d="M46 78 L52 20 L90 54 Z" fill={earFill} {...line} />
        <path d="M56 68 L58 36 L80 56 Z" fill={earInner} />
      </>
    );

  return (
    <>
      <Body fur={fur} outline={outline} />
      {look.ruff && <path d={fluffyPath(100, 116, 82, 70, 16, 0.12)} fill={furShade} />}
      <Mirror>{earShape}</Mirror>

      {/* Cabeza */}
      {look.fluffy ? (
        <path d={fluffyPath(100, 100, headRx + 8, headRy + 6, 18, 0.07)} fill={fur} {...line} />
      ) : (
        <ellipse cx="100" cy="100" rx={headRx} ry={headRy} fill={fur} {...line} />
      )}

      {/* Patrones */}
      {pattern === 'tabby' && (
        <g fill="none" stroke={patternColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M84 56 L90 70 L100 58 L110 70 L116 56" />
          <Mirror>
            <path d="M40 96 L56 98 M42 108 L57 107" />
          </Mirror>
        </g>
      )}
      {pattern === 'rosettes' && (
        <g fill="none" stroke={patternColor} strokeWidth="3">
          <circle cx="70" cy="62" r="6" />
          <circle cx="132" cy="64" r="5.5" />
          <circle cx="100" cy="54" r="5" />
          <circle cx="52" cy="102" r="5" />
          <circle cx="148" cy="100" r="5.5" />
          <g fill={patternColor} stroke="none">
            <circle cx="86" cy="64" r="2.5" />
            <circle cx="116" cy="62" r="2.5" />
            <circle cx="60" cy="86" r="2.5" />
            <circle cx="142" cy="84" r="2.5" />
          </g>
        </g>
      )}
      {pattern === 'points' && <ellipse cx="100" cy="114" rx="38" ry="34" fill={patternColor} opacity="0.88" />}

      {/* Almohadillas de los bigotes */}
      {pattern !== 'points' && (
        <Mirror>
          <ellipse cx={look.flatFace ? 92 : 89} cy="121" rx={look.flatFace ? 11 : 13} ry="10" fill={muzzle} />
        </Mirror>
      )}

      <Mirror>
        <ellipse cx="62" cy="114" rx="9" ry="6" fill={BLUSH} opacity="0.3" />
        <path d="M70 118 L32 112 M70 124 L32 128" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.4" />
      </Mirror>
      <CatEyes expr={expr} color={eye} />

      <path d="M93 108 L107 108 L100 116 Z" fill={nose} strokeLinejoin="round" stroke={nose} strokeWidth="2" />
      <Mouth expr={expr} y={115} />
    </>
  );
}
