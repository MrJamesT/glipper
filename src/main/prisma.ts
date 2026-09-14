import log from 'electron-log'
import { dbUrl, qePath } from './constants'
// This needs to be kept as require for the generated client to work
import type { PrismaClient as PrismaClientType } from '../generated/client'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('../generated/client')

log.info('DB URL', dbUrl)
log.info('QE Path', qePath)

// Must be set before the client is created, see https://www.prisma.io/docs/orm/reference/environment-variables-reference
process.env.PRISMA_QUERY_ENGINE_LIBRARY = qePath

export const prisma: PrismaClientType = new PrismaClient({
	log: ['info', 'warn', 'error'],
	datasources: {
		db: {
			url: dbUrl
		}
	}
})
