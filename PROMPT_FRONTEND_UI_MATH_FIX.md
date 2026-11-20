Actúa como un Ingeniero Frontend Senior y Diseñador UI/UX especialista en Vue 3, TypeScript y Tailwind CSS. Realiza una mejora puntual en `ExerciseRunner.vue`, `WeeklyExamView.vue` y `src/assets/main.css` para corregir el renderizado de símbolos matemáticos en opciones/explicaciones y elevar la calidad visual del runner de ejercicios:

### 1. Renderizado Matemático Completo en `ExerciseRunner.vue` y `WeeklyExamView.vue`
- Asegúrate de que **absolutamente todos** los textos matemáticos usen `<MathRenderer :content="..." />`, incluyendo:
    - El `enunciado` del ejercicio.
    - Cada opción dentro de `opciones` (`<MathRenderer :content="opcion" />`).
    - La `pista` (`<MathRenderer :content="currentExercise.pista" />`).
    - La `explicacion_paso_a_paso` (`<MathRenderer :content="currentExercise.explicacion_paso_a_paso" />`).
    - La `retroalimentacion` devuelta por la IA en respuestas cortas (`<MathRenderer :content="feedback.retroalimentacion" />`).

### 2. Rediseño Limpio de las Opciones Múltiples (Eliminar Radio Buttons Deformados)
- Revisa `src/assets/main.css` y elimina cualquier regla global `input { width: 100% }` que afecte a `input[type="radio"]` o `input[type="checkbox"]`.
- En `ExerciseRunner.vue` y `WeeklyExamView.vue`, reemplaza el `<input type="radio">` nativo gigante por **tarjetas clicables de opción (`<button type="button">` o `<label>`)** alineadas a la izquierda (`flex items-center gap-3.5 text-left w-full p-4 rounded-xl border transition-all`):
    - Muestra un badge circular/cuadrado con la letra de opción (`A`, `B`, `C`, `D`) a la izquierda y el contenido `<MathRenderer :content="opcion" />` alineado a la izquierda ocupando el resto del espacio.
    - Estados visuales claros:
        - **Normal:** `bg-slate-800/70 border-slate-700/80 hover:border-indigo-500/60 hover:bg-slate-800`
        - **Seleccionada (antes de validar):** `bg-indigo-500/15 border-indigo-500 text-white`
        - **Correcta (tras validar):** `bg-emerald-500/15 border-emerald-500 text-emerald-100`
        - **Incorrecta elegida (tras validar):** `bg-rose-500/15 border-rose-500 text-rose-100`

### 3. Paleta de Colores Refinada para Pistas y Explicaciones
Reemplaza los bloques sólidos saturados de pista y explicación por tarjetas limpias con **borde izquierdo de acento** y alta legibilidad:
- **Tarjeta de Pista:** `bg-amber-500/10 border border-amber-500/20 border-l-4 border-l-amber-400 text-amber-100 rounded-xl p-4` con un encabezado pequeño `"Pista conceptual"`.
- **Tarjeta de Explicación Paso a Paso:** `bg-emerald-500/10 border border-emerald-500/20 border-l-4 border-l-emerald-400 text-slate-100 rounded-xl p-4` con un encabezado pequeño `"Solución paso a paso"`.
- **Tarjeta de Error / Respuesta Incorrecta:** `bg-rose-500/10 border border-rose-500/20 border-l-4 border-l-rose-400 text-slate-100 rounded-xl p-4`.

Verifica con `npm run type-check` que compile sin errores.