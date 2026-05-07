import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const appointmentId = searchParams.get('appointmentId')

    const where: Record<string, unknown> = {
      userId: auth.userId,
    }

    if (patientId) {
      where.patientId = patientId
    }

    if (appointmentId) {
      where.appointmentId = appointmentId
    }

    const sessionNotes = await db.sessionNote.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: sessionNotes })
  } catch (error) {
    console.error('Get session notes error:', error)
    return NextResponse.json(
      { error: 'Error al obtener notas de sesión' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const {
      patientId,
      appointmentId,
      content,
      mood,
      techniques,
      homework,
      nextSessionPlan,
      isPrivate,
    } = body

    if (!patientId || !content) {
      return NextResponse.json(
        { error: 'Paciente y contenido son obligatorios' },
        { status: 400 }
      )
    }

    // Verify patient belongs to user
    const patient = await db.patient.findFirst({
      where: { id: patientId, userId: auth.userId },
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      )
    }

    // If appointmentId provided, verify it belongs to user and patient
    if (appointmentId) {
      const appointment = await db.appointment.findFirst({
        where: { id: appointmentId, userId: auth.userId, patientId },
      })

      if (!appointment) {
        return NextResponse.json(
          { error: 'Cita no encontrada o no pertenece al paciente' },
          { status: 404 }
        )
      }
    }

    const sessionNote = await db.sessionNote.create({
      data: {
        userId: auth.userId,
        patientId,
        appointmentId: appointmentId || null,
        content,
        mood: mood || null,
        techniques: techniques || null,
        homework: homework || null,
        nextSessionPlan: nextSessionPlan || null,
        isPrivate: isPrivate !== undefined ? isPrivate : true,
      },
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

    return NextResponse.json({ data: sessionNote }, { status: 201 })
  } catch (error) {
    console.error('Create session note error:', error)
    return NextResponse.json(
      { error: 'Error al crear nota de sesión' },
      { status: 500 }
    )
  }
}
