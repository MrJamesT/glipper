import path from 'path'
import fs from 'fs'
import { app } from 'electron'

const appPath = app.getAppPath()
// files listed in asarUnpack live next to the asar, not inside it
const unpackedAppPath = appPath.replace('app.asar', 'app.asar.unpacked')

export const dbPath = import.meta.env.DEV
	? path.join(appPath, 'prisma', 'dev.db')
	: path.join(app.getPath('userData'), 'app.db')
export const dbUrl = 'file:' + dbPath

export const migrationsPath = path.join(unpackedAppPath, 'prisma', 'migrations')

// Hacky, but putting this here because otherwise at query time the Prisma client
// gives an error "Environment variable not found: DATABASE_URL" despite us passing
// the dbUrl into the prisma client constructor in datasources.db.url
process.env.DATABASE_URL = dbUrl

// @prisma/engines downloads only the engine for the build machine, so the exact file name differs per OS
const enginesPath = path.join(unpackedAppPath, 'node_modules', '@prisma', 'engines')
const queryEngineFile = fs
	.readdirSync(enginesPath)
	.find((file) => file.endsWith('.node') && /^(lib)?query_engine/.test(file))

if (!queryEngineFile) {
	throw new Error(`No Prisma query engine found in ${enginesPath}`)
}

export const qePath = path.join(enginesPath, queryEngineFile)
