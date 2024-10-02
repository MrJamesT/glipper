import { AppSettings } from '../generated/client'
import { buildGameDB } from './gamesList'
import { mainWindow } from './mainWindow'
import { prisma } from './prisma'
import log from 'electron-log'

export async function getSettings() {
	const settings = await prisma.appSettings.findFirst()
	mainWindow!.webContents.send('getSettings', settings)
	return settings
}

export async function saveSettings(settings: AppSettings) {
	try {
		const currentSettings = await prisma.appSettings.findUnique({
			where: { id: 1 }
		})

		let updatedSettings: AppSettings
		if (currentSettings) {
			updatedSettings = await prisma.appSettings.update({
				where: { id: 1 },
				data: { ...currentSettings, ...settings }
			})
		} else {
			updatedSettings = await prisma.appSettings.create({
				data: { ...settings, lastGameDBUpdate: new Date() }
			})
		}

		if (!currentSettings || currentSettings.gameFolder !== updatedSettings.gameFolder) {
			buildGameDB(true)
		}

		mainWindow!.webContents.send('getSettings', updatedSettings)
		return true
	} catch (error) {
		log.error(error)
		return false
	}
}
