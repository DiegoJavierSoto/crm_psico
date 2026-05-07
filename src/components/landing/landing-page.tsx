'use client'

import { motion } from 'framer-motion'
import { CalendarCheck, FileText, Shield, ArrowRight, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/store/app-store'

const features = [
  {
    icon: CalendarCheck,
    title: 'Agenda Inteligente',
    description: 'Gestiona tus citas y horarios con facilidad. Recordatorios automaticos y control de inasistencias.',
  },
  {
    icon: FileText,
    title: 'Expediente Digital',
    description: 'Notas clinicas seguras, seguimiento de sesiones y historial completo de cada paciente.',
  },
  {
    icon: Shield,
    title: 'Seguimiento Etico',
    description: 'Alertas de seguimiento, control de pacientes inactivos y cumplimiento etico profesional.',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: 'easeOut' },
  }),
}

export function LandingPage() {
  const { setView } = useAppStore()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground tracking-tight">PsicoCRM</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setView('login')}
              className="text-muted-foreground hover:text-foreground"
            >
              Iniciar sesion
            </Button>
            <Button
              onClick={() => setView('register')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Registrarse
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sage-50 via-background to-teal-50" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
              Gestion clinica{' '}
              <span className="text-primary">profesional</span>
              <br />
              para psicologos
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Organiza tu practica clinica con herramientas disenadas para el ejercicio profesional de la psicologia. 
              Seguro, etico y confiable.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => setView('register')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base"
              >
                Comenzar ahora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setView('login')}
                className="px-8 h-12 text-base border-border"
              >
                Ya tengo cuenta
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 border-t border-border/50 py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Herramientas pensadas para el flujo de trabajo clinico real
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <Card className="h-full border-border/50 bg-card hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-6 lg:p-8">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Comienza a gestionar tu practica de forma profesional
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Sin complicaciones. Sin curva de aprendizaje. Solo las herramientas que necesitas.
            </p>
            <Button
              size="lg"
              onClick={() => setView('register')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base"
            >
              Crear cuenta gratuita
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30 py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">PsicoCRM</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} PsicoCRM. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
