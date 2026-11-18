import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useStudyStore } from '../stores/useStudyStore'
export function useFocusMonitor(subtemaTitulo: string) {
  const store = useStudyStore(); const remainingSeconds = ref(store.settings.duracionSesionMinutos * 60); const paused = ref(false); const distractionSeconds = ref(0); const alertSeconds = ref(0); const showAlert = ref(false)
  let timer: number | undefined; let idleTimer: number | undefined; let distractionStarted = 0
  function pause() { paused.value = true }
  function resume() { paused.value = false; if (distractionStarted) finishDistraction() }
  function finishDistraction() { const duration = Math.max(0, Math.round((Date.now() - distractionStarted) / 1000)); if (!duration) return; distractionSeconds.value = duration; alertSeconds.value = duration; store.addIncident({ id: crypto.randomUUID(), tipo: document.hidden ? 'cambio_pestana' : 'inactividad', fechaHora: new Date().toISOString(), duracionSegundos: duration, subtemaTitulo }); distractionStarted = 0; showAlert.value = true }
  function distracted() { if (!distractionStarted) { distractionStarted = Date.now(); pause() } }
  function activity() { window.clearTimeout(idleTimer); idleTimer = window.setTimeout(() => { if (!distractionStarted) { distractionStarted = Date.now(); pause() } }, store.settings.tiempoInactividadSegundos * 1000) }
  function toggleFullscreen() { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => undefined); else document.exitFullscreen().catch(() => undefined) }
  onMounted(() => { timer = window.setInterval(() => { if (!paused.value && remainingSeconds.value > 0) remainingSeconds.value-- }, 1000); document.addEventListener('visibilitychange', distracted); window.addEventListener('blur', distracted); window.addEventListener('focus', resume); ['mousemove', 'keydown', 'click', 'scroll'].forEach(e => window.addEventListener(e, activity)); activity() })
  onBeforeUnmount(() => { window.clearInterval(timer); window.clearTimeout(idleTimer); document.removeEventListener('visibilitychange', distracted); window.removeEventListener('blur', distracted); window.removeEventListener('focus', resume); ['mousemove', 'keydown', 'click', 'scroll'].forEach(e => window.removeEventListener(e, activity)) })
  return { remainingSeconds, paused, distractionSeconds, alertSeconds, showAlert, pause, resume, toggleFullscreen }
}
