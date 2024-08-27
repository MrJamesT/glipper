import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMainStore = defineStore('main', () => {
	const selectedGameId = ref('')
	const selectedClipId = ref('')

	return { selectedGameId, selectedClipId }
})
