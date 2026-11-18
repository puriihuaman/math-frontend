# Especificación Técnica y Plan de Implementación — Frontend MVP "DiscretaFlow"

## 1. Rol y Objetivo
Actúa como un Ingeniero Frontend Senior especialista en Vue 3 (Composition API + `<script setup lang="ts">`), TypeScript, Tailwind CSS y Google Client-Side APIs. Tu objetivo es construir el **Frontend completo, limpio, reactivo y listo para producción local** del MVP **"DiscretaFlow"**, una plataforma web anti-procrastinación diseñada para el estudio autónomo de Matemática Discreta (ciclo universitario de **4 Módulos × 4 Semanas**).

---

## 2. Stack Tecnológico y Restricciones de Arquitectura
- **Framework:** Vue 3.4+ + Vite + TypeScript estricto.
- **Gestión de Estado:** Pinia (`pinia`) con persistencia automática en `localStorage` y sincronización opcional de respaldo en Google Drive (`appDataFolder`).
- **Estilos:** Tailwind CSS (diseño limpio, minimalista, con modo claro y modo oscuro de alto contraste para evitar fatiga visual durante sesiones de estudio).
- **Renderizado Matemático:** `katex` para renderizar expresiones LaTeX en línea (`$...$`) y en bloque (`$$...$$`) en lecciones, fórmulas, pistas y ejercicios.
- **Iconografía:** `lucide-vue-next`.
- **Integración Google (Client-Side OAuth 2.0):** Google Identity Services (GIS) + Google Picker API + Google Drive REST API v3 + Google Calendar REST API v3.
- **Sin Login/Registro propio:** **NO habrá sistema de usuario/contraseña ni pantallas de autenticación tradicional.** La aplicación abre directamente en el espacio de trabajo local y ofrece un botón en el encabezado: **"Conectar Google (Drive y Calendar)"**.

---

## 3. Estructura de Directorios Obligatoria
Crea exactamente esta estructura de carpetas y archivos:

```text
discreta-frontend/
├── public/
├── src/
│   ├── assets/
│   │   └── main.css                  # Directivas Tailwind + estilos base KaTeX
│   ├── components/
│   │   ├── common/
│   │   │   ├── MathRenderer.vue      # Renderizador seguro de texto + LaTeX (KaTeX)
│   │   │   └── NavbarHeader.vue      # Navegación, estado de conexión Google y acceso a Configuración
│   │   ├── cycle/
│   │   │   ├── WeekUploadModal.vue   # Modal para importar desde Google Drive o subir PDF/PPTX local
│   │   │   └── WeekDetailDrawer.vue  # Vista de subtemas de la semana, botón Calendar y Test Examen
│   │   ├── focus/
│   │   │   ├── FocusTimerBar.vue     # Barra superior fija con temporizador, pausa y botón Pantalla Completa
│   │   │   └── DistractionAlertModal.vue # Alerta de interrupción (abandono de pestaña o inactividad)
│   │   ├── study/
│   │   │   ├── LessonReader.vue      # Lectura estructurada en 6 bloques pedagógicos
│   │   │   └── ExerciseRunner.vue    # Motor de 6 ejercicios progresivos con pistas y evaluación IA
│   │   └── settings/
│   │       └── SettingsModal.vue     # Configuración personalizable de sesiones, inactividad y Calendar
│   ├── composables/
│   │   ├── useFocusMonitor.ts        # Motor anti-distracciones (Page Visibility, inactividad, log)
│   │   └── useGoogleServices.ts      # OAuth 2.0 (GIS), Google Picker, Drive y Google Calendar
│   ├── services/
│   │   └── apiClient.ts              # Cliente HTTP tipado hacia el backend FastAPI
│   ├── stores/
│   │   └── useStudyStore.ts          # Estado global Pinia (4x4 módulos/semanas, progreso, sesión activa)
│   ├── types/
│   │   └── study.ts                  # Interfaces TypeScript alineadas con los schemas del Backend
│   ├── views/
│   │   ├── CycleMapView.vue          # Vista principal: Cuadrícula 4 Módulos × 4 Semanas
│   │   ├── StudySessionView.vue      # Vista inmersiva de sesión de estudio + Modo Enfoque
│   │   ├── WeeklyExamView.vue        # Vista de Test Examen Semanal (10 preguntas sin pistas)
│   │   └── ProgressDashboardView.vue # Métricas de progreso, rachas e historial de distracciones
│   ├── router/
│   │   └── index.ts                  # Vue Router (/, /session/:modulo/:semana/:subtemaId, /exam/:modulo/:semana, /progress)
│   ├── App.vue
│   └── main.ts
├── .env.example
├── index.html                        # Incluye scripts oficiales de Google GIS y Google API (gapi)
├── package.json
└── README.md
```

---

## 4. Contratos de Datos (`src/types/study.ts`)
Deben coincidir exactamente con el Backend FastAPI (`http://localhost:8000/api/v1/study`):

1. **`Subtema`**:
   - `id: string`
   - `orden: number`
   - `titulo: string`
   - `explicacion_simplificada: string`
   - `analogia_vida_real: string`
   - `conceptos_fundamentales: string[]`
   - `formulas_y_definiciones_originales: string[]`
   - `ejemplo_resuelto: string`
   - `referencias_material: string[]`
   - `completado?: boolean`

2. **`WeekData`**:
   - `modulo: number` (1 a 4)
   - `semana: number` (1 a 4)
   - `estado: 'pendiente' | 'procesada' | 'completada'`
   - `titulo_semana?: string`
   - `resumen_general?: string`
   - `subtemas: Subtema[]`
   - `calendarEventIds?: string[]` (IDs de eventos creados en Google Calendar para poder reprogramarlos)

3. **`Ejercicio`**:
   - `id: number`
   - `nivel: 'basico' | 'intermedio' | 'reto'`
   - `tipo: 'opcion_multiple' | 'respuesta_corta'`
   - `enunciado: string`
   - `opciones: string[] | null`
   - `respuesta_correcta: string`
   - `pista: string`
   - `explicacion_paso_a_paso: string`

4. **`UserSettings`**:
   - `duracionSesionMinutos: number` (default: `25`)
   - `tiempoInactividadSegundos: number` (default: `180` — 3 minutos)
   - `horaEstudioPreferida: string` (default: `"19:00"`)
   - `cantidadEjerciciosPorSesion: number` (default: `6`)

5. **`DistractionIncident`**:
   - `id: string`
   - `tipo: 'cambio_pestana' | 'inactividad'`
   - `fechaHora: string` (ISO string)
   - `duracionSegundos: number`
   - `subtemaTitulo: string`

6. **`ActiveSessionDraft`** (Persistencia intra-sesión para evitar pérdida si se cierra el navegador):
   - `modulo: number`
   - `semana: number`
   - `subtemaId: string`
   - `fase: 'lectura' | 'ejercicios'`
   - `ejercicios: Ejercicio[]`
   - `ejercicioActualIndex: number`
   - `respuestasUsuario: Record<number, { respuesta: string; esCorrecta: boolean; retroalimentacion: string }>`
   - `tiempoRestanteSegundos: number`

---

## 5. Especificación Funcional Detallada

### A. Mapa del Ciclo (`CycleMapView.vue`) y Carga de Material (`WeekUploadModal.vue`)
- Muestra los **4 Módulos** y dentro de cada uno sus **4 Semanas** (16 tarjetas en total) con indicadores visuales claros de estado (`Pendiente`, `En Progreso`, `Completada`).
- Al abrir una semana `Pendiente`, muestra dos vías de carga (permitiendo combinar PDF + PPTX de esa semana):
  1. **Importar desde Google Drive:** Abre el selector nativo **Google Picker** filtrado para `.pdf` y `.pptx`, descarga los blobs en memoria usando el `access_token` de Google y los envía al backend (`POST /api/v1/study/process-week-material`).
  2. **Subir desde mi PC (Drag & Drop):** Permite arrastrar archivos `.pdf` y `.pptx`. Si el usuario tiene Google conectado, sube automáticamente una copia respaldada a una carpeta llamada `"DiscretaFlow - Matemática Discreta"` en su Google Drive (creándola si no existe) y los envía al backend para procesarlos.
- **Resiliencia API:** Si el backend devuelve error `429` (límite de cuota gratuita de Gemini) o fallo de red, muestra un mensaje amigable en español con un botón **"Reintentar procesamiento"**.

### B. Integración con Google Calendar (`useGoogleServices.ts`)
- Al procesar una semana o hacer clic en **"Agendar sesiones en Calendar"**, crea eventos diarios consecutivos de `duracionSesionMinutos` (por defecto 25 min) a partir de hoy (o mañana) a la `horaEstudioPreferida`, respetando estrictamente el orden secuencial de los subtemas (Día 1: Subtema 1, Día 2: Subtema 2, etc.).
- **Reprogramación inteligente:** Incluye un botón **"Reprogramar pendientes a partir de hoy"** que toma los subtemas aún no completados de la semana actual y actualiza/recrea sus eventos en Google Calendar desde la fecha actual en orden secuencial, evitando la frustración por días perdidos.

### C. Anatomía de la Sesión de Estudio (`StudySessionView.vue`)
Al iniciar un subtema:
1. **Recuperación de sesión:** Si existe un `ActiveSessionDraft` guardado para ese subtema, pregunta si desea continuar donde lo dejó (ej. *Ejercicio 3 de 6*) o reiniciar.
2. **Fase 1 — Lectura Activa (`LessonReader.vue`):**
   - Renderiza con `MathRenderer.vue` (KaTeX) los **6 bloques pedagógicos** del subtema:
     1. *Explicación Simplificada* (lenguaje cotidiano).
     2. *Analogía de la Vida Real* (tarjeta destacada).
     3. *Conceptos Fundamentales* (checklist visual).
     4. *Fórmulas y Definiciones Originales* (bloque matemático formal).
     5. *Ejemplo Resuelto Paso a Paso*.
     6. *Referencias al Material del Curso* (etiquetas con archivo y página/diapositiva).
   - Botón principal: **"Listo, pasar a los ejercicios"** (llama a `POST /api/v1/study/generate-exercises` pasando `cantidadEjerciciosPorSesion`).
3. **Fase 2 — Práctica Progresiva (`ExerciseRunner.vue`):**
   - Muestra **1 ejercicio a la vez** (por defecto 6: 2 Básicos, 2 Intermedios, 2 Reto) con etiqueta de nivel de dificultad.
   - Recordatorio visual sutil: *"Resuelve en papel y lápiz antes de responder"*.
   - **Botón "Necesito una pista":** Despliega el campo `pista` del ejercicio sin penalización.
   - **Opción Múltiple:** Evalúa localmente y muestra de inmediato la `explicacion_paso_a_paso` (explicando por qué los distractores eran trampas comunes).
   - **Respuesta Corta:** Envía la respuesta al endpoint `POST /api/v1/study/evaluate-short-answer` y muestra el puntaje (`0-100`) y la `retroalimentacion` semántica de la IA.
   - Al completar los 6 ejercicios, marca el subtema como `completado`, actualiza la racha de estudio, sincroniza el JSON de progreso en Google Drive (`appDataFolder`) si está conectado, y limpia el borrador intra-sesión.

### D. Motor del Bloqueador de Distracciones — Modo Enfoque (`useFocusMonitor.ts`)
Activo automáticamente dentro de `StudySessionView.vue` y `WeeklyExamView.vue`:
- **Pantalla Completa:** Botón en `FocusTimerBar.vue` para activar/desactivar `document.documentElement.requestFullscreen()`.
- **Detección de Abandono:** Escucha `document.addEventListener('visibilitychange', ...)` y `window.addEventListener('blur', ...)`. Si el usuario cambia de pestaña o ventana, el temporizador **se pausa automáticamente** en ese instante y comienza a contar el tiempo de distracción.
- **Detección de Inactividad:** Escucha `mousemove`, `keydown`, `click` y `scroll`. Si transcurren `userSettings.tiempoInactividadSegundos` (por defecto 180s = 3 min) sin eventos, el temporizador **se pausa automáticamente**.
- **Registro y Alerta Visual:** Cuando el usuario regresa a la pestaña o vuelve a mover el mouse, registra la incidencia en `useStudyStore` (`tipo`, `fechaHora`, `duracionSegundos`, `subtemaTitulo`) y despliega `DistractionAlertModal.vue` mostrando cuántos segundos/minutos se perdió el enfoque y un botón **"Retomar sesión de estudio"**.

### E. Test Examen Semanal (`WeeklyExamView.vue`)
- Disponible en cada semana procesada mediante el botón **"Rendir Test Examen Semanal"**.
- Llama a `POST /api/v1/study/generate-weekly-exam` para obtener **10 preguntas integradoras**.
- **Reglas de examen:** Se ejecuta bajo el Modo Enfoque, **deshabilita el botón de pistas**, oculta la retroalimentación hasta finalizar las 10 preguntas y entrega al final una nota sobre 20 (escala universitaria peruana) con el desglose detallado de aciertos y errores.

### F. Dashboard de Progreso (`ProgressDashboardView.vue`)
- Muestra:
  - **Racha actual** (días consecutivos completando al menos 1 sesión).
  - **Progreso del Ciclo** (barra de progreso global de las 16 semanas y desglose por Módulo 1 al 4).
  - **Promedio de notas** en Tests Semanales y precisión en ejercicios.
  - **Monitor de Enfoque:** Total de interrupciones registradas (abandono de pestaña vs. inactividad) y minutos totales recuperados/perdidos para fomentar la autoconciencia del hábito.
  - Botón manual **"Forzar respaldo en Google Drive"** (`discretaflow_progress.json` en `appDataFolder`).

---

## 6. Plan de Ejecución Paso a Paso
Construye la aplicación de manera incremental, asegurando que TypeScript compile sin errores (`npm run type-check` / `vue-tsc`):
1. Inicializa el proyecto Vite + Vue 3 + TypeScript + Tailwind CSS + Pinia + Vue Router + `katex` + `lucide-vue-next` y crea `.env.example` (`VITE_API_BASE_URL=http://localhost:8000`, `VITE_GOOGLE_CLIENT_ID=`, `VITE_GOOGLE_API_KEY=`).
2. Crea los tipos en `src/types/study.ts` y el cliente HTTP en `src/services/apiClient.ts` con interceptores de manejo de errores (`429` y errores de red).
3. Implementa `MathRenderer.vue` asegurando que procese correctamente bloques `$...$` y `$$...$$` con `katex.renderToString(..., { throwOnError: false })` sin romper saltos de línea ni HTML.
4. Implementa `useStudyStore.ts` con la inicialización de los 4 Módulos × 4 Semanas, `UserSettings`, persistencia en `localStorage` y persistencia del borrador intra-sesión.
5. Implementa `useGoogleServices.ts` (OAuth 2.0 GIS, Google Picker, subida/descarga en Drive, respaldo JSON en `appDataFolder` y creación/reprogramación secuencial en Calendar).
6. Implementa `useFocusMonitor.ts` con toda la lógica exacta de temporizador regresivo, detección de visibilidad/blur, detección de inactividad configurable, pausa automática y registro de incidencias.
7. Construye los componentes y vistas (`CycleMapView.vue`, `StudySessionView.vue`, `WeeklyExamView.vue`, `ProgressDashboardView.vue`, `SettingsModal.vue`).
8. Redacta un `README.md` detallado con el paso a paso para configurar Google Cloud Console (habilitar Drive API, Picker API, Calendar API, crear OAuth Client ID para `http://localhost:5173` y API Key para Picker) y arrancar el servidor de desarrollo con `npm run dev`.