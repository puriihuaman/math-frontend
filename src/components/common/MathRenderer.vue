<script setup lang="ts">
import katex from 'katex'
import { computed } from 'vue'
const props = defineProps<{ content: string }>()
const rendered = computed(() => {
  const escaped = props.content.replace(/&(?!(?:amp|lt|gt|quot);)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escaped.replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+)\$/g, (_match, block, inline) => katex.renderToString(block || inline, { throwOnError: false, displayMode: Boolean(block) }))
})
</script>
<template><div class="whitespace-pre-line leading-7" v-html="rendered" /></template>
