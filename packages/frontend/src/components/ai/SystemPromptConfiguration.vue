<script setup lang="ts">
import Card from "primevue/card";
import Textarea from "primevue/textarea";
import Button from "primevue/button";
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useSDK } from "@/plugins/sdk";


const toast = useToast();
const sdk = useSDK();

// System Prompt Configuration
const systemPrompt = ref("");
const isLoading = ref(false);

// Load AI configuration on mount
onMounted(async () => {
  await loadAIConfig();
});

const loadAIConfig = async () => {
  try {
    const result = await sdk.backend.getAIConfig();
    if (result.success && result.config) {
      systemPrompt.value = result.config.system_prompt || systemPrompt.value;
    }
  } catch (error) {
    console.error('Failed to load AI config:', error);
  }
};

const saveSystemPrompt = async () => {
  isLoading.value = true;
  
  try {
    const result = await sdk.backend.updateSystemPrompt(systemPrompt.value.trim());
    
    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'System prompt saved successfully',
        life: 3000
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: result.error || 'Failed to save system prompt',
        life: 3000
      });
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to save system prompt',
      life: 3000
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <Card class="h-full">
    <template #title>
      <div class="flex items-center gap-2">
        <span class="fas fa-cog"></span>
        System Prompt
      </div>
    </template>
    <template #content>
      <div class="space-y-4">
        <p class="text-gray-400 dark:text-surface-400 mb-4">
          Define how the AI will respond to findings. Updating it may break the functionality.
        </p>
        
        <Textarea
          v-model="systemPrompt"
          rows="12"
          placeholder="Enter the system prompt that defines the AI's role..."
          class="w-full"
        />
        
        <div class="flex justify-end">
          <Button
            label="Save System Prompt"
            icon="fas fa-save"
            :loading="isLoading"
            @click="saveSystemPrompt"
          />
        </div>
      </div>
    </template>
  </Card>
</template>
