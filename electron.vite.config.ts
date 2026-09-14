import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { version } from './package.json'

export default defineConfig({
	main: {},
	preload: {},
	renderer: {
		define: {
			__APP_VERSION__: JSON.stringify(version)
		},
		resolve: {
			alias: {
				'@renderer': resolve('src/renderer/src')
			}
		},
		plugins: [vue(), tailwindcss()]
	}
})
