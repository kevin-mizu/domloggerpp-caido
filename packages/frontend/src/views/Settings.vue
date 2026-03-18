<script setup lang="ts">
import Button from "primevue/button";
import { ref, onMounted, onUnmounted } from "vue";
import KeyboardShortcuts from "@/components/settings/KeyboardShortcuts.vue";
import Configuration from "@/components/settings/Configuration.vue";
import ProjectManagement from "@/components/settings/ProjectManagement.vue";

const projectManagementRef = ref<InstanceType<typeof ProjectManagement> | null>(null);

const handleKeyDown = (event: KeyboardEvent) => {
  // Reload projects
  if (event.ctrlKey && event.key === 'r') {
    event.preventDefault();
    projectManagementRef.value?.fetchProjects();
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
  <div class="h-full overflow-y-auto p-4">
    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-bold">
        <span class="fas fa-cog"></span> Settings
      </h1>
      <Button 
          icon="fas fa-arrows-rotate"
          class="bg-surface-900 dark:bg-surface-300 text-white dark:text-surface-900 border-surface-900 dark:border-surface-300 hover:bg-surface-800 dark:hover:bg-surface-200 focus:ring-surface-500 dark:focus:ring-surface-0"
          @click="projectManagementRef?.fetchProjects()" 
        />
    </div>

    <KeyboardShortcuts />
    <Configuration />
    <ProjectManagement ref="projectManagementRef" />
  </div>
</template>
