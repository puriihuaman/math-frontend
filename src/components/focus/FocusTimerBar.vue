<script setup lang="ts">
import { Maximize, Pause, Play } from 'lucide-vue-next'
defineProps<{ remaining: number; paused: boolean }>()
defineEmits<{ pause: []; resume: []; fullscreen: [] }>()
const format = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
</script>
<template><div class="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-white"><span class="font-mono text-lg">{{ format(remaining) }}</span><div class="flex gap-2"><button class="rounded-lg bg-white/10 p-2" @click="paused ? $emit('resume') : $emit('pause')"><Play v-if="paused" :size="17" /><Pause v-else :size="17" /></button><button class="rounded-lg bg-white/10 p-2" @click="$emit('fullscreen')"><Maximize :size="17" /></button></div></div></template>
