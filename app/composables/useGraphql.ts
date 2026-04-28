import type { GraphQLResponse } from '../types/api'

export const useGraphql = () => {
  const config = useRuntimeConfig()
  const token = useState<string | null>('auth-token', () => null)

  const execute = async <T>(query: string, variables: Record<string, unknown> = {}) => {
    const response = await $fetch<GraphQLResponse<T>>(config.public.graphqlEndpoint, {
      method: 'POST',
      headers: {
        ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
      },
      body: {
        query,
        variables,
      },
    })

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
    token,
  }
}
