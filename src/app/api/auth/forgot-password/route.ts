import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'El correo electrónico es obligatorio' },
        { status: 400 }
      )
    }

    // Always clean up expired tokens from the DB to prevent clutter
    try {
      await db.passwordReset.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      })
    } catch (cleanupError) {
      console.error('Error cleaning up expired tokens:', cleanupError)
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
    })

    // If user does not exist, return a generic success message to prevent user enumeration
    if (!user) {
      return NextResponse.json({
        message: 'Si la dirección de correo electrónico está registrada, recibirás un enlace de recuperación.',
      })
    }

    // Invalidate previous tokens for this specific user
    await db.passwordReset.deleteMany({
      where: { userId: user.id },
    })

    // Generate cryptographically secure token (64 hex characters)
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Save token in DB
    await db.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    // Simulate sending email: Log to console and write to db/resets.log
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`
    
    console.log('\n=======================================')
    console.log('📧 PASSWORD RESET SIMULATOR')
    console.log(`To: ${email}`)
    console.log(`Link: ${resetUrl}`)
    console.log('=======================================\n')

    try {
      const logDir = path.join(process.cwd(), 'db')
      const logPath = path.join(logDir, 'resets.log')
      const logEntry = `[${new Date().toISOString()}] Email: ${email} | Link: ${resetUrl}\n`
      await fs.mkdir(logDir, { recursive: true })
      await fs.appendFile(logPath, logEntry)
    } catch (logError) {
      console.error('Error writing reset token to log file:', logError)
    }

    return NextResponse.json({
      message: 'Si la dirección de correo electrónico está registrada, recibirás un enlace de recuperación.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud de recuperación' },
      { status: 500 }
    )
  }
}
