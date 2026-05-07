import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const { name, phone, licenseNumber, specialty } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone || null
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber || null
    if (specialty !== undefined) updateData.specialty = specialty || null

    const user = await db.user.update({
      where: { id: auth.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        licenseNumber: true,
        specialty: true,
      },
    })

    return NextResponse.json({ data: user })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar perfil' },
      { status: 500 }
    )
  }
}
