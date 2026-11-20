<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Ejercicio } from '../../types/study'
import { apiClient } from '../../services/apiClient'
import MathRenderer from '../common/MathRenderer.vue'
import { Lightbulb } from 'lucide-vue-next'

const props = defineProps<{
  exercises: Ejercicio[]
  modulo: number
  semana: number
  subtemaId: string
}>()
const emit = defineEmits<{ complete: []; progress: [index: number] }>()
const index = ref(0)
const answer = ref('')
const submitted = ref(false)
const multipleChoiceCorrect = ref<boolean | null>(null)
const shortFeedback = ref<{ score: number; retroalimentacion: string } | null>(null)
const showHint = ref(false)
const busy = ref(false)
const exercise = computed(() => props.exercises[index.value])

async function submit() {
  if (!answer.value.trim() || busy.value || !exercise.value) return
  busy.value = true
  submitted.value = true
  if (exercise.value.tipo === 'opcion_multiple') {
    multipleChoiceCorrect.value = answer.value === exercise.value.respuesta_correcta
  } else {
    try {
      shortFeedback.value = await apiClient.evaluateShortAnswer({
        ejercicio: exercise.value,
        respuesta: answer.value
      })
    } catch (reason) {
      shortFeedback.value = {
        score: 0,
        retroalimentacion: reason instanceof Error ? reason.message : 'No se pudo evaluar.'
      }
    }
  }
  busy.value = false
}

function next() {
  if (index.value === props.exercises.length - 1) {
    emit('complete')
    return
  }
  index.value++
  emit('progress', index.value)
  answer.value = ''
  submitted.value = false
  multipleChoiceCorrect.value = null
  shortFeedback.value = null
  showHint.value = false
}

function optionClass(option: string) {
  const base = 'flex w-full items-center gap-3.5 rounded-xl border p-4 text-left transition-all'
  if (!submitted.value) {
    return `${base} ${answer.value === option
      ? 'border-indigo-500 bg-indigo-500/15 text-white'
      : 'border-slate-700/80 bg-slate-800/70 hover:border-indigo-500/60 hover:bg-slate-800'}`
  }
  if (option === exercise.value?.respuesta_correcta) {
    return `${base} border-emerald-500 bg-emerald-500/15 text-emerald-100`
  }
  if (answer.value === option) {
    return `${base} border-rose-500 bg-rose-500/15 text-rose-100`
  }
  return `${base} border-slate-700/80 bg-slate-800/70 opacity-70`
}

function optionLetter(optionIndex: number) {
  return String.fromCharCode(65 + optionIndex)
}
</script>

<template>
  <form v-if="exercise" class="card space-y-5" @submit.prevent="submitted ? next() : submit()">
    <div class="flex justify-between text-sm">
      <span>Ejercicio {{ index + 1 }} de {{ exercises.length }}</span>
      <span class="rounded-full bg-indigo-500/10 px-3 py-1 text-indigo-300">{{ exercise.nivel }}</span>
    </div>
    <p class="text-sm text-slate-400">Resuelve en papel y lápiz antes de responder.</p>
    <div class="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <MathRenderer :content="exercise.enunciado" />
    </div>

    <div v-if="exercise.tipo === 'opcion_multiple'" class="space-y-3">
      <button
        v-for="(option, optionIndex) in exercise.opciones || []"
        :key="option"
        type="button"
        :disabled="submitted"
        :class="optionClass(option)"
        @click="answer = option"
      >
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current/30 bg-slate-950/30 text-sm font-bold">
          {{ optionLetter(optionIndex) }}
        </span>
        <span class="min-w-0 flex-1 text-left">
          <MathRenderer :content="option" />
        </span>
      </button>
    </div>

    <input
      v-else
      v-model="answer"
      class="w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
      placeholder="Escribe tu respuesta"
      :disabled="submitted"
    />

    <button v-if="!submitted" type="button" class="inline-flex items-center gap-2 rounded-lg border border-sky-500/25 bg-sky-500/10 px-3.5 py-2 text-sm font-medium text-sky-300 transition-colors hover:bg-sky-500/20" @click="showHint = !showHint">
      <Lightbulb :size="17" />
      Ver pista / sugerencia
    </button>
    <div v-if="showHint" class="mt-3 rounded-xl border border-sky-500/30 border-l-4 border-l-sky-400 bg-sky-950/40 p-4 text-sm leading-relaxed text-sky-100">
      <p class="mb-1 font-semibold text-sky-300">Sugerencia para resolverlo:</p>
      <MathRenderer :content="exercise.pista" />
    </div>

    <div v-if="submitted && exercise.tipo === 'opcion_multiple' && multipleChoiceCorrect === false"
         class="rounded-xl border border-rose-500/20 border-l-4 border-l-rose-400 bg-rose-500/10 p-4 text-slate-100">
      <p class="mb-2 text-xs font-bold uppercase tracking-wider text-rose-300">Respuesta incorrecta</p>
      <p>La respuesta correcta es:</p>
      <MathRenderer :content="exercise.respuesta_correcta" />
    </div>

    <div v-if="submitted && exercise.tipo === 'opcion_multiple'"
         class="rounded-xl border border-emerald-500/20 border-l-4 border-l-emerald-400 bg-emerald-500/10 p-4 text-slate-100">
      <p class="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-300">Solución paso a paso</p>
      <MathRenderer :content="exercise.explicacion_paso_a_paso" />
    </div>

    <div v-if="submitted && shortFeedback"
         class="rounded-xl border border-l-4 p-4 text-slate-100"
         :class="shortFeedback.score >= 60
           ? 'border-emerald-500/20 border-l-emerald-400 bg-emerald-500/10'
           : 'border-rose-500/20 border-l-rose-400 bg-rose-500/10'">
      <p class="mb-2 text-xs font-bold uppercase tracking-wider" :class="shortFeedback.score >= 60 ? 'text-emerald-300' : 'text-rose-300'">
        Retroalimentación · {{ shortFeedback.score }}/100
      </p>
      <MathRenderer :content="shortFeedback.retroalimentacion" />
    </div>

    <button class="btn-primary w-full" :disabled="!answer || busy">
      {{ submitted
        ? (index === exercises.length - 1 ? 'Finalizar sesión' : 'Siguiente ejercicio')
        : 'Evaluar respuesta' }}
    </button>
  </form>
</template>
