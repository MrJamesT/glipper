import { AppSettings, Clip, Game } from '../../../generated/client'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useMainStore = defineStore('main', () => {
	const selectedGame = ref<Game | null>(null)
	const selectedClipId = ref('')
	const settings = ref<AppSettings | null>(null)

	const clips = ref<Clip[]>([])

	const sortedClips = computed(() => {
		return [...clips.value].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
	})

	async function getSettings() {
		const response = await window.electron.ipcRenderer.invoke('getSettings')
		settings.value = response
	}

	// a clip id from another visit must not survive, or the same clip cannot be re-selected
	function selectGame(game: Game | null) {
		selectedGame.value = game
		selectedClipId.value = ''
		clips.value = []
	}

	function startListeners() {
		window.electron.ipcRenderer.on('clipsList', (_, res: Clip[]) => {
			clips.value = res
		})
	}

	return { selectedGame, selectedClipId, settings, clips, sortedClips, getSettings, selectGame, startListeners }
})
