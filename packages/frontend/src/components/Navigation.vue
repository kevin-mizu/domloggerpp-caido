<script setup lang="ts">
import Button from "primevue/button";
import Toast from "primevue/toast";
import { ref, onMounted, onUnmounted } from "vue";

import Dashboard from "@/views/Dashboard.vue";
import AI from "@/views/AI.vue";
import Tutorial from "@/views/Tutorial.vue";
import Settings from "@/views/Settings.vue";

const activeTab = ref(0);

const tabs = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    component: Dashboard,
    icon: 'fas fa-chart-line'
  },
  {
    id: 'ai',
    label: 'AI',
    component: AI,
    icon: 'fas fa-robot'
  },
  {
    id: 'tutorial',
    label: 'Tutorial',
    component: Tutorial,
    icon: 'fas fa-graduation-cap'
  },
  {
    id: 'settings',
    label: 'Settings',
    component: Settings,
    icon: 'fas fa-cog'
  }
];

const setActiveTab = (index: number) => {
  activeTab.value = index;
};

const handleKeyDown = (event: KeyboardEvent) => {
  // ALT + number shortcuts for navigation
  if (event.altKey && !event.ctrlKey && !event.shiftKey) {
    const code = event.code;
    if (code === 'Digit1' || code === 'Digit2' || code === 'Digit3' || code === 'Digit4') {
      event.preventDefault();
      const tabIndex = parseInt(code.replace('Digit', '')) - 1;
      if (tabIndex < tabs.length) {
        setActiveTab(tabIndex);
      }
    }
  }
};

const openLink = (url: string) => {
  if ((window as any).__CAIDO_DESKTOP__ !== undefined) {
    (window as any).__CAIDO_DESKTOP__.openInBrowser(url);
  } else {
    window.open(url, '_blank');
  }
};

onMounted(() => {
  // Add keyboard event listener
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  // Remove keyboard event listener
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <Toast />

  <div class="h-full flex flex-col">
    <!-- Compact Horizontal Navigation Bar -->
    <div class="bg-surface-800 dark:bg-surface-200 border-b border-surface-700 dark:border-surface-600 px-4 py-2 flex-shrink-0">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="cursor-pointer flex items-center gap-2" @click="openLink('https://github.com/kevin-mizu/domloggerpp')">
            <span class="fas fa-search text-lg text-orange-600"></span>
            <h1 class="text-base font-semibold text-white-600 dark:text-white-600 mr-4">DOMLogger++</h1>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex gap-1">
            <Button
              v-for="(tab, index) in tabs"
              :key="tab.id"
              :icon="tab.icon"
              :label="tab.label"
              :severity="activeTab === index ? 'primary' : 'secondary'"
              size="small"
              @click="setActiveTab(index)"
              :class="[
                activeTab === index 
                  ? 'bg-primary-700 border-primary-700 hover:bg-primary-600/80 hover:border-primary-600/80' 
                  : 'bg-surface-700 dark:bg-surface-300 border-surface-600 dark:border-surface-400 hover:bg-surface-600 dark:hover:bg-surface-200'
              ]"
            />
          </div>
        </div>

        <!-- Star on GitHub Button -->
        <Button
          icon="fas fa-star"
          label="Star on GitHub"
          size="small"
          severity="contrast"
          @click="openLink('https://github.com/kevin-mizu/domloggerpp-caido')"
          class="bg-surface-700 dark:bg-surface-300 border-surface-600 dark:border-surface-400 hover:bg-surface-600 dark:hover:bg-surface-200 text-orange-600"
        />
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 overflow-hidden">
      <component :is="tabs[activeTab]?.component" />
    </div>
  </div>
</template>
