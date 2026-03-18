<script setup lang="ts">
import Card from "primevue/card";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import InputSwitch from "primevue/inputswitch";
import Slider from "primevue/slider";
import { ref, onMounted, computed, onUnmounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useSDK } from "@/plugins/sdk";
import type { AIModel } from "@/types";


const toast = useToast();
const sdk = useSDK();

// OpenRouter API Key Configuration
const openAiKey = ref('');
const storedApiKey = ref('');
const isKeyVisible = ref(false);
const isLoading = ref(false);
const aiEnabled = ref(true);
const selectedModel = ref('openai/gpt-3.5-turbo');
const availableModels = ref<AIModel[]>([]);
const groupedModels = ref<Record<string, AIModel[]>>({});
const isLoadingModels = ref(false);
const isModelDropdownOpen = ref(false);
const modelSearchQuery = ref('');
const temperature = ref(0.7);
const threadCount = ref(1);
let temperatureUpdateTimeout: ReturnType<typeof setTimeout> | null = null;

// Computed properties
const isApiKeyValid = computed(() => {
  return storedApiKey.value && storedApiKey.value.trim() !== '';
});

const filteredGroupedModels = computed(() => {
  if (!modelSearchQuery.value.trim()) {
    return groupedModels.value;
  }
  
  const filtered: Record<string, AIModel[]> = {};
  const query = modelSearchQuery.value.toLowerCase();
  
  Object.keys(groupedModels.value).forEach(provider => {
    const models = groupedModels.value[provider];
    if (models) {
      const filteredModels = models.filter(model => 
        model.name.toLowerCase().includes(query) || 
        model.id.toLowerCase().includes(query)
      );
      if (filteredModels.length > 0) {
        filtered[provider] = filteredModels;
      }
    }
  });
  
  return filtered;
});

const selectedModelInfo = computed(() => {
  return availableModels.value.find(model => model.id === selectedModel.value);
});

// Load AI configuration on mount
onMounted(async () => {
  await loadAIConfig();
  
  // Add click outside handler for dropdown
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.model-dropdown-container')) {
    closeModelDropdown();
  }
};

const loadAIConfig = async () => {
  try {
    const result = await sdk.backend.getAIConfig();
    if (result.success && result.config) {
      openAiKey.value = result.config.openrouter_api_key || '';
      storedApiKey.value = result.config.openrouter_api_key || '';
      aiEnabled.value = result.config.ai_enabled ?? true;
      selectedModel.value = result.config.selected_model || 'openai/gpt-3.5-turbo';
      temperature.value = result.config.temperature ?? 0.7;
      threadCount.value = result.config.thread_count ?? 1;

      if (storedApiKey.value && storedApiKey.value.trim() !== '') {
        await loadAvailableModels();
      }
    }
  } catch (error) {
    console.error('Failed to load AI config:', error);
  }
};

// Methods
const toggleKeyVisibility = () => {
  isKeyVisible.value = !isKeyVisible.value;
};

const loadAvailableModels = async () => {
  if (!storedApiKey.value || storedApiKey.value.trim() === '') {
    availableModels.value = [];
    groupedModels.value = {};
    return;
  }

  isLoadingModels.value = true;
  
  try {
    const result = await sdk.backend.getAIModels();
    
    if (result.success && result.models) {
      availableModels.value = result.models;
      groupModelsByProvider(result.models);
    } else {
      availableModels.value = [];
      groupedModels.value = {};
      toast.add({
        severity: 'warn',
        summary: 'Warning',
        detail: result.error || 'Failed to load available models',
        life: 3000
      });
    }
  } catch (error) {
    availableModels.value = [];
    groupedModels.value = {};
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load available models',
      life: 3000
    });
  } finally {
    isLoadingModels.value = false;
  }
};

/* ***************************************************** */
/* ****************** MODEL **************************** */
/* ***************************************************** */
const groupModelsByProvider = (models: AIModel[]) => {
  const grouped: Record<string, AIModel[]> = {};
  
  models.forEach(model => {
    const provider = getProviderFromId(model.id);
    if (!grouped[provider]) {
      grouped[provider] = [];
    }
    grouped[provider].push(model);
  });
  
  // Sort models within each provider by name
  Object.keys(grouped).forEach(provider => {
    const models = grouped[provider];
    if (models) {
      models.sort((a, b) => a.name.localeCompare(b.name));
    }
  });
  
  groupedModels.value = grouped;
};

const getProviderFromId = (id: string): string => {
  if (id.startsWith('openai/')) return 'OpenAI';
  if (id.startsWith('anthropic/')) return 'Anthropic';
  if (id.startsWith('google/')) return 'Google';
  if (id.startsWith('deepseek/')) return 'DeepSeek';
  if (id.startsWith('x-ai/')) return 'xAI';
  if (id.startsWith('qwen/')) return 'Qwen';
  return 'Other';
};

const getProviderIcon = (provider: string): string => {
  const icons: Record<string, string> = {
    'OpenAI': 'fas fa-brain',
    'Anthropic': 'fas fa-robot',
    'Google': 'fab fa-google',
    'DeepSeek': 'fas fa-water',
    'xAI': 'fas fa-rocket',
    'Qwen': 'fas fa-arrows-up-down-left-right',
    'Other': 'fas fa-cog'
  };
  return icons[provider] || 'fas fa-cog';
};

const formatPricingPerMillion = (pricing: { prompt: string; completion: string }): string => {
  const promptPrice = parseFloat(pricing.prompt);
  const completionPrice = parseFloat(pricing.completion);

  if (isNaN(promptPrice) || isNaN(completionPrice)) return 'N/A';

  const promptPerMillion = (promptPrice * 1000000).toFixed(2);
  const completionPerMillion = (completionPrice * 1000000).toFixed(2);

  return `$${promptPerMillion}/M | $${completionPerMillion}/M`;
};

const toggleModelDropdown = () => {
  if (isApiKeyValid.value) {
    isModelDropdownOpen.value = !isModelDropdownOpen.value;
  }
};

const selectModel = (modelId: string) => {
  selectedModel.value = modelId;
  isModelDropdownOpen.value = false;
  updateSelectedModel();
};

const closeModelDropdown = () => {
  isModelDropdownOpen.value = false;
};
const updateSelectedModel = async () => {
  isLoading.value = true;
  
  try {
    const result = await sdk.backend.updateSelectedModel(selectedModel.value);
    
    if (!result.success) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: result.error || 'Failed to update selected model',
        life: 3000
      });
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update selected model',
      life: 3000
    });
  } finally {
    isLoading.value = false;
  }
};

const toggleAIEnabled = async () => {
  isLoading.value = true;
  
  try {
    const result = await sdk.backend.updateAIEnabled(aiEnabled.value);
    
    if (!result.success) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: result.error || 'Failed to update AI enabled status',
        life: 3000
      });
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update AI enabled status',
      life: 3000
    });
  } finally {
    isLoading.value = false;
  }
};

/* ***************************************************** */
/* ****************** API KEY ************************** */
/* ***************************************************** */
const saveOpenAiKey = async () => {
  isLoading.value = true;
  
  try {
    const result = await sdk.backend.updateOpenAIKey(openAiKey.value.trim());
    
    if (result.success) {
      storedApiKey.value = openAiKey.value.trim();

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'OpenRouter API key saved successfully',
        life: 3000
      });

      if (openAiKey.value && openAiKey.value.trim() !== '') {
        await loadAvailableModels();
      } else {
        availableModels.value = [];
      }
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: result.error || 'Failed to save OpenRouter API key',
        life: 3000
      });
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to save OpenRouter API key',
      life: 3000
    });
  } finally {
    isLoading.value = false;
  }
};

/* ***************************************************** */
/* ****************** TEMPERATURE ********************* */
/* ***************************************************** */
const updateTemperatureValue = async () => {
  if (temperatureUpdateTimeout) {
    clearTimeout(temperatureUpdateTimeout);
  }

  temperatureUpdateTimeout = setTimeout(async () => {
    isLoading.value = true;

    try {
      const result = await sdk.backend.updateTemperature(temperature.value);
      
      if (!result.success) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: result.error || 'Failed to update temperature',
          life: 3000
        });
      }
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update temperature',
        life: 3000
      });
    } finally {
      isLoading.value = false;
    }
  }, 500);
};

/* ***************************************************** */
/* ****************** THREAD *************************** */
/* ***************************************************** */
const updateThreadCountValue = async () => {
  isLoading.value = true;
  
  try {
    const result = await sdk.backend.updateThreadCount(threadCount.value);

    if (!result.success) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: result.error || 'Failed to update thread count',
        life: 3000
      });
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update thread count',
      life: 3000
    });
  } finally {
    isLoading.value = false;
  }
};

/* ***************************************************** */
/* ****************** TEST ***************************** */
/* ***************************************************** */
const testAIConfiguration = async () => {
  if (!storedApiKey.value || storedApiKey.value.trim() === '') {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Please enter and save an API key first',
      life: 3000
    });
    return;
  }

  isLoading.value = true;

  try {
    const result = await sdk.backend.testAiConfiguration({});
    
    if (result.success && result.response) {
      toast.add({
        severity: 'success',
        summary: 'Test Successful',
        detail: `AI Response: ${result.response.substring(0, 100)}${result.response.length > 100 ? '...' : ''}`,
        life: 5000
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Test Failed',
        detail: result.error || 'Failed to get response from AI',
        life: 5000
      });
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Test Failed',
      detail: 'Failed to test AI configuration',
      life: 5000
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
        <span class="fas fa-brain mr-2"></span>
        OpenRouter Configuration
      </div>
    </template>
    <template #content>
      <div class="space-y-4">
        <p class="text-gray-400 dark:text-surface-400 mb-4">
          Configure your OpenRouter API key, and select the model to use.
        </p>
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <InputText
              v-model="openAiKey"
              :type="isKeyVisible ? 'text' : 'password'"
              placeholder="Enter your OpenRouter API key (sk-or-...)"
              class="w-full"
            />
          </div>
          <Button
            :icon="isKeyVisible ? 'fas fa-eye-slash' : 'fas fa-eye'"
            severity="secondary"
            @click="toggleKeyVisibility"
            :aria-label="isKeyVisible ? 'Hide key' : 'Show key'"
          />
          <Button
            label="Save"
            icon="fas fa-save"
            :loading="isLoading"
            @click="saveOpenAiKey"
          />
        </div>
      </div>
      
      <!-- Model Selection -->
      <div class="mb-5 pt-5">
        <div class="flex items-center gap-3">
          <div class="flex-1 relative model-dropdown-container">
            <!-- Custom Model Selector -->
            <div 
              class="w-full p-3 border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-0 dark:bg-surface-900 cursor-pointer hover:border-primary-500 transition-colors"
              :class="{ 'opacity-50 cursor-not-allowed': !isApiKeyValid }"
              @click="toggleModelDropdown"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i v-if="selectedModelInfo" :class="getProviderIcon(getProviderFromId(selectedModelInfo.id))" class="text-sm"></i>
                  <span v-if="selectedModelInfo" class="text-surface-900 dark:text-surface-0">{{ selectedModelInfo.name }}</span>
                  <span v-else class="text-surface-500">{{ isApiKeyValid ? 'Select a model' : 'Enter API key to select the model' }}</span>
                </div>
                <i class="fas fa-chevron-down text-xs transition-transform" :class="{ 'rotate-180': isModelDropdownOpen }"></i>
              </div>
            </div>

            <!-- Custom Dropdown -->
            <div 
              v-if="isModelDropdownOpen" 
              class="absolute top-full left-0 right-0 mt-1 bg-surface-0 dark:bg-surface-900 border border-surface-300 dark:border-surface-600 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden"
            >
              <!-- Search Bar -->
              <div class="p-3 border-b border-surface-200 dark:border-surface-700">
                <div class="relative">
                  <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-surface-400 text-sm"></i>
                  <input
                    v-model="modelSearchQuery"
                    type="text"
                    placeholder="Search models..."
                    class="w-full pl-9 pr-3 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    @click.stop
                  />
                </div>
              </div>

              <!-- Model List -->
              <div class="max-h-64 overflow-y-auto">
                <div v-for="(models, provider) in filteredGroupedModels" :key="provider" class="border-b border-surface-200 dark:border-surface-700 last:border-b-0">
                  <!-- Provider Header -->
                  <div class="px-3 py-2 bg-surface-100 dark:bg-surface-800 text-sm font-medium text-surface-700 dark:text-surface-300 flex items-center gap-2">
                    <i :class="getProviderIcon(provider)" class="text-sm"></i>
                    {{ provider }}
                  </div>
                  
                  <!-- Models -->
                  <div v-for="model in models" :key="model.id" 
                       class="px-3 py-2 hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer transition-colors flex items-center justify-between"
                       :class="{ 'bg-primary-50 dark:bg-primary-900/20': selectedModel === model.id }"
                       @click="selectModel(model.id)">
                    <div class="flex items-center gap-2">
                      <i :class="getProviderIcon(provider)" class="text-sm text-surface-500"></i>
                      <span class="text-sm text-surface-900 dark:text-surface-0">{{ model.name }}</span>
                    </div>
                    <span class="text-xs text-surface-500">
                      {{ formatPricingPerMillion(model.pricing || { prompt: '0', completion: '0' }) }}
                    </span>
                  </div>
                </div>
                
                <!-- No Results -->
                <div v-if="Object.keys(filteredGroupedModels).length === 0" class="px-3 py-4 text-center text-surface-500 text-sm">
                  No models found
                </div>
              </div>
            </div>
          </div>
          <Button
            icon="fas fa-sync"
            severity="secondary"
            @click="loadAvailableModels"
            :loading="isLoadingModels"
            :disabled="!storedApiKey || storedApiKey.trim() === ''"
            v-tooltip="'Refresh models'"
          />
        </div>
      </div>

      <!-- Temperature Selection -->
      <div class="mb-4">
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <label class="block text-sm text-surface-400 mb-2">Temperature: {{ temperature }}</label>
            <Slider
              v-model="temperature"
              :min="0"
              :max="2"
              :step="0.1"
              class="w-full"
              @change="updateTemperatureValue"
            />
            <div class="flex justify-between text-xs text-surface-500 mt-1">
              <span>More focused (0.0)</span>
              <span>More creative (2.0)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Enabled Toggle and Thread Count -->
      <div class="mb-4">
        <div class="flex items-center gap-3">
          <div class="flex-1 p-3 bg-surface-700 rounded-lg">
            <div class="flex items-center justify-between">
              <div style="color: #C5D2D4;">Toggle AI-powered analysis</div>
              <InputSwitch 
                v-model="aiEnabled" 
                @change="toggleAIEnabled"
                :disabled="isLoading"
              />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-sm text-surface-400 whitespace-nowrap">Threads:</label>
            <InputText
              v-model.number="threadCount"
              type="number"
              :min="1"
              :max="10"
              class="w-16"
              @change="updateThreadCountValue"
              :disabled="isLoading"
            />
          </div>
        </div>
      </div>

      <!-- Test AI Configuration -->
      <div class="mb-4 flex justify-center">
        <Button
          label="Test Configuration"
          icon="fas fa-comment"
          @click="testAIConfiguration"
          :loading="isLoading"
          :disabled="!storedApiKey || storedApiKey.trim() === ''"
        />
      </div>
    </template>
  </Card>
</template>
