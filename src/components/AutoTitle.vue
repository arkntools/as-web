<template>
  <span ref="span" :title="isEllipsis ? text : undefined">{{ text }}</span>
</template>

<script setup lang="ts">
import { debounce } from 'es-toolkit';

const { text = '', resizeTrigger } = defineProps<{ text?: string; resizeTrigger?: any }>();

const span = useTemplateRef('span');
const isEllipsis = ref(false);

const update = debounce(() => {
  if (!span.value) return;
  const { scrollWidth, offsetWidth } = span.value;
  isEllipsis.value = scrollWidth > offsetWidth;
}, 200);

onMounted(() => {
  update();
});

watch([() => text, () => resizeTrigger], update);
</script>
