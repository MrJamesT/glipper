import path from 'path'
import { prisma } from './prisma'
import { promisify } from 'util'
import fs from 'fs'
import log from 'electron-log'

import ffmpeg, { FfprobeData } from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import ffprobePath from 'ffprobe-static'

if (ffmpegPath !== null) {
	ffmpeg.setFfmpegPath(ffmpegPath.replace('app.asar', 'app.asar.unpacked'))
	ffmpeg.setFfprobePath(ffprobePath.path.replace('app.asar', 'app.asar.unpacked'))
}
const ffprobe = promisify(ffmpeg.ffprobe)

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

		if (gamesToDelete.length > 0) {
			await prisma.clip.deleteMany({ where: { gameName: { in: gamesToDelete } } })
			await prisma.game.deleteMany({ where: { name: { in: gamesToDelete } } })
		}

		if (gamesToCreate.length > 0) {
			await prisma.game.createMany({
				data: gamesToCreate.map((name) => ({ name }))
			})
		}

		return true
	} catch (error) {
		log.error(error)
		return false
	}
}

export async function readClipsFolderAndSave(gameName: string) {
	try {
		const settings = await prisma.appSettings.findFirst()
		if (!settings) return

		const game = await prisma.game.findUnique({ where: { name: gameName } })
		if (!game) return

		const clipsInDb = await prisma.clip.findMany({ where: { gameName } })
		const clipsInDbNames = clipsInDb.map((clip) => clip.filename)

		const clipsInFolder = fs.readdirSync(path.join(settings.gameFolder, game.name))
		const clips = clipsInFolder.filter((clip) => clip.endsWith('.mp4') && !clipsInDbNames.includes(clip))

		const clipsToDelete = clipsInDbNames.filter(
			(clip) => !fs.existsSync(path.join(settings.gameFolder, game.name, clip))
		)

		await prisma.clip.deleteMany({ where: { filename: { in: clipsToDelete } } })

		for (const delClip of clipsToDelete) {
			const thumbPath = path.join(settings.gameFolder, 'thumbs', delClip + '.jpg')
			if (fs.existsSync(thumbPath)) {
				fs.unlinkSync(thumbPath)
			}
		}

		const clipsParsedWithId = clips
			.filter((clip) => clip.endsWith('.mp4'))
			.map((clip) => {
				const cut = clip.endsWith('.cut.mp4')

				const { size, birthtime } = fs.statSync(path.join(settings.gameFolder, game.name, clip))
				const sizeMB = +(size / (1024 * 1024)).toFixed(2)

				// Match date and time from the filename - format: YYYY.MM.DD - HH.MM.SS
				const parsedDateTimeFromName = clip.match(/(\d{4}\.\d{2}\.\d{2}) - (\d{2}\.\d{2}\.\d{2})/)
				const parsedDate = parsedDateTimeFromName
					? new Date(parsedDateTimeFromName[1] + ' ' + parsedDateTimeFromName[2].replace(/\./g, ':'))
					: new Date(birthtime)

				return { filename: clip, gameName, size: +sizeMB, timestamp: parsedDate, cut }
			})

		await prisma.clip.createMany({
			data: clipsParsedWithId
		})

		// Find stats in clips and aggregate them to the game
		const [lastClipDateResult, totalSizeResult, nOfClips] = await prisma.$transaction([
			prisma.clip.aggregate({
				where: { gameName },
				_max: { timestamp: true }
			}),
			prisma.clip.aggregate({
				where: { gameName },
				_sum: { size: true }
			}),
			prisma.clip.count({
				where: { gameName }
			})
		])
		const lastClipDate = lastClipDateResult._max.timestamp
		const totalSize = totalSizeResult._sum.size

		await prisma.game.update({
			where: { name: gameName },
			data: {
				lastClipDate: lastClipDate || new Date('1970-01-01'),
				size: totalSize || 0,
				nOfClips: nOfClips || 0
			}
		})

		return true
	} catch (error) {
		log.error(error)
		return false
	}
}

export async function getClipDetails(clipId: string) {
	try {
		const settings = await prisma.appSettings.findFirst()
		if (!settings) return

		const clip = await prisma.clip.findUnique({ where: { id: clipId } })
		if (!clip) return

		const meta = (await ffprobe(path.join(settings.gameFolder, clip.gameName, clip.filename))) as FfprobeData
		const duration = meta.streams[0].duration
		const fpsDiv = meta.streams[0].avg_frame_rate?.split('/') || []
		const fps = fpsDiv[0] && fpsDiv[1] ? Math.round(+fpsDiv[0] / +fpsDiv[1]) : 0
		const resolution = meta.streams[0].width + 'x' + meta.streams[0].height

		return { name: clip.filename, duration, fps, resolution, size: clip.size }
	} catch (error) {
		log.error(error)
		return false
	}
}
