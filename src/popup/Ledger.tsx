import { useState } from "react";
import styles from "./App.module.css";
import type { MotiveId } from "./flow";
import { type LedgerEntry, type Resolution, type Summary } from "../shared/storage";

const OUTCOME_LABEL = { buy: "🛍️ Bought", vault: "🔒 Vaulted", save: "🔖 Saved" };

function money(n: number) {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function Ledger({
  entries, summary, motiveLabel, onResolve, onExport, onDeleteAll,
}: {
  entries: LedgerEntry[];
  summary: Summary;
  motiveLabel: Record<MotiveId, string>;
  onResolve: (id: string, r: Resolution) => void;
  onExport: () => void;
  onDeleteAll: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const motives = Object.keys(summary.byMotive) as MotiveId[];
  const maxCount = Math.max(1, ...motives.map((m) => summary.byMotive[m].count));
  return (
    <section className={styles.screen} aria-labelledby="ledger-title">
      <p className={styles.kicker}><span aria-hidden="true">📒</span> Your ledger</p>
      <div className={styles.tallyStatic}>
        <span className={styles.tallyAmount}>{money(summary.notSpent)}</span>
        <span className={styles.cardCopy}>
          💰 kept{summary.anyEstimate ? " · ~estimated" : ""}
        </span>
        <span className={styles.cardCopy}>
          🔒 {money(summary.onHold)} on hold · 🛍️ {summary.intentional} bought · 🔮 {summary.consults} asks
        </span>
      </div>

      <h2 id="ledger-title" className={styles.subhead}>By motive</h2>
      <div className={styles.bars}>
        {motives.map((m) => {
          const b = summary.byMotive[m];
          return (
            <div key={m} className={styles.barRow}>
              <span className={styles.barLabel}>{motiveLabel[m]}</span>
              <span className={styles.barTrack}>
                <span className={styles.barFill} style={{ width: `${(b.count / maxCount) * 100}%` }} />
              </span>
              <span className={styles.barValue}>
                {b.count} · {money(b.notSpent)}
              </span>
            </div>
          );
        })}
      </div>

      <h2 className={styles.subhead}>Recent</h2>
      {entries.length === 0 ? (
        <p className={styles.hint}>Nothing yet 🌱</p>
      ) : (
        <ul className={styles.history}>
          {entries.slice(0, 12).map((e) => (
            <li key={e.id} className={styles.historyItem}>
              <div className={styles.historyTop}>
                <span>{e.itemName || e.category} · {motiveLabel[e.motive]}</span>
                <span>{e.amount ? `${e.amountIsEstimate ? "~" : ""}${money(e.amount)}` : "—"}</span>
              </div>
              <div className={styles.cardCopy}>
                {OUTCOME_LABEL[e.outcome]}
                {e.resolution === "released" ? " · 🕊️ let go" : ""}
                {e.outcome !== "buy" && e.resolution === "bought" ? " · bought later" : ""}
                
                {e.site ? ` · ${e.site}` : ""} · {new Date(e.createdAt).toLocaleDateString()}
              </div>
              {e.outcome !== "buy" && e.resolution === "open" ? (
                <div className={styles.inlineActions}>
                  <button type="button" className={styles.textButton} onClick={() => onResolve(e.id, "released")}>🕊️ Let go</button>
                  <button type="button" className={styles.textButton} onClick={() => onResolve(e.id, "bought")}>🛍️ Bought</button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <div className={styles.navRow}>
        <button type="button" className={styles.secondaryAction} onClick={onExport}><span aria-hidden="true">⬇️</span> Export</button>
        {confirming ? (
          <button type="button" className={styles.danger} onClick={() => { setConfirming(false); onDeleteAll(); }}>
            Yes, delete all
          </button>
        ) : (
          <button type="button" className={styles.secondaryAction} onClick={() => setConfirming(true)}><span aria-hidden="true">🗑️</span> Delete all</button>
        )}
      </div>
      <p className={styles.privacy}><span aria-hidden="true">🔐</span> Only in this browser</p>
    </section>
  );
}
