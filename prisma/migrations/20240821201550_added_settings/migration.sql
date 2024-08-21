-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameFolder" TEXT NOT NULL,
    "clipSwitchDirection" TEXT NOT NULL,
    "clipboardToggle" BOOLEAN NOT NULL
);
