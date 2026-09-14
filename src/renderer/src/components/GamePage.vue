<template>
	<div v-if="mainStore.selectedGame" class="flex min-h-0 flex-1 flex-col">
		<section class="relative isolate overflow-hidden px-8 pt-6 pb-6">
			<div class="pointer-events-none absolute inset-0 -z-10">
				<img :src="poster" alt="" class="h-full w-full scale-110 object-cover opacity-30 blur-3xl" />
				<div class="absolute inset-0 bg-linear-to-b from-zinc-950/10 via-zinc-950/60 to-zinc-950" />
			</div>

			<div class="flex items-end gap-6">
				<img
					:src="poster"
					alt="Game poster"
					class="h-44 w-[7.5rem] shrink-0 rounded-xl object-cover shadow-2xl ring-1 ring-white/10"
				/>
				<div class="min-w-0 pb-1">
					<div class="text-xs font-semibold tracking-[0.2em] text-primary-400 uppercase">Game</div>
					<h1 class="mt-1 truncate text-4xl font-bold tracking-tight">{{ mainStore.selectedGame.name }}</h1>
					<div class="mt-4 flex flex-wrap items-center gap-2">
						<span class="stat"
							><i class="pi pi-video" /> {{ pluralClips(mainStore.selectedGame.nOfClips) }}</span
						>
						<span class="stat"
							><i class="pi pi-database" /> {{ formatSize(mainStore.selectedGame.size) }}</span
						>
						<span class="stat">
							<i class="pi pi-clock" />
							Last clip
							{{
								formatDistanceToNowStrict(new Date(mainStore.selectedGame.lastClipDate || ''), {
									addSuffix: true
								})
							}}
						</span>
					</div>
				</div>
			</div>
		</section>

		<div class="flex min-h-0 flex-1 gap-4 px-8 pb-6">
			<ClipList />
			<VideoPlayer />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ClipList from './ClipList.vue'
import VideoPlayer from './VideoPlayer.vue'
import defaultImage from '../assets/default.jpg'
import { formatSize, pluralClips } from '../utils/format'

import { useMainStore } from '@renderer/stores/mainStore'
import { formatDistanceToNowStrict } from 'date-fns'

const mainStore = useMainStore()
const poster = computed(() => mainStore.selectedGame?.poster || defaultImage)
</script>

<style scoped>
@reference '../assets/main.css';

.stat {
	@apply inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-200;
}
.stat .pi {
	@apply text-xs text-zinc-400;
}
</style>
