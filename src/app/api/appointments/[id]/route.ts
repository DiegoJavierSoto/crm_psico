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

    const appointment = await db.appointment.findFirst({
      where: { id, userId: auth.userId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        sessionNote: true,
      },
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: appointment })
  } catch (error) {
    console.error('Get appointment error:', error)
    return NextResponse.json(
      { error: 'Error al obtener cita' },
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
    const existing = await db.appointment.findFirst({
      where: { id, userId: auth.userId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    const allowedFields = [
      'date', 'startTime', 'endTime', 'status', 'type', 'notes',
      'reminderSent'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] === '' ? null : body[field]
      }
    }

    const appointment = await db.appointment.update({
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

    // If status changes to NO_SHOW, create an Alert
    if (body.status === 'NO_SHOW' && existing.status !== 'NO_SHOW') {
      await db.alert.create({
        data: {
          userId: auth.userId,
          patientId: existing.patientId,
          type: 'NO_SHOW',
          title: 'Paciente no asistió',
          message: `El paciente no asistió a la cita del ${existing.date} a las ${existing.startTime}`,
          severity: 'WARNING',
        },
      })
    }

    // If status changes to CANCELLED, handle gracefully (just update, no alert)
    // The update is already done above

    return NextResponse.json({ data: appointment })
  } catch (error) {
    console.error('Update appointment error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cita' },
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
    const existing = await db.appointment.findFirst({
      where: { id, userId: auth.userId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      )
    }

    await db.appointment.delete({
      where: { id },
    })

    return NextResponse.json({ data: { message: 'Cita eliminada' } })
  } catch (error) {
    console.error('Delete appointment error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar cita' },
      { status: 500 }
    )
  }
}
