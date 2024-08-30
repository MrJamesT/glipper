import { AppSettings } from '@prisma/client'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMainStore = defineStore('main', () => {
	const selectedGameName = ref('')
	const selectedClipId = ref('')
	const settings = ref<AppSettings | null>(null)

	async function getSettings() {
		const response = await window.electron.ipcRenderer.invoke('getSettings')
		settings.value = response
	}

	return { selectedGameName, selectedClipId, settings, getSettings }
})
