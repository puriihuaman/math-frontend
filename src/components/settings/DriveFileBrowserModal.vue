<script setup lang="ts">
import {onMounted, ref} from "vue";
import {Search, X} from "lucide-vue-next";
import type {Ref} from "vue";
import {useGoogleServices} from "../../composables/useGoogleServices";
import {useToast} from "../../composables/useToast";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
}

const emit = defineEmits<{ close: []; selected: [files: File[]] }>();
const google = useGoogleServices();
const toast = useToast();
const files: Ref<DriveFile[]> = ref([]);
const selected = ref<string[]>([]);
const search = ref("");
const loading = ref(false);
const error = ref("");

async function loadFiles() {
  loading.value = true;
  error.value = "";
  try {
    files.value = await google.listDriveFiles(search.value);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : "No se pudieron cargar los archivos de Drive.";
  } finally {
    loading.value = false;
  }
}

async function downloadSelected() {
  loading.value = true;
  error.value = "";
  const chosen = files.value.filter(file => selected.value.includes(file.id));
  emit("close");
  try {
    const downloaded = await Promise.all(chosen.map(file => google.downloadDriveFileAsBlob(file)));
    emit("selected", downloaded);
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "No se pudieron descargar los archivos.";
    error.value = message;
    toast.showError(message);
  } finally {
    loading.value = false;
  }
}

console.log("**".repeat(50));
console.log(files);
console.log("**".repeat(50));

onMounted(loadFiles);
</script>
<template>
  <div class="fixed inset-0 z-[70] grid place-items-center bg-slate-950/80 p-4">
    <div class="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
      <div class="flex items-center justify-between">
        <div><h2 class="text-xl font-bold text-white">Explorar Google Drive</h2>
          <p class="text-sm text-slate-400">Selecciona PDF o PPTX para esta semana.</p></div>
        <button class="text-slate-400" @click="$emit('close')">
          <X/>
        </button>
      </div>
      <form class="mt-5 flex gap-2" @submit.prevent="loadFiles"><label class="sr-only"
                                                                       for="drive-search">Buscar
        archivo</label><input id="drive-search" v-model="search"
                              class="flex-1 rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-indigo-500"
                              placeholder="Buscar por nombre…"/>
        <button class="rounded-xl bg-indigo-600 px-4 text-white">
          <Search :size="18"/>
        </button>
      </form>
      <p v-if="error" class="mt-3 rounded-xl border border-red-500/30 bg-red-950 p-3 text-red-200">
        {{ error }}
      </p>

      <div class="mt-4 max-h-80 space-y-2 overflow-y-auto">
        <label v-for="file in files"
               :key="file.id"
               class="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 p-3 text-slate-200 hover:border-indigo-500">
          <input v-model="selected" type="checkbox" :value="file.id" class="w-auto"/>
          <span
              class="min-w-0 flex-1 truncate">{{ file.name }}</span>
          <span
              class="text-xs text-slate-500">
            {{ file.mimeType.includes("pdf") ? "PDF" : "PPTX" }}
          </span>
        </label>
        <p v-if="!loading && !files.length" class="py-8 text-center text-slate-500">No encontramos
          archivos compatibles.</p>
        <p v-if="loading" class="py-8 text-center text-slate-400">Cargando Drive…</p></div>
      <div class="mt-5 flex justify-end gap-2">
        <button class="rounded-xl bg-slate-800 px-4 py-2 text-slate-200" @click="$emit('close')">
          Cancelar
        </button>
        <button
            class="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
            :disabled="loading || !selected.length" @click="downloadSelected">Agregar seleccionados
        </button>
      </div>
    </div>
  </div>
</template>
