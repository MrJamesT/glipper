<template>
	<Dialog v-model:visible="dialog" modal header="Settings" :style="{ width: '40rem' }" :draggable="false">
		<div class="flex flex-col gap-6 pt-1">
			<section>
				<label for="gameFolder" class="text-sm font-semibold">Clips folder</label>
				<p class="mt-0.5 mb-2 text-xs text-zinc-400">
					Where your recordings land. It needs one sub folder per game with the .mp4 files inside.
				</p>
				<InputGroup>
					<InputText
						id="gameFolder"
						v-model="settings.gameFolder"
						autocomplete="off"
						placeholder="C:\Videos\Clips"
					/>
					<Button icon="pi pi-folder-open" label="Browse" severity="secondary" @click="pickFolder" />
				</InputGroup>
			</section>

			<Divider class="!my-0" />

			<section class="grid gap-6 sm:grid-cols-2">
				<div>
					<div class="text-sm font-semibold">After a cut</div>
					<p class="mt-0.5 mb-2 text-xs text-zinc-400">Which clip gets selected next.</p>
					<SelectButton
						v-model="settings.clipSwitchDirection"
						:options="nextClipOptions"
						option-label="label"
						option-value="value"
						:allow-empty="false"
						size="small"
					/>
				</div>

				<div>
					<div class="text-sm font-semibold">Clipboard</div>
					<p class="mt-0.5 mb-2 text-xs text-zinc-400">Copy the cut file so you can paste it right away.</p>
					<div class="flex items-center gap-3 pt-1">
						<ToggleSwitch v-model="settings.clipboardToggle" input-id="clipboardToggle" />
						<label for="clipboardToggle" class="text-sm">Copy cut clips</label>
					</div>
				</div>
			</section>
		</div>

		<template #footer>
			<Button label="Cancel" severity="secondary" text @click="dialog = false" />
			<Button label="Save" icon="pi pi-check" @click="saveSettings" />
		</template>
	</Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputGroup from 'primevue/inputgroup'
import ToggleSwitch from 'primevue/toggleswitch'
import SelectButton from 'primevue/selectbutton'
import Divider from 'primevue/divider'
import { useToast } from 'primevue/usetoast'

import { useMainStore } from '../stores/mainStore'

const dialog = defineModel<boolean>()
const nextClipOptions = [
	{ label: 'Newer clip', value: 'up' },
	{ label: 'Older clip', value: 'down' }
]

const toast = useToast()
const mainStore = useMainStore()

const settings = ref({
	gameFolder: '',
	clipboardToggle: false,
	clipSwitchDirection: 'up'
})

const pickFolder = async () => {
	const picked = (await window.electron.ipcRenderer.invoke('pickFolder', settings.value.gameFolder)) as string | null
	if (picked) settings.value.gameFolder = picked
}

const saveSettings = async () => {
	const saveResult = await window.electron.ipcRenderer.invoke('saveSettings', {
		gameFolder: settings.value.gameFolder,
		clipboardToggle: settings.value.clipboardToggle,
		clipSwitchDirection: settings.value.clipSwitchDirection
	})
	if (saveResult) {
		mainStore.settings = {
			id: 1,
			gameFolder: settings.value.gameFolder,
			clipboardToggle: settings.value.clipboardToggle,
			clipSwitchDirection: settings.value.clipSwitchDirection,
			lastGameDBUpdate: new Date()
		}

		toast.add({ severity: 'success', summary: 'Settings saved', life: 3000 })
	} else {
		toast.add({ severity: 'error', summary: 'Could not save settings', life: 3000 })
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
