<script setup lang="ts">
import Card from "primevue/card";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useSDK } from "@/plugins/sdk";
import type { Project } from "@/types";

const sdk = useSDK();
const toast = useToast();

const projects = ref<Project[]>([]);
const loading = ref(false);
const deleting = ref<string | null>(null);

const formatTableSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const fetchProjects = async () => {
  try {
    loading.value = true;
    const result = await sdk.backend.getProjects();
    if (result.success) {
      projects.value = result.projects || [];
    } else {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: result.error || "Failed to fetch projects",
        life: 5000
      });
    }
  } catch (error) {
    toast.add({
      severity: "error", 
      summary: "Error",
      detail: "Failed to fetch projects",
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const deleteProject = async (projectName: string) => {
  try {
    deleting.value = projectName;
    const result = await sdk.backend.deleteProject(projectName);
    if (result.success) {
      toast.add({
        severity: "success",
        summary: "Success", 
        detail: `Project "${projectName}" deleted successfully`,
        life: 3000
      });
      await fetchProjects();
    } else {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: result.error || "Failed to delete project",
        life: 5000
      });
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error", 
      detail: "Failed to delete project",
      life: 3000
    });
  } finally {
    deleting.value = null;
  }
};

// Expose fetchProjects for parent component
defineExpose({
  fetchProjects
});

onMounted(() => {
  fetchProjects();
});
</script>

<template>
  <Card class="mb-6">
    <template #title>
      <div class="flex items-center gap-2">
        <span class="fas fa-folder"></span>
        Project Management
      </div>
    </template>
    <template #content>
      <div class="flex-1 overflow-auto settings-table">
        <DataTable 
          :value="projects" 
          :loading="loading"
          stripedRows
          tableStyle="min-width: 100%"
          responsiveLayout="scroll"
          dataKey="id"
          :emptyMessage="loading ? 'Loading projects...' : 'No projects found'"
        >
          <Column field="name" header="Project Name" sortable>
            <template #body="props">
              {{ props.data.name }}
            </template>
          </Column>

          <Column field="rowCount" header="Findings Count" sortable>
            <template #body="props">
              {{ props.data.rowCount.toLocaleString() }}
            </template>
          </Column>

          <Column field="tableSize" header="Size" sortable>
            <template #body="props">
              {{ formatTableSize(props.data.tableSize) }}
            </template>
          </Column>

          <Column field="created_at" header="Created" sortable>
            <template #body="props">
              {{ new Date(props.data.created_at).toLocaleDateString() }}
            </template>
          </Column>

          <Column header="Actions">
            <template #body="props">
              <span
                class="fas fa-trash cursor-pointer"
                :loading="deleting === props.data.name"
                :disabled="deleting !== null"
                @click="deleteProject(props.data.name)"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </template>
  </Card>
</template>
