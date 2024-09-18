<template>
	<div class="w-full">
		<Header />
		<GameTiles v-if="mainStore.selectedGame === null" />
		<GamePage v-else />
	</div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { differenceInHours } from 'date-fns'

import GameTiles from './components/GameTiles.vue'
import Header from './components/Header.vue'

import { useMainStore } from './stores/mainStore'
import GamePage from './components/GamePage.vue'
import { AppSettings } from '@prisma/client'

const mainStore = useMainStore()

onMounted(async () => {
	await mainStore.getSettings()
	if (
		!mainStore.settings?.lastGameDBUpdate ||
		differenceInHours(new Date(), new Date(mainStore.settings.lastGameDBUpdate)) > 4
	) {
		if (!mainStore.settings?.gameFolder) return
		console.log('Game DB is older than 4 hours, rebuilding...')
		window.electron.ipcRenderer.invoke('buildGameDB')
	}

	// All ON handlers
	window.electron.ipcRenderer.on('getSettings', (_, res: AppSettings) => {
		mainStore.settings = res
	})
})
</script>
