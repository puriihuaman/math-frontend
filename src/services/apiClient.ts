const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    const headers = new Headers(options.headers)
    if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
    const response = await fetch(`${baseUrl}${path}`, { ...options, headers })
    if (!response.ok) {
      if (response.status === 429) throw new ApiError(429, 'El límite gratuito de IA se alcanzó. Espera un momento y reintenta.')
      const body = await response.text()
      throw new ApiError(response.status, body || 'El servidor no pudo procesar la solicitud.')
    }
    return response.status === 204 ? (undefined as T) : await response.json() as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(0, 'No se pudo conectar con el backend. Verifica que FastAPI esté ejecutándose.')
  }
}
export const apiClient = {
  processWeek: (files: File[], modulo: number, semana: number) => {
    const data = new FormData(); files.forEach(file => data.append('files', file))
    data.append('modulo', String(modulo)); data.append('semana', String(semana))
    return request<import('../types/study').WeekData>('/api/v1/study/process-week-material', { method: 'POST', body: data, headers: {} })
  },
  generateExercises: (payload: object) => request<import('../types/study').Ejercicio[]>('/api/v1/study/generate-exercises', { method: 'POST', body: JSON.stringify(payload) }),
  evaluateShortAnswer: (payload: object) => request<{ score: number; retroalimentacion: string }>('/api/v1/study/evaluate-short-answer', { method: 'POST', body: JSON.stringify(payload) }),
  generateExam: (payload: object) => request<import('../types/study').Ejercicio[]>('/api/v1/study/generate-weekly-exam', { method: 'POST', body: JSON.stringify(payload) })
}
