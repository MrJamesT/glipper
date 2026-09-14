import path from 'path'
import { prisma } from './prisma'
import fs from 'fs'
import { mainWindow } from './mainWindow'
import { clipsList } from './gamesList'
import { writeFilePaths } from 'electron-clipboard-ex'
import log from 'electron-log'

import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import ffprobePath from 'ffprobe-static'

if (ffmpegPath !== null) {
	ffmpeg.setFfmpegPath(ffmpegPath.replace('app.asar', 'app.asar.unpacked'))
	ffmpeg.setFfprobePath(ffprobePath.path.replace('app.asar', 'app.asar.unpacked'))
}

interface ClipCutData {
	startTime: number
	endTime: number
	removeOriginal: boolean
	customName: string
	pasteToClipboard: boolean
}

export async function cutClip(clipId: string, reqData: ClipCutData) {
	try {
		const settings = await prisma.appSettings.findFirst()
		if (!settings) return false

		const clip = await prisma.clip.findUnique({ where: { id: clipId } })
		if (!clip) return false

		const oldClipPath = path.join(settings.gameFolder, clip.gameName, clip.filename)
		const newClipPath = path.join(settings.gameFolder, clip.gameName, reqData.customName)
		const duration = reqData.endTime - reqData.startTime

		return new Promise((resolve) => {
			ffmpeg(oldClipPath)
				.setStartTime(reqData.startTime)
				.videoCodec('copy')
				.audioCodec('copy')
				.setDuration(duration)
				.output(newClipPath)
				.on('start', () => {
					mainWindow!.webContents.send('progress', {
						action: 'Saving...',
						percentage: 0
					})
				})
				.on('end', async () => {
					try {
						mainWindow!.webContents.send('progress', {
							action: 'File Saved!',
							percentage: 100
						})

						if (reqData.removeOriginal) {
							fs.unlinkSync(oldClipPath)

							const thumbPath = path.join(settings.gameFolder, 'thumbs', clip.filename + '.jpg')
							if (fs.existsSync(thumbPath)) {
								fs.unlinkSync(thumbPath)
							}
							await prisma.clip.delete({ where: { id: clipId } })
						}

						const { size } = fs.statSync(newClipPath)
						const sizeMB = (size / (1024 * 1024)).toFixed(2)

						await prisma.clip.create({
							data: {
								filename: reqData.customName,
								size: +sizeMB,
								timestamp: clip.timestamp,
								cut: true,
								game: { connect: { name: clip.gameName } }
							}
						})

						if (reqData.pasteToClipboard) {
							writeFilePaths([newClipPath])
						}

						resolve(true)
						clipsList(clip.gameName)
					} catch (error) {
						log.error(error)
						resolve(false)
					}
				})
				.on('progress', (progress) => {
					const time = parseInt(progress.timemark.replace(/:/g, ''))
					const percentage = (time / duration) * 100

					mainWindow!.webContents.send('progress', {
						action: 'Saving...',
						percentage
					})
				})
				.on('error', (err) => {
					log.error(err)
					resolve(false)
				})
				.run()
		})
	} catch (error) {
		log.error(error)
		return false
	}
}

export async function deleteClip(clipId: string) {
	try {
		const settings = await prisma.appSettings.findFirst()
		if (!settings) return

		const clip = await prisma.clip.findUnique({ where: { id: clipId } })
		if (!clip) return

		fs.unlinkSync(path.join(settings.gameFolder, clip.gameName, clip.filename))

		const thumbPath = path.join(settings.gameFolder, 'thumbs', clip.filename + '.jpg')
		if (fs.existsSync(thumbPath)) {
			fs.unlinkSync(thumbPath)
		}

		await prisma.clip.delete({ where: { id: clipId } })
		clipsList(clip.gameName)
		return true
	} catch (error) {
		log.error(error)
		return false
	}
}

export async function getClipsThumbnail(clipIds: string[]) {
	try {
		const settings = await prisma.appSettings.findFirst()
		if (!settings) return

		const clips = await prisma.clip.findMany({ where: { id: { in: clipIds } } })
		if (!clips || clips.length === 0) return

		// Get the thumbnail of each clip through ffmpeg
		const thumbnailsGenerated = await Promise.all(
			clips.map(async (clip) => {
				const clipPath = path.join(settings.gameFolder, clip.gameName, clip.filename)
				const thumbsFolder = path.join(settings.gameFolder, 'thumbs')
				const thumbnailPath = path.join(thumbsFolder, clip.filename + '.jpg')

				if (!fs.existsSync(thumbsFolder)) {
					fs.mkdirSync(thumbsFolder)
				}

				if (fs.existsSync(thumbnailPath)) {
					return true
				}

				return new Promise((resolve) => {
					ffmpeg(clipPath)
						.screenshots({
							count: 1,
							filename: clip.filename + '.jpg',
							folder: thumbsFolder,
							size: '320x180'
						})
						.outputOptions('-q:v 2')
						.on('end', () => {
							resolve(true)
						})
						.on('error', () => {
							resolve(false)
						})
				})
			})
		)

		const allThumbnailsGenerated = thumbnailsGenerated.every((result) => result === true)
		mainWindow!.webContents.send('getThumbnails', allThumbnailsGenerated)
		return allThumbnailsGenerated
	} catch (error) {
		log.error(error)
		return []
	}
}
