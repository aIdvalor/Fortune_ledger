export type Step =
  | "welcome"
  | "context"
  | "price"
  | "motive"
  | "fortune"
  | "pause"
  | "decision"
  | "confirm"
  | "ledger"
  | "settings";

export type CategoryId =
  | "style"
  | "tech"
  | "home"
  | "hobby"
  | "treat"
  | "useful"
  | "feeling"
  | "named";

export type PriceBandId = "none" | "under25" | "mid" | "over100";

export type MotiveId =
  | "need"
  | "convenience"
  | "treat"
  | "identity"
  | "future";

export type OutcomeId = "buy" | "vault" | "save";

export type CategoryOption = {
  id: CategoryId;
  emoji: string;
  label: string;
};

export const CATEGORY_CHIPS: CategoryOption[] = [
  { id: "style", emoji: "👕", label: "Style" },
  { id: "tech", emoji: "🎧", label: "Tech" },
  { id: "home", emoji: "🪴", label: "Home" },
  { id: "hobby", emoji: "🏃", label: "Hobby" },
  { id: "treat", emoji: "🍰", label: "Treat" },
  { id: "useful", emoji: "📦", label: "Useful" },
];

export const FEELING_OPTION: CategoryOption = {
  id: "feeling",
  emoji: "✨",
  label: "Just a vibe",
};

export const NAME_IT_OPTION: CategoryOption = {
  id: "named",
  emoji: "✍️",
  label: "Name it",
};

export const PRICE_BANDS: { id: PriceBandId; label: string }[] = [
  { id: "none", label: "🤷 Not sure" },
  { id: "under25", label: "Under $25" },
  { id: "mid", label: "$25–$100" },
  { id: "over100", label: "$100+" },
];

export const MOTIVES: {
  id: MotiveId;
  title: string;
  description: string;
}[] = [
  {
    id: "need",
    title: "Need",
    description: "🔧 Fixes a real problem",
  },
  {
    id: "convenience",
    title: "Convenience",
    description: "⏱️ Saves time",
  },
  {
    id: "treat",
    title: "Treat",
    description: "🎉 Pure joy",
  },
  {
    id: "identity",
    title: "Identity",
    description: "🪞 Who I'm becoming",
  },
  {
    id: "future",
    title: "Future me",
    description: "🌱 Later-me will thank me",
  },
];

export const OUTCOMES: { id: OutcomeId; label: string }[] = [
  { id: "buy", label: "🛍️ Buy it, mindfully" },
  { id: "vault", label: "🔒 Sleep on it (24h)" },
  { id: "save", label: "🔖 Save for later" },
];

export const CONFIRMATION: Record<OutcomeId, string> = {
  buy: "Enjoy it. 🛍️",
  vault: "Locked in the vault. See you tomorrow. 🔒",
  save: "Saved. No rush. 🔖",
};

export const MOTIVE_LABEL: Record<MotiveId, string> = {
  need: "Need",
  convenience: "Convenience",
  treat: "Treat",
  identity: "Identity",
  future: "Future me",
};
