// In-page pill: a small, dismissible "Consult the Ledger?" invitation.
// It never blocks, hides, or delays the store's own checkout button.
import { detectCheckout } from "./detect";

const HOST_ID = "fortune-ledger-pill-host";
const SNOOZE_MS = 24 * 60 * 60 * 1000;
let dismissedForUrl = "";

async function isSnoozed(host: string): Promise<boolean> {
  const { snoozed = {}, settings = {} } = await chrome.storage.local.get(["snoozed", "settings"]);
  if ((settings as { pillEnabled?: boolean }).pillEnabled === false) return true;
  const until = (snoozed as Record<string, number>)[host];
  return until === -1 || (typeof until === "number" && until > Date.now());
}

async function snooze(host: string, forever: boolean) {
  const { snoozed = {} } = await chrome.storage.local.get("snoozed");
  (snoozed as Record<string, number>)[host] = forever ? -1 : Date.now() + SNOOZE_MS;
  await chrome.storage.local.set({ snoozed });
}

function removePill() {
  document.getElementById(HOST_ID)?.remove();
}

function renderPill() {
  if (document.getElementById(HOST_ID)) return;
  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.cssText = "all:initial;position:fixed;right:16px;bottom:16px;z-index:2147483646;";
  const root = host.attachShadow({ mode: "closed" });
  root.innerHTML = `
    <style>
      .pill{display:flex;align-items:center;gap:6px;padding:6px 6px 6px 12px;border-radius:999px;
        background:linear-gradient(180deg,#f7f0e2,#efe4cf);color:#2b241c;border:1px solid rgba(181,122,58,.45);
        box-shadow:0 6px 20px rgba(43,36,28,.18);font:14px "Iowan Old Style",Georgia,serif;}
      button{font:inherit;border:0;background:transparent;color:inherit;cursor:pointer;border-radius:999px;padding:6px 10px}
      .go{background:rgba(181,122,58,.16);font-weight:600}
      .go:hover{background:rgba(181,122,58,.26)}
      .menu{font-size:12px;color:#5d5246}
      .x{font-size:16px;line-height:1;padding:4px 8px;color:#5d5246}
      .snooze{display:none;gap:4px}
      .pill.open .snooze{display:flex}
      .pill.open .menu{display:none}
      button:focus-visible{outline:2px solid #8a5a24;outline-offset:1px}
    </style>
    <div class="pill" role="region" aria-label="Fortune Ledger">
      <span aria-hidden="true">🔮</span>
      <button class="go" type="button">Pause first?</button>
      <button class="menu" type="button" aria-label="Mute options">😴</button>
      <span class="snooze">
        <button class="menu" data-s="day" type="button">Mute 24h</button>
        <button class="menu" data-s="always" type="button">Never here</button>
      </span>
      <button class="x" type="button" aria-label="Dismiss">✕</button>
    </div>`;
  const pill = root.querySelector(".pill") as HTMLElement;
  root.querySelector(".go")!.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "fl:open" });
    removePill();
    dismissedForUrl = location.href;
  });
  root.querySelector(".menu:not([data-s])")!.addEventListener("click", () => pill.classList.add("open"));
  root.querySelectorAll("[data-s]").forEach((b) =>
    b.addEventListener("click", async () => {
      await snooze(location.hostname, (b as HTMLElement).dataset.s === "always");
      removePill();
    }),
  );
  root.querySelector(".x")!.addEventListener("click", () => {
    dismissedForUrl = location.href;
    removePill();
  });
  document.documentElement.appendChild(host);
}

let lastUrl = "";
async function check() {
  if (location.href === lastUrl && document.getElementById(HOST_ID)) return;
  lastUrl = location.href;
  const kind = detectCheckout(new URL(location.href), document);
  if (!kind || dismissedForUrl === location.href || (await isSnoozed(location.hostname))) {
    removePill();
    return;
  }
  renderPill();
}

check();
// Single-page checkouts change the URL without reloading.
window.addEventListener("popstate", check);
setInterval(() => {
  if (location.href !== lastUrl) check();
}, 1500);
