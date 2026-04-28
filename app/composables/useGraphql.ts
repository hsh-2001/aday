import type { GraphQLResponse } from '../types/api'

export const useGraphql = () => {
  const config = useRuntimeConfig()
  const token = useState<string | null>('auth-token', () => null)

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
    token,
  }
}
