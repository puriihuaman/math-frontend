import { createRouter, createWebHistory } from 'vue-router'
import CycleMapView from '../views/CycleMapView.vue'
import StudySessionView from '../views/StudySessionView.vue'
import WeeklyExamView from '../views/WeeklyExamView.vue'
import ProgressDashboardView from '../views/ProgressDashboardView.vue'
import SettingsView from '../views/SettingsView.vue'
export default createRouter({ history: createWebHistory(), routes: [{ path: '/', component: CycleMapView }, { path: '/session/:modulo/:semana/:subtemaId', component: StudySessionView }, { path: '/exam/:modulo/:semana', component: WeeklyExamView }, { path: '/progress', component: ProgressDashboardView }, { path: '/settings', component: SettingsView }] })
