import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { todayISO, addDays, daysBetween } from '@/lib/date-utils'

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const today = todayISO()
    const sevenDaysFromNow = addDays(today, 7)

    // Total patients and by status
    const allPatients = await db.patient.findMany({
      where: { userId: auth.userId },
      select: { id: true, status: true },
    })

    const totalPatients = allPatients.length
    const patientsByStatus: Record<string, number> = {}
    for (const p of allPatients) {
      patientsByStatus[p.status] = (patientsByStatus[p.status] || 0) + 1
    }

    // Today's appointments
    const todayAppointments = await db.appointment.count({
      where: {
        userId: auth.userId,
        date: today,
        status: 'SCHEDULED',
      },
    })

    // Upcoming appointments (next 7 days)
    const upcomingAppointments = await db.appointment.findMany({
      where: {
        userId: auth.userId,
        date: { gte: today, lte: sevenDaysFromNow },
        status: 'SCHEDULED',
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
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })

    // Pending follow-ups
    const pendingFollowUps = await db.followUp.count({
      where: {
        userId: auth.userId,
        status: { in: ['PENDING', 'OVERDUE'] },
      },
    })

    // Unread alerts
    const unreadAlerts = await db.alert.count({
      where: {
        userId: auth.userId,
        isRead: false,
        isDismissed: false,
      },
    })

    // Inactive patients: status INACTIVE or no session in 30+ days
    const thirtyDaysAgo = addDays(today, -30)
    const patientsWithRecentAppointments = await db.appointment.findMany({
      where: {
        userId: auth.userId,
        date: { gte: thirtyDaysAgo },
      },
      select: { patientId: true },
      distinct: ['patientId'],
    })

    const recentPatientIds = new Set(patientsWithRecentAppointments.map(a => a.patientId))

    const inactivePatients = allPatients.filter(p => {
      if (p.status === 'INACTIVE') return true
      if (!recentPatientIds.has(p.id) && p.status !== 'ADMISSION') return true
      return false
    })

    // Recent activity (last 10 combined appointments and notes)
    const recentAppointments = await db.appointment.findMany({
      where: { userId: auth.userId },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    })

    const recentNotes = await db.sessionNote.findMany({
      where: { userId: auth.userId },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // Combine and sort by date
    const recentActivity = [
      ...recentAppointments.map(a => ({
        type: 'appointment' as const,
        id: a.id,
        patient: a.patient,
        description: `Cita ${a.type} - ${a.status}`,
        date: a.date,
        createdAt: a.updatedAt,
      })),
      ...recentNotes.map(n => ({
        type: 'sessionNote' as const,
        id: n.id,
        patient: n.patient,
        description: 'Nota de sesión registrada',
        date: '',
        createdAt: n.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)

    return NextResponse.json({
      data: {
        totalPatients,
        patientsByStatus,
        todayAppointments,
        upcomingAppointments,
        pendingFollowUps,
        unreadAlerts,
        inactivePatients: inactivePatients.length,
        recentActivity,
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos del dashboard' },
      { status: 500 }
    )
  }
}
