import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { todayISO, addDays } from '@/lib/date-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const { id } = await params

    const patient = await db.patient.findFirst({
      where: { id, userId: auth.userId },
      include: {
        appointments: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        sessionNotes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        followUps: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: patient })
  } catch (error) {
    console.error('Get patient error:', error)
    return NextResponse.json(
      { error: 'Error al obtener paciente' },
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
    const existing = await db.patient.findFirst({
      where: { id, userId: auth.userId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    // Only update fields that are provided
    const allowedFields = [
      'firstName', 'lastName', 'email', 'phone', 'dateOfBirth',
      'status', 'reasonForConsult', 'background', 'emergencyContact',
      'emergencyPhone', 'referredBy', 'notes', 'sessionFrequency',
      'lastContactDate'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] === '' ? null : body[field]
      }
    }

    // If status changes to INACTIVE, set lastContactDate
    if (body.status === 'INACTIVE' && existing.status !== 'INACTIVE') {
      updateData.lastContactDate = todayISO()
    }

    const patient = await db.patient.update({
      where: { id },
      data: updateData,
    })

    // If status changes to TREATMENT, create a follow-up for initial check-in (7 days)
    if (body.status === 'TREATMENT' && existing.status !== 'TREATMENT') {
      await db.followUp.create({
        data: {
          userId: auth.userId,
          patientId: id,
          type: 'CHECK_IN',
          suggestedDate: addDays(todayISO(), 7),
          status: 'PENDING',
          contactMethod: 'PHONE',
          notes: 'Seguimiento inicial después de admisión',
        },
      })
    }

    return NextResponse.json({ data: patient })
  } catch (error) {
    console.error('Update patient error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar paciente' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // PATCH behaves the same as PUT - partial update
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
    const existing = await db.patient.findFirst({
      where: { id, userId: auth.userId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      )
    }

    // Delete patient - cascade will handle related data
    await db.patient.delete({
      where: { id },
    })

    return NextResponse.json({ data: { message: 'Paciente eliminado' } })
  } catch (error) {
    console.error('Delete patient error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar paciente' },
      { status: 500 }
    )
  }
}
