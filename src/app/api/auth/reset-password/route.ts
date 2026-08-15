import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'El token y la nueva contraseña son obligatorios' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Find the token in the DB
    const resetRequest = await db.passwordReset.findUnique({
      where: { token },
    })

    if (!resetRequest) {
      return NextResponse.json(
        { error: 'El enlace de recuperación es inválido o ya ha sido utilizado' },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (resetRequest.expiresAt < new Date()) {
      // Clean up the expired token
      try {
        await db.passwordReset.delete({
          where: { token },
        })
      } catch (e) {
        console.error('Error deleting expired token during reset:', e)
      }

      return NextResponse.json(
        { error: 'El enlace de recuperación ha expirado (validez de 30 minutos)' },
        { status: 400 }
      )
    }

    // Hash the new password
    const passwordHash = await hashPassword(newPassword)

    // Update user password
    await db.user.update({
      where: { id: resetRequest.userId },
      data: { passwordHash },
    })

    // Delete the token immediately after successful reset to prevent reuse
    await db.passwordReset.delete({
      where: { token },
    })

    return NextResponse.json({
      success: true,
      message: 'Tu contraseña ha sido restablecida correctamente.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Error al restablecer la contraseña' },
      { status: 500 }
    )
  }
}
