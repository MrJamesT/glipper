import { AppSettings, Game } from '@prisma/client'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMainStore = defineStore('main', () => {
	const selectedGame = ref<Game | null>(null)
	const selectedClipId = ref('')
	const settings = ref<AppSettings | null>(null)

	async function getSettings() {
		const response = await window.electron.ipcRenderer.invoke('getSettings')
		settings.value = response
	}

	return { selectedGame, selectedClipId, settings, getSettings }
})
