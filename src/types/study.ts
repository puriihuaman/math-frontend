export interface Subtema {
  id: string; orden: number; titulo: string; explicacion_simplificada: string
  analogia_vida_real: string; conceptos_fundamentales: string[]
  formulas_y_definiciones_originales: string[]; ejemplo_resuelto: string
  referencias_material: string[]; completado?: boolean
}
export interface WeekData {
  modulo: number; semana: number
  estado: 'pendiente' | 'procesada' | 'completada'
  titulo_semana?: string; resumen_general?: string; subtemas: Subtema[]
  calendarEventIds?: string[]
}
export interface Ejercicio {
  id: number; nivel: 'basico' | 'intermedio' | 'reto'
  tipo: 'opcion_multiple' | 'respuesta_corta'; enunciado: string
  opciones: string[] | null; respuesta_correcta: string; pista: string
  explicacion_paso_a_paso: string
}
export interface UserSettings {
  duracionSesionMinutos: number; tiempoInactividadSegundos: number
  horaEstudioPreferida: string; cantidadEjerciciosPorSesion: number
}
export interface DistractionIncident {
  id: string; tipo: 'cambio_pestana' | 'inactividad'; fechaHora: string
  duracionSegundos: number; subtemaTitulo: string
}
export interface ActiveSessionDraft {
  modulo: number; semana: number; subtemaId: string
  fase: 'lectura' | 'ejercicios'; ejercicios: Ejercicio[]
  ejercicioActualIndex: number
  respuestasUsuario: Record<number, { respuesta: string; esCorrecta: boolean; retroalimentacion: string }>
  tiempoRestanteSegundos: number
}
export interface ExamResult { week: string; score: number; correct: number; total: number; date: string }
