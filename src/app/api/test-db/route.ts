import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Mask sensitive string for safe display
function maskString(str: string | undefined): string {
  if (!str) return 'undefined/empty'
  if (str.length <= 15) return '*'.repeat(str.length)
  return `${str.slice(0, 10)}...${str.slice(-5)} (length: ${str.length})`
}

export async function GET(request: NextRequest) {
  const debugInfo = {
    NODE_ENV: process.env.NODE_ENV,
    TURSO_DATABASE_URL: maskString(process.env.TURSO_DATABASE_URL),
    TURSO_AUTH_TOKEN: maskString(process.env.TURSO_AUTH_TOKEN),
    DATABASE_URL: maskString(process.env.DATABASE_URL),
    NEXTAUTH_SECRET: maskString(process.env.NEXTAUTH_SECRET),
  }

  try {
    console.log('API Test-DB: Attempting query on User table...')
    const users = await db.user.findMany({
      take: 1,
      select: {
        id: true,
        email: true,
        name: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Database query executed successfully!',
      users,
      debugInfo,
    })
  } catch (error: any) {
    console.error('API Test-DB: Query failed:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Database query failed!',
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack,
      },
      debugInfo,
    }, { status: 500 })
  }
}
