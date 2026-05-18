'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface ApiError {
  message: string
  status?: number
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Error de conexion' }))
    const error: ApiError = {
      message: errorData.error || errorData.message || `Error ${res.status}`,
      status: res.status,
    }
    throw error
  }

  if (res.status === 204) return undefined as T

  const json = await res.json()

  // Unwrap { data: ... } format from API responses
  if (json && typeof json === 'object' && 'data' in json) {
    return json.data as T
  }

  return json as T
}

export function useApi<T>(url: string | null, enabled = true) {
  return useQuery<T>({
    queryKey: [url],
    queryFn: () => apiFetch<T>(url!),
    enabled: !!url && enabled,
    staleTime: 30000,
    retry: 1,
  })
}

export function useApiMutation<TData, TVariables = unknown>() {
  const queryClient = useQueryClient()

  return useMutation<TData, ApiError, { url: string; method?: string; body?: TVariables }>({
    mutationFn: async ({ url, method = 'POST', body }) => {
      return apiFetch<TData>(url, {
        method,
        body: body ? JSON.stringify(body) : undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries()
    },
  })
}
