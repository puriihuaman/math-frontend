import { computed, ref } from 'vue'
import type { UserSettings, WeekData } from '../types/study'
import { useStudyStore } from '../stores/useStudyStore'
import { useToast } from './useToast'

interface GoogleTokenResponse { access_token?: string; expires_in?: number; error?: string }
interface TokenClient { requestAccessToken: () => void }
export interface DriveFile { id: string; name: string; mimeType: string; modifiedTime?: string; size?: string }
interface GoogleOauth2 {
  initTokenClient: (config: { client_id: string; scope: string; callback: (response: GoogleTokenResponse) => void }) => TokenClient
  revoke: (token: string, callback?: () => void) => void
}
declare global { interface Window { google?: { accounts: { oauth2: GoogleOauth2 } } } }

const connecting = ref(false)
const error = ref('')
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
const googleScope = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'

function waitForGoogleScripts(timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now()
    const check = () => {
      if (window.google?.accounts?.oauth2) resolve()
      else if (Date.now() - started >= timeoutMs) reject(new Error('Google aún está cargando. Recarga la página e inténtalo de nuevo.'))
      else window.setTimeout(check, 100)
    }
    check()
  })
}

export function useGoogleServices() {
  const store = useStudyStore()
  store.hydrate()
  const toast = useToast()
  const accessToken = computed(() => store.isGoogleTokenValid ? store.googleAuth.accessToken : null)
  const connected = computed(() => store.isGoogleTokenValid)
  const userEmail = computed(() => store.googleAuth.userEmail)

  function connect() {
    error.value = ''
    if (!clientId) { error.value = 'Configura VITE_GOOGLE_CLIENT_ID en .env.'; toast.showError(error.value); return }
    connecting.value = true
    waitForGoogleScripts().then(() => {
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: googleScope,
        callback: response => {
          if (!response.access_token) { error.value = response.error || 'No se pudo conectar con Google.'; connecting.value = false; toast.showError(error.value); return }
          void (async () => {
            const expiresAt = Date.now() + Math.max(60, Number(response.expires_in || 3600) - 60) * 1000
            const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${response.access_token}` } })
            if (!profileResponse.ok) throw new Error('No se pudo obtener el perfil de Google.')
            const profile = await profileResponse.json() as { email?: string; name?: string }
            store.setGoogleAuth({ accessToken: response.access_token!, expiresAt, userEmail: profile.email || null, userName: profile.name || null })
            toast.showSuccess(`Google conectado${profile.email ? ` como ${profile.email}` : ''}.`)
          })().catch(reason => { const message = reason instanceof Error ? reason.message : 'No se pudo completar la conexión con Google.'; error.value = message; toast.showError(message) }).finally(() => { connecting.value = false })
        }
      })
      client.requestAccessToken()
    }).catch(reason => { connecting.value = false; error.value = reason instanceof Error ? reason.message : 'No se pudo cargar Google.'; toast.showError(error.value) })
  }

  function disconnect() {
    const token = store.googleAuth.accessToken
    if (token && window.google?.accounts?.oauth2) window.google.accounts.oauth2.revoke(token)
    store.clearGoogleAuth()
    toast.showInfo('Cuenta de Google desconectada.')
  }

  async function ensureResponse(response: Response, unauthorizedMessage = 'La sesión de Google expiró. Reconecta tu cuenta en Configuración.') {
    if (response.status === 401) { store.clearGoogleAuth(); throw new Error(unauthorizedMessage) }
    if (!response.ok) throw new Error(`Google Drive respondió con error ${response.status}.`)
    return response
  }

  async function listDriveFiles(search = ''): Promise<DriveFile[]> {
    if (!accessToken.value) throw new Error('Conecta Google para explorar Drive.')
    const query = "(mimeType='application/pdf' or mimeType='application/vnd.openxmlformats-officedocument.presentationml.presentation') and trashed=false"
    const params = new URLSearchParams({ q: query, fields: 'files(id,name,mimeType,modifiedTime,size)', orderBy: 'modifiedTime desc', pageSize: '25' })
    const response = await ensureResponse(await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers: { Authorization: `Bearer ${accessToken.value}` } }))
    const data = await response.json() as { files: DriveFile[] }
    return search.trim() ? data.files.filter(file => file.name.toLowerCase().includes(search.trim().toLowerCase())) : data.files
  }

  async function downloadDriveFileAsBlob(file: DriveFile): Promise<File> {
    if (!accessToken.value) throw new Error('La sesión de Google expiró. Reconecta tu cuenta.')
    const response = await ensureResponse(await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`, { headers: { Authorization: `Bearer ${accessToken.value}` } }))
    return new File([await response.blob()], file.name, { type: file.mimeType })
  }

  async function backupProgress() {
    if (!accessToken.value) throw new Error('Google no está conectado.')
    const metadata = { name: 'discretaflow_progress.json', parents: ['appDataFolder'] }
    const body = new FormData()
    body.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    body.append('file', new Blob([JSON.stringify({ weeks: store.weeks, incidents: store.incidents, examResults: store.examResults })], { type: 'application/json' }))
    await ensureResponse(await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', { method: 'POST', headers: { Authorization: `Bearer ${accessToken.value}` }, body }))
  }

  async function verifyConnection() {
    if (!accessToken.value) throw new Error('Google no está conectado.')
    await ensureResponse(await fetch('https://www.googleapis.com/drive/v3/about?fields=user', { headers: { Authorization: `Bearer ${accessToken.value}` } }))
  }

  async function findOrCreateBackupFolder(): Promise<string> {
    if (!accessToken.value) throw new Error('Google no está conectado.')
    const name = 'DiscretaFlow - Matemática Discreta'
    const query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    const params = new URLSearchParams({ q: query, fields: 'files(id,name)', pageSize: '10' })
    const listResponse = await ensureResponse(await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers: { Authorization: `Bearer ${accessToken.value}` } }))
    const list = await listResponse.json() as { files?: Array<{ id: string }> }
    if (list.files?.[0]?.id) return list.files[0].id
    const createResponse = await ensureResponse(await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken.value}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder' })
    }))
    const created = await createResponse.json() as { id: string }
    return created.id
  }

  async function uploadLocalFilesToFolder(files: File[]) {
    if (!accessToken.value) throw new Error('Google no está conectado.')
    const folderId = await findOrCreateBackupFolder()
    await Promise.all(files.map(async file => {
      const body = new FormData()
      body.append('metadata', new Blob([JSON.stringify({ name: file.name, parents: [folderId] })], { type: 'application/json' }))
      body.append('file', file)
      await ensureResponse(await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', { method: 'POST', headers: { Authorization: `Bearer ${accessToken.value}` }, body }))
    }))
  }

  async function scheduleWeekSessions(week: WeekData, onlyPending = false) {
    if (!store.isGoogleTokenValid || !accessToken.value) {
      toast.showWarning('Conecta Google en Configuración para agendar sesiones.')
      throw new Error('Google no está conectado.')
    }
    const settings = store.settings
    const subs = (onlyPending ? week.subtemas.filter(sub => !sub.completado) : week.subtemas).slice().sort((a, b) => a.orden - b.orden)
    const ids: string[] = []
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const [hour, minute] = settings.horaEstudioPreferida.split(':').map(Number)
    const firstDate = new Date()
    firstDate.setSeconds(0, 0)
    firstDate.setMinutes(minute)
    firstDate.setHours(hour)
    if (firstDate.getTime() <= Date.now()) firstDate.setDate(firstDate.getDate() + 1)

    for (let i = 0; i < subs.length; i++) {
      const start = new Date(firstDate)
      start.setDate(firstDate.getDate() + i)
      const end = new Date(start)
      end.setMinutes(end.getMinutes() + settings.duracionSesionMinutos)
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken.value}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: `DiscretaFlow: ${subs[i].titulo} (M${week.modulo}.S${week.semana})`,
          description: `${subs[i].explicacion_simplificada}\n\nConceptos clave:\n-${subs[i].conceptos_fundamentales.join('\n- ')}`,
          start: { dateTime: start.toISOString(), timeZone: timezone },
          end: { dateTime: end.toISOString(), timeZone: timezone }
        })
      })
      if (response.status === 401) { store.clearGoogleAuth(); toast.showError('La sesión de Google expiró. Reconecta tu cuenta en Configuración.'); throw new Error('Sesión de Google expirada.') }
      if (response.status === 403) { toast.showError('Google rechazó permisos de Calendar. Reconecta tu cuenta en Configuración para otorgar permisos.'); throw new Error('Permisos de Calendar insuficientes.') }
      if (!response.ok) throw new Error(`Google Calendar respondió con error ${response.status}.`)
      ids.push((await response.json() as { id: string }).id)
    }
    store.updateWeek({ ...week, calendarEventIds: [...(week.calendarEventIds || []), ...ids] })
    toast.showSuccess(`${ids.length} sesión(es) agendada(s) en Google Calendar.`)
    return ids
  }

  async function reschedulePendingSessions(week: WeekData) {
    if (!store.isGoogleTokenValid || !accessToken.value) {
      toast.showWarning('Conecta Google en Configuración para reprogramar sesiones.')
      throw new Error('Google no está conectado.')
    }
    for (const eventId of week.calendarEventIds || []) {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken.value}` }
      })
      if (response.status === 401) { store.clearGoogleAuth(); toast.showError('Reconecta tu cuenta de Google en Configuración.'); throw new Error('Sesión expirada.') }
      if (response.status === 403) toast.showError('Google rechazó permisos de Calendar. Reconecta tu cuenta en Configuración.')
    }
    const ids = await scheduleWeekSessions({ ...week, calendarEventIds: [] }, true)
    store.updateWeek({ ...week, calendarEventIds: ids })
    toast.showSuccess(`Se reprogramaron ${ids.length} sesión(es) pendientes desde hoy.`)
    return ids
  }

  return { connected, connecting, accessToken, userEmail, error, connect, disconnect, listDriveFiles, downloadDriveFileAsBlob, backupProgress, verifyConnection, uploadLocalFilesToFolder, scheduleWeekSessions, reschedulePendingSessions }
}
