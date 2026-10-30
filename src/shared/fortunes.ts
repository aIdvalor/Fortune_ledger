// 40 handwritten fortunes. No AI API: each line is keyed to a motive, and
// optionally to a price band and/or category. The most specific match wins;
// ties rotate so a second consult rarely repeats the first.
import type { CategoryId, MotiveId, PriceBandId } from "../popup/flow";

type Fortune = {
  text: string;
  motive?: MotiveId;
  price?: PriceBandId[];
  category?: CategoryId[];
};

const BIG: PriceBandId[] = ["over100"];
const SMALL: PriceBandId[] = ["under25"];

export const FORTUNES: Fortune[] = [
  // Need
  { motive: "need", text: "A real need will still be real tomorrow. That is how you know it." },
  { motive: "need", text: "Buy the tool, not the promise of becoming someone who uses it." },
  { motive: "need", price: BIG, text: "Needs this size deserve a second look at the receipt you will keep." },
  { motive: "need", price: SMALL, text: "Small, useful, and solving something. The Ledger nods quietly." },
  { motive: "need", category: ["useful", "home"], text: "The best household purchases disappear into the days they make easier." },
  { motive: "need", category: ["tech"], text: "Ask what you will stop doing once this arrives. That is its real price." },
  { motive: "need", text: "If you already own something that does this, it may only need finding." },
  { motive: "need", category: ["style"], text: "A need in a nicer colour is still a need. Just notice which part you are paying for." },
  // Convenience
  { motive: "convenience", text: "You are trading money for time. Make sure the time goes somewhere you love." },
  { motive: "convenience", text: "Friction you remove today may be friction that was protecting you." },
  { motive: "convenience", price: SMALL, text: "A small ease, gently bought. Let it actually make the day lighter." },
  { motive: "convenience", price: BIG, text: "Expensive shortcuts work best when the road was truly long." },
  { motive: "convenience", category: ["tech"], text: "Every new gadget brings its own chores: charging, updating, remembering." },
  { motive: "convenience", category: ["home", "useful"], text: "Picture the drawer it will live in. Is there room for it there, and in your week?" },
  { motive: "convenience", text: "Count the minutes this saves per week. Then decide if it earns its keep." },
  { motive: "convenience", category: ["treat"], text: "Sometimes the convenience is just being kind to a tired version of you. That counts." },
  // Treat
  { motive: "treat", text: "Joy is a fine reason. Let it be your joy, not the algorithm's." },
  { motive: "treat", text: "A treat chosen slowly tastes better than one grabbed at the till." },
  { motive: "treat", price: SMALL, text: "Small delights are the cheapest kind of wealth. Enjoy it fully." },
  { motive: "treat", price: BIG, text: "A big treat deserves a reason to celebrate. Is today that day, or is it next week?" },
  { motive: "treat", category: ["treat"], text: "Comfort is real. So is the comfort of not needing to buy it." },
  { motive: "treat", category: ["style"], text: "The mirror will love it for a week. Ask what you will reach for in a year." },
  { motive: "treat", text: "If this is a reward, name what it rewards. Then decide if it fits." },
  { motive: "treat", category: ["feeling"], text: "Some feelings ask for a purchase. Some only ask to be noticed." },
  // Identity
  { motive: "identity", text: "You are buying a vote for the person you intend to become." },
  { motive: "identity", text: "Your future self is built more by habits than by gear." },
  { motive: "identity", price: BIG, text: "Expensive equipment rarely creates commitment. It often just watches it fade." },
  { motive: "identity", category: ["hobby"], text: "Start with what you have. Buy the upgrade once the hobby asks for it twice." },
  { motive: "identity", category: ["style"], text: "Style is what you keep wearing, not what you keep buying." },
  { motive: "identity", category: ["tech"], text: "The newest version of a tool rarely makes a newer version of you." },
  { motive: "identity", price: SMALL, text: "A small vote for who you are becoming. Cast it on purpose." },
  { motive: "identity", category: ["feeling", "named"], text: "Who will you be the moment after you click? Is that who you want to be?" },
  // Future me
  { motive: "future", text: "Future you is a real person. Ask them if they want this, or the money." },
  { motive: "future", text: "Some gifts to the future are objects. Others are simply savings." },
  { motive: "future", price: BIG, text: "A large gift to future you. Make sure they will not be the ones paying for it." },
  { motive: "future", category: ["useful", "home"], text: "Buying ahead is wise when the need is certain and the space is ready." },
  { motive: "future", category: ["hobby"], text: "Will future you thank you for the gear, or for the hours spent using it?" },
  { motive: "future", price: SMALL, text: "Small, kind, forward-looking. The Ledger approves of planning." },
  // Any motive
  { text: "The cart will wait. That is its whole job." },
  { price: BIG, text: "Sleep on numbers with three digits. Morning is an honest accountant." },
];

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickFortune(
  motive: MotiveId,
  price: PriceBandId,
  category: CategoryId,
  rotation = 0,
): string {
  let best: { score: number; text: string }[] = [];
  let bestScore = -1;
  for (const f of FORTUNES) {
    if (f.motive && f.motive !== motive) continue;
    if (f.price && !f.price.includes(price)) continue;
    if (f.category && !f.category.includes(category)) continue;
    const score = (f.motive ? 1 : 0) + (f.price ? 2 : 0) + (f.category ? 2 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = [{ score, text: f.text }];
    } else if (score === bestScore) {
      best.push({ score, text: f.text });
    }
  }
  // Mix in equally-good general motive lines when only one specific line exists,
  // so repeat consults still vary.
  const pool = best.length > 1 || bestScore <= 1
    ? best
    : [
        ...best,
        ...FORTUNES.filter((f) => f.motive === motive && !f.price && !f.category).map((f) => ({
          score: 1,
          text: f.text,
        })),
      ];
  const idx = (hash(`${motive}|${price}|${category}`) + rotation) % pool.length;
  return pool[idx].text;
}
