// Bundles the extension for VS Code. Plain JS API call: no shell quoting, so it runs the same on Windows.
import { build } from "esbuild";

await build({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  external: ["vscode"],
  outfile: "dist/extension.js",
  minify: true,
  // The SDK reads import.meta.url; CJS output has none, so supply it from __filename.
  define: { "import.meta.url": "__importMetaUrl" },
  banner: { js: 'var __importMetaUrl = require("url").pathToFileURL(__filename).href;' },
  logLevel: "warning",
});
