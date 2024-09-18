<template>
	<div class="bg-gray-800 h-14 w-full">
		<div class="flex justify-between items-center w-full h-full">
			<div class="flex items-center">
				<h5 class="font-black text-2xl ml-4 mr-2">GLIPPER</h5>
				<Badge value="v1.0 | ALPHA" class="mt-1" severity="primary"></Badge>

				<Button
					v-if="mainStore.selectedGame"
					class="ml-4"
					label="Games List"
					text
					icon="pi pi-arrow-left"
					@click="mainStore.selectedGame = null"
				/>
			</div>

			<div class="text-primary font-semibold">
				<span v-if="lastCheck">
					Last game DB check was {{ lastCheck }} and found {{ clipsSinceLastCheck }} new clips
				</span>
				<span v-else>No game DB check has been performed yet</span>
			</div>

			<div class="mr-2 flex flex-row justify-center items-center">
				<ProgressBar class="w-80 mr-4" :value="50"></ProgressBar>
				<OverlayBadge value="2" class="mr-[-10px]">
					<Button icon="pi pi-bell" class="p-button-rounded p-button-text mr-2"></Button>
				</OverlayBadge>
				<Button icon="pi pi-cog" class="p-button-rounded p-button-text"></Button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import Badge from 'primevue/badge'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import OverlayBadge from 'primevue/overlaybadge'

import { formatDistanceToNow } from 'date-fns'
import { useMainStore } from '../stores/mainStore'

import { ref, computed, onMounted } from 'vue'

const mainStore = useMainStore()
const clipsSinceLastCheck = ref(0)

const lastCheck = computed(() => {
	if (!mainStore.settings?.lastGameDBUpdate) return null
	else return formatDistanceToNow(new Date(mainStore.settings.lastGameDBUpdate), { addSuffix: true })
})

onMounted(async () => {
	window.electron.ipcRenderer.send('clipsSinceLastUpdate')
	window.electron.ipcRenderer.on('clipsSinceLastUpdate', (_, res: number) => {
		clipsSinceLastCheck.value = res
	})
})
</script>
