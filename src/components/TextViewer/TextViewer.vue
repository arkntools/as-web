<template>
  <VueMonacoEditor :value="value || ''" :options="options" :language="language" />
</template>

<script setup lang="ts">
import '@/setup/monacoEditor';
import { VueMonacoEditor } from '@guolao/vue-monaco-editor';
import { isJSON } from 'es-toolkit';
import type { editor } from 'monaco-editor/esm/vs/editor/editor.api';

const props = defineProps<{
  value: string;
  isJson?: boolean;
}>();

const language = computed(() => (props.isJson || isJSON(props.value) ? 'json' : undefined));

const options: editor.IStandaloneEditorConstructionOptions = {
  readOnly: true,
  wordWrap: 'on',
  unicodeHighlight: {
    ambiguousCharacters: false,
    includeComments: false,
    includeStrings: false,
    invisibleCharacters: false,
    nonBasicASCII: false,
  },
};
</script>
