<template>
	<Dialog v-model:visible="dialog" modal header="Settings" :style="{ width: '50rem' }" :draggable="false">
		<div class="flex flex-col gap-2">
			<label for="gameFolder">Clips Folder</label>
			<InputText id="gameFolder" v-model="settings.gameFolder" autocomplete="off" aria-describedby="path-help" />
			<small id="path-help">
				Specify a path where your clips are stored, it should contain folders with specific games and clips
				inside of those folders.
			</small>
		</div>

		<div class="flex justify-around items-center my-4">
			<div class="flex items-center">
				<Checkbox v-model="settings.clipboardToggle" binary input-id="clipboardToggle" />
				<label for="clipboardToggle" class="ml-3">Save cut clips to clipboard</label>
			</div>

			<div class="flex items-center">
				<label class="mx-3">Next clip after cutting</label>
				<SelectButton
					v-model="settings.clipSwitchDirection"
					:options="nextClipOptions"
					option-label="label"
					option-value="value"
				/>
			</div>
		</div>

		<div class="flex justify-end gap-4">
			<Button type="button" label="Cancel" severity="secondary" text @click="dialog = false"></Button>
			<Button type="button" label="Save" @click="saveSettings"></Button>
		</div>
	</Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import SelectButton from 'primevue/selectbutton'
import { useToast } from 'primevue/usetoast'

import { useMainStore } from '../stores/mainStore'

const dialog = defineModel<boolean>()
const nextClipOptions = [
	{ label: 'Up', value: 'up' },
	{ label: 'Down', value: 'down' }
]

const toast = useToast()
const mainStore = useMainStore()

const settings = ref({
	gameFolder: '',
	clipboardToggle: false,
	clipSwitchDirection: 'up'
})

const saveSettings = async () => {
	const saveResult = await window.electron.ipcRenderer.invoke('saveSettings', {
		gameFolder: settings.value.gameFolder,
		clipboardToggle: settings.value.clipboardToggle,
		clipSwitchDirection: settings.value.clipSwitchDirection
	})
	if (saveResult && mainStore.settings) {
		mainStore.settings.clipSwitchDirection = settings.value.clipSwitchDirection
		mainStore.settings.clipboardToggle = settings.value.clipboardToggle
		mainStore.settings.gameFolder = settings.value.gameFolder

		toast.add({ severity: 'success', summary: 'Settings saved successfully!', life: 3000 })
	} else {
		toast.add({ severity: 'error', summary: 'Failed to save settings!', life: 3000 })
	}
	dialog.value = false
}

watch(dialog, (val) => {
	if (val && mainStore.settings) {
		settings.value.gameFolder = mainStore.settings.gameFolder
		settings.value.clipboardToggle = mainStore.settings.clipboardToggle
		settings.value.clipSwitchDirection = mainStore.settings.clipSwitchDirection
	}
})
</script>

<style scoped></style>
