import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const url = (process.env.TURSO_DATABASE_URL || '').trim()
const authToken = (process.env.TURSO_AUTH_TOKEN || '').trim()
const isProduction = process.env.NODE_ENV === 'production'

let prismaClient: PrismaClient

if (isProduction && (url.startsWith('libsql://') || url.startsWith('https://'))) {
  const adapter = new PrismaLibSql({
    url,
    authToken,
  })
  prismaClient = new PrismaClient({ adapter })
} else {
  prismaClient = new PrismaClient()
}

export const db = globalForPrisma.prisma ?? prismaClient

if (!isProduction) globalForPrisma.prisma = db