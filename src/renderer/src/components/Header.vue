<template>
	<header
		class="relative z-10 flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-zinc-950/60 px-4 backdrop-blur-md"
	>
		<div class="flex items-center gap-3">
			<div class="flex items-center gap-2.5">
				<AppLogo class="h-7 w-7" />
				<span class="text-lg font-bold tracking-tight">Glipper</span>
				<span
					class="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] font-medium text-zinc-400"
				>
					{{ appVersion }}
				</span>
			</div>

			<Transition name="fade">
				<Button
					v-if="mainStore.selectedGame"
					label="Library"
					icon="pi pi-arrow-left"
					text
					size="small"
					severity="secondary"
					class="ml-2"
					@click="mainStore.selectGame(null)"
				/>
			</Transition>
		</div>

		<div class="flex items-center gap-2">
			<Transition name="fade">
				<div
					v-if="progress > 0"
					class="mr-2 flex items-center gap-3 rounded-full border border-white/10 bg-white/5 py-1 pr-1 pl-3"
				>
					<span class="text-xs text-zinc-300">{{ progressAction }}</span>
					<ProgressBar :value="progress" :show-value="false" class="!h-1.5 w-40" />
				</div>
			</Transition>

			<div class="hidden items-center gap-1 text-sm text-zinc-400 md:flex">
				<i class="pi pi-clock text-xs" />
				<span v-if="lastCheck">Scanned {{ lastCheck }}</span>
				<span v-else>Not scanned yet</span>
				<template v-if="lastCheck">
					<span class="mx-1 text-zinc-600">·</span>
					<span :class="clipsSinceLastCheck > 0 ? 'text-primary-400' : ''"
						>{{ clipsSinceLastCheck }} new</span
					>
				</template>
			</div>

			<Button
				v-tooltip.bottom="'Scan clips folder'"
				icon="pi pi-refresh"
				text
				rounded
				severity="secondary"
				aria-label="Scan clips folder"
				@click="handleRefreshClick"
			/>
			<Button
				v-tooltip.bottom="'Settings'"
				icon="pi pi-cog"
				text
				rounded
				severity="secondary"
				aria-label="Settings"
				@click="mainStore.settingsDialogOpen = true"
			/>
		</div>
	</header>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import AppLogo from './AppLogo.vue'

import { formatDistance } from 'date-fns'
import { useMainStore } from '../stores/mainStore'

import { ref, computed, onMounted, onUnmounted } from 'vue'

const mainStore = useMainStore()
const clipsSinceLastCheck = ref(0)
const progress = ref(0)
const progressAction = ref('')

// ticks so the relative time below re-renders while the app stays open
const now = ref(new Date())
let clock: ReturnType<typeof setInterval> | undefined

const lastCheck = computed(() => {
	if (!mainStore.settings?.lastGameDBUpdate) return null
	return formatDistance(new Date(mainStore.settings.lastGameDBUpdate), now.value, { addSuffix: true })
})

const appVersion = `v${__APP_VERSION__}`

const handleRefreshClick = () => {
	window.electron.ipcRenderer.invoke('buildGameDB')
}

onMounted(async () => {
	clock = setInterval(() => (now.value = new Date()), 30_000)

	window.electron.ipcRenderer.send('clipsSinceLastUpdate')
	window.electron.ipcRenderer.on('clipsSinceLastUpdate', (_, res: number) => {
		clipsSinceLastCheck.value = res
	})

	window.electron.ipcRenderer.on('progress', (_, res: { percentage: number; action: string }) => {
		progress.value = res.percentage
		progressAction.value = res.action

		if (res.percentage === 100) {
			setTimeout(() => {
				if (progress.value === 100) {
					progress.value = 0
					progressAction.value = ''
				}
			}, 2000)
		}
	})
})

onUnmounted(() => {
	clearInterval(clock)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
