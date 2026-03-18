<!-- For some unknown reason, PrimeVue Splitter breaks the Datatable scrolling flex. Due to that I need to implement my own Splitter (Probably skill issue on my side). -->

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';

interface CustomSplitterProps {
  initialSize?: number;
  minSize?: number;
  maxSize?: number;
  layout?: 'vertical' | 'horizontal';
}

const props = withDefaults(defineProps<CustomSplitterProps>(), {
  initialSize: 50,
  minSize: 20,
  maxSize: 80,
  layout: 'vertical'
});

const emit = defineEmits<{
  resize: [topSize: number, bottomSize: number];
}>();

const splitterRef = ref<HTMLElement>();
const topPanelRef = ref<HTMLElement>();
const bottomPanelRef = ref<HTMLElement>();
const handleRef = ref<HTMLElement>();

const isDragging = ref(false);
const topSize = ref(props.initialSize);

const startDrag = (e: MouseEvent) => {
  isDragging.value = true;
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
  e.preventDefault();
  e.stopPropagation();
};

const handleDrag = (e: MouseEvent) => {
  if (!isDragging.value || !splitterRef.value) return;

  const rect = splitterRef.value.getBoundingClientRect();
  let newTopSize: number;
  
  if (props.layout === 'horizontal') {
    newTopSize = ((e.clientX - rect.left) / rect.width) * 100;
  } else {
    newTopSize = ((e.clientY - rect.top) / rect.height) * 100;
  }

  // Apply min/max constraints
  const constrainedSize = Math.max(props.minSize, Math.min(props.maxSize, newTopSize));
  topSize.value = constrainedSize;

  emit('resize', constrainedSize, 100 - constrainedSize);
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
};

const updatePanels = () => {
  if (!topPanelRef.value || !bottomPanelRef.value) return;

  if (props.layout === 'horizontal') {
    topPanelRef.value.style.flex = `0 0 ${topSize.value}%`;
    bottomPanelRef.value.style.flex = `0 0 ${100 - topSize.value}%`;
  } else {
    topPanelRef.value.style.flex = `0 0 ${topSize.value}%`;
    bottomPanelRef.value.style.flex = `0 0 ${100 - topSize.value}%`;
  }
};

watch(topSize, () => {
  updatePanels();
});

onMounted(() => {
  nextTick(() => {
    updatePanels();
  });
});

onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
});
</script>

<template>
  <div ref="splitterRef" :class="['custom-splitter', `splitter-${props.layout}`]">
    <div ref="topPanelRef" class="splitter-panel top-panel">
      <slot name="top"></slot>
    </div>
    
    <div 
      ref="handleRef"
      :class="['splitter-handle', `handle-${props.layout}`]"
      @mousedown="startDrag"
      @click="(e) => e.stopPropagation()"
    ></div>
    
    <div ref="bottomPanelRef" class="splitter-panel bottom-panel">
      <slot name="bottom"></slot>
    </div>
  </div>
</template>

<style scoped>
.custom-splitter {
  display: flex;
  height: 100%;
  width: 100%;
}

.splitter-vertical {
  flex-direction: column;
}

.splitter-horizontal {
  flex-direction: row;
}

.splitter-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.splitter-handle {
  background-color: #484C56;
  flex-shrink: 0;
  transition: background-color 0.2s ease;
  position: relative;
  z-index: 10;
  user-select: none;
}

.handle-vertical {
  height: 3px;
  cursor: row-resize;
}

.handle-horizontal {
  width: 3px;
  cursor: col-resize;
}

.splitter-handle::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--surface-500);
  border-radius: 1px;
}

.handle-vertical::before {
  width: 20px;
  height: 2px;
}

.handle-horizontal::before {
  width: 2px;
  height: 20px;
}

.splitter-handle::after {
  content: ''; 
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--surface-500);
  border-radius: 1px;
}

.handle-vertical::after {
  width: 20px;
  height: 2px;
  margin-top: 2px;
}

.handle-horizontal::after {
  width: 2px;
  height: 20px;
  margin-left: 2px;
}
</style>
