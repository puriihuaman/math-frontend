<script setup lang="ts">
defineProps<{ seconds: number }>()
defineEmits<{ (event: 'close'): void }>()
</script>
<template><div class="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"><div class="card max-w-md text-center"><div class="mb-3 text-4xl">⏱️</div><h2 class="text-xl font-bold">Pausa de enfoque detectada</h2><p class="my-4 text-slate-500">Perdiste {{ Math.floor(seconds / 60) }} min {{ seconds % 60 }} s. No pasa nada: vuelve a tu objetivo.</p><button class="btn-primary" @click="$emit('close')">Retomar sesión de estudio</button></div></div></template>
