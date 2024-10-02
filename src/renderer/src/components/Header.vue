<template>
	<div class="bg-gray-800 py-2 w-full flex justify-between items-center relative">
		<div class="flex items-center">
			<h5 class="font-black text-2xl ml-4 mr-2">GLIPPER</h5>
			<Badge value="v1.0.2 | BETA" class="mt-1" severity="primary"></Badge>

			<Button
				v-if="mainStore.selectedGame"
				class="ml-4"
				label="Games List"
				text
				icon="pi pi-arrow-left"
				@click="mainStore.selectedGame = null"
			/>
		</div>

		<div class="text-primary font-semibold absolute left-1/2 -translate-x-1/2">
			<span v-if="lastCheck">
				Last game DB check was {{ lastCheck }} and found {{ clipsSinceLastCheck }} new clips
			</span>
			<span v-else>No game DB check has been performed yet</span>

			<Button icon="pi pi-refresh" class="p-button-rounded p-button-text ml-2" @click="handleRefreshClick" />
		</div>

		<div class="mr-2 flex flex-row justify-center items-center">
			<div v-if="progress > 0" class="flex items-center">
				<div class="mr-4">{{ progressAction }}</div>
				<ProgressBar class="w-80 mr-4" :value="progress"></ProgressBar>
			</div>
			<Button icon="pi pi-cog" class="p-button-rounded p-button-text" @click="settingsDialog = true"></Button>
		</div>
	</div>

	<SettingsDialog v-model="settingsDialog" />
</template>

<script setup lang="ts">
import Badge from 'primevue/badge'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import SettingsDialog from '../components/SettingsDialog.vue'

import { formatDistanceToNow } from 'date-fns'
import { useMainStore } from '../stores/mainStore'

import { ref, computed, onMounted } from 'vue'

const mainStore = useMainStore()
const clipsSinceLastCheck = ref(0)
const settingsDialog = ref(false)
const progress = ref(0)
const progressAction = ref('')

const lastCheck = computed(() => {
	if (!mainStore.settings?.lastGameDBUpdate) return null
	else return formatDistanceToNow(new Date(mainStore.settings.lastGameDBUpdate), { addSuffix: true })
})

const handleRefreshClick = () => {
	window.electron.ipcRenderer.invoke('buildGameDB')
}

onMounted(async () => {
	window.electron.ipcRenderer.send('clipsSinceLastUpdate')
	window.electron.ipcRenderer.on('clipsSinceLastUpdate', (_, res: number) => {
		clipsSinceLastCheck.value = res
	})

	window.electron.ipcRenderer.on('progress', (_, res: { percentage: number; action: string }) => {
		progress.value = res.percentage
		progressAction.value = res.action

		if (res.percentage === 100) {
			setTimeout(() => {
				if (progress.value === 100) {
					progress.value = 0
					progressAction.value = ''
				}
			}, 2000)
		}
	})
})
</script>
