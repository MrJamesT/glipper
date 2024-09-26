<template>
	<div class="flex flex-col justify-start items-center w-full p-10 pt-0">
		<video ref="video" controls class="h-full max-h-[80%] w-full"></video>

		<div class="flex justify-center items-center p-4">
			<Button
				class="btn mx-2"
				icon="pi pi-map-marker"
				icon-pos="left"
				label="Mark start point"
				@click="markStartTime"
			/>
			<Button
				class="btn mx-2"
				icon="pi pi-map-marker"
				icon-pos="left"
				label="Mark end point"
				@click="markEndTime"
			/>
			<Button class="btn mx-2" disabled icon="pi pi-video" icon-pos="left" label="Add to compilation" />
			<Button class="btn mx-2" icon="pi pi-trash" icon-pos="left" label="Delete clip" @click="deleteClip" />
			<Button class="btn mx-2" icon="pi pi-save" icon-pos="left" label="Save clip" @click="saveClip" />
		</div>

		<div class="flex justify-center items-center">
			<InputText
				v-model="clipSettings.customName"
				placeholder="Custom clip name"
				class="p-2"
				style="min-width: 600px"
				@focus="handleInputFocus"
			/>
			<div class="flex items-center ml-4">
				<Checkbox v-model="clipSettings.removeOriginal" input-id="removeOrig" binary />
				<label for="removeOrig" class="ml-2">Delete original clip</label>
			</div>
		</div>

		<div v-if="clipDetails.duration > 0" class="flex justify-center items-center p-2">
			<Chip class="m-2" :label="'Start: ' + clipSettings.startTime + 's'" icon="pi pi-map-marker" />
			<Chip class="m-2" :label="'End: ' + clipSettings.endTime + 's'" icon="pi pi-map-marker" />
			<Chip class="m-2" :label="'Duration: ' + clipDetails.duration + 's'" icon="pi pi-clock" />
			<Chip class="m-2" :label="'FPS: ' + clipDetails.fps" icon="pi pi-video" />
			<Chip class="m-2" :label="'Resolution: ' + clipDetails.resolution" icon="pi pi-image" />
			<Chip class="m-2" :label="'Size: ' + approximateFileSize" icon="pi pi-file" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'

import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Chip from 'primevue/chip'

import { useMainStore } from '../stores/mainStore'
import { Clip } from '@prisma/client'
const mainStore = useMainStore()
const toast = useToast()

const video = ref<HTMLVideoElement>()

const clipSettings = ref({
	startTime: 50,
	endTime: 60,
	compilation: false,
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

const approximateFileSize = computed(() => {
	const duration = clipSettings.value.endTime - clipSettings.value.startTime
	return '~' + ((+clipDetails.value.size / clipDetails.value.duration) * duration).toFixed(2) + ' MB'
})

const getClipDetails = async () => {
	const data = await window.electron.ipcRenderer.invoke('getClipDetails', mainStore.selectedClipId)
	clipDetails.value.name = data.name
	clipDetails.value.duration = +(+data.duration).toFixed(2)
	clipDetails.value.fps = +data.fps
	clipDetails.value.resolution = data.resolution
	clipSettings.value.startTime = +(
		+clipDetails.value.duration - 10 < 0 ? 0 : +clipDetails.value.duration - 10
	).toFixed(2)
	clipSettings.value.endTime = +(+clipDetails.value.duration).toFixed(2)
	clipDetails.value.size = data.size
	clipSettings.value.customName = data.name.replace('.mp4', '')
}

const saveClip = async () => {
	if (video.value) video.value.src = ''

	const clipCutResult = (await window.electron.ipcRenderer.invoke('cutClip', mainStore.selectedClipId, {
		startTime: clipSettings.value.startTime,
		endTime: clipSettings.value.endTime,
		removeOriginal: clipSettings.value.removeOriginal,
		customName: clipSettings.value.customName + '.cut.mp4',
		pasteToClipboard: mainStore.settings!.clipboardToggle
	})) as boolean

	if (clipCutResult) {
		toast.add({ severity: 'success', summary: 'Clip saved successfully!', life: 3000 })

		const clips = mainStore.sortedClips
		if (mainStore.settings?.clipSwitchDirection) {
			const clipIndex = clips.findIndex((c: Clip) => c.id === mainStore.selectedClipId)
			if (mainStore.settings.clipSwitchDirection === 'up') {
				if (clipIndex > 0) mainStore.selectedClipId = clips[clipIndex - 1].id
			} else {
				if (clipIndex < clips.length - 1) mainStore.selectedClipId = clips[clipIndex + 1].id
			}
		}
	} else {
		toast.add({ severity: 'error', summary: 'Error saving clip!', life: 3000 })
	}
}

const deleteClip = async () => {
	if (video.value) video.value.src = ''

	const clipDeleteResult = (await window.electron.ipcRenderer.invoke(
		'deleteClip',
		mainStore.selectedClipId
	)) as boolean

	if (clipDeleteResult) {
		toast.add({ severity: 'success', summary: 'Clip deleted successfully!', life: 3000 })
	} else {
		toast.add({ severity: 'error', summary: 'Error deleting clip!', life: 3000 })
	}
}

watch(
	() => [mainStore.selectedGame, mainStore.selectedClipId],
	async () => {
		if (mainStore.selectedGame && mainStore.selectedClipId.length > 0 && video.value) {
			await getClipDetails()
			video.value.src = `${mainStore.settings!.gameFolder}/${mainStore.selectedGame.name}/${clipDetails.value.name}`
			video.value.currentTime = clipSettings.value.startTime
			video.value.volume = 0.1
			video.value.play()
		}
	}
)

const markStartTime = () => {
	if (!video.value) return
	clipSettings.value.startTime = +video.value.currentTime.toFixed(2)
}

const markEndTime = () => {
	if (!video.value) return
	clipSettings.value.endTime = +video.value.currentTime.toFixed(2)
}

// Handle all keyboard events along with removing them when user is typing in the input field
const handleKeyboard = (e: KeyboardEvent) => {
	if (e.key === 'q') {
		markStartTime()
	} else if (e.key === 'w') {
		markEndTime()
	} else if (e.key === 'c') {
		console.warn('not implemented')
	} else if (e.key === 's') {
		saveClip()
	}
}

const removeListeners = () => {
	document.removeEventListener('keydown', handleKeyboard)
}

const addListeners = () => {
	document.addEventListener('keydown', handleKeyboard)
}

const handleInputFocus = (focus: boolean) => {
	if (focus) removeListeners()
	else addListeners()
}

onMounted(() => {
	addListeners()
})
</script>

<style scoped></style>
