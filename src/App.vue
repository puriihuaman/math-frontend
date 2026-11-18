<script setup lang="ts">
import SidebarNav from './components/common/SidebarNav.vue'
import TopStatusBar from './components/common/TopStatusBar.vue'
import ToastContainer from './components/common/ToastContainer.vue'
import { useStudyStore } from './stores/useStudyStore'
useStudyStore().hydrate()
</script>
<template><div class="min-h-screen bg-slate-950 text-slate-200"><SidebarNav /><TopStatusBar /><div class="lg:pl-64"><RouterView /></div><ToastContainer /></div></template>
