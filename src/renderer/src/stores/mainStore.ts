import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMainStore = defineStore('main', () => {
	const selectedGameName = ref('')
	const selectedClipId = ref('')

	return { selectedGameName, selectedClipId }
})
