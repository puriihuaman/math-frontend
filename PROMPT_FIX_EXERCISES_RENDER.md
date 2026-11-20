Actúa como un Ingeniero Frontend Senior en Vue 3 y TypeScript. Realiza **dos correcciones puntuales** sin modificar el diseño ni la lógica que ya funciona:

### 1. Extraer el array `ejercicios` en `src/services/apiClient.ts`
El backend devuelve `{ "ejercicios": [...] }`, pero el componente `<ExerciseRunner :exercises="..." />` espera un `Array` directo (`Ejercicio[]`), lo que provoca el warning `Invalid prop: type check failed for prop "exercises". Expected Array, got Object` y evita que se rendericen los ejercicios.
- En `src/services/apiClient.ts`, dentro de `generateExercises(...)` y `generateWeeklyExam(...)`, asegúrate de devolver explícitamente el arreglo:
  ```ts
  return Array.isArray(data) ? data : (data.ejercicios ?? []);
  ```
- Verifica también en `StudySessionView.vue` y `WeeklyExamView.vue` que tanto la variable reactiva como el `ActiveSessionDraft` almacenado en `useStudyStore.ts` reciban y guarden `Ejercicio[]` (un arreglo, nunca el objeto contenedor `{ ejercicios: ... }`).

### 2. Eliminar el warning `Form submission canceled because the form is not connected`
- Revisa `WeekUploadModal.vue` y `LessonReader.vue`. Asegúrate de que ningún `<form @submit.prevent>` se desmonte del DOM de manera síncrona antes de completar su función `async` (cierra el modal solo dentro del bloque `try` una vez resuelta la promesa, o usa `type="button"` en botones de acción que navegan o cambian de fase).

Verifica con `npm run type-check` que no queden errores de tipos.