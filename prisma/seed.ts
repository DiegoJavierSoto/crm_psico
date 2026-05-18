import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.alert.deleteMany()
  await prisma.followUp.deleteMany()
  await prisma.sessionNote.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.user.deleteMany()

  // Create demo user
  const passwordHash = await bcrypt.hash('demo1234', 12)
  const user = await prisma.user.create({
    data: {
      email: 'demo@psicocrm.com',
      name: 'Dra. María López',
      phone: '+54 11 5555-0123',
      licenseNumber: 'MN-54321',
      specialty: 'Psicología Clínica - Terapia Cognitivo Conductual',
      passwordHash,
    },
  })

  console.log(`✅ Demo user created: ${user.email}`)

  // Create sample patients across different pipeline stages
  const patients = await Promise.all([
    // ADMISSION patients
    prisma.patient.create({
      data: {
        userId: user.id,
        firstName: 'Carlos',
        lastName: 'Ramírez',
        email: 'carlos.r@email.com',
        phone: '+54 11 4444-1001',
        dateOfBirth: '1985-03-15',
        status: 'ADMISSION',
        reasonForConsult: 'Ansiedad generalizada y ataques de pánico',
        background: 'Consultante derivado por médico clínico. Primer episodio de pánico hace 3 meses.',
        emergencyContact: 'Laura Ramírez (esposa)',
        emergencyPhone: '+54 11 4444-1002',
        referredBy: 'Dr. Pérez - Médico Clínico',
        sessionFrequency: 1,
        lastContactDate: '2025-03-03',
      },
    }),
    prisma.patient.create({
      data: {
        userId: user.id,
        firstName: 'Lucía',
        lastName: 'Fernández',
        email: 'lucia.f@email.com',
        phone: '+54 11 3333-2001',
        dateOfBirth: '1992-07-22',
        status: 'ADMISSION',
        reasonForConsult: 'Duelo por pérdida de familiar cercano',
        background: 'Fallecimiento de su madre hace 2 meses. Dificultad para retomar rutina laboral.',
        emergencyContact: 'Pedro Fernández (padre)',
        emergencyPhone: '+54 11 3333-2002',
        sessionFrequency: 1,
        lastContactDate: '2025-03-04',
      },
    }),

    // TREATMENT patients
    prisma.patient.create({
      data: {
        userId: user.id,
        firstName: 'Martín',
        lastName: 'González',
        email: 'martin.g@email.com',
        phone: '+54 11 2222-3001',
        dateOfBirth: '1978-11-08',
        status: 'TREATMENT',
        reasonForConsult: 'Depresión mayor recurrente',
        background: 'Historia de 2 episodios depresivos previos. Actualmente en tratamiento farmacológico con psiquiatra.',
        emergencyContact: 'Sofía González (hermana)',
        emergencyPhone: '+54 11 2222-3002',
        sessionFrequency: 2,
        lastContactDate: '2025-03-05',
        notes: 'Buena adherencia al tratamiento. Progreso constante en reestructuración cognitiva.',
      },
    }),
    prisma.patient.create({
      data: {
        userId: user.id,
        firstName: 'Valentina',
        lastName: 'Torres',
        email: 'valentina.t@email.com',
        phone: '+54 11 1111-4001',
        dateOfBirth: '1995-01-30',
        status: 'TREATMENT',
        reasonForConsult: 'Trastorno de ansiedad social',
        background: 'Dificultad en situaciones sociales desde la adolescencia. Evita reuniones y presentaciones laborales.',
        emergencyContact: 'Ana Torres (madre)',
        emergencyPhone: '+54 11 1111-4002',
        sessionFrequency: 1,
        lastContactDate: '2025-03-05',
        notes: 'Incorporando técnicas de exposición gradual. Avance significativo en últimas 4 sesiones.',
      },
    }),
    prisma.patient.create({
      data: {
        userId: user.id,
        firstName: 'Roberto',
        lastName: 'Díaz',
        email: 'roberto.d@email.com',
        phone: '+54 11 6666-5001',
        dateOfBirth: '1970-06-12',
        status: 'TREATMENT',
        reasonForConsult: 'Estrés laboral crónico y burnout',
        background: 'Gerente senior en empresa multinacional. Síntomas de agotamiento emocional y despersonalización.',
        emergencyContact: 'Claudia Díaz (esposa)',
        emergencyPhone: '+54 11 6666-5002',
        sessionFrequency: 1,
        lastContactDate: '2025-02-28',
        notes: 'Trabajando en límites laborales y autocuidado. Pendiente evaluación de posible licencia.',
      },
    }),

    // DISCHARGE patients
    prisma.patient.create({
      data: {
        userId: user.id,
        firstName: 'Andrea',
        lastName: 'Morales',
        email: 'andrea.m@email.com',
        phone: '+54 11 7777-6001',
        dateOfBirth: '1988-09-25',
        status: 'DISCHARGE',
        reasonForConsult: 'Trastorno de pánico (resuelto)',
        background: '12 sesiones de TCC. Alta lograda con criterios de mejoría significativa.',
        emergencyContact: 'Diego Morales (pareja)',
        emergencyPhone: '+54 11 7777-6002',
        sessionFrequency: 0,
        lastContactDate: '2025-01-15',
        notes: 'Alta terapéutica exitosa. Se acuerda control de seguimiento a 3 meses.',
      },
    }),
    prisma.patient.create({
      data: {
        userId: user.id,
        firstName: 'Federico',
        lastName: 'Ruiz',
        email: 'federico.r@email.com',
        phone: '+54 11 8888-7001',
        dateOfBirth: '1983-04-18',
        status: 'DISCHARGE',
        reasonForConsult: 'Duelo complicado (resuelto)',
        background: 'Proceso de 8 meses. Buena evolución. Incorporación de nuevas herramientas de afrontamiento.',
        emergencyContact: 'María Ruiz (hermana)',
        emergencyPhone: '+54 11 8888-7002',
        sessionFrequency: 0,
        lastContactDate: '2025-02-01',
        notes: 'Alta acordada mutuamente. Seguimiento trimestral programado.',
      },
    }),

    // INACTIVE patients
    prisma.patient.create({
      data: {
        userId: user.id,
        firstName: 'Patricia',
        lastName: 'Herrera',
        email: 'patricia.h@email.com',
        phone: '+54 11 9999-8001',
        dateOfBirth: '1990-12-05',
        status: 'INACTIVE',
        reasonForConsult: 'Fobia específica (aviones)',
        background: 'Abandonó tratamiento después de 4 sesiones sin aviso. Última sesión: 2025-01-20.',
        emergencyContact: 'Jorge Herrera (padre)',
        emergencyPhone: '+54 11 9999-8002',
        sessionFrequency: 1,
        lastContactDate: '2025-01-20',
        notes: 'No respondió a recordatorios de sesión. Intentar recontacto.',
      },
    }),
    prisma.patient.create({
      data: {
        userId: user.id,
        firstName: 'Nicolás',
        lastName: 'Castro',
        email: 'nicolas.c@email.com',
        phone: '+54 11 1010-9001',
        dateOfBirth: '1975-08-30',
        status: 'INACTIVE',
        reasonForConsult: 'Insomnio crónico asociado a ansiedad',
        background: 'Canceló últimas 3 citas. Mencionó problemas económicos en última sesión.',
        emergencyContact: 'Elena Castro (esposa)',
        emergencyPhone: '+54 11 1010-9002',
        sessionFrequency: 1,
        lastContactDate: '2025-01-08',
        notes: 'Sugerir frecuencia quincenal como alternativa económica.',
      },
    }),
  ])

  console.log(`✅ Created ${patients.length} sample patients`)

  // Create appointments for the current week
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sun, 1=Mon, etc.
  
  // Helper to get date string for a specific day this week
  function getDateForDay(targetDay: number): string {
    const diff = targetDay - dayOfWeek
    const d = new Date(today)
    d.setDate(d.getDate() + diff)
    return d.toISOString().split('T')[0]
  }

  const appointments = await Promise.all([
    // Monday
    prisma.appointment.create({
      data: {
        userId: user.id,
        patientId: patients[2].id, // Martín - TREATMENT
        date: getDateForDay(1),
        startTime: '09:00',
        endTime: '10:00',
        status: 'SCHEDULED',
        type: 'SESSION',
      },
    }),
    prisma.appointment.create({
      data: {
        userId: user.id,
        patientId: patients[3].id, // Valentina - TREATMENT
        date: getDateForDay(1),
        startTime: '10:30',
        endTime: '11:30',
        status: 'SCHEDULED',
        type: 'SESSION',
      },
    }),
    // Tuesday
    prisma.appointment.create({
      data: {
        userId: user.id,
        patientId: patients[0].id, // Carlos - ADMISSION
        date: getDateForDay(2),
        startTime: '14:00',
        endTime: '15:00',
        status: 'SCHEDULED',
        type: 'INITIAL',
        notes: 'Primera sesión de evaluación',
      },
    }),
    // Wednesday
    prisma.appointment.create({
      data: {
        userId: user.id,
        patientId: patients[2].id, // Martín - TREATMENT
        date: getDateForDay(3),
        startTime: '09:00',
        endTime: '10:00',
        status: 'SCHEDULED',
        type: 'SESSION',
      },
    }),
    prisma.appointment.create({
      data: {
        userId: user.id,
        patientId: patients[4].id, // Roberto - TREATMENT
        date: getDateForDay(3),
        startTime: '11:00',
        endTime: '12:00',
        status: 'SCHEDULED',
        type: 'SESSION',
      },
    }),
    // Thursday
    prisma.appointment.create({
      data: {
        userId: user.id,
        patientId: patients[1].id, // Lucía - ADMISSION
        date: getDateForDay(4),
        startTime: '15:00',
        endTime: '16:00',
        status: 'SCHEDULED',
        type: 'INITIAL',
      },
    }),
    prisma.appointment.create({
      data: {
        userId: user.id,
        patientId: patients[3].id, // Valentina - TREATMENT
        date: getDateForDay(4),
        startTime: '16:30',
        endTime: '17:30',
        status: 'SCHEDULED',
        type: 'SESSION',
      },
    }),
    // Friday
    prisma.appointment.create({
      data: {
        userId: user.id,
        patientId: patients[4].id, // Roberto - TREATMENT
        date: getDateForDay(5),
        startTime: '10:00',
        endTime: '11:00',
        status: 'SCHEDULED',
        type: 'SESSION',
      },
    }),
    // Past completed appointment
    prisma.appointment.create({
      data: {
        userId: user.id,
        patientId: patients[2].id, // Martín
        date: getDateForDay(dayOfWeek >= 2 ? dayOfWeek - 2 : dayOfWeek + 5),
        startTime: '09:00',
        endTime: '10:00',
        status: 'COMPLETED',
        type: 'SESSION',
      },
    }),
    // Past no-show
    prisma.appointment.create({
      data: {
        userId: user.id,
        patientId: patients[7].id, // Patricia - INACTIVE
        date: getDateForDay(dayOfWeek >= 1 ? dayOfWeek - 1 : 6),
        startTime: '14:00',
        endTime: '15:00',
        status: 'NO_SHOW',
        type: 'SESSION',
      },
    }),
  ])

  console.log(`✅ Created ${appointments.length} sample appointments`)

  // Create session notes for completed sessions
  await Promise.all([
    prisma.sessionNote.create({
      data: {
        userId: user.id,
        patientId: patients[2].id,
        appointmentId: appointments[8].id,
        content: 'Sesión de seguimiento. Martín reporta mejora en calidad del sueño y mayor motivación para actividades diarias. Se revisaron técnicas de reestructuración cognitiva aplicadas a pensamientos automáticos negativos.',
        mood: 'Estable-Mejorando',
        techniques: 'Reestructuración cognitiva, Registro de pensamientos',
        homework: 'Completar registro de pensamientos automáticos 3 veces esta semana',
        nextSessionPlan: 'Revisar registros de pensamientos. Introducir técnica de programación de actividades.',
        isPrivate: false,
      },
    }),
    prisma.sessionNote.create({
      data: {
        userId: user.id,
        patientId: patients[3].id,
        content: 'Valentina practicó exposición gradual en situación de reunión de trabajo. Reporta ansiedad moderada pero manejable. Buena utilización de técnicas de respiración.',
        mood: 'Ansioso pero funcional',
        techniques: 'Exposición gradual, Respiración diafragmática',
        homework: 'Asistir a un evento social pequeño este fin de semana',
        nextSessionPlan: 'Procesar experiencia de exposición. Evaluar avance en jerarquía de ansiedad social.',
        isPrivate: false,
      },
    }),
    // Private note
    prisma.sessionNote.create({
      data: {
        userId: user.id,
        patientId: patients[4].id,
        content: 'Roberto menciona pensamientos de desesperanza laboral. Evaluar riesgo. No hay ideación suicida activa pero requiere monitoreo estrecho. Coordinar con psiquiatra tratante.',
        mood: 'Deprimido',
        techniques: 'Validación emocional, Psicoeducación sobre burnout',
        homework: 'Registro de actividades placenteras',
        nextSessionPlan: 'Reevaluar nivel de burnout. Considerar derivación a psiquiatría si no mejora.',
        isPrivate: true,
      },
    }),
  ])

  console.log('✅ Created sample session notes')

  // Create follow-ups
  await Promise.all([
    prisma.followUp.create({
      data: {
        userId: user.id,
        patientId: patients[5].id, // Andrea - DISCHARGE
        type: 'POST_DISCHARGE',
        suggestedDate: '2025-04-15',
        status: 'PENDING',
        contactMethod: 'PHONE',
        notes: 'Control de seguimiento post-alta a 3 meses',
      },
    }),
    prisma.followUp.create({
      data: {
        userId: user.id,
        patientId: patients[6].id, // Federico - DISCHARGE
        type: 'POST_DISCHARGE',
        suggestedDate: '2025-05-01',
        status: 'PENDING',
        contactMethod: 'EMAIL',
        notes: 'Seguimiento trimestral post-alta',
      },
    }),
    prisma.followUp.create({
      data: {
        userId: user.id,
        patientId: patients[7].id, // Patricia - INACTIVE
        type: 'RE_ENGAGEMENT',
        suggestedDate: '2025-02-15',
        status: 'OVERDUE',
        contactMethod: 'PHONE',
        notes: 'Recontacto tras abandono de tratamiento. Intentar llamar y luego WhatsApp.',
      },
    }),
    prisma.followUp.create({
      data: {
        userId: user.id,
        patientId: patients[8].id, // Nicolás - INACTIVE
        type: 'RE_ENGAGEMENT',
        suggestedDate: '2025-02-20',
        status: 'OVERDUE',
        contactMethod: 'MESSAGE',
        notes: 'Ofrecer frecuencia quincenal como alternativa. Verificar situación económica.',
      },
    }),
    prisma.followUp.create({
      data: {
        userId: user.id,
        patientId: patients[3].id, // Valentina - TREATMENT
        type: 'EVOLUTION_CONTROL',
        suggestedDate: '2025-03-15',
        status: 'PENDING',
        contactMethod: 'PHONE',
        notes: 'Control de evolución cada 10 sesiones',
      },
    }),
  ])

  console.log('✅ Created sample follow-ups')

  // Create alerts
  await Promise.all([
    prisma.alert.create({
      data: {
        userId: user.id,
        patientId: patients[7].id, // Patricia - INACTIVE
        type: 'INACTIVE_PATIENT',
        title: 'Paciente inactiva sin aviso',
        message: 'Patricia Herrera no asiste a sesiones desde el 20/01/2025 (más de 6 semanas). No respondió a recordatorios.',
        severity: 'WARNING',
      },
    }),
    prisma.alert.create({
      data: {
        userId: user.id,
        patientId: patients[8].id, // Nicolás - INACTIVE
        type: 'INACTIVE_PATIENT',
        title: 'Paciente inactivo - posible problema económico',
        message: 'Nicolás Castro canceló 3 citas seguidas. Mencionó problemas económicos. Considerar ofrecer frecuencia quincenal.',
        severity: 'WARNING',
      },
    }),
    prisma.alert.create({
      data: {
        userId: user.id,
        patientId: patients[7].id, // Patricia - INACTIVE (NO_SHOW)
        type: 'NO_SHOW',
        title: 'Ausencia sin aviso',
        message: 'Patricia Herrera no asistió a su sesión programada sin previo aviso.',
        severity: 'URGENT',
      },
    }),
    prisma.alert.create({
      data: {
        userId: user.id,
        patientId: patients[5].id, // Andrea - DISCHARGE
        type: 'FOLLOW_UP_DUE',
        title: 'Seguimiento post-alta próximo',
        message: 'Se acerca la fecha de control de seguimiento para Andrea Morales (alta: 15/01/2025). Programar llamada para el 15/04.',
        severity: 'INFO',
      },
    }),
    prisma.alert.create({
      data: {
        userId: user.id,
        patientId: patients[2].id, // Martín - TREATMENT
        type: 'APPOINTMENT_REMINDER',
        title: 'Sesión mañana - Martín González',
        message: 'Recordar confirmación de sesión de mañana a las 09:00 con Martín González.',
        severity: 'INFO',
      },
    }),
  ])

  console.log('✅ Created sample alerts')
  console.log('')
  console.log('🎉 Seed completed successfully!')
  console.log('')
  console.log('📋 Demo credentials:')
  console.log('   Email:    demo@psicocrm.com')
  console.log('   Password: demo1234')
  console.log('')
  console.log('📊 Sample data includes:')
  console.log('   - 9 patients across all pipeline stages')
  console.log('   - 10 appointments (scheduled, completed, no-show)')
  console.log('   - 3 session notes (1 private)')
  console.log('   - 5 follow-ups (pending and overdue)')
  console.log('   - 5 alerts (info, warning, urgent)')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
