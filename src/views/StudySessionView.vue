<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useRoute} from "vue-router";
import {useStudyStore} from "../stores/useStudyStore";
import {apiClient} from "../services/apiClient";
import {useFocusMonitor} from "../composables/useFocusMonitor";
import LessonReader from "../components/study/LessonReader.vue";
import ExerciseRunner from "../components/study/ExerciseRunner.vue";
import FocusTimerBar from "../components/focus/FocusTimerBar.vue";
import DistractionAlertModal from "../components/focus/DistractionAlertModal.vue";
import type {Ejercicio} from "../types/study";

const route = useRoute();
const store = useStudyStore();
const module = Number(route.params.modulo);
const weekNumber = Number(route.params.semana);
const id = String(route.params.subtemaId);
const subtema = computed(() => store.weeks.find(w => w.modulo === module && w.semana === weekNumber)?.subtemas.find(s => s.id === id));
const phase = ref<"lectura" | "ejercicios">("lectura");
const exercises = ref<Ejercicio[]>([]);
const loading = ref(false);
const error = ref("");
const focus = useFocusMonitor(subtema.value?.titulo || "Subtema");
onMounted(store.hydrate);

async function startExercises() {
  if (!subtema.value) return;
  loading.value = true;
  try {
    exercises.value = await apiClient.generateExercises(subtema.value, store.settings.cantidadEjerciciosPorSesion);
    store.saveDraft({
      modulo: module,
      semana: weekNumber,
      subtemaId: id,
      fase: "ejercicios",
      ejercicios: exercises.value,
      ejercicioActualIndex: 0,
      respuestasUsuario: {},
      tiempoRestanteSegundos: focus.remainingSeconds.value
    });
    phase.value = "ejercicios";
  } catch (e) {
    error.value = e instanceof Error ? e.message : "No se pudieron generar los ejercicios.";
  } finally {
    loading.value = false;
  }
}
</script>
<template>
  <div class="min-h-screen">
    <main class="mx-auto max-w-3xl px-5 py-6">
      <RouterLink to="/" class="text-sm text-slate-500">← Volver al mapa</RouterLink>
      <div v-if="subtema" class="mt-5 space-y-5">
        <div><p class="text-sm font-bold uppercase text-indigo-400">Sesión de enfoque</p>
          <h1 class="text-3xl font-black text-white">{{ subtema.titulo }}</h1></div>
        <FocusTimerBar :remaining="focus.remainingSeconds.value" :paused="focus.paused.value"
                       @pause="focus.pause" @resume="focus.resume"
                       @fullscreen="focus.toggleFullscreen"/>
        <p v-if="error" class="rounded-xl border border-red-500/30 bg-red-950 p-3 text-red-200">
          {{ error }}</p>
        <LessonReader v-if="phase === 'lectura'" :subtema="subtema" @exercises="startExercises"/>
        <p v-if="loading" class="text-center text-slate-500">Generando práctica personalizada…</p>
        <ExerciseRunner v-if="phase === 'ejercicios' && !loading" :exercises="exercises"
                        :modulo="module" :semana="weekNumber" :subtema-id="id"
                        @progress="store.draft && store.saveDraft({ ...store.draft, ejercicioActualIndex: $event })"
                        @complete="store.completeSubtopic(module, weekNumber, id); store.saveDraft(null); $router.push('/')"/>
      </div>
      <p v-else class="py-20 text-center">Subtema no encontrado.</p></main>
    <DistractionAlertModal v-if="focus.showAlert.value" :seconds="focus.alertSeconds.value"
                           @close="focus.showAlert.value = false"/>
  </div>
</template>
