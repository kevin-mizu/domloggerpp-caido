<script setup lang="ts">
import Card from "primevue/card";
</script>

<template>
  <Card class="mb-6">
    <template #title>
      <div class="flex items-center gap-2">
        <span class="fas fa-keyboard"></span>
        Keyboard Shortcuts
      </div>
    </template>
    <template #content>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Group 1: Search & Suggestions -->
        <div class="space-y-3">
          <h3 class="font-semibold text-surface-200 dark:text-surface-300 border-b border-surface-700 dark:border-surface-600 pb-2">
            Search & Suggestions
          </h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-sm text-surface-300 dark:text-surface-400">Focus Search Input</span>
              <kbd class="px-2 py-1 text-xs font-mono bg-surface-700 dark:bg-surface-600 text-surface-200 dark:text-surface-300 rounded border border-surface-600 dark:border-surface-500">Ctrl + F</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-surface-300 dark:text-surface-400">Exit Search Input</span>
              <kbd class="px-2 py-1 text-xs font-mono bg-surface-700 dark:bg-surface-600 text-surface-200 dark:text-surface-300 rounded border border-surface-600 dark:border-surface-500">Esc</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-surface-300 dark:text-surface-400">Navigate Suggestions</span>
              <kbd class="px-2 py-1 text-xs font-mono bg-surface-700 dark:bg-surface-600 text-surface-200 dark:text-surface-300 rounded border border-surface-600 dark:border-surface-500">↑ ↓</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-surface-300 dark:text-surface-400">Apply Suggestion</span>
              <kbd class="px-2 py-1 text-xs font-mono bg-surface-700 dark:bg-surface-600 text-surface-200 dark:text-surface-300 rounded border border-surface-600 dark:border-surface-500">Tab / Enter</kbd>
            </div>
          </div>
        </div>

        <!-- Group 2: Table Navigation -->
        <div class="space-y-3">
          <h3 class="font-semibold text-surface-200 dark:text-surface-300 border-b border-surface-700 dark:border-surface-600 pb-2">
            Table Navigation
          </h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-sm text-surface-300 dark:text-surface-400">Navigate Between Findings</span>
              <kbd class="px-2 py-1 text-xs font-mono bg-surface-700 dark:bg-surface-600 text-surface-200 dark:text-surface-300 rounded border border-surface-600 dark:border-surface-500">↑ ↓</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-surface-300 dark:text-surface-400">Previous/Next Page</span>
              <kbd class="px-2 py-1 text-xs font-mono bg-surface-700 dark:bg-surface-600 text-surface-200 dark:text-surface-300 rounded border border-surface-600 dark:border-surface-500">Ctrl + ← →</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-surface-300 dark:text-surface-400">Scroll Table Up/Down</span>
              <kbd class="px-2 py-1 text-xs font-mono bg-surface-700 dark:bg-surface-600 text-surface-200 dark:text-surface-300 rounded border border-surface-600 dark:border-surface-500">Ctrl + ↑ ↓</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-surface-300 dark:text-surface-400">Select/Unselect All Findings</span>
              <kbd class="px-2 py-1 text-xs font-mono bg-surface-700 dark:bg-surface-600 text-surface-200 dark:text-surface-300 rounded border border-surface-600 dark:border-surface-500">Ctrl + A</kbd>
            </div>
          </div>
        </div>

        <!-- Group 3: Actions -->
        <div class="space-y-3">
          <h3 class="font-semibold text-surface-200 dark:text-surface-300 border-b border-surface-700 dark:border-surface-600 pb-2">
            Actions
          </h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-sm text-surface-300 dark:text-surface-400">Refresh Data</span>
              <kbd class="px-2 py-1 text-xs font-mono bg-surface-700 dark:bg-surface-600 text-surface-200 dark:text-surface-300 rounded border border-surface-600 dark:border-surface-500">Ctrl + R</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-surface-300 dark:text-surface-400">Export/Download Findings</span>
              <kbd class="px-2 py-1 text-xs font-mono bg-surface-700 dark:bg-surface-600 text-surface-200 dark:text-surface-300 rounded border border-surface-600 dark:border-surface-500">Ctrl + S</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-surface-300 dark:text-surface-400">Delete Findings</span>
              <kbd class="px-2 py-1 text-xs font-mono bg-surface-700 dark:bg-surface-600 text-surface-200 dark:text-surface-300 rounded border border-surface-600 dark:border-surface-500">Ctrl + Backspace</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-surface-300 dark:text-surface-400">Toggle Recording</span>
              <kbd class="px-2 py-1 text-xs font-mono bg-surface-700 dark:bg-surface-600 text-surface-200 dark:text-surface-300 rounded border border-surface-600 dark:border-surface-500">Ctrl + Space</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-surface-300 dark:text-surface-400">Send to AI</span>
              <kbd class="px-2 py-1 text-xs font-mono bg-surface-700 dark:bg-surface-600 text-surface-200 dark:text-surface-300 rounded border border-surface-600 dark:border-surface-500">Ctrl + I</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-surface-300 dark:text-surface-400">Enhance Stack Trace</span>
              <kbd class="px-2 py-1 text-xs font-mono bg-surface-700 dark:bg-surface-600 text-surface-200 dark:text-surface-300 rounded border border-surface-600 dark:border-surface-500">Ctrl + T</kbd>
            </div>
          </div>
        </div>

        <!-- Group 4: Menu -->
        <div class="space-y-3">
          <h3 class="font-semibold text-surface-200 dark:text-surface-300 border-b border-surface-700 dark:border-surface-600 pb-2">
            Menu
          </h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-sm text-surface-300 dark:text-surface-400">Go to Dashboard</span>
              <kbd class="px-2 py-1 text-xs font-mono bg-surface-700 dark:bg-surface-600 text-surface-200 dark:text-surface-300 rounded border border-surface-600 dark:border-surface-500">Alt + 1</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-surface-300 dark:text-surface-400">Go to AI</span>
              <kbd class="px-2 py-1 text-xs font-mono bg-surface-700 dark:bg-surface-600 text-surface-200 dark:text-surface-300 rounded border border-surface-600 dark:border-surface-500">Alt + 2</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-surface-300 dark:text-surface-400">Go to Tutorial</span>
              <kbd class="px-2 py-1 text-xs font-mono bg-surface-700 dark:bg-surface-600 text-surface-200 dark:text-surface-300 rounded border border-surface-600 dark:border-surface-500">Alt + 3</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-surface-300 dark:text-surface-400">Go to Settings</span>
              <kbd class="px-2 py-1 text-xs font-mono bg-surface-700 dark:bg-surface-600 text-surface-200 dark:text-surface-300 rounded border border-surface-600 dark:border-surface-500">Alt + 4</kbd>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>
