<template>
	<div class="flex flex-col gap-y-4 w-[25rem] bg-gray-700 p-4 h-full overflow-y-scroll">
		<div v-for="clip in clips" :key="clip.id">
			<div
				class="clip-card bg-gray-600 font-bold rounded p-2 flex justify-between cursor-pointer"
				@click="mainStore.selectedClipId = clip.id"
			>
				{{ format(clip.timestamp, 'dd. MM. yyyy HH:mm:ss') }}

				<div>
					<Badge :value="clip.size + ' MB'" severity="info"></Badge>
					<Badge class="ml-2" :severity="clip.cut ? 'primary' : 'secondary'">
						<i v-if="clip.cut" class="pi pi-filter"></i>
						<i v-else class="pi pi-filter-slash"></i>
					</Badge>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Clip } from '@prisma/client'
import { format } from 'date-fns'
import { useMainStore } from '@renderer/stores/mainStore'

import Badge from 'primevue/badge'

const mainStore = useMainStore()
const clips = ref<Clip[]>([])

onMounted(() => {
	window.electron.ipcRenderer.invoke('clipsList', mainStore.selectedGameId).then((res: Clip[]) => {
		clips.value = res
	})
})
</script>

<style scoped>
.clip-card {
	transition: transform 0.3s ease;
}

.clip-card:hover {
	transform: translateX(10px);
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}
</style>
