<template>
	<div class="flex h-dvh w-full flex-col">
		<Header />
		<main class="flex min-h-0 flex-1 flex-col">
			<GameTiles v-if="mainStore.selectedGame === null" />
			<GamePage v-else />
		</main>
		<SettingsDialog v-model="mainStore.settingsDialogOpen" />
		<Toast position="bottom-right" />
	</div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { differenceInHours } from 'date-fns'

import GameTiles from './components/GameTiles.vue'
import GamePage from './components/GamePage.vue'
import Header from './components/Header.vue'
import SettingsDialog from './components/SettingsDialog.vue'
import Toast from 'primevue/toast'

import { useMainStore } from './stores/mainStore'
import { AppSettings } from '../../generated/client'

const mainStore = useMainStore()

onMounted(async () => {
	await mainStore.getSettings()
	mainStore.startListeners()

	window.electron.ipcRenderer.on('getSettings', (_, res: AppSettings) => {
		mainStore.settings = res
	})

	if (!mainStore.settings?.gameFolder) {
		mainStore.settingsDialogOpen = true
		return
	}

	if (
		!mainStore.settings.lastGameDBUpdate ||
		differenceInHours(new Date(), new Date(mainStore.settings.lastGameDBUpdate)) > 4
	) {
		window.electron.ipcRenderer.invoke('buildGameDB')
	}
})
</script>
