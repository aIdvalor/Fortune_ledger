// Content scripts cannot be ES modules, so bundle the content script and the
// service worker as single IIFE files with esbuild (already a Vite dependency).
import { build } from "esbuild";

await Promise.all(
  [
    ["src/content/content.ts", "dist/content.js"],
    ["src/background/background.ts", "dist/background.js"],
  ].map(([entry, outfile]) =>
    build({ entryPoints: [entry], outfile, bundle: true, format: "iife", target: "chrome120", minify: true }),
  ),
);
console.log("built content.js and background.js");
