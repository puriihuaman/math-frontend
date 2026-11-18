# Especificación de Evolución y Refactorización UI/UX — Frontend "DiscretaFlow" (V2)

## 1. Contexto y Objetivo
Actúa como un Ingeniero Frontend Senior especialista en Vue 3 (Composition API + `<script setup lang="ts">`), TypeScript, Tailwind CSS y Pinia.
Toma como base el proyecto actual desarrollado a partir de `PROMPT_FRONTEND.md` y ejecuta una **refactorización evolutiva** para corregir los fallos de integración con Google Drive, elevar la calidad visual (Dark Mode SaaS moderno) y mejorar la experiencia de usuario.

**Reglas transversales obligatorias:**
1. **Prohibido el uso de diálogos nativos del navegador:** Queda **estrictamente prohibido** usar `alert()`, `confirm()` o `prompt()` de JavaScript en cualquier componente o composable. Todo mensaje de éxito, error o advertencia debe mostrarse mediante un sistema global de notificaciones **Toast** reactivo, y toda confirmación debe usar modales personalizados en Vue.
2. **Uso correcto de Formularios:** Toda entrada de datos del usuario (configuración de tiempos, agendamiento de horarios en Calendar, respuestas cortas en ejercicios, búsqueda de archivos en Drive) debe estar envuelta en etiquetas semánticas `<form @submit.prevent="...">` con validación visual y soporte para envío con la tecla `Enter`.
3. **Preservar la lógica core ya construida:** Mantén intacta la compatibilidad con los contratos de `src/types/study.ts`, el motor de enfoque (`useFocusMonitor.ts`), `MathRenderer.vue` (KaTeX) y los endpoints de `apiClient.ts`.

---

## 2. Rediseño Visual y Estructura de Navegación (Layout SaaS Dark Mode)

Reemplaza el diseño claro actual por una arquitectura de aplicación SaaS moderna en **Modo Oscuro de Alto Contraste** (`bg-slate-950` / `#0F172A` para el fondo principal, `bg-slate-900` / `#1E293B` para tarjetas y paneles, bordes sutiles `border-slate-800`, y acentos en `indigo-500` y `emerald-500`):

1. **Barra Lateral Fija (`SidebarNav.vue`):**
    - Logo **DiscretaFlow** en la parte superior.
    - Enlaces de navegación con estado activo resaltado:
        - `Mapa del Ciclo` (`/`)
        - `Sesión de Enfoque` (acceso directo a la sesión activa o siguiente pendiente)
        - `Progreso & Analíticas` (`/progress`)
        - `Configuración & Integraciones` (`/settings`) — **Nueva vista dedicada**.

2. **Barra Superior de Estado (`TopStatusBar.vue`):**
    - Muestra 3 indicadores compactos y reactivos en tiempo real:
        - **Racha diaria:** Chip con icono de fuego (`X días de racha`).
        - **Duración de sesión configurada:** Chip (`25 min`).
        - **Estado real de Google:** Píldora interactiva que lee directamente el getter `studyStore.isGoogleTokenValid`. Si es `true`, muestra punto verde + `"Drive & Calendar: Conectado"` (haciendo clic lleva a `/settings`); si es `false`, muestra punto ámbar + `"Google: Desconectado (Conectar)"`.

3. **Tarjeta Héroe de Acción Inmediata en `CycleMapView.vue`:**
    - Encima de la cuadrícula de los 4 Módulos × 4 Semanas, añade un banner destacado: **"Continuar donde lo dejaste"**.
    - Detecta automáticamente si hay un `ActiveSessionDraft` en curso o selecciona el primer subtema `pendiente` del ciclo.
    - Incluye un botón principal de alto contraste: **`Iniciar Sesión de {duracionSesionMinutos} min`**.

---

## 3. Vista Dedicada de Configuración e Integraciones (`SettingsView.vue` — Ruta `/settings`)

Reemplaza el antiguo modal de configuración por una vista completa `/settings` dividida en 3 tarjetas con formularios limpios:

1. **Tarjeta 1: Integración con Google Drive y Google Calendar**
    - **Fuente única de verdad del estado de conexión:** Elimina cualquier variable duplicada de estado de conexión. Todo debe depender únicamente de `studyStore.googleAuth` (`accessToken`, `expiresAt`, `userEmail`, `userName`) y del getter `isGoogleTokenValid` (que valida `!!accessToken && Date.now() < expiresAt`).
    - **Si está desconectado (o el token expiró):** Muestra un botón claro **"Conectar cuenta de Google"** que inicia el flujo OAuth 2.0 (Google Identity Services) solicitando los scopes:
        - `https://www.googleapis.com/auth/drive.readonly`
        - `https://www.googleapis.com/auth/drive.file`
        - `https://www.googleapis.com/auth/drive.appdata`
        - `https://www.googleapis.com/auth/calendar.events`
        - `https://www.googleapis.com/auth/userinfo.email`
        - `https://www.googleapis.com/auth/userinfo.profile`
    - **Si está conectado:** Muestra el avatar/correo del usuario conectado (`userEmail`), los minutos restantes de validez del token, un botón **"Probar conexión"** (que hace una petición de verificación y muestra un Toast de éxito/error) y un botón **"Desconectar cuenta"** (que revoca el token y limpia `studyStore.googleAuth`).

2. **Tarjeta 2: Parámetros de Estudio y Enfoque (`<form @submit.prevent="saveSettings">`)**
    - Campos numéricos y selectores validados para:
        - Duración de la sesión de estudio (minutos, min: `10`, max: `90`, default: `25`).
        - Tiempo de inactividad antes de pausa automática (minutos, min: `1`, max: `15`, default: `3`).
        - Cantidad de ejercicios por sesión (default: `6`).
        - Hora preferida por defecto para agendar en Google Calendar (`<input type="time">`, default: `"19:00"`).
    - Botón `"Guardar preferencias"` que persiste en `localStorage` y dispara un Toast de confirmación.

3. **Tarjeta 3: Respaldo de Progreso**
    - Botón **"Sincronizar respaldo con Google Drive"** (guarda `discretaflow_progress.json` en `appDataFolder`) y botón **"Exportar JSON local"** como respaldo offline.

---

## 4. Reemplazo del Google Picker por Explorador Nativo de Drive API v3 (`DriveFileBrowserModal.vue`)

Para eliminar por completo el problema de ventanas congeladas o iframes bloqueados de Google Picker:
1. **Elimina la dependencia de `gapi.load('picker')` y de `VITE_GOOGLE_API_KEY`.**
2. En `WeekUploadModal.vue`, al hacer clic en **"Importar desde Google Drive"**:
    - Verifica `studyStore.isGoogleTokenValid`. Si es `false`, muestra un Toast de advertencia con enlace directo a `/settings` (nunca muestres estados contradictorios).
    - Si es `true`, abre un componente modal nativo en Vue (`DriveFileBrowserModal.vue`) que consulta directamente la **Google Drive REST API v3**:
      `GET https://www.googleapis.com/drive/v3/files?q=(mimeType='application/pdf' or mimeType='application/vnd.openxmlformats-officedocument.presentationml.presentation') and trashed=false&fields=files(id,name,mimeType,modifiedTime,size)&orderBy=modifiedTime desc&pageSize=25`
      usando el header `Authorization: Bearer ${studyStore.googleAuth.accessToken}`.
3. **Funcionalidades del Explorador Nativo (`DriveFileBrowserModal.vue`):**
    - Incluye un `<form @submit.prevent>` de búsqueda por nombre de archivo para filtrar rápidamente los apuntes de la universidad.
    - Permite seleccionar uno o varios archivos (ej. el PDF y el PPTX de la semana) mediante checkboxes.
    - Al confirmar la selección, cierra inmediatamente `DriveFileBrowserModal.vue`, descarga los archivos en memoria vía `GET https://www.googleapis.com/drive/v3/files/{fileId}?alt=media`, los convierte en objetos `File` nativos y los agrega a la lista de archivos listos para procesar en `WeekUploadModal.vue`.
    - Si la API de Drive responde `401 Unauthorized` (token expirado), limpia `studyStore.googleAuth`, cierra el modal y muestra un Toast pidiendo reconectar en Configuración.

---

## 5. Sistema Global de Notificaciones Toast (`ToastContainer.vue` + `useToast.ts`)
- Crea un composable ligero `useToast.ts` (`showSuccess`, `showError`, `showWarning`, `showInfo`) renderizado en `App.vue` (esquina inferior derecha).
- Reemplaza **todas** las llamadas existentes a `alert()` o `confirm()` en el proyecto (incluyendo `ExerciseRunner.vue`, `WeeklyExamView.vue`, `WeekDetailDrawer.vue` y `useGoogleServices.ts`) por notificaciones Toast o modales de confirmación en Vue.

---

## 6. Plan de Ejecución Paso a Paso
1. Implementa `useToast.ts` y `ToastContainer.vue` en `App.vue` y elimina cualquier `alert()`/`confirm()` del código base.
2. Refactoriza `useStudyStore.ts` para unificar `googleAuth` y `isGoogleTokenValid` como única fuente de verdad persistida en `localStorage`.
3. Actualiza `useGoogleServices.ts` eliminando `gapi`/`picker` e implementando `listDriveFiles()` y `downloadDriveFileAsBlob()` con `fetch` + `Authorization: Bearer`.
4. Construye `SidebarNav.vue`, `TopStatusBar.vue` y aplica la paleta Dark Mode (`slate-950` / `slate-900` / `indigo-500` / `emerald-500`) en todas las vistas existentes.
5. Implementa `SettingsView.vue` (`/settings`) y `DriveFileBrowserModal.vue` con formularios `<form @submit.prevent>`.
6. Actualiza `CycleMapView.vue` añadiendo la tarjeta héroe *"Continuar donde lo dejaste"* y verifica con `npm run type-check` que todo compile limpiamente.