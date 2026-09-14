<template>
	<aside class="panel flex w-80 shrink-0 flex-col overflow-hidden">
		<div class="flex items-center justify-between border-b border-white/5 px-4 py-3">
			<span class="text-sm font-semibold">Clips</span>
			<span class="text-xs text-zinc-400">{{ mainStore.sortedClips.length }}</span>
		</div>

		<div :key="refreshKey" class="min-h-0 flex-1 overflow-y-auto p-2">
			<button
				v-for="clip in mainStore.sortedClips"
				:key="clip.id"
				type="button"
				class="clip-card group flex w-full items-center gap-3 rounded-lg p-2 text-left transition focus:outline-none"
				:class="
					mainStore.selectedClipId === clip.id
						? 'bg-primary-500/15 ring-1 ring-primary-500/50'
						: 'hover:bg-white/5 focus-visible:bg-white/5'
				"
				@click="mainStore.selectedClipId = clip.id"
			>
				<div class="relative h-14 w-24 shrink-0 overflow-hidden rounded-md bg-zinc-800">
					<Skeleton v-if="loadingThumbs" width="100%" height="100%" border-radius="0" />
					<img v-else :src="getImagePath(clip.filename)" alt="" class="h-full w-full object-cover" />
					<div
						v-if="mainStore.selectedClipId === clip.id"
						class="absolute inset-0 flex items-center justify-center bg-black/40"
					>
						<i class="pi pi-play-circle text-xl text-primary-300" />
					</div>
				</div>

				<div class="min-w-0 flex-1">
					<div class="truncate text-sm font-medium">{{ format(clip.timestamp, 'd MMM yyyy') }}</div>
					<div class="mt-0.5 text-xs text-zinc-400">
						{{ format(clip.timestamp, 'HH:mm:ss') }} · {{ formatSize(clip.size) }}
					</div>
				</div>

				<i
					v-if="clip.cut"
					v-tooltip.left="'Already cut'"
					class="pi pi-check-circle shrink-0 text-sm text-primary-400"
				/>
			</button>

			<p v-if="mainStore.sortedClips.length === 0" class="px-3 py-10 text-center text-sm text-zinc-500">
				No clips in this game
			</p>
		</div>
	</aside>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { format } from 'date-fns'
import { useMainStore } from '@renderer/stores/mainStore'
import { formatSize, toFileUrl } from '../utils/format'

import Skeleton from 'primevue/skeleton'

const mainStore = useMainStore()
const loadingThumbs = ref(true)
const refreshKey = ref(0)

const stopListeners: (() => void)[] = []

onMounted(() => {
	if (!mainStore.selectedGame) return
	window.electron.ipcRenderer.send('clipsList', mainStore.selectedGame.name)

	stopListeners.push(
		window.electron.ipcRenderer.on('clipsList', () => {
			window.electron.ipcRenderer.send(
				'getThumbnails',
				mainStore.clips.map((clip) => clip.id)
			)
		}),
		window.electron.ipcRenderer.on('getThumbnails', (_, success) => {
			if (success) {
				loadingThumbs.value = false
				refreshKey.value++
			}
		})
	)
})

onUnmounted(() => {
	stopListeners.forEach((stop) => stop())
})

function getImagePath(filename: string) {
	return toFileUrl(mainStore.settings!.gameFolder, 'thumbs', filename + '.jpg')
}
</script>
