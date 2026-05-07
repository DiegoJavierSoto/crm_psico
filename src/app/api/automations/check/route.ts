import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { todayISO, addDays } from '@/lib/date-utils'

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const today = todayISO()
    const tomorrow = addDays(today, 1)
    const fourteenDaysAgo = addDays(today, -14)
    const twentyOneDaysAgo = addDays(today, -21)
    let alertsCreated = 0

    // 1. Find patients with status INACTIVE whose last appointment was 14+ days ago
    //    → create RE_ENGAGEMENT alert
    const inactivePatients = await db.patient.findMany({
      where: {
        userId: auth.userId,
        status: 'INACTIVE',
      },
      include: {
        appointments: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    })

    for (const patient of inactivePatients) {
      const lastAppointment = patient.appointments[0]
      if (lastAppointment && lastAppointment.date <= fourteenDaysAgo) {
        // Check if a RE_ENGAGEMENT alert already exists for this patient recently
        const existingAlert = await db.alert.findFirst({
          where: {
            userId: auth.userId,
            patientId: patient.id,
            type: 'INACTIVE_PATIENT',
            isDismissed: false,
            createdAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 7)),
            },
          },
        })

        if (!existingAlert) {
          await db.alert.create({
            data: {
              userId: auth.userId,
              patientId: patient.id,
              type: 'INACTIVE_PATIENT',
              title: 'Paciente inactivo',
              message: `${patient.firstName} ${patient.lastName} no ha tenido cita en más de 14 días. Considere contactar para re-engagement.`,
              severity: 'WARNING',
            },
          })
          alertsCreated++
        }
      }
    }

    // 2. Find appointments tomorrow that haven't had reminders sent
    //    → mark reminderSent and create APPOINTMENT_REMINDER alert
    const tomorrowAppointments = await db.appointment.findMany({
      where: {
        userId: auth.userId,
        date: tomorrow,
        status: 'SCHEDULED',
        reminderSent: false,
      },
      include: {
        patient: true,
      },
    })

    for (const appointment of tomorrowAppointments) {
      await db.appointment.update({
        where: { id: appointment.id },
        data: { reminderSent: true },
      })

      await db.alert.create({
        data: {
          userId: auth.userId,
          patientId: appointment.patientId,
          type: 'APPOINTMENT_REMINDER',
          title: 'Recordatorio de cita',
          message: `Cita mañana con ${appointment.patient.firstName} ${appointment.patient.lastName} a las ${appointment.startTime}`,
          severity: 'INFO',
        },
      })
      alertsCreated++
    }

    // 3. Find follow-ups with suggestedDate <= today and status PENDING
    //    → mark as OVERDUE and create FOLLOW_UP_DUE alert
    const overdueFollowUps = await db.followUp.findMany({
      where: {
        userId: auth.userId,
        status: 'PENDING',
        suggestedDate: { lte: today },
      },
      include: {
        patient: true,
      },
    })

    for (const followUp of overdueFollowUps) {
      await db.followUp.update({
        where: { id: followUp.id },
        data: { status: 'OVERDUE' },
      })

      await db.alert.create({
        data: {
          userId: auth.userId,
          patientId: followUp.patientId,
          type: 'FOLLOW_UP_DUE',
          title: 'Seguimiento vencido',
          message: `Seguimiento de tipo ${followUp.type} para ${followUp.patient.firstName} ${followUp.patient.lastName} está vencido (fecha sugerida: ${followUp.suggestedDate})`,
          severity: 'WARNING',
        },
      })
      alertsCreated++
    }

    // 4. Find patients in TREATMENT with no appointment in 21+ days
    //    → create MISSED_SESSION alert
    const treatmentPatients = await db.patient.findMany({
      where: {
        userId: auth.userId,
        status: 'TREATMENT',
      },
      include: {
        appointments: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    })

    for (const patient of treatmentPatients) {
      const lastAppointment = patient.appointments[0]
      if (lastAppointment && lastAppointment.date <= twentyOneDaysAgo) {
        // Check if a MISSED_SESSION alert already exists for this patient recently
        const existingAlert = await db.alert.findFirst({
          where: {
            userId: auth.userId,
            patientId: patient.id,
            type: 'MISSED_SESSION',
            isDismissed: false,
            createdAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 7)),
            },
          },
        })

        if (!existingAlert) {
          await db.alert.create({
            data: {
              userId: auth.userId,
              patientId: patient.id,
              type: 'MISSED_SESSION',
              title: 'Sesión perdida',
              message: `${patient.firstName} ${patient.lastName} no ha tenido sesión en más de 21 días estando en tratamiento.`,
              severity: 'URGENT',
            },
          })
          alertsCreated++
        }
      } else if (!lastAppointment) {
        // No appointments at all while in treatment
        const existingAlert = await db.alert.findFirst({
          where: {
            userId: auth.userId,
            patientId: patient.id,
            type: 'MISSED_SESSION',
            isDismissed: false,
            createdAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 7)),
            },
          },
        })

        if (!existingAlert) {
          await db.alert.create({
            data: {
              userId: auth.userId,
              patientId: patient.id,
              type: 'MISSED_SESSION',
              title: 'Sin sesiones programadas',
              message: `${patient.firstName} ${patient.lastName} está en tratamiento pero no tiene citas programadas.`,
              severity: 'URGENT',
            },
          })
          alertsCreated++
        }
      }
    }

    return NextResponse.json({
      data: {
        alertsCreated,
        checks: {
          inactivePatients: inactivePatients.length,
          tomorrowAppointments: tomorrowAppointments.length,
          overdueFollowUps: overdueFollowUps.length,
          treatmentPatients: treatmentPatients.length,
        },
      },
    })
  } catch (error) {
    console.error('Automation check error:', error)
    return NextResponse.json(
      { error: 'Error al ejecutar verificaciones automáticas' },
      { status: 500 }
    )
  }
}
