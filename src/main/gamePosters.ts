import { prisma } from './prisma'

interface ApiPosterResult {
	status: string
	results: Record<string, string>
}

export async function getAndSaveGamePosters() {
	const games = await prisma.game.findMany()
	const gameNames = games
		.filter((game) => (game.poster || '').length === 0 || game.nOfClips > 0)
		.map((game) => game.name)

	if (gameNames.length === 0) return true

	const req = await fetch('https://glipper.babyradjiri.eu/fetch', {
		method: 'POST',
		body: JSON.stringify({ names: gameNames }),
		headers: { 'Content-Type': 'application/json' }
	})
	const posters = (await req.json()) as ApiPosterResult

	for (const [name, poster] of Object.entries(posters.results)) {
		await prisma.game.update({
			where: { name },
			data: { poster }
		})
	}

	return true
}
