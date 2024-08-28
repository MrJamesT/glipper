/*
  Warnings:

  - You are about to drop the column `gameId` on the `Clip` table. All the data in the column will be lost.
  - The primary key for the `Game` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Game` table. All the data in the column will be lost.
  - Added the required column `gameName` to the `Clip` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Clip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameName" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "cut" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Clip_gameName_fkey" FOREIGN KEY ("gameName") REFERENCES "Game" ("name") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Clip" ("cut", "filename", "id", "size", "timestamp") SELECT "cut", "filename", "id", "size", "timestamp" FROM "Clip";
DROP TABLE "Clip";
ALTER TABLE "new_Clip" RENAME TO "Clip";
CREATE TABLE "new_Game" (
    "name" TEXT NOT NULL,
    "nOfClips" INTEGER NOT NULL DEFAULT 0,
    "size" INTEGER NOT NULL DEFAULT 0,
    "lastClipDate" DATETIME,
    "poster" TEXT
);
INSERT INTO "new_Game" ("lastClipDate", "nOfClips", "name", "poster", "size") SELECT "lastClipDate", "nOfClips", "name", "poster", "size" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
CREATE UNIQUE INDEX "Game_name_key" ON "Game"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
