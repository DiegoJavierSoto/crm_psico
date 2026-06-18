import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { todayISO, addDays } from '@/lib/date-utils'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {
      userId: auth.userId,
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ]
    }

    const patients = await db.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: patients })
  } catch (error) {
    console.error('Get patients error:', error)
    return NextResponse.json(
      { error: 'Error al obtener pacientes' },
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
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      status,
      reasonForConsult,
      background,
      emergencyContact,
      emergencyPhone,
      referredBy,
      notes,
      sessionFrequency,
    } = body

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'Nombre y apellido son obligatorios' },
        { status: 400 }
      )
    }

    const patient = await db.patient.create({
      data: {
        userId: auth.userId,
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        dateOfBirth: dateOfBirth || null,
        status: status || 'ADMISSION',
        reasonForConsult: reasonForConsult || null,
        background: background || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
        referredBy: referredBy || null,
        notes: notes || null,
        sessionFrequency: sessionFrequency || 1,
        lastContactDate: todayISO(),
      },
    })

    // If status is TREATMENT, create a follow-up for initial check-in (7 days)
    if (status === 'TREATMENT') {
      await db.followUp.create({
        data: {
          userId: auth.userId,
          patientId: patient.id,
          type: 'CHECK_IN',
          suggestedDate: addDays(todayISO(), 7),
          status: 'PENDING',
          contactMethod: 'PHONE',
          notes: 'Seguimiento inicial después de admisión',
        },
      })
    }

    return NextResponse.json({ data: patient }, { status: 201 })
  } catch (error) {
    console.error('Create patient error:', error)
    return NextResponse.json(
      { error: 'Error al crear paciente' },
      { status: 500 }
    )
  }
}
