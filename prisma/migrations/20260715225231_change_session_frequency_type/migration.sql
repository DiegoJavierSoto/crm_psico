-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Patient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "dateOfBirth" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ADMISSION',
    "reasonForConsult" TEXT,
    "background" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "referredBy" TEXT,
    "notes" TEXT,
    "lastContactDate" TEXT,
    "sessionFrequency" TEXT NOT NULL DEFAULT 'Semanal',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Patient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Patient" ("background", "createdAt", "dateOfBirth", "email", "emergencyContact", "emergencyPhone", "firstName", "id", "lastContactDate", "lastName", "notes", "phone", "reasonForConsult", "referredBy", "sessionFrequency", "status", "updatedAt", "userId") SELECT "background", "createdAt", "dateOfBirth", "email", "emergencyContact", "emergencyPhone", "firstName", "id", "lastContactDate", "lastName", "notes", "phone", "reasonForConsult", "referredBy", CASE "sessionFrequency" WHEN 1 THEN 'Semanal' WHEN 2 THEN 'Dos veces por semana' WHEN 0 THEN 'A demanda' ELSE 'Semanal' END, "status", "updatedAt", "userId" FROM "Patient";
DROP TABLE "Patient";
ALTER TABLE "new_Patient" RENAME TO "Patient";
CREATE INDEX "Patient_userId_idx" ON "Patient"("userId");
CREATE INDEX "Patient_status_idx" ON "Patient"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
