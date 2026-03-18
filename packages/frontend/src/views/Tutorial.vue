<script setup lang="ts">
import ExtensionInstallationGuide from "@/components/tutorial/ExtensionInstallationGuide.vue";
import ConfigurationGuide from "@/components/tutorial/ConfigurationGuide.vue";
</script>

<template>
  <div class="h-full overflow-y-auto p-4">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-bold">
        <span class="fas fa-graduation-cap"></span> Tutorial
      </h1>
    </div>

    <ExtensionInstallationGuide />
    <ConfigurationGuide />
  </div>
</template>