<script setup lang="ts">
import Card from "primevue/card";
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";

const toast = useToast();
const autoRefreshInterval = ref(30); // Default 30 seconds

const saveAutoRefreshSetting = () => {
  if (autoRefreshInterval.value <= 0 || autoRefreshInterval.value >= 300) {
    toast.add({
      severity: "error",
      summary: "Invalid Value",
      detail: "Invalid Auto-refresh interval provided.",
      life: 3000
    })
    return;
  }
  localStorage.setItem('domloggerpp-auto-refresh-interval', autoRefreshInterval.value.toString());
  toast.add({
    severity: "success",
    summary: "Setting Saved",
    detail: `Auto-refresh interval set to ${autoRefreshInterval.value} seconds`,
    life: 3000
  });
};

const loadAutoRefreshSetting = () => {
  const saved = localStorage.getItem('domloggerpp-auto-refresh-interval');
  if (saved !== null) {
    const interval = parseInt(saved, 10);
    if (!isNaN(interval) && interval >= 0 && interval <= 300) {
      autoRefreshInterval.value = interval;
    }
  }
};

onMounted(() => {
  loadAutoRefreshSetting();
});
</script>

<template>
  <Card class="mb-6">
    <template #title>
      <div class="flex items-center gap-2">
        <span class="fas fa-sliders-h"></span>
        Configuration
      </div>
    </template>
    <template #content>
      <div class="space-y-4">
        <!-- Auto-Refresh Configuration -->
        <div class="space-y-3">
          <h3 class="font-semibold text-surface-200 dark:text-surface-300 border-b border-surface-700 dark:border-surface-600 pb-2">
            Dashboard Auto-Refresh Interval
          </h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-sm text-surface-300 dark:text-surface-400">Auto-refresh only activates when viewing the first page of findings (0 = disabled)</span>
              <div class="flex items-center gap-2">
                <div class="flex flex-col items-end gap-1">
                  <div class="flex items-center gap-2">
                    <input
                      v-model.number="autoRefreshInterval"
                      type="number"
                      min="0"
                      max="300"
                      step="5"
                      class="w-20 px-3 py-2 text-sm bg-surface-700 dark:bg-surface-600 border border-surface-600 dark:border-surface-500 rounded text-surface-200 dark:text-surface-300 focus:outline-none focus:ring-2 focus:ring-surface-500 dark:focus:ring-surface-400"
                      @change="saveAutoRefreshSetting"
                    />
                    <span class="text-sm text-surface-300 dark:text-surface-400">seconds</span>
                  </div>
                  <span class="text-xs text-surface-400 dark:text-surface-500">Range: 0-300</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>
