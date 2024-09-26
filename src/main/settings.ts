import { AppSettings } from '@prisma/client'
import { mainWindow } from './mainWindow'
import { prisma } from './prisma'

export async function getSettings() {
	const settings = await prisma.appSettings.findFirst()
	mainWindow!.webContents.send('getSettings', settings)
	return settings
}

export async function saveSettings(settings: AppSettings) {
	const currentSettings = await prisma.appSettings.findUnique({
		where: { id: 1 }
	})

	const updatedSettings = await prisma.appSettings.update({
		where: { id: 1 },
		data: { ...currentSettings, ...settings }
	})

	mainWindow!.webContents.send('getSettings', updatedSettings)
	return true
}
