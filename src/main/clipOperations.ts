import path from 'path'
import { prisma } from './prisma'
import fs from 'fs'
import { clipboard, ipcMain } from 'electron'

import ffmpeg from 'fluent-ffmpeg'
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg'
ffmpeg.setFfmpegPath(ffmpegPath)

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
				.on('end', async () => {
					try {
						ipcMain.emit('progress', { clipId: clip.id, clipName: clip.filename, progress: 100 })

						if (reqData.removeOriginal) {
							fs.unlinkSync(oldClipPath)
							await prisma.clip.delete({ where: { id: clipId } })
						}

						const { size } = fs.statSync(newClipPath)
						const sizeMB = (size / (1024 * 1024)).toFixed(2)

						await prisma.clip.create({
							data: {
								filename: reqData.customName,
								size: +sizeMB,
								timestamp: new Date(),
								cut: true,
								game: { connect: { name: clip.gameName } }
							}
						})

						if (reqData.pasteToClipboard) {
							clipboard.writeBuffer('public.file-url', Buffer.from(newClipPath))
						}

						resolve(true)
					} catch (error) {
						console.log(error)
						resolve(false)
					}
				})
				.on('progress', (progress) => {
					const time = parseInt(progress.timemark.replace(/:/g, ''))
					const percent = (time / duration) * 100
					ipcMain.emit('progress', { clipId: clip.id, clipName: clip.filename, progress: percent })
				})
				.on('error', (err) => {
					console.log(err)
					resolve(false)
				})
				.run()
		})
	} catch (error) {
		console.log(error)
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

		await prisma.clip.delete({ where: { id: clipId } })
		return true
	} catch (error) {
		console.log(error)
		return false
	}
}
