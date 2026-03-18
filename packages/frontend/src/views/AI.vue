<script setup lang="ts">
import Toast from 'primevue/toast';
import OpenAIConfiguration from '@/components/ai/OpenAIConfiguration.vue';
import SystemPromptConfiguration from '@/components/ai/SystemPromptConfiguration.vue';
import UserPromptsConfiguration from '@/components/ai/UserPromptsConfiguration.vue';
</script>

<template>
  <div class="h-full overflow-y-auto p-4">
    <Toast />
    
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-bold">
        <span class="fas fa-robot"></span> AI
      </h1>
    </div>

    <!-- API Key and System Prompt on same row -->
    <div class="flex gap-6 mb-6">
      <div class="flex-1">
        <OpenAIConfiguration />
      </div>
      <div class="flex-1">
        <SystemPromptConfiguration />
      </div>
    </div>

    <!-- User Prompts takes full height -->
    <div class="flex-1">
      <UserPromptsConfiguration />
    </div>
  </div>
</template>
