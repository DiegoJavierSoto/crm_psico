import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const { id } = await params

    const sessionNote = await db.sessionNote.findFirst({
      where: { id, userId: auth.userId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        appointment: true,
      },
    })

    if (!sessionNote) {
      return NextResponse.json(
        { error: 'Nota de sesión no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: sessionNote })
  } catch (error) {
    console.error('Get session note error:', error)
    return NextResponse.json(
      { error: 'Error al obtener nota de sesión' },
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
    const existing = await db.sessionNote.findFirst({
      where: { id, userId: auth.userId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Nota de sesión no encontrada' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    const allowedFields = [
      'content', 'mood', 'techniques', 'homework',
      'nextSessionPlan', 'isPrivate', 'appointmentId'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] === '' ? null : body[field]
      }
    }

    const sessionNote = await db.sessionNote.update({
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

    return NextResponse.json({ data: sessionNote })
  } catch (error) {
    console.error('Update session note error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar nota de sesión' },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const { id } = await params

    // Verify ownership
    const existing = await db.sessionNote.findFirst({
      where: { id, userId: auth.userId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Nota de sesión no encontrada' },
        { status: 404 }
      )
    }

    await db.sessionNote.delete({
      where: { id },
    })

    return NextResponse.json({ data: { message: 'Nota de sesión eliminada' } })
  } catch (error) {
    console.error('Delete session note error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar nota de sesión' },
      { status: 500 }
    )
  }
}
