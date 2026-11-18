Actúa como un Ingeniero Frontend Senior en Vue 3 y TypeScript. Revisa y corrige el flujo de selección de archivos entre `DriveFileBrowserModal.vue` y `WeekUploadModal.vue`:

### Problema Actual
1. El usuario abre `DriveFileBrowserModal.vue`, marca uno o más archivos de Google Drive y pulsa **"Agregar seleccionados"**.
2. El modal se cierra, pero al volver a `WeekUploadModal.vue` ("Cargar semana X.Y"), no aparece ningún archivo listado y el botón **"Procesar material"** sigue deshabilitado.

### Solución Obligatoria (Aplica estos 3 puntos)

1. **Estado unificado de archivos en `WeekUploadModal.vue`:**
   - Crea un estado reactivo único: `const queuedFiles = ref<Array<{ id: string; file: File; source: 'local' | 'drive' }>>([])`.
   - Cuando el usuario selecciona archivos desde el `<input type="file">` local, conviértelos y agrégalos a `queuedFiles` con `source: 'local'` (y limpia `event.target.value = ''` para permitir volver a seleccionar si se borra).
   - Cuando `DriveFileBrowserModal.vue` confirme la selección, descarga cada archivo seleccionado vía `GET https://www.googleapis.com/drive/v3/files/${fileId}?alt=media` (con `Authorization: Bearer ${token}`), conviértelo en `new File([blob], fileName, { type: mimeType })` y agrégalo a `queuedFiles` con `source: 'drive'`.
   - Muestra un indicador de carga (*"Descargando archivos de Drive..."*) mientras se descargan los blobs y lanza un Toast de error explícito si falla alguna descarga.

2. **Renderizado visual explícito de la lista de archivos en `WeekUploadModal.vue`:**
   - Debajo de los botones de carga, renderiza siempre que `queuedFiles.length > 0` una lista limpia con todos los archivos en cola mostrando:
      - Nombre del archivo (`item.file.name`) y tamaño en KB/MB.
      - Badge de origen (`"Google Drive"` en verde o `"Local"` en azul).
      - Botón `X` para quitar ese archivo individual de la cola.
   - Habilita el botón **"Procesar material"** siempre que `queuedFiles.length > 0` (sin depender del estado interno del `<input type="file">` nativo).

3. **Envío al Backend:**
   - Al enviar el formulario de `WeekUploadModal.vue`, extrae `queuedFiles.value.map(item => item.file)` y envíalos al endpoint `POST /api/v1/study/process-week-material`.
   - Si entre los archivos en cola hay alguno con `source === 'local'` y Google está conectado, súbelo también como respaldo a la carpeta `"DiscretaFlow - Matemática Discreta"` en Google Drive sin bloquear el procesamiento principal.

Verifica con `npm run type-check` que los eventos (`defineEmits`) entre `DriveFileBrowserModal.vue` y `WeekUploadModal.vue` coincidan exactamente en tipos.