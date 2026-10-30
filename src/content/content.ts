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
      :host{--ink:#2b241c;--accent:#8a5a24;--font-ui:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
        --fs-base:15px;--fw-regular:400;--fw-bold:700}
      .pill{display:flex;align-items:center;gap:6px;padding:6px 6px 6px 12px;border-radius:999px;
        background:color-mix(in srgb,var(--accent) 5%,white);color:var(--ink);
        border:1px solid color-mix(in srgb,var(--accent) 45%,transparent);
        box-shadow:0 6px 20px color-mix(in srgb,var(--ink) 18%,transparent);
        font:var(--fw-regular) var(--fs-base) var(--font-ui);}
      button{font:inherit;border:0;background:transparent;color:inherit;cursor:pointer;border-radius:999px;padding:6px 10px}
      .go{background:color-mix(in srgb,var(--accent) 16%,transparent);font-weight:var(--fw-bold)}
      .go:hover{background:color-mix(in srgb,var(--accent) 26%,transparent)}
      .menu,.x{color:color-mix(in srgb,var(--ink) 78%,transparent)}
      .x{line-height:1;padding:4px 8px}
      .snooze{display:none;gap:4px}
      .pill.open .snooze{display:flex}
      .pill.open .menu{display:none}
      button:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
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
