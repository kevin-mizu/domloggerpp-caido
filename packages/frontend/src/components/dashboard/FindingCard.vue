<script setup lang="ts">
import CustomSplitter from '@/components/dashboard/CustomSplitter.vue';
import { useToast } from 'primevue/usetoast';
import { useSDK } from "@/plugins/sdk";
import { Finding } from "@/types";
import { ref, computed, onMounted, watch } from "vue";
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import { js as beautifyJs, html as beautifyHtml, css as beautifyCss } from 'js-beautify';

interface FindingCardProps {
  selectedFinding: Finding | null;
  onFilterClick: (event: Event|null, type: string, value: string) => void;
  onFindingUpdate?: (finding: Finding) => void;
}

const props = defineProps<FindingCardProps>();
const emit = defineEmits<{
  'finding-update': [finding: Finding];
}>();

const toast = useToast();
const sdk = useSDK();
const isUpdatingFavorite = ref(false);

const BETTER_TRACE_MARKER = '--- BETTER TRACE ---\n';

// Check if trace has been enhanced
const isTraceEnhanced = computed(() => {
  if (!props.selectedFinding?.trace) return false;
  return props.selectedFinding.trace.startsWith(BETTER_TRACE_MARKER);
});

// AI Score helper functions
const getAIScoreClass = (aiScore: string | undefined): string => {
  switch (aiScore) {
    case 'In queue':
      return 'fas fa-clock';
    case 'In progress':
      return 'fas fa-spinner fa-spin';
    case '1':
      return 'bg-red-500 rounded-full';
    case '2':
      return 'bg-orange-400 rounded-full';
    case '3':
      return 'bg-yellow-400 rounded-full';
    case '4':
      return 'bg-green-500 rounded-full';
    case '5':
      return 'bg-blue-500 rounded-full';
  } return '';
};

const getAIScoreTitle = (aiScore: string | undefined): string => {
  switch (aiScore) {
    case 'In queue':
      return 'In queue';
    case 'In progress':
      return 'In progress';
    case '1':
      return 'Very Low Risk (Score 1)';
    case '2':
      return 'Low Risk (Score 2)';
    case '3':
      return 'Medium Risk (Score 3)';
    case '4':
      return 'High Risk (Score 4)';
    case '5':
      return 'Critical Risk (Score 5)';
  } return '';
};

// Highlight.js
const selectedLanguage = ref('html');
const availableLanguages = [
  { label: 'HTML', value: 'html' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'CSS', value: 'css' }
];

// Language detection rules - automatically detect syntax when selecting a finding
const detectLanguage = (finding: Finding): string => {
  if (!finding.data) return 'html';
  
  // Rule 1: If type is "event" -> JavaScript
  if (finding.type === 'event') {
    return 'javascript';
  }
  
  // Rule 2: If data starts with "function(" -> JavaScript
  if (finding.data.trim().startsWith('function(')) {
    return 'javascript';
  }

  // Rule 3: If sink includes "style" -> CSS
  if (finding.sink.includes('style')) {
    return 'css';
  }
  
  // Rule 4: Default to HTML if nothing is detected
  return 'html';
};

onMounted(() => {
  hljs.registerLanguage('javascript', javascript);
  hljs.registerLanguage('css', css);
  hljs.registerLanguage('html', xml);
});

// Auto-detect language when finding changes
watch(() => props.selectedFinding, (newFinding) => {
  if (newFinding?.data) {
    console.log('newFinding.data', newFinding);
    const detectedLanguage = detectLanguage(newFinding);
    selectedLanguage.value = detectedLanguage;
  }
}, { immediate: true });

const copyDataToClipboard = (data: string) => {
  navigator.clipboard.writeText(data).then(() => {
    toast.add({
      severity: "info",
      summary: "Info",
      detail: "Data copied to clipboard!",
      life: 3000
    });
  });
};

const copyDebugUrlToClipboard = (debugKey: string, href: string) => {
  const parsedUrl = new URL(href);
  parsedUrl.searchParams.set("domloggerpp-canary", debugKey);

  navigator.clipboard.writeText(parsedUrl.href)
    .then(() => {
      toast.add({
        severity: "info",
        summary: "Info",
        detail: "Debugging link copied to clipboard! Visit it to your browser with DOMLogger++ enabled.",
        life: 3000
      });
    });
};

const beautifyCode = () => {
  if (!props.selectedFinding?.data) return;

  try {
    let beautified = props.selectedFinding.data;
    
    switch (selectedLanguage.value) {
      case 'javascript':
        beautified = beautifyJs(props.selectedFinding.data, {
          indent_size: 2,
          space_in_empty_paren: true,
          preserve_newlines: true,
          max_preserve_newlines: 2,
          jslint_happy: false,
          brace_style: 'collapse',
          keep_array_indentation: false,
          keep_function_indentation: false,
          space_before_conditional: true,
          break_chained_methods: false,
          eval_code: false,
          unescape_strings: false,
          wrap_line_length: 0,
          end_with_newline: true
        });
        break;
      case 'html':
        beautified = beautifyHtml(props.selectedFinding.data, {
          indent_size: 2,
          indent_char: ' ',
          max_preserve_newlines: 2,
          preserve_newlines: true,
          keep_array_indentation: false,
          break_chained_methods: false,
          indent_scripts: 'normal',
          brace_style: 'collapse',
          space_before_conditional: true,
          unescape_strings: false,
          jslint_happy: false,
          end_with_newline: true,
          wrap_line_length: 0,
          indent_inner_html: false,
          comma_first: false,
          e4x: false,
          indent_empty_lines: false
        });
        break;
      case 'css':
        beautified = beautifyCss(props.selectedFinding.data, {
          indent_size: 2,
          indent_char: ' ',
          selector_separator_newline: false,
          end_with_newline: true,
          newline_between_rules: true,
          space_around_selector_separator: false
        });
        break;
      default:
        beautified = props.selectedFinding.data;
    }

    // Update the finding data with beautified version
    const updatedFinding = { ...props.selectedFinding, data: beautified };
    emit('finding-update', updatedFinding);

    if (props.onFindingUpdate) {
      props.onFindingUpdate(updatedFinding);
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to beautify code",
      life: 3000
    });
  }
};


const formatWithLineNumbers = (text: string): string => {
  if (!text) return '';
  
  return text
    .split('\n')
    .map((line, index) => `${(index + 1).toString().padStart(3, ' ')} | ${line}`)
    .join('\n');
};

const getHighlightedData = computed(() => {
  if (!props.selectedFinding?.data) return '';
  
  try {
    const highlighted = hljs.highlight(props.selectedFinding.data, { 
      language: selectedLanguage.value 
    });
    return formatWithLineNumbers(highlighted.value);
  } catch (error) {
    return props.selectedFinding.data;
  }
});

const getHighlightedTrace = computed(() => {
  if (!props.selectedFinding?.trace) return '';

  // Only apply syntax highlighting if trace has been enhanced
  if (!isTraceEnhanced.value) {
    return formatWithLineNumbers(props.selectedFinding.trace);
  }

  try {
    // Strip the marker before processing
    let trace = props.selectedFinding.trace;
    if (trace.startsWith(BETTER_TRACE_MARKER)) {
      trace = trace.slice(BETTER_TRACE_MARKER.length);
    }

    const blocks = trace.split('----\n');
    let result = '';

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (!block) continue;

      const trimmedBlock = block.trim();

      if (trimmedBlock) {
        if (i > 0) {
          result += '----\n';
        }
        try {
          const highlighted = hljs.highlight(trimmedBlock, { 
            language: 'javascript' 
          });
          result += highlighted.value + '\n';
        } catch (error) {
          result += trimmedBlock + '\n';
        }
      }
    }

    return formatWithLineNumbers(result);
  } catch (error) {
    return formatWithLineNumbers(props.selectedFinding.trace);
  }
});

const toggleFavorite = async () => {
  if (!props.selectedFinding?.id || isUpdatingFavorite.value) return;

  isUpdatingFavorite.value = true;
  const newFavoriteStatus = !props.selectedFinding.favorite;

  try {
    const result = await sdk.backend.updateFindingFavorite(props.selectedFinding.id, newFavoriteStatus);

    if (result.success) {
      const updatedFinding = { ...props.selectedFinding, favorite: newFavoriteStatus };
      emit('finding-update', updatedFinding);

      if (props.onFindingUpdate) {
        props.onFindingUpdate(updatedFinding);
      }
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: result.error || 'Failed to update favorite status',
        life: 3000
      });
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update favorite status',
      life: 3000
    });
  } finally {
    isUpdatingFavorite.value = false;
  }
};
</script>

<template>
  <div class="h-full flex flex-col bg-surface-800">
    <!-- Default Placeholder -->
    <div v-if="!selectedFinding" class="flex-1 p-20 overflow-y-auto items-center justify-center text-surface-500" style="min-height: 0;">
      <div class="text-center">
        <span class="fas fa-mouse-pointer text-3xl mb-3 block"></span>
        <h4 class="font-medium text-lg mb-1">Select a Finding</h4>
        <p class="text-sm">Click on a row in the table above to view details</p>
      </div>
    </div>

    <div v-else class="flex-1 flex flex-col" style="min-height: 0;">
      <!-- Finding info header -->
      <div class="bg-surface-800 border-b border-surface-600 p-4 flex-shrink-0">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-surface-200 flex items-center gap-2">
            <span class="fas fa-bug text-red-400"></span>
            Finding #{{ selectedFinding.id }}
          </h3>
          <div class="flex items-center gap-2">
            <!-- AI Score Indicator -->
            <div v-if="selectedFinding.aiScore && selectedFinding.aiScore !== ''" class="flex items-center">
              <div 
                class="cursor-pointer w-4 h-4 flex items-center justify-center"
                :class="getAIScoreClass(selectedFinding.aiScore)"
                :title="getAIScoreTitle(selectedFinding.aiScore)"
                @click="onFilterClick(null, 'aiScore', selectedFinding.aiScore)"
              >
              </div>
            </div>
            <span 
              class="cursor-pointer fas fa-star text-lg transition-colors"
              :class="selectedFinding.favorite 
                ? 'text-yellow-400' 
                : 'text-surface-600'"
              @click="toggleFavorite"
              :title="selectedFinding.favorite ? 'Remove from favorites' : 'Add to favorites'"
            ></span>
            <span 
              class="cursor-pointer fas fa-bell text-lg transition-colors"
              :class="selectedFinding.alert 
                ? 'text-yellow-400' 
                : 'text-surface-600'"
              @click="onFilterClick(null, 'alert', selectedFinding.alert ? '1' : '0')"
            ></span>
          </div>
        </div>

        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-1">
              <span class="text-surface-400">Tag:</span>
              <span 
                class="cursor-pointer hover:text-gray-500 transition-colors"
                @click="onFilterClick(null, 'tag', selectedFinding.tag)"
              >
                {{ selectedFinding.tag }}
              </span>
            </div>

            <div class="flex items-center gap-1">
              <span class="text-surface-400">Sink:</span>
              <span 
                class="cursor-pointer hover:text-yellow-400 transition-colors"
                @click="onFilterClick(null, 'sink', selectedFinding.sink)"
              >
                {{ selectedFinding.sink }}
              </span>
            </div>

            <div class="flex items-center gap-1">
              <span class="text-surface-400">Type:</span>
              <span 
                class="cursor-pointer hover:text-green-400 transition-colors"
                @click="onFilterClick(null, 'type', selectedFinding.type)"
              >
                {{ selectedFinding.type }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <span class="text-surface-400">Date:</span>
            <span 
            class="cursor-pointer hover:text-green-500 transition-colors"
            @click="onFilterClick(null, 'date', selectedFinding.date)"
            >{{ selectedFinding.date }}</span>
          </div>
        </div>
      </div>

      <!-- Main finding data -->
      <div class="flex-1" style="min-height: 0; overflow: hidden;">
        <CustomSplitter 
          layout="horizontal"
          :initialSize="50" 
          :minSize="5" 
          :maxSize="95"
          class="h-full"
        >
          <template #top>
            <div class="h-full flex flex-col">
              <div class="bg-surface-800 border-b border-surface-600 p-3 flex items-center justify-between flex-shrink-0">
                <h4 class="font-medium text-surface-200 flex items-center gap-2">
                  <span class="fas fa-code text-blue-400"></span>
                  Data
                </h4>
                <div class="flex items-center gap-3">
                  <button
                    @click="beautifyCode"
                    class="flex items-center gap-2 px-2 py-1.5 text-xs bg-surface-700 border border-surface-600 text-surface-200 rounded hover:bg-surface-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Beautify code"
                  >
                    <span class="fas fa-spray-can-sparkles text-xs"></span>
                    Beautify
                  </button>
                  <select 
                    v-model="selectedLanguage"
                    class="cursor-pointer bg-surface-700 border border-surface-600 text-surface-200 text-xs px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option 
                      v-for="lang in availableLanguages" 
                      :key="lang.value" 
                      :value="lang.value"
                      class="cursor-pointer"
                    >
                      {{ lang.label }}
                    </option>
                  </select>
                  <span 
                    class="fas fa-copy cursor-pointer text-surface-500 hover:text-blue-400 text-sm"
                    @click="copyDataToClipboard(selectedFinding.data)"
                  ></span>
                </div>
              </div>
              <div class="bg-surface-400 flex-1 p-4 overflow-y-auto" style="min-height: 0; background-color: #25272D;">
                <pre class="text-surface-200 text-sm font-mono whitespace-pre-wrap break-all" v-html="getHighlightedData"></pre>
              </div>
            </div>
          </template>
          <template #bottom>
            <div class="h-full flex flex-col">
              <div class="bg-surface-800 border-b border-surface-600 p-4 flex items-center justify-between flex-shrink-0">
                <h4 class="font-medium text-surface-200 flex items-center gap-2">
                  <span class="fas fa-list text-green-400"></span>
                  Stack Trace
                </h4>
                <span 
                  class="fas fa-copy cursor-pointer text-surface-500 hover:text-green-400 text-sm"
                  @click="copyDataToClipboard(selectedFinding.trace)"
                ></span>
              </div>
              <div class="flex-1 p-4 overflow-y-auto" style="min-height: 0; background-color: #25272D;">
                <pre class="text-surface-200 text-sm font-mono whitespace-pre-wrap break-all" v-html="getHighlightedTrace"></pre>
              </div>
            </div>
          </template>
        </CustomSplitter>
      </div>

      <!-- Finding info footer -->
      <div class="bg-surface-800 border-t border-surface-600 p-3 flex-shrink-0">
        <div class="flex items-center gap-2 text-sm">
          <span class="text-surface-400 flex-shrink-0">URL:</span>
          <span 
            class="truncate flex-1 cursor-pointer hover:text-blue-400 transition-colors px-2 py-1 rounded"
            @click="copyDebugUrlToClipboard(selectedFinding.debug, selectedFinding.href)"
          >
            {{ selectedFinding.href }}
          </span>
          <span 
            class="fas fa-filter cursor-pointer text-surface-500 hover:text-orange-400 text-xs flex-shrink-0"
            @click="onFilterClick(null, 'href', selectedFinding.href)"
          ></span>
        </div>
      </div>
    </div>
  </div>
</template>
