<template>
	<div class="h-full w-full">
		<Header />
		<div class="h-full pt-14">
			<GameTiles v-if="mainStore.selectedGameId === ''" />
			<GamePage v-else />
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

import GameTiles from './components/GameTiles.vue'
import Header from './components/Header.vue'

import { useMainStore } from './stores/mainStore'
import GamePage from './components/GamePage.vue'

const mainStore = useMainStore()

onMounted(() => {
	//window.electron.ipcRenderer.invoke('rebuildGameDB').then((res) => {
	//	console.log(res)
	//})
})
</script>
