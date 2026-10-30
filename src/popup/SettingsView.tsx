import styles from "./App.module.css";
import type { Settings } from "../shared/storage";

export function SettingsView({
  settings, snoozed, onChange, onUnsnooze,
}: {
  settings: Settings;
  snoozed: Record<string, number>;
  onChange: (s: Settings) => void;
  onUnsnooze: (host: string) => void;
}) {
  const now = Date.now();
  const active = Object.entries(snoozed).filter(([, until]) => until === -1 || until > now);
  return (
    <section className={styles.screen} aria-labelledby="settings-title">
      <p className={styles.kicker}><span aria-hidden="true">⚙️</span> Settings</p>
      <h1 id="settings-title" className={styles.prompt}>Make it yours</h1>

      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={settings.pillEnabled}
          onChange={(e) => onChange({ ...settings, pillEnabled: e.target.checked })}
        />
        <span>
          <strong>🔮 Nudge at checkout</strong>
          <span className={styles.cardCopy}>Never blocks the store</span>
        </span>
      </label>

      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={settings.coolOffEnabled}
          onChange={(e) => onChange({ ...settings, coolOffEnabled: e.target.checked })}
        />
        <span>
          <strong>🌬️ Breathing pause</strong>
          <span className={styles.cardCopy}>Always skippable</span>
        </span>
      </label>

      {settings.coolOffEnabled ? (
        <div className={styles.reveal}>
          <label className={styles.fieldLabel} htmlFor="cool-off">
            Pause: {settings.coolOffSeconds}s
          </label>
          <input
            id="cool-off"
            type="range"
            min={10}
            max={60}
            step={5}
            value={settings.coolOffSeconds}
            onChange={(e) => onChange({ ...settings, coolOffSeconds: Number(e.target.value) })}
          />
          {settings.coolOffSeconds > 15 ? (
            <p className={styles.hint}>Over 15s can feel long</p>
          ) : null}
        </div>
      ) : null}

      <h2 className={styles.subhead}>😴 Muted sites</h2>
      {active.length === 0 ? (
        <p className={styles.hint}>None yet</p>
      ) : (
        <ul className={styles.history}>
          {active.map(([host, until]) => (
            <li key={host} className={styles.historyTop}>
              <span>{host} · {until === -1 ? "always" : `until ${new Date(until).toLocaleString()}`}</span>
              <button type="button" className={styles.textButton} onClick={() => onUnsnooze(host)}>Unmute</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
