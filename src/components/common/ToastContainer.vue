<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { useToast } from '../../composables/useToast'
const { toasts } = useToast()
const colors = { success: 'border-emerald-500/40 bg-emerald-950 text-emerald-100', error: 'border-red-500/40 bg-red-950 text-red-100', warning: 'border-amber-500/40 bg-amber-950 text-amber-100', info: 'border-indigo-500/40 bg-indigo-950 text-indigo-100' }
function dismiss(id: number) { toasts.value = toasts.value.filter(toast => toast.id !== id) }
</script>
<template><div class="fixed bottom-5 right-5 z-[100] flex w-[min(calc(100vw-2rem),24rem)] flex-col gap-3"><div v-for="toast in toasts" :key="toast.id" class="flex items-start justify-between gap-3 rounded-xl border p-4 text-sm shadow-2xl" :class="colors[toast.kind]"><span>{{ toast.message }}</span><button aria-label="Cerrar notificación" @click="dismiss(toast.id)"><X :size="16" /></button></div></div></template>
