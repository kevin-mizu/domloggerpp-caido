<script setup lang="ts">
import Card from "primevue/card";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Button from "primevue/button";
import InputSwitch from "primevue/inputswitch";
import { reactive, ref, computed, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useSDK } from "@/plugins/sdk";
import type { UserPrompt } from "@/types";
import SearchInput from "@/components/dashboard/SearchInput.vue";

const toast = useToast();
const sdk = useSDK();

// Template variables for finding attributes
const templateVariables = [
  { key: '{sink}', description: 'JavaScript sink' },
  { key: '{href}', description: 'Page URL' },
  { key: '{frame}', description: 'Frame context' },
  { key: '{data}', description: 'Sink data' },
  { key: '{trace}', description: 'Stack trace' },
  { key: '{type}', description: 'Finding type' },
  { key: '{tag}', description: 'Finding tag' },
  { key: '{alert}', description: 'Alert status (true/false)' },
  { key: '{date}', description: 'Finding timestamp' },
  { key: '{dupKey}', description: 'Deduplication key' },
  { key: '{debug}', description: 'Debug key' },
];

// User Prompt + Condition Configuration
const userPrompts = reactive<UserPrompt[]>([]);
const isLoading = ref(false);

const selectedPrompt = ref<UserPrompt | undefined>(undefined);
const searchQuery = ref('');

// Load user prompts from backend
onMounted(async () => {
  await loadUserPrompts();
});

const loadUserPrompts = async () => {
  try {
    const result = await sdk.backend.getUserPrompts();
    if (result.success && result.prompts) {
      userPrompts.splice(0, userPrompts.length, ...result.prompts);
      if (userPrompts.length > 0 && !selectedPrompt.value) {
        selectedPrompt.value = userPrompts[0];
      }
    }
  } catch (error) {
    console.error('Failed to load user prompts:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load user prompts',
      life: 3000
    });
  }
};

// Filtered prompts based on search
const filteredPrompts = computed(() => {
  if (!searchQuery.value.trim()) {
    return userPrompts;
  }
  return userPrompts.filter(prompt => 
    prompt.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    prompt.condition.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const addUserPrompt = async () => {
  isLoading.value = true;
  
  try {
    const newPromptData = {
      name: 'New Prompt',
      condition: '',
      prompt: 'Enter your prompt here...',
      enabled: true
    };
    
    const result = await sdk.backend.createUserPrompt(newPromptData);
    
    if (result.success && result.prompt) {
      userPrompts.push(result.prompt);
      selectedPrompt.value = result.prompt;
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'New prompt created successfully',
        life: 3000
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: result.error || 'Failed to create prompt',
        life: 3000
      });
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create prompt',
      life: 3000
    });
  } finally {
    isLoading.value = false;
  }
};

const selectPrompt = (prompt: any) => {
  selectedPrompt.value = prompt;
};

const removeUserPrompt = async (id: number) => {
  if (!id) return;
  
  isLoading.value = true;
  
  try {
    const result = await sdk.backend.deleteUserPrompt(id);
    
    if (result.success) {
      const index = userPrompts.findIndex(p => p.id === id);
      if (index > -1) {
        userPrompts.splice(index, 1);
        if (selectedPrompt.value?.id === id) {
          selectedPrompt.value = userPrompts.length > 0 ? userPrompts[0] : undefined;
        }
      }
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Prompt deleted successfully',
        life: 3000
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: result.error || 'Failed to delete prompt',
        life: 3000
      });
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete prompt',
      life: 3000
    });
  } finally {
    isLoading.value = false;
  }
};

const saveUserPrompt = async (prompt: UserPrompt) => {
  if (!prompt.id) {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Prompt ID is required',
      life: 3000
    });
    return;
  }
  
  isLoading.value = true;
  
  try {
    const result = await sdk.backend.updateUserPrompt(prompt.id, {
      name: prompt.name.trim(),
      condition: prompt.condition.trim(),
      prompt: prompt.prompt.trim(),
      enabled: prompt.enabled
    });
    
    if (result.success && result.prompt) {
      // Update the prompt in the local array
      const index = userPrompts.findIndex(p => p.id === prompt.id);
      if (index > -1) {
        userPrompts[index] = result.prompt;
        selectedPrompt.value = result.prompt;
      }
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Prompt "${prompt.name}" saved successfully`,
        life: 3000
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: result.error || 'Failed to save prompt',
        life: 3000
      });
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to save prompt',
      life: 3000
    });
  } finally {
    isLoading.value = false;
  }
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Copied to clipboard',
    life: 3000
  });
};

const suggestionConfig = {
  globalObjects: [
    { 
      name: "sink", 
      description: "Sink object", 
      variables: [
        { name: "id", description: 'ID' },
        { name: "alert", description: 'alert' },
        { name: "tag", description: 'Custom tag' },
        { name: "type", description: 'Javascript type' },
        { name: "dupKey", description: 'Duplicate key' },
        { name: "debug", description: 'Debug key' },
        { name: "data", description: 'data' },
        { name: "date", description: 'Discovery date' },
        { name: "href", description: 'URL' },
        { name: "sink", description: 'Javascript sink' },
        { name: "frame", description: 'Execution frame' },
        { name: "favorite", description: 'Favorite' },
        { name: "trace", description: 'Stack trace' }
      ]
    },
  ],
  functions: [
    { name: "eq", description: "Equal" },
    { name: "ne", description: "Not equal" },
    { name: "cont", description: "Contain" },
    { name: "ncont", description: "Not contain" }
  ],
  operators: [
    { name: "AND", description: "Logical AND" },
    { name: "OR", description: "Logical OR" }
  ]
};
</script>

<template>
  <Card class="h-full">
    <template #title>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="fas fa-comments"></span>
          User Prompts
        </div>
        <Button
          label="Add Prompt"
          icon="fas fa-plus"
          size="small"
          :loading="isLoading"
          @click="addUserPrompt"
        />
      </div>
    </template>
    <template #content>
      <div class="h-full flex flex-col space-y-4">
        <p class="text-gray-400 dark:text-surface-400 mb-4">
          Define custom prompts that will be triggered based on specific conditions when findings are detected.
        </p>

        <div class="flex gap-4 flex-1 h-full">
          <!-- Left Panel - Prompt List -->
          <div class="w-1/4 border border-surface-600 rounded-lg p-4 flex flex-col">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold">Prompts</h3>
            </div>
            
            <!-- Search Bar -->
            <div class="mb-4">
              <InputText
                v-model="searchQuery"
                placeholder="Search prompts..."
                class="w-full"
              />
            </div>
            
            <div class="space-y-2 overflow-y-auto flex-1 max-h-80">
              <div
                v-for="prompt in filteredPrompts"
                :key="prompt.id"
                @click="selectPrompt(prompt)"
                class="w-full p-3 rounded-lg cursor-pointer transition-colors prompt-item"
                :style="{ backgroundColor: selectedPrompt?.id === prompt.id ? '#A1213F' : '#484c56' }"
              >
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 flex-1 min-w-0">
                      <InputSwitch
                        v-model="prompt.enabled"
                        @click.stop
                      />
                      <span class="font-medium text-sm truncate flex-1">{{ prompt.name }}</span>
                    </div>
                  <Button
                    icon="fas fa-trash"
                    severity="transparent"
                    size="small"
                    @click.stop="prompt.id && removeUserPrompt(prompt.id)"
                    :aria-label="`Remove prompt ${prompt.name}`"
                  />
                </div>
              </div>
              
              <!-- Empty state when no prompts match search -->
              <div v-if="filteredPrompts.length === 0 && searchQuery.trim()" class="text-center py-8 text-surface-500">
                <span class="fas fa-search text-2xl mb-2 block"></span>
                <p class="text-sm">No prompts found matching "{{ searchQuery }}"</p>
              </div>
            </div>
          </div>

          <!-- Right Panel - Edit Form with Helper Table -->
          <div class="flex-1 border border-surface-600 rounded-lg p-4 flex flex-col">
            <div v-if="selectedPrompt" class="h-full flex gap-4">
              <!-- Edit Form -->
              <div class="flex-1 flex flex-col">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-semibold">Edit Prompt</h3>
                  <Button
                    label="Save"
                    icon="fas fa-save"
                    size="small"
                    :loading="isLoading"
                    @click="saveUserPrompt(selectedPrompt)"
                  />
                </div>

                <div class="flex-1 flex flex-col space-y-4">
                  <!-- Prompt Name -->
                  <div>
                    <label class="block text-sm font-medium mb-2">Name</label>
                    <InputText
                      v-model="selectedPrompt.name"
                      placeholder="Prompt name"
                      class="w-full"
                    />
                  </div>

                  <!-- Condition -->
                  <div>
                    <label class="block text-sm font-medium mb-2">Condition</label>
                    <div class="space-y-2">
                      <SearchInput
                        v-model="selectedPrompt.condition"
                        placeholder="sink.field.operator:&quot;value&quot;"
                        class="w-full"
                        :suggestion-config="suggestionConfig"
                      />
                    </div>
                  </div>

                  <!-- User Prompt -->
                  <div class="flex-1 flex flex-col">
                    <label class="block text-sm font-medium mb-2">User Prompt</label>
                    <Textarea
                      v-model="selectedPrompt.prompt"
                      rows="8"
                      placeholder="Enter the prompt to send to AI when condition is met... For instance:&#10;&#10;URL: {href}&#10;Type: {type}&#10;Sink: {sink}&#10;Data: {data}&#10;Trace: {trace}"
                      class="w-full"
                    />
                  </div>
                </div>
              </div>

              <!-- Helper Table -->
              <div class="w-80 border-l border-surface-600 pl-4 flex flex-col">
                <h4 class="font-semibold mb-3">Variables</h4>
                <div class="space-y-1 overflow-y-auto flex-1 text-sm">
                  <div
                    v-for="variable in templateVariables"
                    :key="variable.key"
                    class="py-1"
                  >
                    <span 
                    class="cursor-pointer font-bold text-primary-600 hover:underline"
                    @click="copyToClipboard(variable.key)"
                    >{{ variable.key }}</span>
                    <span class="ml-2 text-gray-400 dark:text-surface-400">{{ variable.description }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="h-full flex items-center justify-center text-surface-500">
              <div class="text-center">
                <span class="fas fa-comments text-4xl mb-4 block"></span>
                <p>No prompt selected</p>
                <p class="text-sm">Select a prompt from the list or create a new one</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>