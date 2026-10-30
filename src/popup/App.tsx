import { useEffect, useId, useState } from "react";
import styles from "./App.module.css";
import {
  CATEGORY_CHIPS,
  CONFIRMATION,
  FEELING_OPTION,
  MOTIVES,
  NAME_IT_OPTION,
  OUTCOMES,
  MOTIVE_LABEL,
  PRICE_BANDS,
  type CategoryId,
  type MotiveId,
  type OutcomeId,
  type PriceBandId,
  type Step,
} from "./flow";
import { pickFortune } from "../shared/fortunes";
import {
  BAND_ESTIMATE,
  VAULT_MS,
  addEntry,
  deleteEverything,
  exportJson,
  getEntries,
  getSettings,
  getSnoozed,
  resolveEntry,
  saveSettings,
  setSnoozed,
  summarize,
  takePendingContext,
  DEFAULT_SETTINGS,
  type LedgerEntry,
  type Settings,
} from "../shared/storage";
import { Ledger } from "./Ledger";
import { SettingsView } from "./SettingsView";
import { Pause } from "./Pause";

type FlowState = {
  step: Step;
  category: CategoryId | null;
  itemName: string;
  showNameField: boolean;
  priceBand: PriceBandId | null;
  exactPrice: string;
  showExactPrice: boolean;
  motive: MotiveId | null;
  outcome: OutcomeId | null;
  fortune: string;
};

const INITIAL_STATE: FlowState = {
  step: "welcome",
  category: null,
  itemName: "",
  showNameField: false,
  priceBand: null,
  exactPrice: "",
  showExactPrice: false,
  motive: null,
  outcome: null,
  fortune: "",
};

function previousStep(step: Step): Step | null {
  switch (step) {
    case "context":
      return "welcome";
    case "price":
      return "context";
    case "motive":
      return "price";
    case "fortune":
      return "motive";
    case "pause":
      return "fortune";
    case "decision":
      return "fortune";
    case "ledger":
    case "settings":
      return "welcome";
    case "confirm":
      return "decision";
    default:
      return null;
  }
}

export default function App() {
  const [flow, setFlow] = useState<FlowState>(INITIAL_STATE);
  const nameFieldId = useId();
  const exactPriceId = useId();
  const backStep = previousStep(flow.step);
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [snoozed, setSnoozedState] = useState<Record<string, number>>({});
  const [site, setSite] = useState<string | undefined>();

  async function refresh() {
    const [s, e, z] = await Promise.all([getSettings(), getEntries(), getSnoozed()]);
    setSettingsState(s);
    setEntries(e);
    setSnoozedState(z);
  }

  useEffect(() => {
    refresh();
    takePendingContext().then(setSite);
    const applyHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "ledger" || hash === "settings") {
        refresh();
        setFlow((current) => ({ ...current, step: hash }));
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const summary = summarize(entries);

  function goBack() {
    if (!backStep) {
      return;
    }

    setFlow((current) => ({ ...current, step: backStep }));
  }

  function selectCategory(id: CategoryId) {
    if (id === "named") {
      setFlow((current) => ({
        ...current,
        category: "named",
        showNameField: true,
      }));
      return;
    }

    setFlow((current) => ({
      ...current,
      category: id,
      showNameField: false,
      itemName: id === "feeling" ? "" : current.itemName,
      step: "price",
    }));
  }

  function continueFromNamedItem() {
    setFlow((current) => ({
      ...current,
      category: "named",
      step: "price",
    }));
  }

  function selectPriceBand(id: PriceBandId) {
    setFlow((current) => ({
      ...current,
      priceBand: id,
      step: "motive",
    }));
  }

  function selectMotive(id: MotiveId) {
    setFlow((current) => ({
      ...current,
      motive: id,
      fortune: pickFortune(
        id,
        current.priceBand ?? "none",
        current.category ?? "feeling",
        entries.length,
      ),
      step: "fortune",
    }));
  }

  function continueFromExactPrice() {
    const value = Number(flow.exactPrice);
    const band: PriceBandId =
      !value || value <= 0 ? "none" : value < 25 ? "under25" : value <= 100 ? "mid" : "over100";
    selectPriceBand(band);
  }

  async function selectOutcome(id: OutcomeId) {
    const exact = Number(flow.exactPrice);
    const band = flow.priceBand ?? "none";
    const entry: LedgerEntry = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      category: flow.category ?? "feeling",
      itemName: flow.itemName.trim() || undefined,
      priceBand: band,
      amount: exact > 0 ? exact : BAND_ESTIMATE[band],
      amountIsEstimate: !(exact > 0),
      motive: flow.motive ?? "need",
      outcome: id,
      resolution: id === "buy" ? "bought" : "open",
      site,
      fortune: flow.fortune,
    };
    await addEntry(entry);
    if (id === "vault" && typeof chrome !== "undefined" && chrome.alarms) {
      chrome.alarms.create(`vault:${entry.id}`, { when: Date.now() + VAULT_MS });
    }
    await refresh();
    setFlow((current) => ({
      ...current,
      outcome: id,
      step: "confirm",
    }));
  }

  function afterFortune() {
    setFlow((current) => ({
      ...current,
      step: settings.coolOffEnabled ? "pause" : "decision",
    }));
  }

  return (
    <main className={styles.popup}>
      {backStep ? (
        <button type="button" className={styles.back} onClick={goBack}>
          <span aria-hidden="true">←</span> Back
        </button>
      ) : null}

      {flow.step === "welcome" ? (
        <section className={styles.screen} aria-labelledby="welcome-title">
          <div className={styles.orb} aria-hidden="true">🔮</div>
          <h1 id="welcome-title" className={styles.title}>
            Fortune Ledger
          </h1>
          <p className={styles.tagline}>A breath before you buy.</p>
          {site ? (
            <p className={styles.hint}>📍 {site}</p>
          ) : null}
          <button
            type="button"
            className={styles.primary}
            onClick={() =>
              setFlow((current) => ({ ...current, step: "context" }))
            }
          >
            ✨ Ask the Ledger
          </button>
          {summary.consults > 0 ? (
            <button
              type="button"
              className={styles.tally}
              onClick={() => setFlow((current) => ({ ...current, step: "ledger" }))}
            >
              <span className={styles.tallyAmount}>${summary.notSpent.toFixed(0)}</span>
              <span className={styles.cardCopy}>💰 kept in your pocket</span>
            </button>
          ) : null}
          <div className={styles.navRow}>
            <button
              type="button"
              className={styles.textButton}
              onClick={() => setFlow((current) => ({ ...current, step: "ledger" }))}
            >
              <span aria-hidden="true">📒</span> Ledger
            </button>
            <button
              type="button"
              className={styles.textButton}
              onClick={() => setFlow((current) => ({ ...current, step: "settings" }))}
            >
              <span aria-hidden="true">⚙️</span> Settings
            </button>
          </div>
          <p className={styles.privacy}>
            <span aria-hidden="true">🔐</span> Stays on this device
          </p>
        </section>
      ) : null}

      {flow.step === "context" ? (
        <section className={styles.screen} aria-labelledby="context-title">
          <h1 id="context-title" className={styles.prompt}>
            What's calling you?
          </h1>
          <div className={styles.chipGrid} role="group" aria-label="Item kinds">
            {CATEGORY_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={styles.chip}
                aria-pressed={flow.category === chip.id}
                onClick={() => selectCategory(chip.id)}
              >
                <span className={styles.emoji} aria-hidden="true">
                  {chip.emoji}
                </span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
          <div className={styles.secondaryRow} role="group" aria-label="Other ways in">
            <button
              type="button"
              className={styles.secondaryChip}
              aria-pressed={flow.category === "feeling"}
              onClick={() => selectCategory(FEELING_OPTION.id)}
            >
              <span className={styles.emoji} aria-hidden="true">
                {FEELING_OPTION.emoji}
              </span>
              <span>{FEELING_OPTION.label}</span>
            </button>
            <button
              type="button"
              className={styles.secondaryChip}
              aria-pressed={flow.showNameField || flow.category === "named"}
              aria-expanded={flow.showNameField}
              aria-controls={flow.showNameField ? nameFieldId : undefined}
              onClick={() => selectCategory(NAME_IT_OPTION.id)}
            >
              <span className={styles.emoji} aria-hidden="true">
                {NAME_IT_OPTION.emoji}
              </span>
              <span>{NAME_IT_OPTION.label}</span>
            </button>
          </div>
          {flow.showNameField ? (
            <div className={styles.reveal}>
              <label className={styles.fieldLabel} htmlFor={nameFieldId}>
                What is it?
              </label>
              <input
                id={nameFieldId}
                className={styles.input}
                type="text"
                autoComplete="off"
                value={flow.itemName}
                onChange={(event) =>
                  setFlow((current) => ({
                    ...current,
                    itemName: event.target.value,
                  }))
                }
              />
              <button
                type="button"
                className={styles.primary}
                onClick={continueFromNamedItem}
              >
                Continue
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {flow.step === "price" ? (
        <section className={styles.screen} aria-labelledby="price-title">
          <h1 id="price-title" className={styles.prompt}>
            Roughly how much?
          </h1>
          <div className={styles.chipGrid} role="group" aria-label="Price ranges">
            {PRICE_BANDS.map((band) => (
              <button
                key={band.id}
                type="button"
                className={styles.chip}
                aria-pressed={flow.priceBand === band.id}
                onClick={() => selectPriceBand(band.id)}
              >
                {band.label}
              </button>
            ))}
          </div>
          {flow.showExactPrice ? (
            <div className={styles.reveal}>
              <label className={styles.fieldLabel} htmlFor={exactPriceId}>
                Exact price
              </label>
              <input
                id={exactPriceId}
                className={styles.input}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={flow.exactPrice}
                onChange={(event) =>
                  setFlow((current) => ({
                    ...current,
                    exactPrice: event.target.value,
                  }))
                }
              />
              <button
                type="button"
                className={styles.primary}
                onClick={continueFromExactPrice}
              >
                Continue
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.textButton}
              aria-expanded="false"
              onClick={() =>
                setFlow((current) => ({ ...current, showExactPrice: true }))
              }
            >
              Exact price
            </button>
          )}
        </section>
      ) : null}

      {flow.step === "motive" ? (
        <section className={styles.screen} aria-labelledby="motive-title">
          <h1 id="motive-title" className={styles.prompt}>
            Why do you want it?
          </h1>
          <div className={styles.cardStack} role="group" aria-label="Motives">
            {MOTIVES.map((motive) => (
              <button
                key={motive.id}
                type="button"
                className={styles.card}
                aria-pressed={flow.motive === motive.id}
                onClick={() => selectMotive(motive.id)}
              >
                <span className={styles.cardTitle}>{motive.title}</span>
                <span className={styles.cardCopy}>{motive.description}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {flow.step === "fortune" ? (
        <section className={styles.screen} aria-labelledby="fortune-title">
          <p className={styles.kicker}><span aria-hidden="true">🔮</span> Your fortune</p>
          <h1 id="fortune-title" className={styles.fortune} aria-live="polite">
            {flow.fortune}
          </h1>
          <button
            type="button"
            className={styles.primary}
            onClick={afterFortune}
          >
            Next →
          </button>
        </section>
      ) : null}

      {flow.step === "decision" ? (
        <section className={styles.screen} aria-labelledby="decision-title">
          <h1 id="decision-title" className={styles.prompt}>
            Your call
          </h1>
          <div className={styles.cardStack} role="group" aria-label="Outcomes">
            {OUTCOMES.map((outcome) => (
              <button
                key={outcome.id}
                type="button"
                className={styles.outcome}
                aria-pressed={flow.outcome === outcome.id}
                onClick={() => selectOutcome(outcome.id)}
              >
                {outcome.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {flow.step === "confirm" && flow.outcome ? (
        <section className={styles.screen} aria-labelledby="confirm-title">
          <div className={flow.outcome === "buy" ? styles.orb : `${styles.orb} ${styles.celebrate}`} aria-hidden="true">
            {flow.outcome === "buy" ? "🛍️" : "🎉"}
          </div>
          {flow.outcome !== "buy" ? (
            <p className={styles.kicker}>Nice. That's money still yours.</p>
          ) : null}
          <h1 id="confirm-title" className={styles.fortune} aria-live="polite">
            {CONFIRMATION[flow.outcome]}
          </h1>
          <button
            type="button"
            className={styles.secondaryAction}
            onClick={() => setFlow(INITIAL_STATE)}
          >
            ↺ Again
          </button>
        </section>
      ) : null}
      {flow.step === "pause" ? (
        <Pause
          seconds={settings.coolOffSeconds}
          fortune={flow.fortune}
          onDone={() => setFlow((current) => ({ ...current, step: "decision" }))}
        />
      ) : null}

      {flow.step === "ledger" ? (
        <Ledger
          entries={entries}
          summary={summary}
          motiveLabel={MOTIVE_LABEL}
          onResolve={async (id, r) => {
            await resolveEntry(id, r);
            await refresh();
          }}
          onExport={async () => {
            const blob = new Blob([await exportJson()], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `fortune-ledger-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
          }}
          onDeleteAll={async () => {
            await deleteEverything();
            await refresh();
          }}
        />
      ) : null}

      {flow.step === "settings" ? (
        <SettingsView
          settings={settings}
          snoozed={snoozed}
          onChange={async (next) => {
            await saveSettings(next);
            setSettingsState(next);
          }}
          onUnsnooze={async (host) => {
            const next = { ...snoozed };
            delete next[host];
            await setSnoozed(next);
            setSnoozedState(next);
          }}
        />
      ) : null}
    </main>
  );
}
