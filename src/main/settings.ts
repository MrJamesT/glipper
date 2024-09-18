import { mainWindow } from './mainWindow'
import { prisma } from './prisma'

export async function getSettings() {
	const settings = await prisma.appSettings.findFirst()
	mainWindow!.webContents.send('getSettings', settings)
	return settings
}
