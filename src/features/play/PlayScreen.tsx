import { useEffect, useRef, useState } from 'react';
import type { Breed } from '../../config/breeds';
import { GAME_CONFIG } from '../../config/game.config';
import { Character, type Expression } from '../../characters/Character';
import { play as playSfx, setTensionIntensity, startTension, stopTension } from '../../audio/sfx';
import { useBrand } from '../../brand/BrandContext';
import { GameEngine, type GameEvent, type GameStats } from '../../game/engine';
import { DISTRACTOR_MESSAGES, KIBBLE_CHEERS } from '../../game/items';
import { GameRenderer } from '../../game/renderer';
import { Logo } from '../../ui/Logo';
import styles from './PlayScreen.module.css';

/**
 * Pantalla de partida.
 *
 * Política de pausa (ver docs/TECNICO.md):
 * - Si la app pierde visibilidad (cambio de app, pantalla apagada, otra
 *   pestaña), la partida se pausa al instante: el cronómetro se congela y no
 *   se pueden sumar puntos.
 * - Al volver se muestra "¿Seguimos?"; al tocar SEGUIR hay una cuenta
 *   regresiva corta y la partida continúa con el tiempo que quedaba.
 * - Si pasan más de `pauseTimeoutMs` en pausa, la experiencia se cancela y
 *   se vuelve al inicio, borrando los datos del participante.
 */

type Phase = 'preparing' | 'countdown' | 'running' | 'paused' | 'resuming' | 'ended';

interface Props {
  breed: Breed;
  onFinish: (stats: GameStats) => void;
  onAbandon: () => void;
}

export function PlayScreen({ breed, onFinish, onAbandon }: Props) {
  // La marca se toma al montar la partida: un cambio posterior no la altera.
  const brandAtStart = useRef(useBrand()).current;
  const canvasFont = brandAtStart.canvasFont;
  const lightField = brandAtStart.fieldTone === 'light';
  const areaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerFillRef = useRef<HTMLDivElement>(null);
  const timerTextRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  const resumeRef = useRef<() => void>(() => {});

  const [phase, setPhase] = useState<Phase>('preparing');
  const [count, setCount] = useState<number>(GAME_CONFIG.countdownSeconds);
  const [score, setScore] = useState(0);
  const [bump, setBump] = useState(0);
  const [expression, setExpression] = useState<Expression>('neutral');
  const [reactionKey, setReactionKey] = useState(0);

  // Callbacks siempre actualizados sin reiniciar el efecto del juego.
  const onFinishRef = useRef(onFinish);
  const onAbandonRef = useRef(onAbandon);
  onFinishRef.current = onFinish;
  onAbandonRef.current = onAbandon;

  useEffect(() => {
    const area = areaRef.current;
    const canvas = canvasRef.current;
    if (!area || !canvas) return;

    const cfg = GAME_CONFIG;
    const engine = new GameEngine({ species: breed.species });
    const renderer = new GameRenderer(canvas, canvasFont, lightField);

    let phaseNow: Phase = 'preparing';
    let disposed = false;
    let raf = 0;
    let lastFrame = performance.now();
    let countdownStart: number | null = null;
    let countdownMs = 0;
    let lastCount = -1;
    let pauseTimer: ReturnType<typeof setTimeout> | undefined;
    let endTimer: ReturnType<typeof setTimeout> | undefined;
    let exprTimer: ReturnType<typeof setTimeout> | undefined;
    let hiddenAt: number | null = null;
    let finished = false;

    const setPhaseBoth = (p: Phase) => {
      phaseNow = p;
      setPhase(p);
    };

    const measure = () => {
      const rect = area.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return false;
      renderer.resize(rect.width, rect.height, window.devicePixelRatio);
      engine.setViewport({ width: rect.width, height: rect.height });
      return true;
    };

    const beginCountdown = (resume: boolean) => {
      countdownStart = performance.now();
      countdownMs = (resume ? cfg.resumeCountdownSeconds : cfg.countdownSeconds) * 1000;
      lastCount = -1;
      setPhaseBoth(resume ? 'resuming' : 'countdown');
    };

    const react = (expr: Expression) => {
      setExpression(expr);
      setReactionKey((k) => k + 1);
      clearTimeout(exprTimer);
      exprTimer = setTimeout(() => setExpression('neutral'), expr === 'surprised' ? 650 : 450);
    };

    const updateTimer = (now: number) => {
      const remaining = engine.remaining(now);
      const fraction = Math.max(0, remaining / engine.durationMs);
      if (timerFillRef.current) timerFillRef.current.style.transform = `scaleX(${fraction})`;
      if (timerTextRef.current) timerTextRef.current.textContent = String(Math.ceil(remaining / 1000));
      timerRef.current?.classList.toggle(styles.hurry!, remaining <= 5000 && remaining > 0);
    };

    const handleEvent = (ev: GameEvent) => {
      if (ev.type === 'hit') {
        let label: string | undefined;
        if (ev.kind === 'distractor') {
          label = DISTRACTOR_MESSAGES[ev.variant as keyof typeof DISTRACTOR_MESSAGES];
          playSfx('oops');
          react('surprised');
        } else {
          if (ev.streak > 0 && ev.streak % 5 === 0) label = KIBBLE_CHEERS[(ev.streak / 5 - 1) % KIBBLE_CHEERS.length];
          playSfx('kibble');
          react('happy');
        }
        renderer.handleEvent(ev, label);
        setScore(ev.score);
        setBump((b) => b + 1);
      } else if (ev.type === 'end' && !finished) {
        finished = true;
        clearTimeout(pauseTimer);
        setPhaseBoth('ended');
        setExpression('celebrate');
        stopTension();
        playSfx('timeUp');
        const stats = engine.getStats();
        endTimer = setTimeout(() => onFinishRef.current(stats), cfg.endBannerMs);
      }
    };

    const frame = (now: number) => {
      if (disposed) return;
      const dt = Math.max(0, now - lastFrame);
      lastFrame = now;

      if ((phaseNow === 'countdown' || phaseNow === 'resuming') && countdownStart !== null) {
        const left = countdownMs - (now - countdownStart);
        const n = Math.ceil(left / 1000);
        if (n !== lastCount && n > 0) {
          lastCount = n;
          setCount(n);
          playSfx('tick');
        }
        if (left <= 0) {
          countdownStart = null;
          // El cronómetro arranca recién acá, con el área de juego lista.
          if (engine.state === 'ready') engine.start(now);
          else engine.resume(now);
          setPhaseBoth('running');
          playSfx('go');
        }
      }

      if (phaseNow === 'running') {
        engine.update(now);
        for (const ev of engine.drainEvents()) handleEvent(ev);
        renderer.updateEffects(dt);
        updateTimer(now);
        // Tensión en los últimos segundos: una sola instancia que se intensifica.
        const remaining = engine.remaining(now);
        if (phaseNow === 'running' && remaining > 0 && remaining <= cfg.tensionFromMs) {
          startTension();
          setTensionIntensity(1 - remaining / cfg.tensionFromMs);
        }
      }

      renderer.draw(engine);
      raf = requestAnimationFrame(frame);
    };

    // El área cambia de tamaño al rotar: solo se reescala, sin reiniciar nada.
    const ro = new ResizeObserver(() => {
      if (!measure()) return;
      if (phaseNow === 'preparing') beginCountdown(false);
      renderer.draw(engine);
    });
    ro.observe(area);

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      if (phaseNow !== 'running') return;
      const rect = canvas.getBoundingClientRect();
      // El evento se procesa en el próximo cuadro (≤16 ms) a través de drainEvents().
      engine.tap(e.clientX - rect.left, e.clientY - rect.top, performance.now());
    };
    const prevent = (e: Event) => e.preventDefault();

    const pause = () => {
      const now = performance.now();
      stopTension();
      if (phaseNow === 'running') engine.pause(now);
      if (phaseNow === 'running' || phaseNow === 'countdown' || phaseNow === 'resuming') {
        countdownStart = null;
        setPhaseBoth('paused');
        clearTimeout(pauseTimer);
        pauseTimer = setTimeout(() => onAbandonRef.current(), cfg.pauseTimeoutMs);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = performance.now();
        pause();
      } else {
        // Los temporizadores pueden demorarse en segundo plano: se verifica al volver.
        if (phaseNow === 'paused' && hiddenAt !== null && performance.now() - hiddenAt >= cfg.pauseTimeoutMs) {
          onAbandonRef.current();
        }
        hiddenAt = null;
      }
    };

    resumeRef.current = () => {
      if (phaseNow !== 'paused') return;
      clearTimeout(pauseTimer);
      beginCountdown(engine.state !== 'ready');
    };

    canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
    area.addEventListener('touchmove', prevent, { passive: false });
    area.addEventListener('contextmenu', prevent);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', pause);
    document.addEventListener('gesturestart', prevent);

    if (measure()) beginCountdown(false);
    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      stopTension();
      cancelAnimationFrame(raf);
      ro.disconnect();
      clearTimeout(pauseTimer);
      clearTimeout(endTimer);
      clearTimeout(exprTimer);
      canvas.removeEventListener('pointerdown', onPointerDown);
      area.removeEventListener('touchmove', prevent);
      area.removeEventListener('contextmenu', prevent);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', pause);
      document.removeEventListener('gesturestart', prevent);
      renderer.dispose();
      resumeRef.current = () => {};
    };
  }, [breed.species, canvasFont, lightField]);

  const seconds = Math.round(GAME_CONFIG.durationMs / 1000);

  return (
    <main className={`${styles.screen} bg-brand`} data-phase={phase} data-testid="play-screen">
      <Logo className={styles.logo} />

      <div ref={timerRef} className={styles.timer} role="timer" aria-label="Tiempo restante">
        <div className={styles.timerTrack}>
          <div ref={timerFillRef} className={styles.timerFill} />
        </div>
        <span className={styles.timerText}>
          <span ref={timerTextRef} data-testid="time-left">
            {seconds}
          </span>
          <small>s</small>
        </span>
      </div>

      <div className={styles.score}>
        <span className={styles.scoreLabel}>Puntos</span>
        <span key={bump} className={styles.scoreValue} data-testid="score">
          {score}
        </span>
      </div>

      <div className={styles.champion} data-breed={breed.id} data-testid="champion">
        <Character look={breed.look} expression={expression} reactionKey={reactionKey} className={styles.championArt} />
        <span className={styles.championName}>{breed.shortName}</span>
      </div>

      <div ref={areaRef} className={styles.field}>
        <canvas ref={canvasRef} className={styles.canvas} aria-label="Área de juego: tocá las croquetas" />
      </div>

      {(phase === 'countdown' || phase === 'resuming' || phase === 'preparing') && (
        <div className={styles.overlay} aria-live="assertive">
          {phase === 'preparing' ? (
            <span className={styles.prepare}>Preparando…</span>
          ) : (
            <span key={count} className={styles.count}>
              {count}
            </span>
          )}
        </div>
      )}

      {phase === 'paused' && (
        <div className={`${styles.overlay} ${styles.dim}`} role="dialog" aria-modal="true" aria-label="Partida en pausa">
          <div className={styles.pauseCard}>
            <h2>Partida en pausa</h2>
            <p>El tiempo quedó congelado. ¿Seguimos?</p>
            <button type="button" className="btn btn-primary" onClick={() => resumeRef.current()}>
              Seguir jugando
            </button>
          </div>
        </div>
      )}

      {phase === 'ended' && (
        <div className={styles.overlay} aria-live="assertive">
          <span className={styles.timeUp}>¡Tiempo!</span>
        </div>
      )}
    </main>
  );
}
