# Fortune Ledger

A privacy-first Chrome extension that offers a playful Warm Oracle fortune about an online purchase before checkout.

**Product promise:** A little perspective before checkout.

This scaffold is popup-only: no content scripts, background service worker, host permissions, or network access.

## Requirements

- [Node.js](https://nodejs.org/) 20 or later
- Google Chrome

## Install

Clone or download this repository, then install dependencies:

```bash
npm install
npm run icons
```

`npm run icons` generates accessible placeholder PNG icons in `public/icons/`.

## Build

Create the unpacked extension output in `dist/`:

```bash
npm run build
```

The build bundles the React popup and copies `public/manifest.json` and icons into `dist/`.

## Load unpacked in Chrome

1. Run `npm run build`.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked**.
5. Select the `dist/` folder from this project.

Click the Fortune Ledger toolbar icon to open the popup. You should see:

- **Fortune Ledger**
- **A little perspective before checkout.**

## Development

For local UI work with Vite:

```bash
npm run dev
```

Open the URL shown in the terminal to preview the popup markup in a browser tab. Reload the unpacked extension in Chrome after each production build to test the real popup.

## Permissions

The extension requests only the Chrome `storage` permission so future features can persist user preferences locally. No data leaves the device in this scaffold.

## Project structure

```text
Fortune_ledger/
├── public/
│   ├── manifest.json
│   └── icons/
├── scripts/
│   └── generate-icons.mjs
├── src/
│   └── popup/
├── popup.html
├── vite.config.ts
└── package.json
```
