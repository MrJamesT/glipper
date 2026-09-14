import '@fontsource-variable/inter'
import './assets/main.css'
import 'primeicons/primeicons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

import PrimeVue from 'primevue/config'
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'

// Emerald accent on zinc surfaces, matching the Tailwind palette used in the components
const GlipperPreset = definePreset(Aura, {
	semantic: {
		primary: {
			50: '{emerald.50}',
			100: '{emerald.100}',
			200: '{emerald.200}',
			300: '{emerald.300}',
			400: '{emerald.400}',
			500: '{emerald.500}',
			600: '{emerald.600}',
			700: '{emerald.700}',
			800: '{emerald.800}',
			900: '{emerald.900}',
			950: '{emerald.950}'
		},
		colorScheme: {
			dark: {
				surface: {
					0: '#ffffff',
					50: '{zinc.50}',
					100: '{zinc.100}',
					200: '{zinc.200}',
					300: '{zinc.300}',
					400: '{zinc.400}',
					500: '{zinc.500}',
					600: '{zinc.600}',
					700: '{zinc.700}',
					800: '{zinc.800}',
					900: '{zinc.900}',
					950: '{zinc.950}'
				}
			}
		}
	}
})

const pinia = createPinia()
const app = createApp(App)
app.use(PrimeVue, {
	theme: {
		preset: GlipperPreset,
		options: {
			// the app is always dark, do not follow the OS setting
			darkModeSelector: '.app-dark'
		}
	}
})
app.use(pinia)
app.use(ToastService)
app.directive('tooltip', Tooltip)
app.mount('#app')
