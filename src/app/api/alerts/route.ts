import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const isRead = searchParams.get('isRead')
    const isDismissed = searchParams.get('isDismissed')
    const severity = searchParams.get('severity')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {
      userId: auth.userId,
    }

    if (isRead !== null && isRead !== undefined) {
      where.isRead = isRead === 'true'
    }

    if (isDismissed !== null && isDismissed !== undefined) {
      where.isDismissed = isDismissed === 'true'
    }

    if (severity) {
      where.severity = severity
    }

    if (type) {
      where.type = type
    }

    const alerts = await db.alert.findMany({
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

    return NextResponse.json({ data: alerts })
  } catch (error) {
    console.error('Get alerts error:', error)
    return NextResponse.json(
      { error: 'Error al obtener alertas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const { patientId, type, title, message, severity } = body

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Tipo, título y mensaje son obligatorios' },
        { status: 400 }
      )
    }

    // Verify patient belongs to user if patientId provided
    if (patientId) {
      const patient = await db.patient.findFirst({
        where: { id: patientId, userId: auth.userId },
      })

      if (!patient) {
        return NextResponse.json(
          { error: 'Paciente no encontrado' },
          { status: 404 }
        )
      }
    }

    const alert = await db.alert.create({
      data: {
        userId: auth.userId,
        patientId: patientId || null,
        type,
        title,
        message,
        severity: severity || 'INFO',
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

    return NextResponse.json({ data: alert }, { status: 201 })
  } catch (error) {
    console.error('Create alert error:', error)
    return NextResponse.json(
      { error: 'Error al crear alerta' },
      { status: 500 }
    )
  }
}
