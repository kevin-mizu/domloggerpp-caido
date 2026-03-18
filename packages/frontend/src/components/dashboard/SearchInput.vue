<script setup lang="ts">
import Textarea from "primevue/textarea";
import { ref, computed, nextTick, watch } from "vue";
import { Suggestion, SuggestionConfig, SuggestionConfigItem } from "@/types";

interface SearchInputProps {
  modelValue: string;
  placeholder?: string;
  suggestionConfig?: SuggestionConfig;
}

interface SearchInputEmits {
  (e: 'update:modelValue', value: string): void;
  (e: 'search'): void;
}

const props = withDefaults(defineProps<SearchInputProps>(), {
  placeholder: 'Search: sink.tag.eq:"XSS" AND sink.data.like:"test"',
  suggestionConfig: () => ({
    globalObjects: [
      { 
        name: "sink", 
        description: "Sink object", 
        variables: [
          { name: "id", description: 'ID' },
          { name: "aiScore", description: 'AI Score' },
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
      { name: "ncont", description: "Not contain" },
      { name: "like", description: "Like (SQL)" },
      { name: "nlike", description: "Not like (SQL)" }
    ],
    operators: [
      { name: "AND", description: "Logical AND" },
      { name: "OR", description: "Logical OR" }
    ]
  })
});

const emit = defineEmits<SearchInputEmits>();

const searchQuery = ref('');
searchQuery.value = props.modelValue;

watch(() => props.modelValue, (newValue) => {
  searchQuery.value = newValue;
});

watch(searchQuery, (newValue) => {
  emit('update:modelValue', newValue);
});

const suggestions = ref<Suggestion[]>([]);
const selectedSuggestionIndex = ref(-1);
const searchInputFocused = ref(false);
const suggestionsHidden = ref(false);
const searchInput = ref<{ $el: HTMLInputElement } | null>(null);
const suggestionsList = ref<HTMLUListElement | null>(null);

// Scroll selected suggestion into view
watch(selectedSuggestionIndex, (newIndex) => {
  if (newIndex >= 0 && suggestionsList.value) {
    const items = suggestionsList.value.querySelectorAll('li');
    if (items[newIndex]) {
      items[newIndex].scrollIntoView({ block: 'nearest' });
    }
  }
});


// Suggestion functions
const hideSuggestions = () => {
  suggestionsHidden.value = true;
  selectedSuggestionIndex.value = -1;
  suggestions.value = [];
};

const filterSuggestion = (suggestion: SuggestionConfigItem[], currentQueryPart: string): SuggestionConfigItem[] => {
  return suggestion.filter(s => s.name.startsWith(currentQueryPart));
};

// Sort suggestions to prioritize specific items
const sortSuggestions = (items: Suggestion[], priorityName: string): Suggestion[] => {
  return items.sort((a, b) => {
    const aMatch = a.value.includes(`.${priorityName}.`) || a.value.includes(`.${priorityName}:`);
    const bMatch = b.value.includes(`.${priorityName}.`) || b.value.includes(`.${priorityName}:`);
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });
};

const getLastFilter = (): string => {
  const query = searchQuery.value || '';
  let lastOperatorIndex = -1;
  let lastOperator: { name: string; description: string } | null = null;

  // Store quoted content with placeholders
  const quotedContent = new Map<string, string>();
  let placeholderCounter = 0;

  const unquotedQuery = query.replace(/"((?:\\.|[^\\"])*)"/g, (match, content) => {
    const placeholder = `__QUOTED_${placeholderCounter}__`;
    quotedContent.set(placeholder, content);
    placeholderCounter++;
    return placeholder;
  });

  for (const operator of props.suggestionConfig.operators) {
    const operatorIndex = unquotedQuery.lastIndexOf(operator.name);
    if (operatorIndex !== -1 && operatorIndex >= lastOperatorIndex) {
      lastOperator = operator;
      lastOperatorIndex = operatorIndex;
    }
  }

  const lastFilter = lastOperator ? unquotedQuery.substring(lastOperatorIndex + lastOperator.name.length) : unquotedQuery;

  // Restore quoted content in the result
  let restoredResult = lastFilter;
  quotedContent.forEach((content, placeholder) => {
    restoredResult = restoredResult.replace(placeholder, `"${content}"`);
  });

  if (restoredResult.startsWith("(")) {
    restoredResult = restoredResult.substring(1);
  }

  return restoredResult.trimStart();
};

const getSuggestion = () => {
  // Reset suggestions
  selectedSuggestionIndex.value = 0;
  suggestionsHidden.value = false;
  suggestions.value = [];

  // Get the current context
  const lastFilter = getLastFilter();
  const filterParts = lastFilter.split(".");
  const searchInputEl = searchInput.value?.$el as HTMLInputElement;

  if (searchQuery.value.length === 0) {
    return;
  }

  if (filterParts.length === 1) {
    suggestions.value = filterSuggestion(props.suggestionConfig.globalObjects, filterParts[0] || '').map(s => ({
      display: filterParts[0] ? s.name.replace(filterParts[0], `<u>${filterParts[0]}</u>`) : s.name,
      value: `${s.name}.`,
      description: s.description,
      icon: "cm-completionIcon-class"
    }));
    return;
  }

  // Check if the global object is valid
  const globalObject = props.suggestionConfig.globalObjects.find(obj => obj.name === filterParts[0]);
  if (!globalObject || !globalObject.variables) {
    return;
  }

  if (filterParts.length === 2) {
    const variableSuggestions = filterSuggestion(globalObject.variables, filterParts[1] || '').map(s => ({
      display: filterParts[1] ? s.name.replace(filterParts[1], `<u>${filterParts[1]}</u>`) : s.name,
      value: `${filterParts[0]}.${s.name}.`,
      description: s.description,
      icon: "cm-completionIcon-variable"
    }));
    suggestions.value = sortSuggestions(variableSuggestions, 'data');
    return;
  }

  // Check if the variable is valid
  if (!globalObject.variables.find(v => v.name === filterParts[1])) {
    return;
  }

  // Suggest operators
  if (filterParts.length === 3) {
    if (searchInputEl.selectionStart === searchInputEl.value.length && filterParts[2]?.match(':".*"\\)? ')) {
      suggestions.value = filterSuggestion(props.suggestionConfig.operators, filterParts[2].split(' ')[1] || '').map(s => ({
        display: s.name,
        value: `${filterParts[0]}.${filterParts[1]}.${filterParts[2]?.split(' ')[0]} ${s.name} `,
        description: s.description,
        icon: "cm-completionIcon-namespace"
      }));
    } else {
      const functionSuggestions = filterSuggestion(props.suggestionConfig.functions, filterParts[2] || '').map(s => ({
        display: filterParts[2] ? s.name.replace(filterParts[2], `<u>${filterParts[2]}</u>`) : s.name,
        value: `${filterParts[0]}.${filterParts[1]}.${s.name}:"value"`,
        description: s.description,
        icon: "cm-completionIcon-function"
      }));
      suggestions.value = sortSuggestions(functionSuggestions, 'cont');
    }
  }
};

const replaceLast = (str: string, search: string, replace: string): string => {
  const index = str.lastIndexOf(search);
  if (index === -1) return str;
  const result = str.slice(0, index) + replace;
  return result.endsWith(' ') ? result.replace(/\s+$/, ' ') : result;
};

const applySuggestion = (suggestion: Suggestion) => {
  selectedSuggestionIndex.value = -1;
  suggestions.value = [];
  const searchInputEl = searchInput.value?.$el as HTMLInputElement;

  searchQuery.value = replaceLast(searchQuery.value, getLastFilter(), suggestion.value);
  if (suggestion.icon === "cm-completionIcon-function") {
    if (searchInputEl) {
      nextTick(() => {
        const newLength = searchInputEl.value.length;
        searchInputEl.selectionStart = newLength - 6;
        searchInputEl.selectionEnd = newLength - 1;
      });
    }
  }
  getSuggestion();
};

const handleUndo = (event: KeyboardEvent) => {
  event.preventDefault();
  const searchInputEl = searchInput.value?.$el as HTMLInputElement;
  if (searchInputEl) {
    document.execCommand('undo');
  }
};

const handleRedo = (event: KeyboardEvent) => {
  event.preventDefault();
  const searchInputEl = searchInput.value?.$el as HTMLInputElement;
  if (searchInputEl) {
    document.execCommand('redo');
  }
};

// Syntax highlighting
const highlightedSearchQuery = computed(() => {
  const query = searchQuery.value;
  if (!query) return '';

  let highlightedQuery = query.replace(/</g, '&lt;').replace(/>/g, '&gt;'); // Prevent XSS
  const colors = {
    globalObjects: 'text-green-500',
    variables: 'text-green-500',
    functions: 'text-yellow-500',
    params: 'text-amber-700'
  };

  // Step 1: Replace quoted content with placeholders to protect from highlighting
  const quotedContent: string[] = [];
  highlightedQuery = highlightedQuery.replace(/"([^"]*)"/g, (match, content) => {
    const placeholder = `__QUOTE_${quotedContent.length}__`;
    quotedContent.push(content);
    return placeholder;
  });

  // Step 2: Apply syntax highlighting to unquoted content
  // Variables
  props.suggestionConfig.globalObjects.forEach(obj => {
    if (obj.variables) {
      obj.variables.forEach(variable => {
        const regex = new RegExp(`(${obj.name}\\.)\\b(${variable.name})\\b(?=\\.)`, 'g');
        highlightedQuery = highlightedQuery.replace(regex, `$1<span class="${colors.variables}">$2</span>`);
      });
    }
  });

  // Global objects
  props.suggestionConfig.globalObjects.forEach(obj => {
    const regex = new RegExp(`(?<!\\.)\\b${obj.name}\\b(?=\\.)`, 'g');
    highlightedQuery = highlightedQuery.replace(regex, `<span class="${colors.globalObjects}">${obj.name}</span>`);
  });

  // Functions
  props.suggestionConfig.functions.forEach(func => {
    const regex = new RegExp(`\\b${func.name}\\b(?=:)`, 'g');
    highlightedQuery = highlightedQuery.replace(regex, `<span class="${colors.functions}">${func.name}</span>`);
  });

  // Step 3: Restore quoted content with highlighting
  highlightedQuery = highlightedQuery.replace(/__QUOTE_(\d+)__/g, (match, index) => {
    return `<span class="${colors.params}">"${quotedContent[parseInt(index)]}"</span>`;
  });

  // Replace spaces with HTML entities to preserve spacing
  highlightedQuery = highlightedQuery.replace(/ (?![^<]*>)/g, '&nbsp;');
  
  return highlightedQuery;
});

// Expose methods and state for parent component
defineExpose({
  searchInput,
  searchQuery,
  searchInputFocused,
  focus: () => {
    if (searchInput.value?.$el) {
      searchInput.value.$el.focus();
      searchInput.value.$el.select();
    }
  },
  blur: () => {
    if (searchInput.value?.$el) {
      searchInput.value.$el.blur();
    }
  }
});
</script>

<template>
  <div class="flex w-full">
    <span class="p-input-icon-left w-full relative">
      <i class="pi pi-search" />
      <Textarea 
        v-model="searchQuery" 
        :placeholder="placeholder" 
        class="w-full syntax-input resize-none" 
        ref="searchInput"
        spellcheck="false"
        rows="1"
        autoResize
        @keydown.enter.prevent="suggestions.length > 0 && selectedSuggestionIndex >= 0 ? applySuggestion(suggestions[selectedSuggestionIndex] as Suggestion) : emit('search')"
        @keydown.tab.prevent="suggestions.length > 0 && selectedSuggestionIndex >= 0 ? applySuggestion(suggestions[selectedSuggestionIndex] as Suggestion) : null"
        @keydown.down.prevent="selectedSuggestionIndex = selectedSuggestionIndex >= suggestions.length - 1 ? 0 : selectedSuggestionIndex + 1"
        @keydown.up.prevent="selectedSuggestionIndex = selectedSuggestionIndex <= 0 ? suggestions.length - 1 : selectedSuggestionIndex - 1"
        @keydown.esc="hideSuggestions"
        @keydown.left="hideSuggestions"
        @keydown.right="hideSuggestions"
        @keydown.ctrl.z="handleUndo"
        @keydown.ctrl.y="handleRedo"
        @input="getSuggestion"
        @focus="searchInputFocused = true"
        @blur="searchInputFocused = false"
      />
      <div 
        v-if="searchQuery"
        class="syntax-overlay leading-none"
        v-html="highlightedSearchQuery"
      ></div>
    </span>
  </div>
  <div v-if="suggestions.length > 0 && searchInputFocused && !suggestionsHidden" class="ͼ1 ͼ3" style="height: 0px !important; border: none !important;">
    <div class="cm-tooltip-autocomplete cm-tooltip cm-tooltip-below absolute z-10 w-full max-w-2xl shadow-lg mt-1">
      <ul ref="suggestionsList" role="listbox" aria-expanded="true" aria-label="Completions">
        <li 
          v-for="(suggestion, index) in suggestions" 
          role="option"
          :key="index"
          :aria-selected="index === selectedSuggestionIndex ? 'true' : undefined"
          :class="{ 'cm-activeCompletion': index === selectedSuggestionIndex }"
          @mousedown.prevent="applySuggestion(suggestion)"
          @mouseover="selectedSuggestionIndex = index"
          style="display: flex; justify-content: space-between; align-items: center; padding: 2px 4px;"
        >
          <div style="display: flex; align-items: center;">
          <div class="cm-completionIcon" :class="suggestion.icon" aria-hidden="true"></div>
          <span class="cm-completionLabel" v-html="suggestion.display"></span>
          </div>
          <span v-if="suggestion.description" class="cm-completionDetail" style="margin-left: auto; padding-left: 12px; padding-right: 8px; opacity: 0.6;">{{ suggestion.description }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* Syntax highlighting overlay */
.syntax-input {
  color: transparent !important;
  caret-color: #ffffff !important;
  word-break: break-all !important;
  line-height: 1.5 !important;
}

.syntax-input::selection {
  color: transparent !important; 
  background: highlight !important;
}

.syntax-overlay {
  position: absolute;
  top: 8px;
  right: 13.10px;
  left: 13.10px;
  bottom: 0;
  pointer-events: none;
  color: rgb(var(--surface-0));
  white-space: pre-wrap;
  overflow-wrap: break-all !important;
  word-break: break-all !important;
  font-family: inherit;
  font-size: inherit;
  line-height: 1.5 !important;
  box-sizing: border-box;
}
</style>
