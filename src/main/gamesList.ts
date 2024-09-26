import { readClipsFolderAndSave, readGamesFolderAndSave } from './fsOperations'
import { getAndSaveGamePosters } from './gamePosters'
import { mainWindow } from './mainWindow'
import { prisma } from './prisma'
import { getSettings } from './settings'

export async function gamesList() {
	const games = await prisma.game.findMany({ where: { nOfClips: { gt: 0 } } })
	mainWindow!.webContents.send('gamesList', games)
	return games
}

export async function clipsList(gameName: string) {
	const clips = await prisma.clip.findMany({ where: { gameName } })
	mainWindow!.webContents.send('clipsList', clips)
	return clips
}

export async function getCountOfClipsSinceLastUpdate() {
	const settings = await prisma.appSettings.findFirst()
	if (!settings) return 0

	const lastUpdate = settings.lastGameDBUpdate
	const clips = await prisma.clip.count({ where: { timestamp: { gte: lastUpdate } } })
	mainWindow!.webContents.send('clipsSinceLastUpdate', clips)
	return clips
}

export async function buildGameDB(fromScratch = false) {
	if (fromScratch) {
		await prisma.clip.deleteMany({})
		await prisma.game.deleteMany({})
	}

	await readGamesFolderAndSave()

	const games = await prisma.game.findMany()
	for (const [index, game] of games.entries()) {
		await readClipsFolderAndSave(game.name)

		mainWindow!.webContents.send('progress', {
			action: `Building (${index}/${games.length})...`,
			percentage: Math.round((index / games.length) * 100)
		})
	}

	mainWindow!.webContents.send('progress', {
		action: 'Game DB Built!',
		percentage: 100
	})

	await prisma.appSettings.update({
		where: { id: 1 },
		data: { lastGameDBUpdate: new Date() }
	})

	getCountOfClipsSinceLastUpdate()
	getSettings()
	await getAndSaveGamePosters()

	return true
}
