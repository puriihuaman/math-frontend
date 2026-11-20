Actúa como un Ingeniero Frontend Senior en Vue 3 y TypeScript. En `ExerciseRunner.vue` (y en cualquier vista de ejercicios), **NO elimines ni deshabilites el apartado interactivo de Pista / Sugerencia**; asegúrate de mantenerlo 100% funcional y mejora únicamente su diseño visual para eliminar el color marrón/amarillo oscuro actual:

### 1. Mantener la Funcionalidad Interactiva de Pista / Sugerencia
- Debe existir siempre un botón claro y accesible antes de responder: **"Ver pista / sugerencia"** (con un icono de bombilla `Lightbulb` de `lucide-vue-next`), que al hacer clic despliegue u oculte (`showHint = !showHint`) el contenido de `currentExercise.pista`.
- Asegura que el texto de la pista se renderice usando `<MathRenderer :content="currentExercise.pista" />` para que cualquier fórmula matemática se vea nítida.

### 2. Reemplazar el Color Amarillo/Marrón por una Paleta Elegante (Cian / Sky)
- Reemplaza por completo las clases amarillas/ámbar/marrones (`bg-amber-...`, `bg-yellow-...`, `text-amber-...`) del botón y de la tarjeta de pista por un estilo **Cian / Azul Hielo translúcido** moderno que armonice con el fondo oscuro `slate-900`:
    - **Botón "Ver pista / sugerencia":** `inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-sky-300 bg-sky-500/10 border border-sky-500/25 hover:bg-sky-500/20 transition-colors`
    - **Tarjeta desplegada de la Pista:** `mt-3 p-4 rounded-xl bg-sky-950/40 border border-sky-500/30 border-l-4 border-l-sky-400 text-sky-100 text-sm leading-relaxed` con un encabezado pequeño en negrita (`text-sky-300 font-semibold mb-1`): `"Sugerencia para resolverlo:"`.

Verifica con `npm run type-check` que compile limpiamente.