// All Fortune Ledger state lives in chrome.storage.local. Nothing leaves the device.
import type { CategoryId, MotiveId, OutcomeId, PriceBandId } from "../popup/flow";

export type Resolution = "open" | "bought" | "released";

export type LedgerEntry = {
  id: string;
  createdAt: number;
  category: CategoryId;
  itemName?: string;
  priceBand: PriceBandId;
  /** Dollar amount used for the tally: exact price if given, else a band estimate. */
  amount: number;
  amountIsEstimate: boolean;
  motive: MotiveId;
  outcome: OutcomeId;
  /** For vault/save entries: did the thought end in a purchase or was it released? */
  resolution: Resolution;
  resolvedAt?: number;
  site?: string;
  fortune: string;
};

export type Settings = {
  coolOffEnabled: boolean;
  coolOffSeconds: number; // 10–60
  pillEnabled: boolean;
};

export type StoreShape = {
  entries: LedgerEntry[];
  settings: Settings;
  /** hostname -> epoch ms until which the pill is snoozed (Infinity stored as -1 = always). */
  snoozed: Record<string, number>;
  /** Set by the in-page pill so the popup knows which site invited it. */
  pendingContext?: { site: string; at: number };
};

export const DEFAULT_SETTINGS: Settings = {
  coolOffEnabled: false,
  coolOffSeconds: 10,
  pillEnabled: true,
};

export const BAND_ESTIMATE: Record<PriceBandId, number> = {
  none: 0,
  under25: 15,
  mid: 60,
  over100: 150,
};

export const VAULT_MS = 24 * 60 * 60 * 1000;
export const NOT_SPENT_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

const hasChrome = typeof chrome !== "undefined" && !!chrome.storage?.local;

// Fallback for previewing the popup outside the extension (e.g. `npm run dev`).
async function rawGet<K extends keyof StoreShape>(key: K): Promise<StoreShape[K] | undefined> {
  if (hasChrome) {
    const result = await chrome.storage.local.get(key);
    return result[key] as StoreShape[K] | undefined;
  }
  const raw = localStorage.getItem(`fl:${key}`);
  return raw ? (JSON.parse(raw) as StoreShape[K]) : undefined;
}

async function rawSet<K extends keyof StoreShape>(key: K, value: StoreShape[K]): Promise<void> {
  if (hasChrome) {
    await chrome.storage.local.set({ [key]: value });
    return;
  }
  localStorage.setItem(`fl:${key}`, JSON.stringify(value));
}

export async function getEntries(): Promise<LedgerEntry[]> {
  return (await rawGet("entries")) ?? [];
}

export async function saveEntries(entries: LedgerEntry[]): Promise<void> {
  await rawSet("entries", entries);
}

export async function addEntry(entry: LedgerEntry): Promise<void> {
  const entries = await getEntries();
  entries.unshift(entry);
  await saveEntries(entries);
}

export async function resolveEntry(id: string, resolution: Resolution): Promise<void> {
  const entries = await getEntries();
  const entry = entries.find((e) => e.id === id);
  if (!entry) return;
  entry.resolution = resolution;
  entry.resolvedAt = Date.now();
  await saveEntries(entries);
}

export async function getSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...((await rawGet("settings")) ?? {}) };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await rawSet("settings", settings);
}

export async function getSnoozed(): Promise<Record<string, number>> {
  return (await rawGet("snoozed")) ?? {};
}

export async function setSnoozed(snoozed: Record<string, number>): Promise<void> {
  await rawSet("snoozed", snoozed);
}

export async function takePendingContext(): Promise<string | undefined> {
  const ctx = await rawGet("pendingContext");
  if (!ctx) return undefined;
  if (hasChrome) await chrome.storage.local.remove("pendingContext");
  else localStorage.removeItem("fl:pendingContext");
  // Only trust a context set in the last 2 minutes.
  return Date.now() - ctx.at < 2 * 60 * 1000 ? ctx.site : undefined;
}

export async function deleteEverything(): Promise<void> {
  if (hasChrome) {
    await chrome.storage.local.clear();
    await chrome.alarms?.clearAll();
    return;
  }
  Object.keys(localStorage)
    .filter((k) => k.startsWith("fl:"))
    .forEach((k) => localStorage.removeItem(k));
}

/** Money not spent: released thoughts, plus vault/save thoughts left unbought for 7+ days. */
export function isNotSpent(e: LedgerEntry, now = Date.now()): boolean {
  if (e.outcome === "buy") return false;
  if (e.resolution === "released") return true;
  if (e.resolution === "bought") return false;
  return now - e.createdAt >= NOT_SPENT_AFTER_MS;
}

export type Summary = {
  notSpent: number;
  onHold: number;
  intentional: number;
  consults: number;
  byMotive: Record<MotiveId, { count: number; notSpent: number; bought: number }>;
  anyEstimate: boolean;
};

export function summarize(entries: LedgerEntry[], now = Date.now()): Summary {
  const byMotive = {
    need: { count: 0, notSpent: 0, bought: 0 },
    convenience: { count: 0, notSpent: 0, bought: 0 },
    treat: { count: 0, notSpent: 0, bought: 0 },
    identity: { count: 0, notSpent: 0, bought: 0 },
    future: { count: 0, notSpent: 0, bought: 0 },
  } as Summary["byMotive"];
  let notSpent = 0;
  let onHold = 0;
  let intentional = 0;
  let anyEstimate = false;
  for (const e of entries) {
    const m = byMotive[e.motive];
    m.count += 1;
    if (e.outcome === "buy" || e.resolution === "bought") {
      m.bought += e.amount;
      if (e.outcome === "buy") intentional += 1;
    } else if (isNotSpent(e, now)) {
      notSpent += e.amount;
      m.notSpent += e.amount;
      if (e.amountIsEstimate && e.amount > 0) anyEstimate = true;
    } else {
      onHold += e.amount;
    }
  }
  return { notSpent, onHold, intentional, consults: entries.length, byMotive, anyEstimate };
}

export async function exportJson(): Promise<string> {
  const [entries, settings] = await Promise.all([getEntries(), getSettings()]);
  return JSON.stringify(
    { app: "Fortune Ledger", exportedAt: new Date().toISOString(), settings, entries },
    null,
    2,
  );
}
