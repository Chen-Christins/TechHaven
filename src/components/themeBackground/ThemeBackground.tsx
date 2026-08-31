import React, { useEffect, useRef, useState } from "react";
import { useTheme, type ThemePreset } from "../../contexts/ThemeContext";
import styles from "./ThemeBackground.module.css";

const PARTICLES = Array.from({ length: 14 }, (_, index) => index);
const EFFECT_PARTICLES = Array.from({ length: 6 }, (_, index) => index);
const MAX_EFFECTS = 8;
const EFFECT_LIFETIME = 1400;

interface ClickEffect {
  id: number;
  preset: ThemePreset;
  x: number;
  y: number;
}

const ThemeBackground: React.FC = () => {
  const { preset } = useTheme();
  const [clickEffects, setClickEffects] = useState<ClickEffect[]>([]);
  const nextEffectId = useRef(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handlePointerDown = (event: PointerEvent) => {
      if (reducedMotion.matches || event.button !== 0) return;

      const effect: ClickEffect = {
        id: nextEffectId.current++,
        preset,
        x: event.clientX,
        y: event.clientY,
      };

      setClickEffects((current) => [...current.slice(-(MAX_EFFECTS - 1)), effect]);
      window.setTimeout(() => {
        setClickEffects((current) => current.filter(({ id }) => id !== effect.id));
      }, EFFECT_LIFETIME);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [preset]);

  return (
    <>
      <div className={styles.background} aria-hidden="true">
        <div className={styles.grid} />
        <div className={styles.wave} />
        <div className={styles.particles}>
          {PARTICLES.map((particle) => (
            <i key={particle} className={styles.particle} />
          ))}
        </div>
      </div>
      <div className={styles.clickEffects} aria-hidden="true">
        {clickEffects.map((effect) => (
          <span key={effect.id} className={`${styles.clickEffect} ${styles[effect.preset]}`} style={{ left: effect.x, top: effect.y }}>
            <i className={styles.effectCore} />
            {EFFECT_PARTICLES.map((particle) => (
              <i key={particle} className={styles.effectParticle} />
            ))}
          </span>
        ))}
      </div>
    </>
  );
};

export default ThemeBackground;
