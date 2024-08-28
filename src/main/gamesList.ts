import { readClipsFolderAndSave, readGamesFolderAndSave } from './fsOperations'
import { getAndSaveGamePosters } from './gamePosters'
import { prisma } from './prisma'

export async function gamesList() {
	const games = await prisma.game.findMany({ where: { nOfClips: { gt: 0 } } })
	return games
}

export async function clipsList(gameName: string) {
	const clips = await prisma.clip.findMany({ where: { gameName } })
	return clips
}

export async function buildGameDB(fromScratch = false) {
	if (fromScratch) {
		await prisma.clip.deleteMany({})
		await prisma.game.deleteMany({})
	}

	await readGamesFolderAndSave()

	const games = await prisma.game.findMany()
	for (const game of games) {
		console.log(`Reading clips for ${game.name}`)
		await readClipsFolderAndSave(game.name)
	}

	await getAndSaveGamePosters()

	return true
}
