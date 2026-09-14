<template>
	<section class="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
		<div class="panel relative flex min-h-0 flex-1 items-center justify-center overflow-hidden !bg-black">
			<video ref="video" controls class="h-full w-full" :class="{ invisible: !hasClip }"></video>
			<div v-if="!hasClip" class="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
				<i class="pi pi-play-circle mb-3 text-5xl text-zinc-600" />
				<p class="text-sm">Pick a clip on the left to start</p>
			</div>
		</div>

		<div class="panel p-4 transition" :class="{ 'pointer-events-none opacity-40': !hasClip }">
			<div class="flex items-center justify-between text-xs text-zinc-400">
				<span class="font-semibold tracking-wide text-zinc-300 uppercase">Trim</span>
				<span>
					<span class="text-zinc-200">{{ formatSeconds(clipSettings.startTime) }}</span>
					<span class="mx-1">→</span>
					<span class="text-zinc-200">{{ formatSeconds(clipSettings.endTime) }}</span>
					<span class="mx-2 text-zinc-600">·</span>
					{{ (clipSettings.endTime - clipSettings.startTime).toFixed(1) }}s of
					{{ clipDetails.duration.toFixed(1) }}s
				</span>
			</div>

			<div class="mt-2 h-2 rounded-full bg-zinc-800">
				<div
					class="relative h-full rounded-full bg-primary-500 transition-all"
					:style="{ marginLeft: rangePercent.start + '%', width: rangePercent.width + '%' }"
				></div>
			</div>

			<div class="mt-4 flex flex-wrap items-center gap-2">
				<Button
					v-tooltip.top="'Shortcut: Q'"
					label="Mark start"
					icon="pi pi-step-backward"
					severity="secondary"
					outlined
					size="small"
					@click="markStartTime"
				/>
				<Button
					v-tooltip.top="'Shortcut: W'"
					label="Mark end"
					icon="pi pi-step-forward"
					severity="secondary"
					outlined
					size="small"
					@click="markEndTime"
				/>

				<div class="ml-auto flex gap-2">
					<Button
						label="Delete clip"
						icon="pi pi-trash"
						severity="danger"
						outlined
						size="small"
						@click="deleteClip"
					/>
					<Button
						v-tooltip.top="'Shortcut: S'"
						label="Save cut"
						icon="pi pi-save"
						size="small"
						@click="saveClip"
					/>
				</div>
			</div>

			<div class="mt-4 flex flex-wrap items-center gap-4">
				<InputGroup class="max-w-xl flex-1">
					<InputText
						v-model="clipSettings.customName"
						placeholder="Clip name"
						size="small"
						@focus="removeListeners"
						@blur="addListeners"
					/>
					<InputGroupAddon class="text-xs">.cut.mp4</InputGroupAddon>
				</InputGroup>

				<div class="flex items-center gap-2">
					<Checkbox v-model="clipSettings.removeOriginal" input-id="removeOrig" binary />
					<label for="removeOrig" class="text-sm text-zinc-300">Delete original</label>
				</div>
			</div>

			<div v-if="clipDetails.duration > 0" class="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-400">
				<span><i class="pi pi-video mr-1 text-[10px]" />{{ clipDetails.fps }} fps</span>
				<span><i class="pi pi-image mr-1 text-[10px]" />{{ clipDetails.resolution }}</span>
				<span><i class="pi pi-file mr-1 text-[10px]" />{{ formatSize(+clipDetails.size) }} source</span>
				<span><i class="pi pi-save mr-1 text-[10px]" />~{{ approximateFileSize }} after cut</span>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'

import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Checkbox from 'primevue/checkbox'

import { useMainStore } from '../stores/mainStore'
import { Clip } from '../../../generated/client'
import { formatSeconds, formatSize, toFileUrl } from '../utils/format'

const mainStore = useMainStore()
const toast = useToast()

const video = ref<HTMLVideoElement>()

const clipSettings = ref({
	startTime: 0,
	endTime: 0,
	removeOriginal: true,
	customName: ''
})

const clipDetails = ref({
	name: '',
	duration: 0,
	fps: 0,
	resolution: '',
	size: ''
})

const hasClip = computed(() => mainStore.selectedClipId.length > 0)

const rangePercent = computed(() => {
	const total = clipDetails.value.duration || 1
	const start = Math.min(100, Math.max(0, (clipSettings.value.startTime / total) * 100))
	const end = Math.min(100, Math.max(start, (clipSettings.value.endTime / total) * 100))
	return { start, width: end - start }
})

const approximateFileSize = computed(() => {
	const duration = clipSettings.value.endTime - clipSettings.value.startTime
	if (!clipDetails.value.duration) return formatSize(0)
	return formatSize((+clipDetails.value.size / clipDetails.value.duration) * duration)
})

const getClipDetails = async () => {
	const data = await window.electron.ipcRenderer.invoke('getClipDetails', mainStore.selectedClipId)
	if (!data) return
	clipDetails.value.name = data.name
	clipDetails.value.duration = +(+data.duration).toFixed(2)
	clipDetails.value.fps = +data.fps
	clipDetails.value.resolution = data.resolution
	clipDetails.value.size = data.size
	// default to the last 10 seconds, the usual "that was cool" moment
	clipSettings.value.startTime = +Math.max(0, clipDetails.value.duration - 10).toFixed(2)
	clipSettings.value.endTime = clipDetails.value.duration
	clipSettings.value.customName = (data.name || '').replace('.mp4', '')
}

// the OS keeps the file locked while the player holds it, so drop the source first
const releaseVideoFile = () => {
	if (!video.value) return
	video.value.pause()
	video.value.removeAttribute('src')
	video.value.load()
}

const neighbourClipId = (fallbackToOtherSide: boolean) => {
	const clips = mainStore.sortedClips
	const clipIndex = clips.findIndex((c: Clip) => c.id === mainStore.selectedClipId)
	if (clipIndex === -1) return null

	const up = mainStore.settings?.clipSwitchDirection !== 'down'
	const preferred = up ? clips[clipIndex - 1] : clips[clipIndex + 1]
	const other = up ? clips[clipIndex + 1] : clips[clipIndex - 1]

	if (preferred) return preferred.id
	if (fallbackToOtherSide && other) return other.id
	return null
}

const saveClip = async () => {
	if (!hasClip.value) return
	releaseVideoFile()
	const nextClipId = neighbourClipId(clipSettings.value.removeOriginal)

	const clipCutResult = (await window.electron.ipcRenderer.invoke('cutClip', mainStore.selectedClipId, {
		startTime: clipSettings.value.startTime,
		endTime: clipSettings.value.endTime,
		removeOriginal: clipSettings.value.removeOriginal,
		customName: clipSettings.value.customName + '.cut.mp4',
		pasteToClipboard: mainStore.settings!.clipboardToggle
	})) as boolean

	if (clipCutResult) {
		toast.add({ severity: 'success', summary: 'Clip saved', life: 3000 })
		if (nextClipId) mainStore.selectedClipId = nextClipId
	} else {
		toast.add({ severity: 'error', summary: 'Could not save the clip', life: 3000 })
	}
}

const deleteClip = async () => {
	if (!hasClip.value) return
	releaseVideoFile()
	const nextClipId = neighbourClipId(true)

	const clipDeleteResult = (await window.electron.ipcRenderer.invoke(
		'deleteClip',
		mainStore.selectedClipId
	)) as boolean

	if (clipDeleteResult) {
		toast.add({ severity: 'success', summary: 'Clip deleted', life: 3000 })
		mainStore.selectedClipId = nextClipId ?? ''
		if (!nextClipId) clipDetails.value.duration = 0
	} else {
		toast.add({ severity: 'error', summary: 'Could not delete the clip', life: 3000 })
	}
}

watch(
	() => [mainStore.selectedGame, mainStore.selectedClipId],
	async () => {
		if (mainStore.selectedGame && mainStore.selectedClipId.length > 0 && video.value) {
			await getClipDetails()
			video.value.src = toFileUrl(
				mainStore.settings!.gameFolder,
				mainStore.selectedGame.name,
				clipDetails.value.name
			)
			video.value.currentTime = clipSettings.value.startTime
			video.value.volume = 0.1
			video.value.play()
		}
	}
)

const markStartTime = () => {
	if (!video.value || !hasClip.value) return
	clipSettings.value.startTime = +video.value.currentTime.toFixed(2)
	if (clipSettings.value.endTime < clipSettings.value.startTime) {
		clipSettings.value.endTime = clipDetails.value.duration
	}
}

const markEndTime = () => {
	if (!video.value || !hasClip.value) return
	clipSettings.value.endTime = +video.value.currentTime.toFixed(2)
}

// Keyboard shortcuts, paused while the name input has focus
const handleKeyboard = (e: KeyboardEvent) => {
	if (e.key === 'q') markStartTime()
	else if (e.key === 'w') markEndTime()
	else if (e.key === 's') saveClip()
}

const removeListeners = () => {
	document.removeEventListener('keydown', handleKeyboard)
}

const addListeners = () => {
	document.addEventListener('keydown', handleKeyboard)
}

onMounted(() => {
	addListeners()
})

onUnmounted(() => {
	removeListeners()
})
</script>
