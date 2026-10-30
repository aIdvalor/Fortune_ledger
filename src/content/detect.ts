// Pure checkout detection. Reads only the URL plus a few well-known button/meta
// selectors. No page text, prices, or personal data are read or stored.

export type CheckoutKind = "amazon" | "shopify" | "generic" | null;

const AMAZON_HOST = /(^|\.)amazon\.(com|ca|co\.uk|de|fr|es|it|com\.au|co\.jp|in)$/;
const AMAZON_PATH = /^\/(gp\/buy|checkout|gp\/cart|cart)(\/|$)|^\/gp\/aw\/c\b|^\/gp\/aws\/cart/;
const GENERIC_PATH = /(^|\/)(checkouts?|cart|basket|bag)(\/|$|\?)/i;

export function detectCheckout(url: URL, doc?: Document): CheckoutKind {
  const host = url.hostname;
  const path = url.pathname;
  if (AMAZON_HOST.test(host)) {
    if (AMAZON_PATH.test(path)) return "amazon";
    if (doc?.querySelector("#submitOrderButtonId, input[name='placeYourOrder1']")) return "amazon";
    return null;
  }
  const isShopify =
    host.endsWith(".myshopify.com") ||
    host === "checkout.shopify.com" ||
    host === "shop.app" ||
    !!doc?.querySelector("meta[name='shopify-checkout-api-token'], link[href*='cdn.shopify.com']");
  if (isShopify && /^\/(cart|checkouts?)(\/|$)|\/checkouts\//.test(path)) return "shopify";
  if (GENERIC_PATH.test(path)) return "generic";
  return null;
}
