# DiscretaFlow

Frontend MVP para estudiar Matemática Discreta en un ciclo de 4 módulos × 4 semanas. Está construido con Vue 3, TypeScript estricto, Vite, Pinia, Tailwind CSS y KaTeX.

## Desarrollo local

```bash
npm install
cp .env.example .env
npm run dev
```

El backend FastAPI debe estar disponible en `http://localhost:8000` (o en `VITE_API_BASE_URL`). Para verificar tipos y generar producción:

```bash
npm run type-check
npm run build
```

## Google Cloud (opcional)

1. En [Google Cloud Console](https://console.cloud.google.com/) crea o selecciona un proyecto.
2. Habilita **Google Drive API**, **Google Calendar API** y la API de Google Picker.
3. Configura la pantalla de consentimiento OAuth como aplicación externa (en modo prueba es suficiente para desarrollo) y agrega tu cuenta como usuario de prueba.
4. Crea un **OAuth Client ID** de tipo aplicación web. Agrega `http://localhost:5173` a los orígenes autorizados.
5. Crea una API Key para Picker y restringe su uso a las APIs habilitadas y al origen local.
6. Copia los valores en `.env`:

```env
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=tu-api-key
```

Después de crear o modificar `.env`, detén y vuelve a arrancar Vite (`npm run dev`); las variables `VITE_*` se incorporan al bundle al iniciar el servidor. En la aplicación, pulsa primero **Conectar Google** y completa el consentimiento. Luego, desde una semana pendiente, **Importar desde Google Drive** abre Picker, filtra PDF/PPTX y descarga los archivos seleccionados en memoria para enviarlos al backend.

Para evitar errores de autorización, en Google Cloud configura la API Key con el origen `http://localhost:5173` y habilita restricciones para **Google Picker API** y **Google Drive API**. El OAuth Client ID debe tener ese mismo origen como origen JavaScript autorizado. La primera conexión solicita el alcance de solo lectura de Drive para poder descargar archivos existentes seleccionados en Picker.

La aplicación no tiene usuario/contraseña propio. Google se conecta desde el encabezado y el estado de estudio se conserva automáticamente en `localStorage`. El respaldo manual usa `appDataFolder`; la integración con Calendar agenda los subtemas secuencialmente.

## API esperada

El backend expone `POST /api/v1/study/process-week-material`, `POST /api/v1/study/generate-exercises`, `POST /api/v1/study/evaluate-short-answer` y `POST /api/v1/study/generate-weekly-exam`. Los errores de red y HTTP 429 se muestran en español para permitir reintentos sin perder el contexto.
