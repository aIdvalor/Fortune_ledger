import { chromium } from "playwright";
const DIST = "/workspace/portfolio/fortune-ledger/source/Fortune_ledger/dist";
const OUT = "/workspace/portfolio/fortune-ledger/source/Fortune_ledger/docs";
const ctx = await chromium.launchPersistentContext("/tmp/fl-profile-" + Date.now(), {
  channel: "chromium", headless: true,
  args: [`--disable-extensions-except=${DIST}`, `--load-extension=${DIST}`],
});
let [sw] = ctx.serviceWorkers();
if (!sw) sw = await ctx.waitForEvent("serviceworker");
const id = sw.url().split("/")[2];
console.log("ext id", id);

// Mock checkout page
await ctx.route("https://cozy-goods.example/**", (r) => r.fulfill({ contentType: "text/html", body: `<!doctype html><html><head><meta charset="utf-8"></head><body style="font-family:Helvetica,Arial;margin:0;background:#fff">
<header style="padding:16px 32px;border-bottom:1px solid #eee;font-weight:700;font-size:20px">Cozy Goods</header>
<main style="display:flex;gap:40px;padding:32px"><section style="flex:2"><h2>Checkout</h2>
<div style="display:flex;gap:16px;align-items:center;border:1px solid #eee;padding:16px;border-radius:8px"><div style="width:72px;height:72px;background:#e9dccb;border-radius:6px"></div><div><b>Linen throw blanket</b><br>Oatmeal · Qty 1</div><div style="margin-left:auto">$89.00</div></div>
<p style="color:#888">Shipping · Payment · Review</p></section>
<aside style="flex:1;border:1px solid #eee;padding:16px;border-radius:8px;height:fit-content"><p>Subtotal <span style="float:right">$89.00</span></p><p><b>Total <span style="float:right">$89.00</span></b></p>
<button style="width:100%;padding:14px;background:#1a1a1a;color:#fff;border:0;border-radius:6px;font-size:16px">Place order</button></aside></main></body></html>` }));
const shop = await ctx.newPage();
await shop.setViewportSize({ width: 1100, height: 560 });
await shop.goto("https://cozy-goods.example/checkout");
await shop.waitForSelector("#fortune-ledger-pill-host", { state: "attached", timeout: 10000 });
await shop.waitForTimeout(400);
await shop.screenshot({ path: `${OUT}/01-checkout-pill.png` });

const p = await ctx.newPage();
await p.setViewportSize({ width: 380, height: 600 });
const url = `chrome-extension://${id}/popup.html`;
await p.goto(url);
// seed some history so the ledger has substance
await p.evaluate(async () => {
  const day = 864e5, now = Date.now();
  const mk = (o) => ({ id: crypto.randomUUID(), amountIsEstimate: false, resolution: "open", fortune: "", ...o });
  const entries = [
    mk({ createdAt: now - 2*day, category: "tech", itemName: "Noise-cancelling earbuds", priceBand: "over100", amount: 179, motive: "identity", outcome: "vault", resolution: "released", site: "www.amazon.com" }),
    mk({ createdAt: now - 9*day, category: "style", itemName: "Second pair of sneakers", priceBand: "mid", amount: 95, motive: "treat", outcome: "save" }),
    mk({ createdAt: now - 4*day, category: "useful", itemName: "Replacement kettle", priceBand: "mid", amount: 45, motive: "need", outcome: "buy", resolution: "bought" }),
    mk({ createdAt: now - 1*day, category: "home", priceBand: "under25", amount: 15, amountIsEstimate: true, motive: "convenience", outcome: "vault" }),
    mk({ createdAt: now - 12*day, category: "hobby", itemName: "Tennis racquet upgrade", priceBand: "over100", amount: 229, motive: "future", outcome: "vault", resolution: "released" }),
  ];
  await chrome.storage.local.set({ entries, snoozed: { "www.bigbox-store.example": now + day } });
});
await p.reload();
const shot = async (n) => { await p.waitForTimeout(250); await p.screenshot({ path: `${OUT}/${n}.png` }); };
await shot("02-welcome");
await p.getByText("Consult the Ledger").click();
await p.getByText("Tech").click();
await shot("03-price");
await p.getByText("$100+").click();
await p.getByText("Identity").click();
await shot("04-fortune-identity-tech-100");
// show a second fortune for a different path
await p.getByText("Back").click();
await p.getByText("Back").click();
await p.getByText("Under $25").click();
await p.getByText("Treat", { exact: true }).click();
await shot("05-fortune-treat-under25");
// enable cool-off via storage then go through pause
await p.evaluate(() => chrome.storage.local.set({ settings: { coolOffEnabled: true, coolOffSeconds: 20, pillEnabled: true } }));
await p.reload();
await p.getByText("Consult the Ledger").click();
await p.getByText("Style").click();
await p.getByText("$25–$100").click();
await p.getByText("Treat", { exact: true }).click();
await p.getByText("Choose what happens next").click();
await p.waitForTimeout(3200);
await shot("06-cool-off-pause");
await p.getByText("Skip the pause").click();
await shot("07-outcomes");
await p.getByText("Put in 24-hour vault").click();
await shot("08-vaulted");
const alarms = await p.evaluate(() => chrome.alarms.getAll());
console.log("alarms", JSON.stringify(alarms.map(a => ({ name: a.name, hoursFromNow: ((a.scheduledTime - Date.now())/36e5).toFixed(2) }))));
await p.setViewportSize({ width: 380, height: 900 });
await p.goto("about:blank"); await p.goto(url + "#ledger");
await shot("09-ledger");
await p.goto("about:blank"); await p.goto(url + "#settings");
await p.setViewportSize({ width: 380, height: 600 });
await shot("10-settings");
// tall-screen background check
await p.setViewportSize({ width: 900, height: 1000 });
await p.goto(url);
await shot("11-tall-window");
// test notification firing path: trigger alarm handler quickly
const fired = await sw.evaluate(async () => {
  const { entries } = await chrome.storage.local.get("entries");
  return entries.length;
});
console.log("entries", fired);
await ctx.close();
