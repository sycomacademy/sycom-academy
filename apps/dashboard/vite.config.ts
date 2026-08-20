import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

// React must stay external in the server build, in both the Vite pass and the
// Nitro pass that re-bundles its output.
//
// React 19 ships CJS only. When it is inlined, the bundle carries its own copy of
// react.production.js while use-sync-external-store/shim — also CJS, pulled in by
// @base-ui/react and @tanstack/react-store — keeps a runtime require("react") that
// loads the copy on disk. Two module instances, two ReactSharedInternals, so the
// hook dispatcher is null during SSR and every render throws
// "Cannot read properties of null (reading 'useSyncExternalStore')".
//
// Externalising leaves exactly one copy: node resolves the ESM import and the CJS
// require to the same file, and shares one module cache between them.
const reactExternals = [/^react(\/|$)/, /^react-dom(\/|$)/];

export default defineConfig({
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
    dedupe: ["react", "react-dom"],
  },
  environments: {
    ssr: {
      resolve: {
        external: ["react", "react-dom"],
      },
    },
  },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro({
      preset: "node-server",
      rolldownConfig: { external: reactExternals },
    }),
    viteReact(),
  ],
});
