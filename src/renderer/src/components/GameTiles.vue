<template>
	<div class="flex flex-wrap p-2 h-full">
		<div
			v-for="game in games"
			:key="game.id"
			class="game-card bg-gray-800 p-3 m-3 rounded flex flex-col justify-between cursor-pointer"
		>
			<div class="flex flex-col justify-end items-end">
				<div class="bg-gray-700 text-white text-xs px-2 py-1 rounded">
					{{ formatDistanceToNowStrict(new Date(game.lastClipDate || ''), { addSuffix: true }) }}
				</div>
				<div class="bg-gray-700 text-white text-xs px-2 py-1 rounded mt-2">{{ game.size }}</div>
			</div>

			<div>
				<div class="bg-purple-500 text-white text-xs px-2 py-1 rounded">{{ game.nOfClips }}</div>
				<div class="font-bold game-title">
					{{ game.name }}
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { formatDistanceToNowStrict } from 'date-fns'
import { Game } from '@prisma/client'

const games = ref<Game[]>([])

onMounted(() => {
	window.electron.ipcRenderer.invoke('gamesList').then((res: Game[]) => {
		games.value = res
	})
})
</script>

<style scoped>
.game-card {
	transition: transform 0.3s ease;
	width: 12rem;
	height: 17rem;
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
