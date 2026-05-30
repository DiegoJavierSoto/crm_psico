import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const url = (process.env.TURSO_DATABASE_URL || '').trim()
const authToken = (process.env.TURSO_AUTH_TOKEN || '').trim()

let prismaClient: PrismaClient

if (url.startsWith('libsql://') || url.startsWith('https://')) {
  const adapter = new PrismaLibSql({
    url,
    authToken,
  })
  prismaClient = new PrismaClient({ adapter, log: ['query'] })
} else {
  prismaClient = new PrismaClient({
    log: ['query'],
  })
}

export const db = globalForPrisma.prisma ?? prismaClient

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db