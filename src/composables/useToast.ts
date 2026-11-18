import { ref } from 'vue'

export type ToastKind = 'success' | 'error' | 'warning' | 'info'
export interface Toast { id: number; kind: ToastKind; message: string }

const toasts = ref<Toast[]>([])
let nextId = 1
function show(kind: ToastKind, message: string) {
  const id = nextId++
  toasts.value.push({ id, kind, message })
  window.setTimeout(() => { toasts.value = toasts.value.filter(toast => toast.id !== id) }, 4500)
}
export function useToast() {
  return {
    toasts,
    showSuccess: (message: string) => show('success', message),
    showError: (message: string) => show('error', message),
    showWarning: (message: string) => show('warning', message),
    showInfo: (message: string) => show('info', message)
  }
}
