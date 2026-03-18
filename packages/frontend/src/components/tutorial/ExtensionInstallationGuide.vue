<script setup lang="ts">
import Card from "primevue/card";
</script>

<template>
  <Card class="mb-6">
    <template #title>
      <div class="flex items-center gap-2">
        <span class="fas fa-download"></span>
        Installing the DOMLogger++ browser extension
      </div>
    </template>
    <template #content>
      <p class="text-gray-400 dark:text-surface-400 mb-4">
        Install the DOMLogger++ browser extension from your preferred browser store or get the source code from GitHub.
      </p>

      <div class="grid md:grid-cols-2 gap-3">
        <div class="flex items-start gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
          <div class="flex items-center justify-center w-8 h-8 bg-orange-600 rounded flex-shrink-0">
            <span class="fab fa-firefox-browser text-white text-sm"></span>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold">Firefox</h3>
            <a href="https://addons.mozilla.org/en-US/firefox/addon/domloggerpp" target="_blank" class="text-sm text-primary-600 hover:underline break-all">
              https://addons.mozilla.org/en-US/firefox/addon/domloggerpp
            </a>
          </div>
        </div>

        <div class="flex items-start gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
          <div class="flex items-center justify-center w-8 h-8 bg-blue-600 rounded flex-shrink-0">
            <span class="fab fa-chrome text-white text-sm"></span>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold">Chromium</h3>
            <a href="https://chromewebstore.google.com/detail/domlogger%2B%2B/lkpfjhmpbmpflldmdpdoabimdbaclolp" target="_blank" class="text-sm text-primary-600 hover:underline break-all">
              https://chromewebstore.google.com/detail/domlogger++/lkpfjhmpbmpflldmdpdoabimdbaclolp
            </a>
          </div>
        </div>

        <div class="flex items-start gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
          <div class="flex items-center justify-center w-8 h-8 bg-gray-800 rounded flex-shrink-0">
            <span class="fab fa-github text-white text-sm"></span>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold">GitHub</h3>
            <a href="https://github.com/kevin-mizu/domloggerpp" target="_blank" class="text-sm text-primary-600 hover:underline break-all">
              https://github.com/kevin-mizu/domloggerpp
            </a>
          </div>
        </div>

        <div class="flex items-start gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
          <div class="flex items-center justify-center w-8 h-8 bg-green-600 rounded flex-shrink-0">
            <span class="fas fa-graduation-cap text-white text-sm"></span>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold">Workshop</h3>
            <a href="http://domloggerpp-workshop.mizu.re:5173/" target="_blank" class="text-sm text-primary-600 hover:underline break-all">
              http://domloggerpp-workshop.mizu.re:5173/
            </a>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>
