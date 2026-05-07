import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {
      userId: auth.userId,
    }

    if (patientId) {
      where.patientId = patientId
    }

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    const followUps = await db.followUp.findMany({
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
      orderBy: { suggestedDate: 'asc' },
    })

    return NextResponse.json({ data: followUps })
  } catch (error) {
    console.error('Get follow-ups error:', error)
    return NextResponse.json(
      { error: 'Error al obtener seguimientos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const { patientId, type, suggestedDate, contactMethod, notes } = body

    if (!patientId || !type || !suggestedDate) {
      return NextResponse.json(
        { error: 'Paciente, tipo y fecha sugerida son obligatorios' },
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

    const followUp = await db.followUp.create({
      data: {
        userId: auth.userId,
        patientId,
        type,
        suggestedDate,
        contactMethod: contactMethod || 'PHONE',
        notes: notes || null,
        status: 'PENDING',
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

    return NextResponse.json({ data: followUp }, { status: 201 })
  } catch (error) {
    console.error('Create follow-up error:', error)
    return NextResponse.json(
      { error: 'Error al crear seguimiento' },
      { status: 500 }
    )
  }
}
