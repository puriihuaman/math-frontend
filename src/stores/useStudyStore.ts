import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ActiveSessionDraft, DistractionIncident, ExamResult, Subtema, UserSettings, WeekData } from '../types/study'

export interface GoogleAuthState {
  isConnected: boolean
  accessToken: string | null
  expiresAt: number | null
  userEmail: string | null
  userName: string | null
}

const emptyGoogleAuth = (): GoogleAuthState => ({ isConnected: false, accessToken: null, expiresAt: null, userEmail: null, userName: null })
const emptyWeek = (modulo: number, semana: number): WeekData => ({ modulo, semana, estado: 'pendiente', subtemas: [] })
const defaults: UserSettings = { duracionSesionMinutos: 25, tiempoInactividadSegundos: 180, horaEstudioPreferida: '19:00', cantidadEjerciciosPorSesion: 6 }

export const useStudyStore = defineStore('study', () => {
  const weeks = ref<WeekData[]>(Array.from({ length: 16 }, (_, i) => emptyWeek(Math.floor(i / 4) + 1, (i % 4) + 1)))
  const settings = ref<UserSettings>({ ...defaults })
  const incidents = ref<DistractionIncident[]>([])
  const draft = ref<ActiveSessionDraft | null>(null)
  const examResults = ref<ExamResult[]>([])
  const completedSessionDates = ref<string[]>([])
  const googleAuth = ref<GoogleAuthState>(emptyGoogleAuth())
  const hydrated = ref(false)
  const storageKey = 'discretaflow-state'
  const persist = () => localStorage.setItem(storageKey, JSON.stringify({ weeks: weeks.value, settings: settings.value, incidents: incidents.value, draft: draft.value, examResults: examResults.value, completedSessionDates: completedSessionDates.value, googleAuth: googleAuth.value }))
  function hydrate() {
    if (hydrated.value) return
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null')
      if (saved) { weeks.value = saved.weeks || weeks.value; settings.value = { ...defaults, ...saved.settings }; incidents.value = saved.incidents || []; draft.value = saved.draft || null; examResults.value = saved.examResults || []; completedSessionDates.value = saved.completedSessionDates || []; googleAuth.value = { ...emptyGoogleAuth(), ...saved.googleAuth } }
    } finally { hydrated.value = true }
  }
  function updateWeek(data: WeekData) { const i = weeks.value.findIndex(w => w.modulo === data.modulo && w.semana === data.semana); if (i >= 0) weeks.value[i] = data; persist() }
  function completeSubtopic(modulo: number, semana: number, id: string) { const week = weeks.value.find(w => w.modulo === modulo && w.semana === semana); const sub = week?.subtemas.find(s => s.id === id); if (sub) sub.completado = true; if (week && week.subtemas.length && week.subtemas.every(s => s.completado)) week.estado = 'completada'; completedSessionDates.value.push(new Date().toISOString().slice(0, 10)); persist() }
  function saveDraft(value: ActiveSessionDraft | null) { draft.value = value; persist() }
  function addIncident(incident: DistractionIncident) { incidents.value.unshift(incident); persist() }
  function updateSettings(value: UserSettings) { settings.value = value; persist() }
  function addExamResult(result: ExamResult) { examResults.value.push(result); persist() }
  function clearGoogleAuth() { googleAuth.value = emptyGoogleAuth(); persist() }
  function setGoogleAuth(value: Omit<GoogleAuthState, 'isConnected'>) { googleAuth.value = { ...value, isConnected: true }; persist() }
  const isGoogleTokenValid = computed(() => {
    const valid = googleAuth.value.isConnected && !!googleAuth.value.accessToken && !!googleAuth.value.expiresAt && Date.now() < googleAuth.value.expiresAt
    if (!valid && googleAuth.value.isConnected) clearGoogleAuth()
    return valid
  })
  const totalCompleted = computed(() => weeks.value.reduce((n, w) => n + w.subtemas.filter(s => s.completado).length, 0))
  const streak = computed(() => { const dates = new Set(completedSessionDates.value); let day = new Date(); let count = 0; while (dates.has(day.toISOString().slice(0, 10))) { count++; day.setDate(day.getDate() - 1) } return count })
  return { weeks, settings, incidents, draft, examResults, googleAuth, isGoogleTokenValid, hydrate, updateWeek, completeSubtopic, saveDraft, addIncident, updateSettings, addExamResult, setGoogleAuth, clearGoogleAuth, totalCompleted, streak }
})
