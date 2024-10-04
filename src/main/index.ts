import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import fs from 'fs'
import { dbPath, dbUrl, latestMigration, Migration } from './constants'
import log from 'electron-log'
import { prisma, runPrismaCommand } from './prisma'
import { buildGameDB, gamesList, clipsList, getCountOfClipsSinceLastUpdate } from './gamesList'
import { getClipDetails } from './fsOperations'
import { cutClip, deleteClip, getClipsThumbnail } from './clipOperations'
import { mainWindow, setMainWindow } from './mainWindow'
import { getSettings, saveSettings } from './settings'
import { autoUpdater } from 'electron-updater'

function createWindow(): void {
	// Create the browser window.
	setMainWindow(
		new BrowserWindow({
			width: 1200,
			height: 800,
			title: 'Glipper',
			resizable: true,
			show: false,
			autoHideMenuBar: true,
			...(process.platform === 'linux' ? { icon } : {}),
			webPreferences: {
				preload: join(__dirname, '../preload/index.js'),
				sandbox: false,
				webSecurity: false
			}
		})
	)

	if (!mainWindow) return

	mainWindow.on('ready-to-show', () => {
		if (!mainWindow) return
		mainWindow.show()
		mainWindow.focus()
		mainWindow.maximize()
	})

	mainWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url)
		return { action: 'deny' }
	})

	// HMR for renderer base on electron-vite cli.
	// Load the remote URL for development or the local html file for production.
	if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
		mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
	} else {
		mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
	}
}

async function runPrismaMigrations() {
	let needsMigration: boolean
	const dbExists = fs.existsSync(dbPath)
	if (!dbExists) {
		needsMigration = true
		// prisma for whatever reason has trouble if the database file does not exist yet.
		// So just touch it here
		fs.closeSync(fs.openSync(dbPath, 'w'))
	} else {
		try {
			const latest: Migration[] = await prisma.$queryRaw`select * from _prisma_migrations order by finished_at`
			needsMigration = latest[latest.length - 1]?.migration_name !== latestMigration
		} catch (e) {
			log.error(e)
			needsMigration = true
		}
	}

	if (needsMigration) {
		try {
			const schemaPath = join(
				app.getAppPath().replace('app.asar', 'app.asar.unpacked'),
				'prisma',
				'schema.prisma'
			)
			log.info(`Needs a migration. Running prisma migrate with schema path ${schemaPath}`)

			// first create or migrate the database! If you were deploying prisma to a cloud service, this migrate deploy
			// command you would run as part of your CI/CD deployment. Since this is an electron app, it just needs
			// to run every time the production app is started. That way if the user updates the app and the schema has
			// changed, it will transparently migrate their DB.
			await runPrismaCommand({
				command: ['migrate', 'deploy', '--schema', schemaPath],
				dbUrl
			})
			log.info('Migration done.')
		} catch (e) {
			log.error(e)
			process.exit(1)
		}
	} else {
		log.info('Does not need migration')
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
	// Set app user model id for windows
	electronApp.setAppUserModelId('com.electron')

	// Run prisma migrations on app start (if needed)
	await runPrismaMigrations()

	// Check for updates
	autoUpdater.logger = log
	autoUpdater.checkForUpdatesAndNotify()

	// Default open or close DevTools by F12 in development
	// and ignore CommandOrControl + R in production.
	// see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
	app.on('browser-window-created', (_, window) => {
		optimizer.watchWindowShortcuts(window)
	})

	// IPC Endpoints
	ipcMain.handle('gamesList', async () => await gamesList())
	ipcMain.handle('clipsList', async (_, gameId) => await clipsList(gameId))
	ipcMain.handle('getSettings', async () => await getSettings())
	ipcMain.handle('saveSettings', async (_, settings) => saveSettings(settings))
	ipcMain.handle('buildGameDB', async () => await buildGameDB(false))
	ipcMain.handle('rebuildGameDB', async () => await buildGameDB(true))
	ipcMain.handle('getClipDetails', async (_, clipId) => await getClipDetails(clipId))
	ipcMain.handle('cutClip', async (_, clipId, reqData) => await cutClip(clipId, reqData))
	ipcMain.handle('deleteClip', async (_, clipId) => await deleteClip(clipId))
	ipcMain.handle('clipsSinceLastUpdate', async () => await getCountOfClipsSinceLastUpdate())

	ipcMain.on('gamesList', async () => await gamesList())
	ipcMain.on('clipsList', async (_, gameId) => await clipsList(gameId))
	ipcMain.on('clipsSinceLastUpdate', async () => await getCountOfClipsSinceLastUpdate())
	ipcMain.on('getThumbnails', async (_, clipIds) => await getClipsThumbnail(clipIds))

	createWindow()

	app.on('activate', function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		prisma.$disconnect()
		app.quit()
	}
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
