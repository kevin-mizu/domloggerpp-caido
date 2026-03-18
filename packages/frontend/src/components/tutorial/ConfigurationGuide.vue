<script setup lang="ts">
import Card from "primevue/card";
import { ref, onMounted, onUnmounted } from "vue";

const showImageModal = ref(false);
const selectedImage = ref('');

const openImageModal = (event: Event) => {
  const imgElement = event.target as HTMLImageElement;
  selectedImage.value = imgElement.src;
  showImageModal.value = true;
};

const closeImageModal = () => {
  showImageModal.value = false;
  selectedImage.value = '';
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && showImageModal.value) {
    closeImageModal();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <Card>
    <template #title>
      <div class="flex items-center gap-2">
        <span class="fas fa-cog"></span>
        Configure your extension
      </div>
    </template>
    <template #content>
      <p class="text-gray-400 dark:text-surface-400 mb-4">
        Configure DOMLogger++ to retrieve your favorite JavaScript sinks traffic to your Caido instance!
      </p>

      <div class="grid md:grid-cols-3 gap-4 mb-6">
        <div class="flex flex-col items-center text-center p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
          <div class="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mb-3">
            1
          </div>
          <h3 class="font-semibold mb-2">Open Settings</h3>
          <p class="text-sm text-gray-400 dark:text-surface-400">
            Press <kbd class="bg-surface-200 dark:bg-surface-700 px-1 rounded text-xs">Alt + Shift + O</kbd> or click the DOMLogger++ logo and settings icon.
          </p>
        </div>

        <div class="flex flex-col items-center text-center p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
          <div class="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mb-3">
            2
          </div>
          <h3 class="font-semibold mb-2">Configure Caido</h3>
          <p class="text-sm text-gray-400 dark:text-surface-400">
            Link your Caido instance, and enable/disable the webhook as you need.
          </p>
        </div>

        <div class="flex flex-col items-center text-center p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
          <div class="bg-yellow-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mb-3">
            !
          </div>
          <h3 class="font-semibold mb-2">Optimize Performance</h3>
          <p class="text-sm text-gray-400 dark:text-surface-400">
            Optionally disable DevTools tab to reduce performance impact.
          </p>
        </div>
      </div>

      <!-- Configuration Images -->
      <div class="grid md:grid-cols-2 gap-4 mt-6">
        <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4 border border-surface-200 dark:border-surface-700">
          <img 
            src="@/images/setup-domlogger-1.png" 
            alt="DOMLogger++ configuration setup screenshot" 
            class="w-full h-auto rounded border border-surface-300 dark:border-surface-600 cursor-pointer hover:opacity-90 transition-opacity"
            @click="openImageModal"
            title="Click to enlarge"
          />
          <p class="text-xs text-center text-gray-500 dark:text-surface-400 mt-2">
            Link the DOMLogger++ to your Caido instance.
          </p>
        </div>

        <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4 border border-surface-200 dark:border-surface-700">
          <img 
            src="@/images/setup-domlogger-2.png" 
            alt="DOMLogger++ configuration diagram" 
            class="w-full h-auto rounded border border-surface-300 dark:border-surface-600 pt-8 cursor-pointer hover:opacity-90 transition-opacity"
            @click="openImageModal"
            title="Click to enlarge"
          />
          <p class="text-xs text-center text-gray-500 dark:text-surface-400 mt-2">
            Disable Devtools tab to improve performance.
          </p>
        </div>
      </div>
    </template>
  </Card>

  <!-- Image Modal -->
  <div v-if="showImageModal" 
       class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
       @click="closeImageModal">
    <div class="relative max-w-[95vw] max-h-full">
      <img 
        :src="selectedImage" 
        alt="Enlarged image view"
        class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        @click.stop
      />
    </div>
  </div>
</template>
