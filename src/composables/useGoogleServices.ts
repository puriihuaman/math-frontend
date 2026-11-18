import { computed, ref } from 'vue'
import type { UserSettings, WeekData } from '../types/study'
import { useStudyStore } from '../stores/useStudyStore'

interface GoogleTokenResponse { access_token?: string; expires_in?: number; error?: string }
interface TokenClient { requestAccessToken: () => void }
interface PickerDocument { id: string; name: string; mimeType: string }
interface PickerResult { action: string; docs?: PickerDocument[] }
interface PickerInstance { setVisible: (visible: boolean) => void }
interface PickerBuilder {
  addView: (view: unknown) => PickerBuilder
  setOAuthToken: (token: string) => PickerBuilder
  setDeveloperKey: (key: string) => PickerBuilder
  setCallback: (callback: (result: PickerResult) => void) => PickerBuilder
  build: () => PickerInstance
}
interface PickerView {
  setMimeTypes: (types: string) => PickerView
  setIncludeFolders: (include: boolean) => PickerView
  setSelectFolderEnabled: (enabled: boolean) => PickerView
}
interface GooglePicker {
  PickerBuilder: new () => PickerBuilder
  DocsView: new () => PickerView
  Action: { PICKED: string; CANCEL: string }
}
interface GoogleAccountsOauth2 {
  initTokenClient: (config: { client_id: string; scope: string; callback: (response: GoogleTokenResponse) => void }) => TokenClient
  revoke: (token: string, callback?: () => void) => void
}
interface Gapi {
  load: (name: string, callback: () => void) => void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: GoogleAccountsOauth2
      }
      picker?: GooglePicker
    }
    gapi?: Gapi
  }
}

const connecting = ref(false)
const error = ref('')
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY

function waitForGoogleScripts(timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now()
    const check = () => {
      if (window.google?.accounts?.oauth2 && window.gapi) {
        resolve()
      } else if (Date.now() - started >= timeoutMs) {
        reject(new Error('Google aún está cargando. Recarga la página e inténtalo de nuevo.'))
      } else {
        window.setTimeout(check, 100)
      }
    }
    check()
  })
}

function loadPickerApi(timeoutMs = 8000): Promise<void> {
  const gapi = window.gapi
  if (!gapi) return Promise.reject(new Error('La API de Google no está disponible.'))
  return new Promise((resolve, reject) => {
    let settled = false
    const timeout = window.setTimeout(() => {
      if (!settled) { settled = true; reject(new Error('Google Picker agotó el tiempo de carga. Verifica que el script y Picker API estén disponibles.')) }
    }, timeoutMs)
    try {
      gapi.load('picker', () => {
        if (!settled) { settled = true; window.clearTimeout(timeout); resolve() }
      })
    } catch {
      if (!settled) { settled = true; window.clearTimeout(timeout); reject(new Error('No se pudo cargar Google Picker. Verifica que Picker API esté habilitada.')) }
    }
  })
}

export function useGoogleServices() {
  const studyStore = useStudyStore()
  studyStore.hydrate()
  const accessToken = computed(() => studyStore.isGoogleTokenValid ? studyStore.googleAuth.accessToken : null)
  const connected = computed(() => studyStore.isGoogleTokenValid)
  const userEmail = computed(() => studyStore.isGoogleTokenValid ? studyStore.googleAuth.userEmail : null)
  function connect() {
    error.value = ''
    if (!clientId) {
      error.value = 'Configura VITE_GOOGLE_CLIENT_ID en tu archivo .env.'
      return
    }
    connecting.value = true
    waitForGoogleScripts().then(() => {
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        callback: response => {
          if (response.access_token) {
            void (async () => {
              const expiresAt = Date.now() + (Number(response.expires_in) - 60) * 1000
              const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${response.access_token}` } })
              if (!userInfoResponse.ok) throw new Error('Google autorizó la app, pero no se pudo obtener el perfil.')
              const userInfo = await userInfoResponse.json() as { email?: string; name?: string }
              studyStore.setGoogleAuth({ accessToken: response.access_token!, expiresAt, userEmail: userInfo.email || null, userName: userInfo.name || null })
              error.value = ''
            })().catch((reason: unknown) => { error.value = reason instanceof Error ? reason.message : 'No se pudo completar la conexión con Google.' }).finally(() => { connecting.value = false })
          } else {
            error.value = response.error || 'No se pudo conectar con Google.'
          }
          if (!response.access_token) connecting.value = false
        }
      })
      client.requestAccessToken()
    }).catch((reason: unknown) => {
      connecting.value = false
      error.value = reason instanceof Error ? reason.message : 'No se pudo cargar Google.'
    })
  }

  async function pickFiles(): Promise<File[]> {
    error.value = ''
    if (!apiKey) {
      error.value = 'Configura VITE_GOOGLE_API_KEY en tu archivo .env para usar Google Picker.'
      return []
    }
    if (!accessToken.value) {
      error.value = 'Conecta Google antes de importar archivos desde Drive.'
      return []
    }
    try {
      await waitForGoogleScripts()
      await loadPickerApi()
      if (!window.google?.picker) throw new Error('Google Picker no terminó de cargar. Verifica que Picker API esté habilitada.')
      const view = new window.google.picker.DocsView()
        .setIncludeFolders(false)
        .setSelectFolderEnabled(false)
        .setMimeTypes('application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation')
      const token = accessToken.value
      if (!token) throw new Error('La sesión de Google expiró. Vuelve a conectar Google.')
      return await new Promise<File[]>((resolve, reject) => {
        const picker = new window.google!.picker!.PickerBuilder()
          .addView(view)
          .setOAuthToken(token)
          .setDeveloperKey(apiKey)
          .setCallback(async result => {
            if (result.action === window.google!.picker!.Action.CANCEL || !result.docs?.length) {
              picker.setVisible(false)
              resolve([])
              return
            }
            picker.setVisible(false)
            try {
              const files = await Promise.all(result.docs.map(document => downloadDriveFile(document, token)))
              resolve(files)
            } catch (reason) {
              reject(reason)
            }
          })
          .build()
        picker.setVisible(true)
      })
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : 'No se pudo abrir Google Picker.'
      return []
    }
  }

  async function downloadDriveFile(document: PickerDocument, token: string): Promise<File> {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(document.id)}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken.value}` }
    })
    if (!response.ok) throw new Error(`No se pudo descargar "${document.name}" desde Google Drive.`)
    return new File([await response.blob()], document.name, { type: document.mimeType })
  }

  async function backupProgress() {
    if (!accessToken.value) throw new Error('Google no está conectado.')
    const store = useStudyStore()
    const content = JSON.stringify({ weeks: store.weeks, incidents: store.incidents, examResults: store.examResults })
    const metadata = { name: 'discretaflow_progress.json', parents: ['appDataFolder'] }
    const body = new FormData()
    body.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    body.append('file', new Blob([content], { type: 'application/json' }))
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken.value}` },
      body
    })
    if (!response.ok) throw new Error('Google Drive rechazó el respaldo.')
  }

  async function scheduleWeek(week: WeekData, settings: UserSettings, onlyPending = false) {
    if (!accessToken.value) throw new Error('Conecta Google para agendar sesiones.')
    const subs = (onlyPending ? week.subtemas.filter(s => !s.completado) : week.subtemas).slice().sort((a, b) => a.orden - b.orden)
    const start = new Date()
    const ids: string[] = []
    for (let i = 0; i < subs.length; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      const [hour, minute] = settings.horaEstudioPreferida.split(':').map(Number)
      date.setHours(hour, minute, 0, 0)
      const end = new Date(date)
      end.setMinutes(end.getMinutes() + settings.duracionSesionMinutos)
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken.value}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: `DiscretaFlow: ${subs[i].titulo}`, start: { dateTime: date.toISOString() }, end: { dateTime: end.toISOString() } })
      })
      if (response.ok) ids.push((await response.json()).id)
    }
    return ids
  }

  async function uploadBackup(_file: File) {
    if (connected.value) await backupProgress()
  }

  function disconnect() {
    const token = studyStore.googleAuth.accessToken
    if (token && window.google?.accounts?.oauth2) window.google.accounts.oauth2.revoke(token)
    studyStore.clearGoogleAuth()
  }

  return { connected, connecting, accessToken, userEmail, error, connect, disconnect, backupProgress, scheduleWeek, pickFiles, uploadBackup }
}
