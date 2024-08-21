<template>
	<div class="w-[100dvw] h-[100dvh] overflow-x-hidden">
		<Header />
		<GameTiles />
	</div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

import GameTiles from './components/GameTiles.vue'
import Header from './components/Header.vue'

onMounted(() => {
	//window.electron.ipcRenderer.invoke('buildGameDB').then((res) => {
	//	console.log(res)
	//})
})
</script>
