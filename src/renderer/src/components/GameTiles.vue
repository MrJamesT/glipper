<template>
	<div class="flex min-h-0 flex-1 flex-col">
		<div class="flex flex-wrap items-end justify-between gap-4 px-8 pt-8 pb-5">
			<div>
				<h1 class="text-3xl font-bold tracking-tight">Library</h1>
				<p class="mt-1 text-sm text-zinc-400">{{ summary }}</p>
			</div>

			<div v-if="games.length > 0" class="flex items-center gap-2">
				<IconField>
					<InputIcon class="pi pi-search" />
					<InputText v-model="search" placeholder="Search games" size="small" class="w-56" />
				</IconField>
				<Select
					v-model="sortBy"
					:options="sortOptions"
					option-label="name"
					option-value="value"
					size="small"
					class="w-44"
				/>
				<Button
					v-tooltip.bottom="sortAsc ? 'Ascending' : 'Descending'"
					:icon="sortAsc ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down'"
					severity="secondary"
					outlined
					size="small"
					aria-label="Sort direction"
					@click="sortAsc = !sortAsc"
				/>
			</div>
		</div>

		<div class="min-h-0 flex-1 overflow-y-auto px-8 pb-10">
			<EmptyState
				v-if="!mainStore.settings?.gameFolder"
				icon="pi pi-folder-open"
				title="Choose your clips folder"
				description="Point Glipper at the folder where your recordings land. It should have one sub folder per game."
			>
				<Button label="Open settings" icon="pi pi-cog" @click="mainStore.settingsDialogOpen = true" />
			</EmptyState>

			<EmptyState
				v-else-if="games.length === 0"
				icon="pi pi-video"
				title="No clips yet"
				description="Nothing was found in your clips folder. Record something, or scan again."
			>
				<Button label="Scan folder" icon="pi pi-refresh" severity="secondary" @click="rescan" />
				<Button
					label="Settings"
					icon="pi pi-cog"
					text
					severity="secondary"
					@click="mainStore.settingsDialogOpen = true"
				/>
			</EmptyState>

			<EmptyState
				v-else-if="sortedGames.length === 0"
				icon="pi pi-search"
				title="No matching games"
				:description="`Nothing matches “${search}”.`"
			>
				<Button label="Clear search" text severity="secondary" @click="search = ''" />
			</EmptyState>

			<div v-else class="grid gap-x-6 gap-y-8 [grid-template-columns:repeat(auto-fill,minmax(11rem,1fr))]">
				<button
					v-for="game in sortedGames"
					:key="game.name"
					type="button"
					class="game-card group text-left focus:outline-none"
					@click="mainStore.selectGame(game)"
				>
					<div
						class="relative aspect-[2/3] overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:ring-primary-400/60 group-hover:shadow-[0_24px_48px_-16px_rgb(16_185_129/0.35)] group-focus-visible:ring-primary-400"
					>
						<img
							:src="game.poster || defaultImage"
							:alt="game.name"
							class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
						/>
						<div
							class="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/85 via-black/30 to-transparent"
						/>

						<div class="absolute inset-x-0 bottom-0 flex items-center gap-1.5 p-3">
							<span class="pill">{{ pluralClips(game.nOfClips) }}</span>
							<span class="pill">{{ formatSize(game.size) }}</span>
						</div>

						<div
							class="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100"
						>
							<span
								class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-zinc-950 shadow-lg"
							>
								<i class="pi pi-play ml-0.5 text-base" />
							</span>
						</div>
					</div>

					<div class="mt-3 px-0.5">
						<div class="truncate font-semibold leading-tight">{{ game.name }}</div>
						<div class="mt-1 text-xs text-zinc-400">
							{{ formatDistanceToNowStrict(new Date(game.lastClipDate || ''), { addSuffix: true }) }}
						</div>
					</div>
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { formatDistanceToNowStrict } from 'date-fns'
import { Game } from '../../../generated/client'
import defaultImage from '../assets/default.jpg'
import { formatSize, pluralClips } from '../utils/format'

import Button from 'primevue/button'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import EmptyState from './EmptyState.vue'

import { useMainStore } from '@renderer/stores/mainStore'

const games = ref<Game[]>([])
const search = ref('')
const sortBy = ref('lastClipDate')
const sortAsc = ref(false)

const sortOptions = [
	{ name: 'Last clip', value: 'lastClipDate' },
	{ name: 'Name', value: 'name' },
	{ name: 'Size', value: 'size' },
	{ name: 'Clips', value: 'nOfClips' }
]
const mainStore = useMainStore()

const summary = computed(() => {
	if (games.value.length === 0) return 'Your game clips, in one place'
	const clips = games.value.reduce((sum, game) => sum + game.nOfClips, 0)
	const size = games.value.reduce((sum, game) => sum + game.size, 0)
	return `${games.value.length} ${games.value.length === 1 ? 'game' : 'games'} · ${pluralClips(clips)} · ${formatSize(size)}`
})

const sortedGames = computed(() => {
	const needle = search.value.trim().toLowerCase()
	const filtered = needle ? games.value.filter((game) => game.name.toLowerCase().includes(needle)) : games.value
	const dir = sortAsc.value ? 1 : -1

	return [...filtered].sort((a, b) => {
		if (sortBy.value === 'name') return dir * a.name.localeCompare(b.name)
		if (sortBy.value === 'size') return dir * (a.size - b.size)
		if (sortBy.value === 'nOfClips') return dir * (a.nOfClips - b.nOfClips)
		return dir * (new Date(a.lastClipDate || '').getTime() - new Date(b.lastClipDate || '').getTime())
	})
})

const rescan = () => {
	window.electron.ipcRenderer.invoke('buildGameDB')
}

let stopGamesListener: (() => void) | undefined

onMounted(() => {
	window.electron.ipcRenderer.send('gamesList')
	stopGamesListener = window.electron.ipcRenderer.on('gamesList', (_, res: Game[]) => {
		games.value = res
	})
})

onUnmounted(() => {
	stopGamesListener?.()
})
</script>

<style scoped>
@reference '../assets/main.css';

.pill {
	@apply rounded-md bg-black/50 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm;
}
</style>
