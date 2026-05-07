'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CheckResult {
  alertsCreated: number
  checks: {
    inactivePatients: number
    tomorrowAppointments: number
    overdueFollowUps: number
    treatmentPatients: number
  }
}

export function AutomationStatus() {
  const [isChecking, setIsChecking] = useState(false)
  const [lastResult, setLastResult] = useState<CheckResult | null>(null)
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null)

  const handleRunCheck = async () => {
    setIsChecking(true)
    try {
      const res = await fetch('/api/automations/check')
      if (res.ok) {
        const data = await res.json()
        // Unwrap { data: ... } format
        const result = data.data || data
        setLastResult(result)
        setLastCheckTime(new Date().toLocaleString('es-AR'))
      }
    } catch {
      // Silent error
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Automatizaciones
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Estado de las verificaciones automaticas
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={handleRunCheck}
            disabled={isChecking}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className={cn('h-4 w-4 mr-1', isChecking && 'animate-spin')} />
            {isChecking ? 'Verificando...' : 'Ejecutar verificacion'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Last check */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Ultima verificacion:</span>
            <span className="text-sm text-foreground">
              {lastCheckTime || 'Nunca'}
            </span>
          </div>

          {/* Stats from last result */}
          {lastResult && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/30 p-3 text-center">
                <p className="text-lg font-bold text-foreground">{lastResult.checks.inactivePatients + lastResult.checks.treatmentPatients}</p>
                <p className="text-xs text-muted-foreground">Pacientes revisados</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3 text-center">
                <p className="text-lg font-bold text-foreground">{lastResult.alertsCreated}</p>
                <p className="text-xs text-muted-foreground">Alertas generadas</p>
              </div>
            </div>
          )}

          {/* Last result feedback */}
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-lg border border-primary/20 bg-primary/5 p-3"
            >
              <div className="flex items-center gap-2">
                {lastResult.alertsCreated > 0 ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                )}
                <span className="text-sm text-foreground">
                  {lastResult.alertsCreated > 0
                    ? `Se generaron ${lastResult.alertsCreated} nuevas alertas`
                    : 'No se generaron nuevas alertas'}
                </span>
              </div>
              {lastResult.checks.overdueFollowUps > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {lastResult.checks.overdueFollowUps} seguimiento(s) vencido(s) detectado(s)
                </p>
              )}
            </motion.div>
          )}

          {/* Checks description */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>El sistema verifica automaticamente:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Pacientes inactivos sin contacto reciente</li>
              <li>Sesiones no asistidas</li>
              <li>Seguimientos vencidos</li>
              <li>Recordatorios de citas proximas</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
