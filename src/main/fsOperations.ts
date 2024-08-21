import path from 'path'
import { prisma } from './prisma'
import fs from 'fs'

export async function readGamesFolderAndSave() {
	try {
		const settings = await prisma.appSettings.findFirst()
		if (!settings) return

		const games = fs
			.readdirSync(settings.gameFolder, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name)

		// Based on the folders, create missing games, and delete games that are not in the folder
		const gamesInDb = await prisma.game.findMany()
		const gamesInDbNames = gamesInDb.map((game) => game.name)
		const gamesToDelete = gamesInDbNames.filter((game) => !games.includes(game))
		const gamesToCreate = games.filter((game) => !gamesInDbNames.includes(game))

		await prisma.game.deleteMany({ where: { name: { in: gamesToDelete } } })
		await prisma.game.createMany({
			data: gamesToCreate.map((name) => ({ name }))
		})

		return true
	} catch (error) {
		console.error(error)
		return false
	}
}

export async function readClipsFolderAndSave(gameId: string) {
	try {
		const settings = await prisma.appSettings.findFirst()
		if (!settings) return

		const game = await prisma.game.findUnique({ where: { id: gameId } })
		if (!game) return

		const clipsInDb = await prisma.clip.findMany({ where: { gameId } })
		const clipsInDbNames = clipsInDb.map((clip) => clip.filename)

		const clips = fs
			.readdirSync(path.join(settings.gameFolder, game.name))
			.filter((clip) => !clipsInDbNames.includes(clip))

		const clipsToDelete = clipsInDbNames.filter((clip) => !clips.includes(clip))
		await prisma.clip.deleteMany({ where: { filename: { in: clipsToDelete } } })

		let dirSize = 0
		let lastClipDate = new Date('1970-01-01T00:00:00')
		const clipsParsedWithId = clips
			.filter((clip) => clip.endsWith('.mp4'))
			.map((clip) => {
				const cut = clip.endsWith('.cut.mp4')

				const { size, birthtime } = fs.statSync(path.join(settings.gameFolder, game.name, clip))
				const sizeMB = +(size / (1024 * 1024)).toFixed(2)
				dirSize += +sizeMB
				lastClipDate = birthtime > lastClipDate ? birthtime : lastClipDate

				return { filename: clip, gameId, size: +sizeMB, timestamp: birthtime, cut }
			})

		await prisma.clip.createMany({
			data: clipsParsedWithId
		})

		await prisma.game.update({
			where: { id: gameId },
			data: { lastClipDate, size: dirSize }
		})

		return true
	} catch (error) {
		console.error(error)
		return false
	}
}
