import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { todayISO } from '@/lib/date-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const { id } = await params

    const followUp = await db.followUp.findFirst({
      where: { id, userId: auth.userId },
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

    if (!followUp) {
      return NextResponse.json(
        { error: 'Seguimiento no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: followUp })
  } catch (error) {
    console.error('Get follow-up error:', error)
    return NextResponse.json(
      { error: 'Error al obtener seguimiento' },
      { status: 500 }
    )
  }
}

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
    const existing = await db.followUp.findFirst({
      where: { id, userId: auth.userId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Seguimiento no encontrado' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    const allowedFields = [
      'type', 'suggestedDate', 'completedDate', 'status',
      'notes', 'contactMethod', 'contactResult'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] === '' ? null : body[field]
      }
    }

    // If status changes to COMPLETED, set completedDate
    if (body.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      updateData.completedDate = todayISO()
    }

    const followUp = await db.followUp.update({
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

    return NextResponse.json({ data: followUp })
  } catch (error) {
    console.error('Update follow-up error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar seguimiento' },
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
