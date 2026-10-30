import { useId, useState } from "react";
import styles from "./App.module.css";
import {
  CATEGORY_CHIPS,
  CONFIRMATION,
  FEELING_OPTION,
  MOTIVES,
  NAME_IT_OPTION,
  OUTCOMES,
  PLACEHOLDER_FORTUNE,
  PRICE_BANDS,
  type CategoryId,
  type MotiveId,
  type OutcomeId,
  type PriceBandId,
  type Step,
} from "./flow";

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
    case "decision":
      return "fortune";
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
      step: "fortune",
    }));
  }

  function selectOutcome(id: OutcomeId) {
    setFlow((current) => ({
      ...current,
      outcome: id,
      step: "confirm",
    }));
  }

  return (
    <main className={styles.popup}>
      {backStep ? (
        <button type="button" className={styles.back} onClick={goBack}>
          Back
        </button>
      ) : null}

      {flow.step === "welcome" ? (
        <section className={styles.screen} aria-labelledby="welcome-title">
          <p className={styles.kicker}>Warm Oracle</p>
          <h1 id="welcome-title" className={styles.title}>
            Fortune Ledger
          </h1>
          <p className={styles.tagline}>A little perspective before checkout.</p>
          <button
            type="button"
            className={styles.primary}
            onClick={() =>
              setFlow((current) => ({ ...current, step: "context" }))
            }
          >
            Consult the Ledger
          </button>
          <p className={styles.privacy}>
            Private by design. Nothing is read from this page.
          </p>
        </section>
      ) : null}

      {flow.step === "context" ? (
        <section className={styles.screen} aria-labelledby="context-title">
          <h1 id="context-title" className={styles.prompt}>
            What kind of thing is calling to you?
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
                What are you considering?
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
            Any sense of the price?
          </h1>
          <p className={styles.hint}>No exact number is required.</p>
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
              Enter exact price
            </button>
          )}
        </section>
      ) : null}

      {flow.step === "motive" ? (
        <section className={styles.screen} aria-labelledby="motive-title">
          <h1 id="motive-title" className={styles.prompt}>
            What is this really for?
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
          <p className={styles.kicker}>The Ledger offers</p>
          <h1 id="fortune-title" className={styles.fortune} aria-live="polite">
            {PLACEHOLDER_FORTUNE}
          </h1>
          <button
            type="button"
            className={styles.primary}
            onClick={() =>
              setFlow((current) => ({ ...current, step: "decision" }))
            }
          >
            Choose what happens next
          </button>
        </section>
      ) : null}

      {flow.step === "decision" ? (
        <section className={styles.screen} aria-labelledby="decision-title">
          <h1 id="decision-title" className={styles.prompt}>
            What would you like to do?
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
          <p className={styles.kicker}>Noted</p>
          <h1 id="confirm-title" className={styles.fortune} aria-live="polite">
            {CONFIRMATION[flow.outcome]}
          </h1>
          <button
            type="button"
            className={styles.secondaryAction}
            onClick={() => setFlow(INITIAL_STATE)}
          >
            Consult again
          </button>
        </section>
      ) : null}
    </main>
  );
}
