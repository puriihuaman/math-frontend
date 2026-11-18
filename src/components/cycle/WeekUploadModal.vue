<script setup lang="ts">
import {ref} from "vue";
import type {WeekData} from "../../types/study";
import {apiClient} from "../../services/apiClient";
import {useGoogleServices} from "../../composables/useGoogleServices";
import DriveFileBrowserModal from "../settings/DriveFileBrowserModal.vue";
import {useToast} from "../../composables/useToast";

const props = defineProps<{ week: WeekData }>();
const emit = defineEmits<{ close: []; processed: [week: WeekData] }>();
interface QueuedFile {
  id: string;
  file: File;
  source: "local" | "drive";
}
interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
}
const queuedFiles = ref<QueuedFile[]>([]);
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

async function addLocalFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  const selected = Array.from(input.files || []);
  selected.forEach(file => {
    queuedFiles.value.push({
      id: `local-${crypto.randomUUID()}`,
      file,
      source: "local"
    });
  });
  input.value = "";
}

async function addDriveFiles(selected: DriveFile[]) {
  browserOpen.value = false;
  isDownloadingFromDrive.value = true;
  try {
    for (const driveFile of selected) {
      const file = await google.downloadDriveFileAsBlob(driveFile);
      queuedFiles.value.push({
        id: `drive-${driveFile.id}`,
        file,
        source: "drive"
      });
    }
    toast.showSuccess(`${selected.length} archivo(s) agregados desde Google Drive.`);
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "No se pudieron descargar los archivos de Google Drive.";
    toast.showError(message);
  } finally {
    isDownloadingFromDrive.value = false;
  }
}

function removeQueuedFile(id: string) {
  queuedFiles.value = queuedFiles.value.filter(item => item.id !== id);
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function process() {
  if (!queuedFiles.value.length) return;
  busy.value = true;
  error.value = "";
  try {
    const processed = await apiClient.processWeek(
      queuedFiles.value.map(item => item.file),
      props.week.modulo,
      props.week.semana
    );
    const localFiles = queuedFiles.value.filter(item => item.source === "local");
    if (google.connected.value && localFiles.length) {
      void google.uploadLocalFilesToFolder(localFiles.map(item => item.file)).catch(reason => {
        toast.showWarning(reason instanceof Error ? reason.message : "El material se procesó, pero no pudo respaldarse en Drive.");
      });
    }
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
    <form class="panel w-full max-w-lg" @submit.prevent="process">
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
                     @change="addLocalFiles"/>
      <button class="btn-secondary mt-3 w-full"
              type="button"
              :disabled="isDownloadingFromDrive || !google.connected" @click="importFromDrive">
        {{ isDownloadingFromDrive ? "Descargando desde Drive…" : "Importar desde Google Drive" }}
      </button>
      <p v-if="!google.connected" class="mt-2 text-xs text-slate-500">Conecta Google desde
        Configuración para importar archivos.</p>
      <div v-if="isDownloadingFromDrive" class="mt-3 rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-3 text-sm text-indigo-200">
        Descargando archivos de Drive...
      </div>
      <div v-if="queuedFiles.length" class="mt-4 space-y-2">
        <div v-for="item in queuedFiles" :key="item.id"
             class="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-slate-200">{{ item.file.name }}</p>
            <p class="text-xs text-slate-500">{{ formatSize(item.file.size) }}</p>
          </div>
          <span class="rounded-full px-2 py-1 text-xs font-semibold"
                :class="item.source === 'drive' ? 'bg-emerald-950 text-emerald-300' : 'bg-blue-950 text-blue-300'">
            {{ item.source === "drive" ? "Google Drive" : "Local" }}
          </span>
          <button type="button" class="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                  aria-label="Quitar archivo" @click="removeQueuedFile(item.id)">X</button>
        </div>
      </div>
      <p v-if="error" class="mt-3 rounded-xl border border-red-500/30 bg-red-950 p-3 text-red-200">
        {{ error }}
        <button class="font-bold underline" @click="process">Reintentar procesamiento</button>
      </p>
      <button type="submit" class="btn-primary mt-5 w-full" :disabled="busy || !queuedFiles.length">
        {{ busy ? "Procesando…" : "Procesar material" }}
      </button>
    </form>
    <DriveFileBrowserModal v-if="browserOpen" @close="browserOpen = false"
                           @selected="addDriveFiles"/>
  </div>
</template>
