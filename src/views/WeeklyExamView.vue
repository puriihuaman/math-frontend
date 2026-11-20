<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useStudyStore } from '../stores/useStudyStore'
import { apiClient } from '../services/apiClient'
import ExerciseRunner from '../components/study/ExerciseRunner.vue'
import FocusTimerBar from '../components/focus/FocusTimerBar.vue'
import { useFocusMonitor } from '../composables/useFocusMonitor'
import type { Ejercicio } from '../types/study'
const route = useRoute(); const store = useStudyStore(); const modulo = Number(route.params.modulo); const semana = Number(route.params.semana); const exercises = ref<Ejercicio[]>([]); const loading = ref(true); const error = ref(''); const focus = useFocusMonitor('Examen semanal'); const week = computed(() => store.weeks.find(w => w.modulo === modulo && w.semana === semana))
onMounted(async () => { store.hydrate(); try { if (!week.value) throw new Error('No se encontró la semana solicitada.') ; exercises.value = await apiClient.generateExam(week.value) } catch (e) { error.value = e instanceof Error ? e.message : 'No se pudo generar el examen.' } finally { loading.value = false } })
function finish() { store.addExamResult({ week: `${modulo}.${semana}`, score: 0, correct: 0, total: exercises.value.length, date: new Date().toISOString() }); history.back() }
</script>
<template><main class="mx-auto max-w-3xl space-y-5 px-5 py-6"><RouterLink to="/" class="text-sm text-slate-500">← Volver</RouterLink><h1 class="text-3xl font-black text-white">Test examen · Semana {{ modulo }}.{{ semana }}</h1><FocusTimerBar :remaining="focus.remainingSeconds.value" :paused="focus.paused.value" @pause="focus.pause" @resume="focus.resume" @fullscreen="focus.toggleFullscreen" /><p class="text-slate-400">Preguntas integradoras · con sugerencias · retroalimentación al finalizar.</p><p v-if="error" class="rounded-xl border border-rose-500/20 border-l-4 border-l-rose-400 bg-rose-500/10 p-4 text-slate-100">{{ error }}</p><p v-if="loading">Generando examen…</p><ExerciseRunner v-else :exercises="exercises" :modulo="modulo" :semana="semana" subtema-id="exam" @complete="finish" /></main></template>
