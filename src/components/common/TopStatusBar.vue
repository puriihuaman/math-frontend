<script setup lang="ts">
import { Flame, Clock, Cloud } from 'lucide-vue-next'
import { useStudyStore } from '../../stores/useStudyStore'
const store = useStudyStore()
</script>
<template><header class="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 px-5 py-3 backdrop-blur"><div class="mx-auto flex max-w-7xl items-center justify-between gap-3 lg:ml-64"><RouterLink to="/" class="text-lg font-black text-white lg:hidden">Discreta<span class="text-indigo-400">Flow</span></RouterLink><div class="ml-auto flex flex-wrap justify-end gap-2"><span class="status-chip text-orange-300"><Flame :size="15" />{{ store.streak }} días de racha</span><span class="status-chip text-indigo-300"><Clock :size="15" />{{ store.settings.duracionSesionMinutos }} min</span><RouterLink to="/settings" class="status-chip" :class="store.isGoogleTokenValid ? 'text-emerald-300' : 'text-amber-300'"><Cloud :size="15" /><span class="h-2 w-2 rounded-full" :class="store.isGoogleTokenValid ? 'bg-emerald-400' : 'bg-amber-400'" />{{ store.isGoogleTokenValid ? 'Drive & Calendar: Conectado' : 'Google: Desconectado (Conectar)' }}</RouterLink></div></div></header></template>
