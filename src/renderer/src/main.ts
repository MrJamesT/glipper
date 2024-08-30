import './assets/main.css'
import 'primeicons/primeicons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'

const pinia = createPinia()
const app = createApp(App)
app.use(PrimeVue, {
	theme: {
		preset: Aura
	}
})
app.use(pinia)
app.use(ToastService)
app.mount('#app')
