<template>
	<div class="px-8 pt-[4.5rem] flex justify-between">
		<h5 class="text-3xl font-bold">Library ({{ games.length }})</h5>

		<div class="w-full md:w-56">
			<InputGroup>
				<Button
					:icon="sortAsc ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down'"
					@click="sortAsc = !sortAsc"
				/>
				<Select
					v-model="sortBy"
					:options="sortOptions"
					option-label="name"
					option-value="value"
					placeholder="Sort Order"
					checkmark
					:highlight-on-select="false"
				/>
			</InputGroup>
		</div>
	</div>

	<div class="flex flex-wrap p-2 h-full">
		<div v-for="game in sortedGames" :key="game.name" class="game-card-wrapper d-flex p-3 m-3">
			<div
				class="game-card rounded flex flex-col justify-between cursor-pointer"
				:class="{ 'bg-gray-800': !game.poster }"
				:style="backgroundImage(game.poster)"
				@click="mainStore.selectedGameName = game.name"
			>
				<div class="flex flex-col justify-end items-start w-full h-full p-3">
					<Badge :value="game.nOfClips + ' clips'" class="mb-2 shadow-lg" severity="primary"></Badge>
					<Badge :value="gameSizeMBOrGB(game.size)" class="shadow-lg" severity="info"></Badge>
				</div>
			</div>

			<div>
				<div class="font-bold game-title mt-2">
					{{ game.name }}
				</div>
				<div class="text-gray-400 text-sm">
					{{ formatDistanceToNowStrict(new Date(game.lastClipDate || ''), { addSuffix: true }) }}
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { formatDistanceToNowStrict } from 'date-fns'
import { Game } from '@prisma/client'

import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Select from 'primevue/select'
import InputGroup from 'primevue/inputgroup'

import { useMainStore } from '@renderer/stores/mainStore'

const games = ref<Game[]>([])
const sortBy = ref('lastClipDate')
const sortAsc = ref(false)

const sortOptions = ref([
	{ name: 'Name', value: 'name' },
	{ name: 'Size', value: 'size' },
	{ name: 'Clips', value: 'nOfClips' },
	{ name: 'Last Clip Date', value: 'lastClipDate' }
])
const mainStore = useMainStore()

const backgroundImage = (url: string | null) => {
	if (!url) return {}
	return {
		backgroundImage: `url(${url})`
	}
}

const gameSizeMBOrGB = (size: number) => {
	if (size < 1024) return `${size}MB`
	return `${(size / 1024).toFixed(2)}GB`
}

const sortedGames = computed(() => {
	return [...games.value].sort((a, b) => {
		if (sortBy.value === 'name') return sortAsc.value ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
		if (sortBy.value === 'size') return sortAsc.value ? a.size - b.size : b.size - a.size
		if (sortBy.value === 'nOfClips') return sortAsc.value ? a.nOfClips - b.nOfClips : b.nOfClips - a.nOfClips
		if (sortBy.value === 'lastClipDate')
			return sortAsc.value
				? new Date(a.lastClipDate || '').getTime() - new Date(b.lastClipDate || '').getTime()
				: new Date(b.lastClipDate || '').getTime() - new Date(a.lastClipDate || '').getTime()
		return 0
	})
})

onMounted(() => {
	window.electron.ipcRenderer.invoke('gamesList').then((res: Game[]) => {
		games.value = res
	})
})
</script>

<style scoped>
.game-card-wrapper {
	height: 20rem;
	width: 12.75rem;
}

.game-card {
	transition: transform 0.3s ease;
	width: 12.75rem;
	height: 17rem;
	background-size: cover;
}

.game-card:hover {
	transform: translateY(-10px);
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.game-title {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
</style>
