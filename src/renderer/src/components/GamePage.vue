<template>
	<!-- Game Poster and info -->
	<div v-if="mainStore.selectedGame" class="flex">
		<img :src="mainStore.selectedGame.poster || defaultImage" class="rounded-lg m-4 h-40" alt="Game Poster" />
		<div class="flex flex-col justify-center ml-4">
			<div class="font-bold text-4xl">
				{{ mainStore.selectedGame.name }}
			</div>
			<div class="text-gray-400 text-lg">
				Last clip
				{{
					formatDistanceToNowStrict(new Date(mainStore.selectedGame.lastClipDate || ''), {
						addSuffix: true
					})
				}}
			</div>
			<div class="mt-2">
				<Badge :value="mainStore.selectedGame.nOfClips + ' clips'" severity="primary"></Badge>
				<Badge :value="gameSizeMBOrGB(mainStore.selectedGame.size)" class="mx-2" severity="info"></Badge>
			</div>
		</div>
	</div>

	<!-- Clip list and video player -->
	<div class="flex h-100">
		<ClipList />
		<VideoPlayer />
	</div>
</template>

<script setup lang="ts">
import ClipList from './ClipList.vue'
import VideoPlayer from './VideoPlayer.vue'
import defaultImage from '../assets/default.jpg'

import { useMainStore } from '@renderer/stores/mainStore'
import { formatDistanceToNowStrict } from 'date-fns'
import Badge from 'primevue/badge'

const mainStore = useMainStore()

const gameSizeMBOrGB = (size: number) => {
	if (size < 1024) return `${size}MB`
	return `${(size / 1024).toFixed(2)}GB`
}
</script>

<style scoped></style>
