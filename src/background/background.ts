// Service worker: 24-hour vault reminders and opening the Ledger from the in-page pill.
import { getEntries, resolveEntry } from "../shared/storage";

const VAULT_PREFIX = "vault:";

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith(VAULT_PREFIX)) return;
  const id = alarm.name.slice(VAULT_PREFIX.length);
  const entry = (await getEntries()).find((e) => e.id === id);
  if (!entry || entry.resolution !== "open") return;
  const what = entry.itemName?.trim() || "that thing";
  chrome.notifications.create(alarm.name, {
    type: "basic",
    iconUrl: chrome.runtime.getURL("icons/icon128.png"),
    title: "🔒 Vault check-in",
    message: `Still want ${what}?`,
    buttons: [{ title: "🛍️ Yes" }, { title: "🕊️ Let it go" }],
    requireInteraction: true,
  });
});

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (!notificationId.startsWith(VAULT_PREFIX)) return;
  const id = notificationId.slice(VAULT_PREFIX.length);
  await resolveEntry(id, buttonIndex === 0 ? "bought" : "released");
  chrome.notifications.clear(notificationId);
});

chrome.notifications.onClicked.addListener((notificationId) => {
  if (!notificationId.startsWith(VAULT_PREFIX)) return;
  chrome.tabs.create({ url: chrome.runtime.getURL("popup.html#ledger") });
  chrome.notifications.clear(notificationId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "fl:vault" && typeof message.id === "string") {
    chrome.alarms.create(`${VAULT_PREFIX}${message.id}`, { when: message.when });
    sendResponse({ ok: true });
    return;
  }
  if (message?.type === "fl:open") {
    const site = sender.tab?.url ? new URL(sender.tab.url).hostname : undefined;
    chrome.storage.local.set({ pendingContext: { site, at: Date.now() } }).then(async () => {
      try {
        // Chrome 127+: opens the real toolbar popup.
        await chrome.action.openPopup();
      } catch {
        // Fallback: open the Ledger in a small window next to the page.
        await chrome.windows.create({
          url: chrome.runtime.getURL("popup.html"),
          type: "popup",
          width: 400,
          height: 600,
        });
      }
      sendResponse({ ok: true });
    });
    return true;
  }
});
