import fs from 'fs'
import path from 'path'
import { createHash, randomUUID } from 'crypto'
import { DatabaseSync } from 'node:sqlite'
import log from 'electron-log'

// Same table Prisma Migrate uses, so `prisma migrate dev` in development still sees what was applied.
const MIGRATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
	"id"                  TEXT PRIMARY KEY NOT NULL,
	"checksum"            TEXT NOT NULL,
	"finished_at"         DATETIME,
	"migration_name"      TEXT NOT NULL,
	"logs"                TEXT,
	"rolled_back_at"      DATETIME,
	"started_at"          DATETIME NOT NULL DEFAULT current_timestamp,
	"applied_steps_count" INTEGER UNSIGNED NOT NULL DEFAULT 0
)`

// Applies every migration.sql from the migrations folder that is not recorded in the database yet.
// Replaces spawning the Prisma CLI, which does not work from inside a packaged app.
export function runMigrations(dbPath: string, migrationsPath: string) {
	const db = new DatabaseSync(dbPath)

	try {
		db.exec(MIGRATIONS_TABLE)

		const applied = new Set(
			db
				.prepare('SELECT migration_name FROM "_prisma_migrations" WHERE rolled_back_at IS NULL')
				.all()
				.map((row) => row.migration_name as string)
		)

		const pending = fs
			.readdirSync(migrationsPath, { withFileTypes: true })
			.filter((entry) => entry.isDirectory() && !applied.has(entry.name))
			.map((entry) => entry.name)
			.sort()

		if (pending.length === 0) {
			log.info('Database is up to date')
			return
		}

		for (const name of pending) {
			const sql = fs.readFileSync(path.join(migrationsPath, name, 'migration.sql'), 'utf8')
			const checksum = createHash('sha256').update(sql).digest('hex')
			const id = randomUUID()

			log.info(`Applying migration ${name}`)
			db.prepare(
				'INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "started_at") VALUES (?, ?, ?, current_timestamp)'
			).run(id, checksum, name)

			db.exec(sql)

			db.prepare(
				'UPDATE "_prisma_migrations" SET "finished_at" = current_timestamp, "applied_steps_count" = 1 WHERE "id" = ?'
			).run(id)
		}

		log.info('Migrations done')
	} finally {
		db.close()
	}
}
