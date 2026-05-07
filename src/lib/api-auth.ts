import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export interface AuthResult {
  userId: string
  error?: never
}

export interface AuthError {
  userId?: never
  error: NextResponse
}

/**
 * Verify the user is authenticated. Returns userId or an error response.
 * Use this in all protected API routes.
 */
export async function requireAuth(): Promise<AuthResult | AuthError> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }),
    }
  }

  return { userId: session.user.id }
}
