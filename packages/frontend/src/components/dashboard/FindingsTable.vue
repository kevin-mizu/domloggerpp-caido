<script setup lang="ts">
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { useToast } from 'primevue/usetoast';
import { useSDK } from "@/plugins/sdk";
import { Finding } from "@/types";
import { ref, watch } from "vue";

interface FindingsTableProps {
  findings: Finding[];
  loading: boolean;
  selectedFindings: Finding[];
  selectedFinding: Finding | null;
  tableKey: number;
}

interface FindingsTableEmits {
  (e: 'update:selectedFindings', value: Finding[]): void;
  (e: 'update:selectedFinding', value: Finding | null): void;
  (e: 'filter-click', event: Event | null, type: string, value: string): void;
  (e: 'finding-update', finding: Finding): void;
}

const props = defineProps<FindingsTableProps>();
const emit = defineEmits<FindingsTableEmits>();
const toast = useToast();
const sdk = useSDK();

// Internal state
const selectedFindings = ref<Finding[]>([]);
const selectedFinding = ref<Finding | null>(null);
const sortField = ref('date');
const sortOrder = ref(-1);

// Initialize from props
selectedFindings.value = props.selectedFindings;
selectedFinding.value = props.selectedFinding;

// Sync with parent component
watch(() => props.selectedFindings, (newValue) => {
  selectedFindings.value = newValue;
});

watch(() => props.selectedFinding, (newValue) => {
  selectedFinding.value = newValue;
});

watch(selectedFindings, (newValue) => {
  emit('update:selectedFindings', newValue);
});

watch(selectedFinding, (newValue) => {
  emit('update:selectedFinding', newValue);
});

// Table functions
const onSort = (event: { sortField: string; sortOrder: number }) => {
  sortField.value = event.sortField;
  sortOrder.value = event.sortOrder;
};

const onRowClick = (event: { data: Finding }) => {
  selectedFinding.value = event.data;
};

const handleLinkClick = (url: string, debugKey: string) => {
  const parsedUrl = new URL(url);
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

const handleFilterClick = (event: Event | null, type: string, value: string) => {
  if (event && !(event as KeyboardEvent).ctrlKey && !(event as KeyboardEvent).metaKey) {
    return;
  }
  emit('filter-click', event, type, value);
};

const toggleFavorite = async (event: Event, finding: Finding) => {
  if (!finding.id) return;

  if (event && (event as KeyboardEvent).ctrlKey && (event as KeyboardEvent).metaKey) {
    handleFilterClick(event, 'favorite', finding.favorite ? '1' : '0');
    return;
  }
  
  const newFavoriteStatus = !finding.favorite;
  
  try {
    const result = await sdk.backend.updateFindingFavorite(finding.id, newFavoriteStatus);
    
    if (result.success) {
      // Update the finding in the local array
      const index = props.findings.findIndex(f => f.id === finding.id);
      if (index !== -1) {
        const updatedFinding = { ...finding, favorite: newFavoriteStatus };
        emit('finding-update', updatedFinding);
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
  }
};

const selectFindingByIndex = (index: number) => {
  const finding = props.findings[index];
  if (finding) {
    selectedFinding.value = finding;
  }
};

const navigateFinding = (direction: 'up' | 'down') => {
  if (!selectedFinding.value) {
    if (props.findings.length > 0) {
      selectFindingByIndex(0);
    }
    return;
  }
  
  const currentIndex = props.findings.findIndex(finding => finding.id === selectedFinding.value!.id);
  const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  
  if (newIndex >= 0 && newIndex < props.findings.length) {
    selectFindingByIndex(newIndex);
  }
};

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

defineExpose({
  navigateFinding,
  selectedFinding
});
</script>

<template>
  <DataTable 
    :key="props.tableKey"
    :value="findings" 
    :loading="loading"
    :sortField="sortField" 
    :sortOrder="sortOrder" 
    @sort="onSort"
    stripedRows
    size="small"
    scrollable
    scrollHeight="flex"
    tableStyle="table-layout: fixed"
    v-model:selection="selectedFindings"
    @row-click="onRowClick"
    resizableColumns
    columnResizeMode="expand"
    :rowClass="(data: Finding) => data.id === selectedFinding?.id ? 'selected-row' : ''"
    class="dashboard-table"
  >
    <Column field="aiScore" header="🎯" :style="{ 'width': '41px' }">
      <template #body="props">
        <div v-if="props.data.aiScore && props.data.aiScore !== ''" class="flex items-center justify-center">
          <div 
            class="cursor-pointer w-4 h-4"
            :class="getAIScoreClass(props.data.aiScore)"
            :title="getAIScoreTitle(props.data.aiScore)"
            @click="handleFilterClick($event, 'aiScore', props.data.aiScore)"
          ></div>
        </div>
      </template>
    </Column>
    <Column field="favorite" header="⭐" :style="{ 'width': '41px' }">
      <template #body="props">
        <span
          class="cursor-pointer fas fa-star hover:text-yellow-400 transition-colors"
          :class="{ 'text-yellow-400': props.data.favorite, 'text-gray-400': !props.data.favorite }"
          @click="toggleFavorite($event, props.data)"
          :title="props.data.favorite ? 'Remove from favorites (Ctrl+click to filter)' : 'Add to favorites (Ctrl+click to filter)'"
        ></span>
      </template>
    </Column>
    <Column selectionMode="multiple" :style="{ 'width': '41px' }"></Column>
    <Column header="🔗" :style="{ 'width': '41px' }">
      <template #body="props">
        <span class="fas fa-link cursor-pointer hover:text-blue-500 truncate transition-colors" @click="handleLinkClick(props.data.href, props.data.debug)"></span>
      </template>
    </Column>
    <Column field="alert" header="🔔" sortable :style="{ 'width': '70px' }">
      <template #body="props">
        <span
          class="cursor-pointer fas fa-bell hover:text-yellow-500 transition-colors"
          @click="handleFilterClick($event, 'alert', props.data.alert === true ? '1' : '0')"
          v-if="props.data.alert"
        ></span>
      </template>
    </Column>
    <Column field="date" header="Date" sortable :style="{ 'width': '250px' }">
      <template #body="props">
        <div class="cursor-pointer hover:text-green-500 truncate transition-colors" @click="handleFilterClick($event, 'date', props.data.date)">{{ props.data.date }}</div>
      </template>
    </Column>
    <Column field="tag" header="Tag" sortable :style="{ 'width': '125px' }">
      <template #body="props">
        <div class="cursor-pointer hover:text-gray-500 truncate transition-colors" @click="handleFilterClick($event, 'tag', props.data.tag)">{{ props.data.tag }}</div>
      </template>
    </Column>
    <Column field="sink" header="Sink" sortable :style="{ 'width': '250px' }">
      <template #body="props">
        <div class="cursor-pointer hover:text-yellow-500 truncate transition-colors" @click="handleFilterClick($event, 'sink', props.data.sink)">{{ props.data.sink }}</div>
      </template>
    </Column>
    <Column field="data" header="Data">
      <template #body="props">
        <div class="break-words whitespace-normal cursor-pointer truncate rounded hover:text-red-500 transition-colors">
          {{ props.data.data }}
        </div>
      </template>
    </Column>
    <Column field="href" header="URL" sortable :style="{ 'width': '400px' }">
      <template #body="props">
        <div class="cursor-pointer hover:text-blue-500 transition-colors truncate break-words whitespace-normal" @click="handleFilterClick($event, 'href', props.data.href)">{{ props.data.href }}</div>
      </template>
    </Column>
  </DataTable>
</template>

<style scoped>
/* Datatable column resizer */
.dashboard-table :deep([data-pc-section="columnresizer"]) {
  background-color: #30333B !important;
  width: 3px !important;
}

/* Remove focus outlines from table elements */
.dashboard-table :deep(*:focus) {
  outline: none !important;
}
</style>
