import type { GraphQLResponse } from '../types/api'

const AUTH_TOKEN_KEY = 'aday_auth_token'

export const useGraphql = () => {
  const config = useRuntimeConfig()
  const token = useState<string | null>('auth-token', () => {
    if (!import.meta.client) {
      return null
    }

    return localStorage.getItem(AUTH_TOKEN_KEY)
  })

  const setToken = (value: string | null) => {
    token.value = value

    if (!import.meta.client) {
      return
    }

    if (value) {
      localStorage.setItem(AUTH_TOKEN_KEY, value)
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY)
    }
  }

  const execute = async <T>(query: string, variables: Record<string, unknown> = {}) => {
    let response: GraphQLResponse<T>

    try {
      response = await $fetch<GraphQLResponse<T>>(config.public.graphqlEndpoint, {
        method: 'POST',
        headers: {
          ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
        },
        body: {
          query,
          variables,
        },
      })
    } catch (error) {
      const fetchError = error as { data?: GraphQLResponse<T>, message?: string, statusMessage?: string }
      const graphQLError = fetchError.data?.errors?.map((item) => item.message).join(' ')
      throw new Error(graphQLError || fetchError.statusMessage || fetchError.message || 'GraphQL request failed.')
    }

    if (response.errors?.length) {
      throw new Error(response.errors.map((error) => error.message).join(' '))
    }

    if (!response.data) {
      throw new Error('GraphQL response did not include data.')
    }

    return response.data
  }

  return {
    execute,
    setToken,
    token,
  }
}
