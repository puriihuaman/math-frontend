Actúa como un Ingeniero Frontend Senior en Vue 3 (Composition API + TypeScript) y Tailwind CSS. Realiza **tres correcciones puntuales** sobre el código actual sin alterar el diseño Dark Mode, el sidebar ni el explorador nativo de Google Drive que ya funcionan:

### 1. Corregir los payloads de `apiClient.ts` (Eliminar errores `422 Unprocessable Content`)
Revisa `src/services/apiClient.ts` donde se llaman los endpoints de generación:
- **En `generateExercises` (`POST /api/v1/study/generate-exercises`):**
  El backend espera un objeto plano en la raíz. Asegúrate de mapear y enviar exactamente este JSON:
  ```ts
  {
    titulo_subtema: subtema.titulo,
    explicacion_simplificada: subtema.explicacion_simplificada,
    conceptos_fundamentales: subtema.conceptos_fundamentales,
    formulas: subtema.formulas_y_definiciones_originales,
    cantidad: cantidad
  }
  ```
- **En `generateWeeklyExam` (`POST /api/v1/study/generate-weekly-exam`):**
  Asegúrate de incluir `titulo_semana` en el cuerpo de la petición:
  ```ts
  {
    titulo_semana: weekData.titulo_semana || `Módulo ${weekData.modulo} - Semana${weekData.semana}`,
    modulo: weekData.modulo,
    semana: weekData.semana,
    subtemas: weekData.subtemas
  }
  ```

### 2. Renderizado Matemático Completo con KaTeX (`main.ts`, `MathRenderer.vue`, `LessonReader.vue`)
- Verifica que en `src/main.ts` esté importada la hoja de estilos oficial de KaTeX:
  `import 'katex/dist/katex.min.css';`
- Revisa `LessonReader.vue` (y cualquier vista de resumen de semana) y asegúrate de que **todos** los textos que puedan contener símbolos matemáticos pasen por `<MathRenderer :content="..." />`, específicamente:
    - `explicacion_simplificada`
    - cada ítem del listado `conceptos_fundamentales`
    - cada ítem de `formulas_y_definiciones_originales`
    - `ejemplo_resuelto`
- En `MathRenderer.vue`, verifica que soporte correctamente expresiones en bloque `$$...$$` (`displayMode: true`) y en línea `$...$` (`displayMode: false`), limpiando cualquier doble barra invertida escapada (`\\`) si viniera del JSON.

### 3. Arreglar el Agendamiento y Reprogramación en Google Calendar (`useGoogleServices.ts` y `WeekDetailDrawer.vue`)
Asegúrate de que Google Calendar no dependa de `gapi.client.calendar` (ya eliminado), sino de `fetch` directo contra la **Google Calendar REST API v3**:
- **Crear eventos secuenciales (`scheduleWeekSessions`):**
    - Valida `studyStore.isGoogleTokenValid`. Si no es válido, lanza un Toast de advertencia indicando conectar Google en `/settings`.
    - Para cada subtema de la semana (en orden `1, 2, 3...`), crea un evento diario consecutivo empezando desde hoy (o mañana si la hora configurada ya pasó hoy) a la hora `studyStore.settings.horaEstudioPreferida` con duración `studyStore.settings.duracionSesionMinutos` minutos.
    - Llama a `POST https://www.googleapis.com/calendar/v3/calendars/primary/events` con headers:
      `Authorization: Bearer ${studyStore.googleAuth.accessToken}` y `Content-Type: application/json`. - Cuerpo del evento: ```ts { summary: `DiscretaFlow: ${subtema.titulo} (M${modulo}.S${semana})`,
      description: `${subtema.explicacion_simplificada}\n\nConceptos clave:\n-${subtema.conceptos_fundamentales.join('\n- ')}`,
      start: { dateTime: startIsoString, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      end: { dateTime: endIsoString, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
      }
```
- Guarda los `event.id` devueltos en `weekData.calendarEventIds` y muestra un Toast de éxito con la cantidad de sesiones agendadas.
- Si Google devuelve `403`, muestra un Toast claro indicando que se debe reconectar la cuenta en Configuración para otorgar permisos de Calendar.
- **Reprogramar pendientes (`reschedulePendingSessions`):**
- Filtra los subtemas de la semana con `!subtema.completado`, elimina los eventos antiguos asociados (si existen en `calendarEventIds` vía `DELETE .../events/{eventId}` ignorando errores 404/410) y vuelve a agendarlos secuencialmente a partir de hoy.

Verifica con `npm run type-check` que todo compile sin errores.