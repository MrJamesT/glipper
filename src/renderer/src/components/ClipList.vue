<template>
	<div :key="refreshKey" class="flex flex-col gap-y-2 w-[30rem] bg-gray-700 p-2 overflow-y-scroll rounded-r-lg">
		<div v-for="clip in mainStore.sortedClips" :key="clip.id">
			<div
				class="clip-card bg-gray-600 font-bold rounded p-2 flex cursor-pointer"
				:class="{ 'bg-primary-700': mainStore.selectedClipId === clip.id }"
				@click="mainStore.selectedClipId = clip.id"
			>
				<div class="bg-gray-100 rounded-md h-16 w-24 mr-4">
					<ProgressSpinner v-if="loadingThumbs" stroke-width="6" style="height: 40px; margin-top: 12px" />
					<img v-else :src="getImagePath(clip.filename)" class="h-full w-full object-cover rounded-md" />
				</div>

				<div class="h-full mt-1">
					{{ format(clip.timestamp, 'dd. MM. yyyy HH:mm:ss') }}
					<div class="flex items-center mt-1">
						<Badge :value="clip.size + ' MB'" severity="info"></Badge>
						<Badge class="ml-2" :severity="clip.cut ? 'primary' : 'secondary'">
							<i v-if="clip.cut" class="pi pi-filter"></i>
							<i v-else class="pi pi-filter-slash"></i>
						</Badge>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { format } from 'date-fns'
import { useMainStore } from '@renderer/stores/mainStore'

import Badge from 'primevue/badge'
import ProgressSpinner from 'primevue/progressspinner'

const mainStore = useMainStore()
const loadingThumbs = ref(true)
const refreshKey = ref(0)

onMounted(() => {
	if (!mainStore.selectedGame) return
	window.electron.ipcRenderer.send('clipsList', mainStore.selectedGame.name)

	window.electron.ipcRenderer.on('clipsList', () => {
		window.electron.ipcRenderer.send(
			'getThumbnails',
			mainStore.clips.map((clip) => clip.id)
		)
	})

	window.electron.ipcRenderer.on('getThumbnails', (_, success) => {
		if (success) {
			loadingThumbs.value = false
			refreshKey.value++
		}
	})
})

function getImagePath(filename: string) {
	return `${mainStore.settings!.gameFolder}/thumbs/${filename}.jpg`
}
</script>

<style scoped>
.clip-card {
	transition: transform 0.3s ease;
}

.clip-card:hover {
	transform: translateX(5px);
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}
</style>
