import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const patientId = searchParams.get('patientId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = {
      userId: auth.userId,
    }

    if (date) {
      where.date = date
    } else if (startDate || endDate) {
      const dateFilter: Record<string, string> = {}
      if (startDate) dateFilter.gte = startDate
      if (endDate) dateFilter.lte = endDate
      where.date = dateFilter
    }

    if (patientId) {
      where.patientId = patientId
    }

    if (status) {
      where.status = status
    }

    const appointments = await db.appointment.findMany({
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
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })

    return NextResponse.json({ data: appointments })
  } catch (error) {
    console.error('Get appointments error:', error)
    return NextResponse.json(
      { error: 'Error al obtener citas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const { patientId, date, startTime, endTime, type, notes } = body

    if (!patientId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Paciente, fecha, hora de inicio y fin son obligatorios' },
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

    const appointment = await db.appointment.create({
      data: {
        userId: auth.userId,
        patientId,
        date,
        startTime,
        endTime,
        type: type || 'SESSION',
        notes: notes || null,
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

    return NextResponse.json({ data: appointment }, { status: 201 })
  } catch (error) {
    console.error('Create appointment error:', error)
    return NextResponse.json(
      { error: 'Error al crear cita' },
      { status: 500 }
    )
  }
}
