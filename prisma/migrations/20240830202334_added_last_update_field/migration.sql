/*
  Warnings:

  - Added the required column `lastGameDBUpdate` to the `AppSettings` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameFolder" TEXT NOT NULL,
    "clipSwitchDirection" TEXT NOT NULL,
    "clipboardToggle" BOOLEAN NOT NULL,
    "lastGameDBUpdate" DATETIME NOT NULL
);
INSERT INTO "new_AppSettings" ("clipSwitchDirection", "clipboardToggle", "gameFolder", "id") SELECT "clipSwitchDirection", "clipboardToggle", "gameFolder", "id" FROM "AppSettings";
DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
