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
  { id: "useful", emoji: "📦", label: "Useful thing" },
];

export const FEELING_OPTION: CategoryOption = {
  id: "feeling",
  emoji: "✨",
  label: "Just a feeling",
};

export const NAME_IT_OPTION: CategoryOption = {
  id: "named",
  emoji: "✍️",
  label: "Name it instead",
};

export const PRICE_BANDS: { id: PriceBandId; label: string }[] = [
  { id: "none", label: "No price" },
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
    description: "It solves a real problem",
  },
  {
    id: "convenience",
    title: "Convenience",
    description: "It buys time or removes friction",
  },
  {
    id: "treat",
    title: "Treat",
    description: "It brings joy, comfort, or celebration",
  },
  {
    id: "identity",
    title: "Identity",
    description: "It supports the person or aesthetic you are becoming",
  },
  {
    id: "future",
    title: "Future me",
    description: "It helps a later version of you",
  },
];

export const OUTCOMES: { id: OutcomeId; label: string }[] = [
  { id: "buy", label: "Buy with intention" },
  { id: "vault", label: "Put in 24-hour vault" },
  { id: "save", label: "Save for later" },
];

export const CONFIRMATION: Record<OutcomeId, string> = {
  buy: "Recorded without judgment. May it serve you well.",
  vault: "The Ledger will hold the thought until tomorrow, and remind you then.",
  save: "Saved privately on this device. No urgency has been created.",
};

export const MOTIVE_LABEL: Record<MotiveId, string> = {
  need: "Need",
  convenience: "Convenience",
  treat: "Treat",
  identity: "Identity",
  future: "Future me",
};
