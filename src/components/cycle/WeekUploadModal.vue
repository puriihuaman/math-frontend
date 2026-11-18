<script setup lang="ts">
import {ref} from "vue";
import type {WeekData} from "../../types/study";
import {apiClient} from "../../services/apiClient";
import {useGoogleServices} from "../../composables/useGoogleServices";
import DriveFileBrowserModal from "../settings/DriveFileBrowserModal.vue";
import {useToast} from "../../composables/useToast";

const props = defineProps<{ week: WeekData }>();
const emit = defineEmits<{ close: []; processed: [week: WeekData] }>();
const files = ref<File[]>([]);
const busy = ref(false);
const isDownloadingFromDrive = ref(false);
const browserOpen = ref(false);
const error = ref("");
const google = useGoogleServices();
const toast = useToast();

function importFromDrive() {
  if (!google.connected.value) {
    toast.showWarning("Conecta Google en Configuración para importar archivos de Drive.");
    return;
  }
  browserOpen.value = true;
}

console.log("--".repeat(50));
console.log(google);
console.log("--".repeat(50));

function addDriveFiles(selected: File[]) {
  files.value = [...files.value, ...selected];
  browserOpen.value = false;
}

async function process() {
  if (!files.value.length) return;
  busy.value = true;
  error.value = "";
  try {
    const processed = await apiClient.processWeek(files.value, props.week.modulo, props.week.semana);
    emit("processed", processed);
    emit("close");
  } catch (e) {
    error.value = e instanceof Error ? e.message : "No se pudo procesar el material.";
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4">
    <div class="panel w-full max-w-lg">
      <div class="flex justify-between"><h2 class="text-xl font-bold text-white">Cargar semana
        {{ week.modulo }}.{{ week.semana }}</h2>
        <button class="text-slate-400" @click="$emit('close')">✕</button>
      </div>
      <p class="my-4 text-slate-400">Combina archivos PDF y PPTX del material de esta semana.</p>
      <p class="mb-3 text-sm font-medium"
         :class="google.connected ? 'text-emerald-300' : 'text-slate-500'">{{
          google.connected ? `Drive conectado: ${google.userEmail.value || "cuenta Google"}` : "Drive desconectado"
        }}</p><input type="file" accept=".pdf,.pptx" multiple
                     class="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-slate-200"
                     @change="files = Array.from(($event.target as HTMLInputElement).files || [])"/>
      <button class="btn-secondary mt-3 w-full"
              :disabled="isDownloadingFromDrive || !google.connected" @click="importFromDrive">
        {{ isDownloadingFromDrive ? "Descargando desde Drive…" : "Importar desde Google Drive" }}
      </button>
      <p v-if="!google.connected" class="mt-2 text-xs text-slate-500">Conecta Google desde
        Configuración para importar archivos.</p>
      <p v-if="files.length" class="mt-3 text-sm text-slate-400">{{ files.length }} archivo(s)
        seleccionado(s)</p>
      <p v-if="error" class="mt-3 rounded-xl border border-red-500/30 bg-red-950 p-3 text-red-200">
        {{ error }}
        <button class="font-bold underline" @click="process">Reintentar procesamiento</button>
      </p>
      <button class="btn-primary mt-5 w-full" :disabled="busy || !files.length" @click="process">
        {{ busy ? "Procesando…" : "Procesar material" }}
      </button>
    </div>
    <DriveFileBrowserModal v-if="browserOpen" @close="browserOpen = false"
                           @selected="addDriveFiles"/>
  </div>
</template>
