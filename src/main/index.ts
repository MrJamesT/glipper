import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import { prisma } from './prisma'
import { buildGameDB, gamesList, clipsList, getCountOfClipsSinceLastUpdate } from './gamesList'
import { getClipDetails } from './fsOperations'
import { cutClip, deleteClip } from './clipOperations'
import { mainWindow, setMainWindow } from './mainWindow'
import { getSettings } from './settings'

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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	// Set app user model id for windows
	electronApp.setAppUserModelId('com.electron')

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
	ipcMain.handle('buildGameDB', async () => await buildGameDB(false))
	ipcMain.handle('rebuildGameDB', async () => await buildGameDB(true))
	ipcMain.handle('getClipDetails', async (_, clipId) => await getClipDetails(clipId))
	ipcMain.handle('cutClip', async (_, clipId, reqData) => await cutClip(clipId, reqData))
	ipcMain.handle('deleteClip', async (_, clipId) => await deleteClip(clipId))
	ipcMain.handle('clipsSinceLastUpdate', async () => await getCountOfClipsSinceLastUpdate())

	ipcMain.on('gamesList', async () => await gamesList())
	ipcMain.on('clipsSinceLastUpdate', async () => await getCountOfClipsSinceLastUpdate())

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
