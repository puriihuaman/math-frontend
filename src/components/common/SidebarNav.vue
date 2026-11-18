<script setup lang="ts">
import { BarChart3, BookOpen, Settings, Target } from 'lucide-vue-next'
import { useStudyStore } from '../../stores/useStudyStore'
const store = useStudyStore()
const nextSession = () => {
  const week = store.weeks.find(item => item.subtemas.some(sub => !sub.completado))
  const sub = week?.subtemas.find(item => !item.completado)
  return week && sub ? `/session/${week.modulo}/${week.semana}/${sub.id}` : '/'
}
</script>
<template><aside class="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-800 bg-slate-900 p-5 lg:block"><RouterLink to="/" class="block border-b border-slate-800 pb-6 text-2xl font-black text-white">Discreta<span class="text-indigo-400">Flow</span></RouterLink><nav class="mt-8 space-y-2"><RouterLink to="/" class="nav-link"><BookOpen :size="18" />Mapa del Ciclo</RouterLink><RouterLink :to="nextSession()" class="nav-link"><Target :size="18" />Sesión de Enfoque</RouterLink><RouterLink to="/progress" class="nav-link"><BarChart3 :size="18" />Progreso & Analíticas</RouterLink><RouterLink to="/settings" class="nav-link"><Settings :size="18" />Configuración</RouterLink></nav><div class="absolute bottom-5 left-5 right-5 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">Estudia con intención.<br /><span class="text-indigo-400">Un concepto a la vez.</span></div></aside></template>
