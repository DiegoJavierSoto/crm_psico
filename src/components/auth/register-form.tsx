'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Brain, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/store/app-store'
import { useAuth } from '@/hooks/use-auth'

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.email('Ingresa un correo electronico valido'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirma tu contrasena'),
  phone: z.string().optional(),
  licenseNumber: z.string().optional(),
  specialty: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contrasenas no coinciden',
  path: ['confirmPassword'],
})

type RegisterFormValues = z.infer<typeof registerSchema>

const specialties = [
  'Psicologia Clinica',
  'Psicoterapia',
  'Neuropsicologia',
  'Psicologia Infantil',
  'Psicologia Familiar',
  'Psicologia Organizacional',
  'Psicologia Educativa',
  'Otra',
]

export function RegisterForm() {
  const { setView } = useAppStore()
  const { register } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      licenseNumber: '',
      specialty: '',
    },
  })

  async function onSubmit(data: RegisterFormValues) {
    setError(null)
    setIsLoading(true)
    try {
      const result = await register({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
        licenseNumber: data.licenseNumber || undefined,
        specialty: data.specialty || undefined,
      })
      if (!result.success) {
        setError(result.error || 'Error al registrar')
      } else {
        // If registration succeeded but auto-login failed, redirect to login
        if (!useAppStore.getState().isAuthenticated) {
          setView('login')
        }
      }
    } catch {
      setError('Error de conexion. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sage-50 via-background to-teal-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">PsicoCRM</span>
          </div>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Crear cuenta</CardTitle>
            <CardDescription>
              Registra tus datos para comenzar a usar PsicoCRM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Dr. Maria Garcia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electronico</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="tu@correo.com" autoComplete="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contrasena</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Minimo 6 caracteres" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar contrasena</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Repite tu contrasena" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefono (opcional)</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+52 55 1234 5678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numero de cedula (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especialidad (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tu especialidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {specialties.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    'Crear cuenta'
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setView('login')}
                className="text-sm text-primary hover:underline focus:outline-none focus:underline"
              >
                Ya tienes cuenta? Inicia sesion
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-border/50 text-center">
              <button
                onClick={() => setView('landing')}
                className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 focus:outline-none"
              >
                <ArrowLeft className="h-3 w-3" />
                Volver al inicio
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
