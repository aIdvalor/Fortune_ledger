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
      <p className={styles.kicker}>Settings</p>
      <h1 id="settings-title" className={styles.prompt}>Shape the pause to fit you.</h1>

      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={settings.pillEnabled}
          onChange={(e) => onChange({ ...settings, pillEnabled: e.target.checked })}
        />
        <span>
          <strong>Offer a gentle invitation on checkout pages</strong>
          <span className={styles.cardCopy}>A small pill. It never blocks the store's button.</span>
        </span>
      </label>

      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={settings.coolOffEnabled}
          onChange={(e) => onChange({ ...settings, coolOffEnabled: e.target.checked })}
        />
        <span>
          <strong>Add a short breath after the fortune</strong>
          <span className={styles.cardCopy}>Optional and always skippable.</span>
        </span>
      </label>

      {settings.coolOffEnabled ? (
        <div className={styles.reveal}>
          <label className={styles.fieldLabel} htmlFor="cool-off">
            Pause length: {settings.coolOffSeconds} seconds
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
            <p className={styles.hint}>Longer than 15 seconds can feel like a wall. Your call.</p>
          ) : null}
        </div>
      ) : null}

      <h2 className={styles.subhead}>Quiet sites</h2>
      {active.length === 0 ? (
        <p className={styles.hint}>No sites snoozed. Use “Snooze…” on the pill to quiet one.</p>
      ) : (
        <ul className={styles.history}>
          {active.map(([host, until]) => (
            <li key={host} className={styles.historyTop}>
              <span>{host} · {until === -1 ? "always" : `until ${new Date(until).toLocaleString()}`}</span>
              <button type="button" className={styles.textButton} onClick={() => onUnsnooze(host)}>Wake</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
