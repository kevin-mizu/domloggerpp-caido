import { defineConfig } from '@caido-community/dev';
import vue from '@vitejs/plugin-vue';
import tailwindcss from "tailwindcss";
// @ts-expect-error no declared types at this time
import tailwindPrimeui from "tailwindcss-primeui";
import tailwindCaido from "@caido/tailwindcss";
import path from "path";
import prefixwrap from "postcss-prefixwrap";

const id = "domloggerpp";
export default defineConfig({
  id,
  name: "DOMLogger++",
  description: "A browser extension that allows you to monitor, intercept, and debug JavaScript sinks based on customizable configurations. ",
  version: "1.0.0",
  author: {
    name: "Mizu",
    email: "kevin.mizu@protonmail.com",
    url: "https://mizu.re",
  },
  plugins: [
    {
      kind: "backend",
      id: "domloggerpp-backend",
      root: "packages/backend",
    },
    {
      kind: 'frontend',
      id: "domloggerpp-frontend",
      root: 'packages/frontend',
      backend: {
        id: "domloggerpp-backend",
      },
      vite: {
        plugins: [vue()],
        build: {
          rollupOptions: {
            external: [
              '@caido/frontend-sdk', 
              "@codemirror/autocomplete", 
              "@codemirror/commands", 
              "@codemirror/language", 
              "@codemirror/lint", 
              "@codemirror/search", 
              "@codemirror/state", 
              "@codemirror/view", 
              "@lezer/common", 
              "@lezer/highlight", 
              "@lezer/lr",
              "vue",
            ]
          }
        },
        resolve: {
          alias: [
            {
              find: "@",
              replacement: path.resolve(__dirname, "packages/frontend/src"),
            },
          ],
        },
        css: {
          postcss: {
            plugins: [
              // This plugin wraps the root element in a unique ID
              // This is necessary to prevent styling conflicts between plugins
              prefixwrap(`#plugin--${id}`),

              tailwindcss({
                corePlugins: {
                  preflight: false,
                },
                content: [
                  './packages/frontend/src/**/*.{vue,ts}',
                  './node_modules/@caido/primevue/dist/primevue.mjs'
                ],
                // Check the [data-mode="dark"] attribute on the <html> element to determine the mode
                // This attribute is set in the Caido core application
                darkMode: ["selector", '[data-mode="dark"]'],
                plugins: [

                  // This plugin injects the necessary Tailwind classes for PrimeVue components
                  tailwindPrimeui,

                  // This plugin injects the necessary Tailwind classes for the Caido theme
                  tailwindCaido,
                ],
              })
            ]
          }
        }
      }
    }
  ]
});