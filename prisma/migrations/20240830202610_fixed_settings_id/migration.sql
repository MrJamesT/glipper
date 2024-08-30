/*
  Warnings:

  - The primary key for the `AppSettings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `AppSettings` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameFolder" TEXT NOT NULL,
    "clipSwitchDirection" TEXT NOT NULL,
    "clipboardToggle" BOOLEAN NOT NULL,
    "lastGameDBUpdate" DATETIME NOT NULL
);
INSERT INTO "new_AppSettings" ("clipSwitchDirection", "clipboardToggle", "gameFolder", "id", "lastGameDBUpdate") SELECT "clipSwitchDirection", "clipboardToggle", "gameFolder", "id", "lastGameDBUpdate" FROM "AppSettings";
DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
