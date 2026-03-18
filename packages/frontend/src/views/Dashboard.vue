<script setup lang="ts">
import Dropdown from "primevue/dropdown";
import Button from "primevue/button";
import Paginator from "primevue/paginator";
import CustomSplitter from '@/components/dashboard/CustomSplitter.vue';
import FindingCard from '@/components/dashboard/FindingCard.vue';
import SearchInput from '@/components/dashboard/SearchInput.vue';
import FindingsTable from '@/components/dashboard/FindingsTable.vue';

import { useToast } from 'primevue/usetoast';
import { ref, onMounted, onUnmounted, computed } from "vue";

import { useSDK } from '@/plugins/sdk';
import { Finding, PaginationInfo, Project } from "@/types";

const sdk = useSDK();
const toast = useToast();

/* ***************************************************** */
/* ************* STATE MANAGEMENT ********************** */
/* ***************************************************** */
const findings = ref<Finding[]>([]);
const loading = ref(false);
const deleting = ref(false);
const exporting = ref(false);
const recording = ref(false);
const sendingToAI = ref(false);
const removingAIScore = ref(false);
const enhancingTrace = ref(false);
const isRecording = ref(false);
const selectedFindings = ref<Finding[]>([]);
const selectedFinding = ref<Finding | null>(null);
const searchQuery = ref('');
const pagination = ref<PaginationInfo>({
  page: 1,
  entriesPerPage: 50,
  totalEntries: 0,
  totalPages: 0
});

const searchInput = ref<any>(null);
const findingsTable = ref<any>(null);
const autoRefreshInterval = ref(10);
const autoRefreshTimer = ref<number | null>(null);
const isAutoRefreshing = ref(false);
const countdownTimer = ref<number | null>(null);
const countdownSeconds = ref(0);

const entriesPerPageOptions = [
  { label: '10 entries', value: 10 },
  { label: '25 entries', value: 25 },
  { label: '50 entries', value: 50 },
  { label: '100 entries', value: 100 }
];

/* ***************************************************** */
/* ************* AUTO-REFRESH ************************* */
/* ***************************************************** */
const startAutoRefresh = () => {
  if (autoRefreshInterval.value <= 0) return;
  
  stopAutoRefresh();
  
  isAutoRefreshing.value = true;
  countdownSeconds.value = autoRefreshInterval.value;
  
  // Start countdown timer
  countdownTimer.value = window.setInterval(() => {
    countdownSeconds.value--;
    if (countdownSeconds.value <= 0) {
      countdownSeconds.value = autoRefreshInterval.value;
    }
  }, 1000);
  
  autoRefreshTimer.value = window.setInterval(() => {
    // Only auto-refresh if we're on page 1
    if (pagination.value.page === 1) {
      fetchFindings();
      countdownSeconds.value = autoRefreshInterval.value;
    }
  }, autoRefreshInterval.value * 1000);
  
  console.log(`Auto-refresh started: ${autoRefreshInterval.value}s interval`);
};

const stopAutoRefresh = () => {
  if (autoRefreshTimer.value !== null) {
    clearInterval(autoRefreshTimer.value);
    autoRefreshTimer.value = null;
  }
  
  if (countdownTimer.value !== null) {
    clearInterval(countdownTimer.value);
    countdownTimer.value = null;
  }
  
  isAutoRefreshing.value = false;
  countdownSeconds.value = 0;
  console.log('Auto-refresh stopped');
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

/* ***************************************************** */
/* ************* FETCH FINDINGS ************************ */
/* ***************************************************** */
const fetchFindings = async () => {
  try {
    loading.value = true;
    const result = await sdk.backend.getFindings(
      pagination.value.page,
      pagination.value.entriesPerPage,
      searchQuery.value
    );
    if (result.success && result.findings) {
      findings.value = result.findings as Finding[];
      pagination.value = result.pagination as PaginationInfo;
    } else {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: `Failed to fetch findings: ${result.error}`,
        life: 3000
      });
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: `Error fetching findings: ${error}`,
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

/* ***************************************************** */
/* ************* TABLE FUNCTIONS *********************** */
/* ***************************************************** */


const onEntriesPerPageChange = (event: { value: number }) => {
  pagination.value.entriesPerPage = event.value;
  pagination.value.page = 1;
  fetchFindings();
};

const onPageChange = (event: { page: number; first: number; rows: number; pageCount: number }) => {
  pagination.value.page = event.page + 1; // PrimeVue uses 0-based indexing
  fetchFindings();
};

// Computed property for Paginator first value (0-based)
const paginatorFirst = computed({
  get: () => (pagination.value.page - 1) * pagination.value.entriesPerPage,
  set: (value: number) => {
    pagination.value.page = Math.floor(value / pagination.value.entriesPerPage) + 1;
  }
});

/* ***************************************************** */
/* ************* TABLE SCROLLING *********************** */
/* ***************************************************** */
const scrollTable = (direction: 'up' | 'down') => {
  const scrollableElement = document.querySelector('[data-pc-section="tablecontainer"]');

  if (!scrollableElement) {
    return;
  }

  const scrollAmount = 45*5; // 45px * 5 rows
  if (direction === 'up') {
    scrollableElement.scrollTop = Math.max(0, scrollableElement.scrollTop - scrollAmount);
  } else {
    scrollableElement.scrollTop = Math.min(
      scrollableElement.scrollHeight - scrollableElement.clientHeight,
      scrollableElement.scrollTop + scrollAmount
    );
  }
};

/* ***************************************************** */
/* ************* DELETE FINDINGS *********************** */
/* ***************************************************** */
const deleteFindings = async () => {
  try {
    deleting.value = true;

    let idsToDelete: number[];
    let deleteType: string;

    if (selectedFindings.value.length > 0) {
      // Delete selected findings
      idsToDelete = selectedFindings.value
        .filter(finding => finding.id !== undefined)
        .map(finding => finding.id!) as number[];
      deleteType = `${idsToDelete.length} selected findings`;
    } else {
      // Delete all findings with current filter
      const result = await sdk.backend.getFindings(
        1,
        pagination.value.totalEntries || 10000,
        searchQuery.value
      );

      if (!result.success || !result.findings) {
        toast.add({
          severity: "error",
          summary: "Delete Error",
          detail: `Failed to fetch findings for deletion: ${result.error}`,
          life: 3000
        });
        return;
      }

      idsToDelete = (result.findings as Finding[])
        .filter(finding => finding.id !== undefined)
        .map(finding => finding.id!) as number[];
      deleteType = searchQuery.value 
        ? `${idsToDelete.length} filtered findings`
        : `all ${idsToDelete.length} findings`;
    }

    if (idsToDelete.length === 0) {
      toast.add({
        severity: "warn",
        summary: "No Data",
        detail: "No findings to delete",
        life: 3000
      });
      return;
    }

    const result = await sdk.backend.deleteFindings(idsToDelete);

    if (result.success) {
      toast.add({
        severity: "success",
        summary: "Success",
        detail: `Deleted ${deleteType}`,
        life: 3000
      });
      selectedFindings.value = [];
      fetchFindings();
    } else {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: `Failed to delete findings: ${result.error}`,
        life: 5000
      });
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: `Error deleting findings: ${error}`,
      life: 5000
    });
  } finally {
    deleting.value = false;
  }
};

/* ***************************************************** */
/* ************* RECORDING TOGGLE ********************** */
/* ***************************************************** */
const toggleRecording = async () => {
  try {
    recording.value = true;
    
    if (isRecording.value) {
      // Stop recording - delete temporary project
      const result = await sdk.backend.deleteTempProject();

      if (result.success) {
        isRecording.value = false;
        toast.add({
          severity: "success",
          summary: "Recording Stopped",
          detail: "Temporary project deleted. Findings will now go to the main project.",
          life: 3000
        });
        fetchFindings(); // Refresh to show main project findings
      } else {
        toast.add({
          severity: "error",
          summary: "Error",
          detail: `Failed to stop recording: ${result.error}`,
          life: 5000
        });
      }
    } else {
      // Start recording - create temporary project
      const result = await sdk.backend.createTempProject();

      if (result.success) {
        isRecording.value = true;
        toast.add({
          severity: "success",
          summary: "Recording Started",
          detail: "Temporary project created. New findings will be captured here.",
          life: 3000
        });
        fetchFindings(); // Refresh to show temp project (likely empty)
      } else {
        toast.add({
          severity: "error",
          summary: "Error",
          detail: `Failed to start recording: ${result.error}`,
          life: 5000
        });
      }
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Recording Error",
      detail: `Error toggling recording: ${error}`,
      life: 5000
    });
  } finally {
    recording.value = false;
  }
};

/* ***************************************************** */
/* ************* EXPORT FINDINGS *********************** */
/* ***************************************************** */
const exportFindings = async () => {
  try {
    exporting.value = true;

    let dataToExport: Finding[];
    let exportType: string;

    if (selectedFindings.value.length > 0) {
      // Export selected findings
      dataToExport = selectedFindings.value;
      exportType = `${selectedFindings.value.length} selected findings`;
    } else {
      // Export all findings with current filter
      const result = await sdk.backend.getFindings(
        1,
        pagination.value.totalEntries || 10000,
        searchQuery.value
      );

      if (!result.success || !result.findings) {
        toast.add({
          severity: "error",
          summary: "Export Error",
          detail: `Failed to fetch findings for export: ${result.error}`,
          life: 5000
        });
        return;
      }

      dataToExport = result.findings as Finding[];
      exportType = searchQuery.value 
        ? `${dataToExport.length} filtered findings`
        : `all ${dataToExport.length} findings`;
    }

    if (dataToExport.length === 0) {
      toast.add({
        severity: "warn",
        summary: "No Data",
        detail: "No findings to export",
        life: 3000
      });
      return;
    }

    // Convert to JSON format (as returned by the API)
    const jsonContent = JSON.stringify(dataToExport, null, 2);

    // Create and download file
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `domlogger-findings-${timestamp}.json`;

      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.add({
        severity: "success",
        summary: "Export Complete",
        detail: `Successfully exported ${exportType} to ${filename}`,
        life: 3000
      });
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Export Error",
      detail: `Error exporting findings: ${error}`,
      life: 5000
    });
  } finally {
    exporting.value = false;
  }
};



/* ***************************************************** */
/* ************* TABLE HANDLERS ************************ */
/* ***************************************************** */

const handleFilterClick = (event: Event | null, type: string, value: string) => {
  if (event && !(event as KeyboardEvent).ctrlKey && !(event as KeyboardEvent).metaKey) {
    return;
  }
  const filter = `sink.${type}.eq:"${value}"`;
  if (searchQuery.value === filter) {
    searchQuery.value = '';
  } else {
    searchQuery.value = filter;
  }
  fetchFindings();
};

const handleFindingUpdate = (updatedFinding: Finding) => {
  const index = findings.value.findIndex(f => f.id === updatedFinding.id);
  if (index !== -1) {
    findings.value[index] = updatedFinding;
  }
  
  if (selectedFinding.value?.id === updatedFinding.id) {
    selectedFinding.value = updatedFinding;
  }
  
  const selectedIndex = selectedFindings.value.findIndex(f => f.id === updatedFinding.id);
  if (selectedIndex !== -1) {
    selectedFindings.value[selectedIndex] = updatedFinding;
  }
};

/* ***************************************************** */
/* ************* CHECK RECORDING STATE ***************** */
/* ***************************************************** */
const checkRecordingState = async () => {
  try {
    const result = await sdk.backend.getProjects();
    if (result.success && result.projects) {
      // Check if temp project exists
      const tempProject = result.projects.find((p: Project) => p.name === 'temp_recording');
      isRecording.value = !!tempProject;
    }
  } catch (error) {
    console.error('Error checking recording state:', error);
  }
};

/* ***************************************************** */
/* ************* REFRESH FINDINGS AND SELECTION ******* */
/* ***************************************************** */
const refreshFindingsAndSelection = async () => {
  // Store selected IDs before refresh
  const selectedIds = selectedFindings.value.map(f => f.id).filter((id): id is number => id !== undefined);
  
  // Refresh findings to show updated data
  await fetchFindings();
  
  // Restore selection after refresh
  if (selectedIds.length > 0) {
    selectedFindings.value = findings.value.filter(f => f.id !== undefined && selectedIds.includes(f.id));
  }
};

/* ***************************************************** */
/* ************* AI ACTIONS **************************** */
/* ***************************************************** */
const sendToAI = async () => {
  if (selectedFindings.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'No Selection',
      detail: 'Please select findings to send to AI analysis',
      life: 3000
    });
    return;
  }

  try {
    sendingToAI.value = true;
    
    // Get IDs of selected findings
    const findingIds = [...selectedFindings.value]
      .filter(f => f.id !== undefined)
      .map(f => f.id!);
    
    if (findingIds.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'Invalid Selection',
        detail: 'Selected findings must have valid IDs',
        life: 3000
      });
      return;
    }

    const result = await sdk.backend.updateFindingsAIScore(findingIds, 'In queue');
    
    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Sent findings to AI analysis queue (if a prompt matches)`,
        life: 3000
      });

      // Refresh findings and restore selection
      await refreshFindingsAndSelection();
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: result.error || 'Failed to send findings to AI analysis',
        life: 3000
      });
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to send findings to AI analysis',
      life: 3000
    });
  } finally {
    sendingToAI.value = false;
  }
};

const removeAIScore = async () => {
  if (selectedFindings.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'No Selection',
      detail: 'Please select findings to remove AI score',
      life: 3000
    });
    return;
  }

  try {
    removingAIScore.value = true;
    
    // Get IDs of selected findings
    const findingIds = [...selectedFindings.value]
      .filter(f => f.id !== undefined)
      .map(f => f.id!);

    if (findingIds.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'Invalid Selection',
        detail: 'Selected findings must have valid IDs',
        life: 3000
      });
      return;
    }

    const result = await sdk.backend.updateFindingsAIScore(findingIds, '');
    
    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Removed ${findingIds.length} findings AI scores`,
        life: 3000
      });

      // Refresh findings and restore selection
      await refreshFindingsAndSelection();
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: result.error || 'Failed to remove findings AI scores',
        life: 3000
      });
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to remove findings AI scores',
      life: 3000
    });
  } finally {
    removingAIScore.value = false;
  }
};

/* ***************************************************** */
/* ************* ENHANCE TRACE ************************* */
/* ***************************************************** */
const enhanceTraces = async () => {
  // Get findings to enhance: selected findings or current finding
  const findingsToEnhance = selectedFindings.value.length > 0 
    ? selectedFindings.value 
    : (selectedFinding.value ? [selectedFinding.value] : []);

  if (findingsToEnhance.length === 0) return;

  try {
    enhancingTrace.value = true;
    let successCount = 0;

    for (const finding of findingsToEnhance) {
      if (!finding.id) continue;
      
      const result = await sdk.backend.enhanceFindingTrace(finding.id);
      if (result.success && result.finding) {
        handleFindingUpdate(result.finding);
        successCount++;
      }
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to enhance traces',
      life: 3000
    });
  } finally {
    enhancingTrace.value = false;
  }
};

/* ***************************************************** */
/* ************* RESET COLUMN WIDTHS ******************* */
/* ***************************************************** */
const tableKey = ref(0);

const resetColumnWidths = () => {
  // Force table re-render by changing the key
  tableKey.value++;
};

/* ***************************************************** */
/* ************* KEYBOARD HANDLERS *h******************** */
/* ***************************************************** */
onMounted(() => {
  loadAutoRefreshSetting();
  checkRecordingState();
  fetchFindings();
  
  if (autoRefreshInterval.value > 0) {
    startAutoRefresh();
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!document.getElementById("plugin--domloggerpp")) return;

    if (event.key === 'Escape') {
      // Unfocus search input
      if (searchInput.value?.searchInputFocused) {
        event.preventDefault();
        searchInput.value.blur();
        return;
      }
    }


    if (searchInput.value?.searchInputFocused) {
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      // Focus search input (always works)
      if (event.key === 'f') {
        event.preventDefault();
        searchInput.value?.focus();
        return;
      }

      // Start download/export
      if (event.key === 's') {
        event.preventDefault();
        exportFindings();
        return;
      }

      // Select/unselect all findings
      if (event.key === 'a') {
        event.preventDefault();
        if (findings.value.length > 0) {
          if (selectedFindings.value.length === findings.value.length) {
            selectedFindings.value = [];
          } else {
            selectedFindings.value = [...findings.value];
          }
        }
        return;
      }

      // Send to AI
      if (event.key === 'i') {
        event.preventDefault();
        sendToAI();
        return;
      }

      // Enhance trace (Ctrl+Shift+E)
      if (event.key === 't') {
        event.preventDefault();
        enhanceTraces();
        return;
      }

      // Refresh data
      if (event.key === 'r') {
        event.preventDefault();
        fetchFindings();
        return;
      }

      // Delete findings
      if (event.key === 'Backspace') {
        event.preventDefault();
        deleteFindings();
        return;
      }

      // Toggle recording
      if (event.key === ' ') {
        event.preventDefault();
        toggleRecording();
        return;
      }

      // Pagination
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (pagination.value.page > 1) {
          pagination.value.page--;
          fetchFindings();
        }
        return;
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (pagination.value.page < pagination.value.totalPages) {
          pagination.value.page++;
          fetchFindings();
        }
        return;
      }

      // Table scrolling
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        scrollTable('up');
        return;
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        scrollTable('down');
        return;
      }
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      findingsTable.value?.navigateFinding('up');
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      findingsTable.value?.navigateFinding('down');
      return;
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  onUnmounted(() => {
    stopAutoRefresh();
    document.removeEventListener('keydown', handleKeyDown);
  });
});
</script>

<template>
  <div class="h-full flex flex-col relative">
    <div class="flex justify-between items-center mb-4 px-4 pt-4">
      <h1 class="text-xl font-bold"><span class="fas fa-chart-line"></span> Dashboard</h1>
      <div class="flex-1 mx-4">
        <SearchInput 
          v-model="searchQuery" 
          @search="fetchFindings"
          ref="searchInput"
        />
      </div>
      <div class="flex items-center gap-2">
        <span>Show:</span>
        <Dropdown 
          v-model="pagination.entriesPerPage" 
          severity="contrast"
          :options="entriesPerPageOptions" 
          optionLabel="label" 
          optionValue="value"
          @change="onEntriesPerPageChange"
        />
        <Button 
          icon="fas fa-arrows-rotate"
          class="bg-surface-900 dark:bg-surface-300 text-white dark:text-surface-900 border-surface-900 dark:border-surface-300 hover:bg-surface-800 dark:hover:bg-surface-200 focus:ring-surface-500 dark:focus:ring-surface-0"
          @click="fetchFindings" 
          :loading="loading"
          :title="isAutoRefreshing ? `Auto-refreshing every ${autoRefreshInterval} seconds` : 'Refresh findings'"
        />
        <Button 
          icon="fas fa-robot"
          class="bg-surface-900 dark:bg-surface-300 text-white dark:text-surface-900 border-surface-900 dark:border-surface-300 hover:bg-surface-800 dark:hover:bg-surface-200 focus:ring-surface-500 dark:focus:ring-surface-0"
          @click="sendToAI" 
          :loading="sendingToAI"
          :disabled="selectedFindings.length === 0"
          title="Send selected findings to AI analysis"
        />
        <Button 
          icon="fas fa-download" 
          class="bg-surface-900 dark:bg-surface-300 text-white dark:text-surface-900 border-surface-900 dark:border-surface-300 hover:bg-surface-800 dark:hover:bg-surface-200 focus:ring-surface-500 dark:focus:ring-surface-0"
          @click="exportFindings" 
          :loading="exporting"
          :title="`Export ${selectedFindings.length || 'all'} findings`"
        />
        <Button 
          icon="fas fa-expand-arrows-alt"
          class="bg-surface-900 dark:bg-surface-300 text-white dark:text-surface-900 border-surface-900 dark:border-surface-300 hover:bg-surface-800 dark:hover:bg-surface-200 focus:ring-surface-500 dark:focus:ring-surface-0"
          @click="resetColumnWidths" 
          title="Reset column widths to default"
        />
        <Button 
          icon="fas fa-circle" 
          :class="isRecording 
            ? 'text-surface-0 !bg-green-700 !border-green-700 !hover:bg-green-600/80 !hover:border-green-600/80 !focus:ring-green-300'
            : 'text-surface-0 !bg-primary-700 !border-primary-700 !hover:bg-primary-600/80 !hover:border-primary-600/80 !focus:ring-primary-300'"
          @click="toggleRecording" 
          :loading="recording"
          :title="isRecording ? 'Stop recording (delete temp project)' : 'Start recording (create temp project)'"
        />
        <Button 
          icon="fas fa-trash" 
          class="text-surface-0 bg-primary-700 border-primary-700 hover:bg-primary-600/80 hover:border-primary-600/80 focus:ring-primary-300"
          @click="deleteFindings" 
          :loading="deleting"
          :title="`Delete ${selectedFindings.length || 'all'} findings`"
        />
        <Button 
          icon="fas fa-times-circle"
          class="text-surface-0 bg-primary-700 border-primary-700 hover:bg-primary-600/80 hover:border-primary-600/80 focus:ring-primary-300"
          @click="removeAIScore" 
          :loading="removingAIScore"
          :disabled="selectedFindings.length === 0"
          title="Remove selected findings AI score"
        />
        <Button 
          icon="fas fa-star"
          class="text-surface-0 !bg-yellow-600 !border-yellow-600 hover:!bg-yellow-500 hover:!border-yellow-500 focus:ring-yellow-300"
          @click="enhanceTraces" 
          :loading="enhancingTrace"
          :disabled="!selectedFinding && selectedFindings.length === 0"
          :title="selectedFindings.length > 0 ? `Enhance ${selectedFindings.length} traces` : 'Enhance selected finding trace'"
        >
        </Button>
        <div v-if="isAutoRefreshing" class="flex items-center gap-1 text-green-500">
          <span :style="{ width: `${Math.max(3, autoRefreshInterval.toString().length) * 0.75}rem` }" class="text-right">{{ countdownSeconds }}s</span>
          <span class="fas fa-clock"></span>
        </div>
      </div>
    </div>

    <div style="height: calc(100vh - 318px) !important">
       <CustomSplitter 
         :initialSize="65" 
         :minSize="10" 
         :maxSize="80"
         class="h-full"
       >
        <template #top>
          <FindingsTable 
            ref="findingsTable"
            :findings="findings"
            :loading="loading"
            :tableKey="tableKey"
            v-model:selectedFindings="selectedFindings"
            v-model:selectedFinding="selectedFinding"
            @filter-click="handleFilterClick"
            @finding-update="handleFindingUpdate"
          />
        </template>

        <template #bottom>
          <FindingCard 
            :selectedFinding="selectedFinding"
            :onFilterClick="(event, type, value) => handleFilterClick(event, type, value)"
            @finding-update="handleFindingUpdate"
          />
        </template>
      </CustomSplitter>
    </div>

    <!-- Paginator -->
    <div class="flex-shrink-0 border-t border-surface-600 py-2 relative">
      <div class="flex justify-center">
        <Paginator 
          v-model:first="paginatorFirst" 
          :rows="pagination.entriesPerPage" 
          :totalRecords="pagination.totalEntries"
          @page="onPageChange"
          :pt="{
            root: { class: '' },
            pageButton: { class: 'text-surface-200 hover:bg-surface-700' },
            current: { class: 'bg-blue-600 text-white' }
          }"
        />
      </div>
      <!-- Total count badge -->
      <div class="absolute top-4 right-2 flex items-center gap-1 p-2 bg-surface-800 rounded-md text-surface-300 dark:text-surface-400 border border-surface-600 dark:border-surface-500">
        <span class="fas fa-list-ul"></span>
        <span>{{ pagination.totalEntries.toLocaleString() }} records</span>
      </div>
    </div>
  </div>
</template>
