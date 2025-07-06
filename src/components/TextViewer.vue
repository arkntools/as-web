<template>
  <VueMonacoEditor :value="data || ''" :options="options" :language="language" />
</template>

<script setup lang="ts">
import '@/setup/monacoEditor';
import { VueMonacoEditor } from '@guolao/vue-monaco-editor';
import isJson from 'is-json';
import type { editor } from 'monaco-editor/esm/vs/editor/editor.api';

const props = defineProps<{
  data: string;
  isJson?: boolean;
}>();

const language = computed(() => (props.isJson || isJson(props.data) ? 'json' : undefined));

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
