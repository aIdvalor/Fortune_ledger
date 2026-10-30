import { useEffect, useState } from "react";
import styles from "./App.module.css";

// Optional cool-off: a short breath with a progress ring. Always skippable;
// it never blocks the purchase itself.
export function Pause({ seconds, fortune, onDone }: { seconds: number; fortune: string; onDone: () => void }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) {
      onDone();
      return;
    }
    const t = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onDone]);
  const r = 46;
  const c = 2 * Math.PI * r;
  const progress = 1 - left / seconds;
  return (
    <section className={styles.screen} aria-labelledby="pause-title">
      <p className={styles.kicker}><span aria-hidden="true">🌬️</span> Breathe</p>
      <h1 id="pause-title" className={styles.prompt}>Just a moment.</h1>
      <div className={styles.ringWrap} role="timer" aria-live="off" aria-label={`${left} seconds left`}>
        <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(43,36,28,0.12)" strokeWidth="6" />
          <circle
            cx="60" cy="60" r={r} fill="none" stroke="#b57a3a" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - progress)}
            transform="rotate(-90 60 60)" style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <span className={styles.ringLabel}>{left}s</span>
      </div>
      <p className={styles.hint} style={{ textAlign: "center", fontStyle: "italic" }}>{fortune}</p>
      <button type="button" className={styles.textButton} onClick={onDone}>
        Skip →
      </button>
    </section>
  );
}
