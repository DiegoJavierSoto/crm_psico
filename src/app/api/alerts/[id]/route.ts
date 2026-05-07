import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const body = await request.json()

    // Verify ownership
    const existing = await db.alert.findFirst({
      where: { id, userId: auth.userId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Alerta no encontrada' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    const allowedFields = ['isRead', 'isDismissed', 'actionTaken']

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const alert = await db.alert.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json({ data: alert })
  } catch (error) {
    console.error('Update alert error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar alerta' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params })
}
