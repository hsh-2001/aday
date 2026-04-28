import type { AuthForm, AuthMode, AuthPayload, DailyUsage, EntryForm, MoneyEntry, User } from '../types/api'
import { toDateInputValue } from '../utils/formatters'

const AUTH_TOKEN_KEY = 'aday_auth_token'

export const useMoneyTracker = () => {
  const { execute, token } = useGraphql()

  const user = ref<User | null>(null)
  const authMode = ref<AuthMode>('login')
  const authForm = reactive<AuthForm>({
    username: '',
    password: '',
  })
  const entryForm = reactive<EntryForm>({
    amount: null,
    category: '',
    note: '',
    spentAt: '',
  })
  const selectedDate = ref(toDateInputValue(new Date()))
  const dailyUsage = ref<DailyUsage | null>(null)
  const errorMessage = ref('')
  const isAuthLoading = ref(false)
  const isDailyLoading = ref(false)
  const isEntryLoading = ref(false)

  const setError = (error: unknown) => {
    errorMessage.value = error instanceof Error ? error.message : 'Something went wrong.'
  }

  const resetEntryForm = () => {
    entryForm.amount = null
    entryForm.category = ''
    entryForm.note = ''
    entryForm.spentAt = ''
  }

  const submitAuth = async () => {
    errorMessage.value = ''
    isAuthLoading.value = true

    const mutationName = authMode.value
    const mutation = `
      mutation Authenticate($username: String!, $password: String!) {
        ${mutationName}(username: $username, password: $password) {
          token
          user {
            id
            username
            createdAt
          }
        }
      }
    `

    try {
      const data = await execute<Record<AuthMode, AuthPayload>>(mutation, {
        username: authForm.username,
        password: authForm.password,
      })
      const payload = data[mutationName]

      token.value = payload.token
      user.value = payload.user
      localStorage.setItem(AUTH_TOKEN_KEY, payload.token)
      authForm.password = ''
      await loadDailyUsage()
    } catch (error) {
      setError(error)
    } finally {
      isAuthLoading.value = false
    }
  }

  const toggleAuthMode = () => {
    authMode.value = authMode.value === 'login' ? 'register' : 'login'
    errorMessage.value = ''
  }

  const loadMe = async () => {
    if (!token.value) {
      return
    }

    try {
      const data = await execute<{ me: User | null }>(`
        query Me {
          me {
            id
            username
            createdAt
          }
        }
      `)

      user.value = data.me
      if (data.me) {
        await loadDailyUsage()
      }
    } catch {
      logout()
    }
  }

  const loadDailyUsage = async () => {
    if (!user.value) {
      return
    }

    errorMessage.value = ''
    isDailyLoading.value = true

    try {
      const data = await execute<{ dailyUsage: DailyUsage }>(`
        query DailyUsage($date: String) {
          dailyUsage(date: $date) {
            date
            total
            entries {
              id
              amount
              category
              note
              spentAt
              createdAt
            }
          }
        }
      `, { date: selectedDate.value })

      dailyUsage.value = data.dailyUsage
    } catch (error) {
      setError(error)
    } finally {
      isDailyLoading.value = false
    }
  }

  const createEntry = async () => {
    if (!entryForm.amount) {
      errorMessage.value = 'Amount is required.'
      return
    }

    errorMessage.value = ''
    isEntryLoading.value = true

    try {
      await execute<{ createMoneyEntry: MoneyEntry }>(`
        mutation CreateMoneyEntry($amount: Float!, $category: String!, $note: String, $spentAt: String) {
          createMoneyEntry(amount: $amount, category: $category, note: $note, spentAt: $spentAt) {
            id
          }
        }
      `, {
        amount: entryForm.amount,
        category: entryForm.category,
        note: entryForm.note || null,
        spentAt: entryForm.spentAt ? new Date(entryForm.spentAt).toISOString() : null,
      })

      resetEntryForm()
      await loadDailyUsage()
    } catch (error) {
      setError(error)
    } finally {
      isEntryLoading.value = false
    }
  }

  const deleteEntry = async (id: string) => {
    errorMessage.value = ''

    try {
      await execute<{ deleteMoneyEntry: boolean }>(`
        mutation DeleteMoneyEntry($id: ID!) {
          deleteMoneyEntry(id: $id)
        }
      `, { id })
      await loadDailyUsage()
    } catch (error) {
      setError(error)
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    dailyUsage.value = null

    if (import.meta.client) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
    }
  }

  const initializeSession = async () => {
    if (!import.meta.client) {
      return
    }

    token.value = localStorage.getItem(AUTH_TOKEN_KEY)
    await loadMe()
  }

  return {
    authForm,
    authMode,
    dailyUsage,
    entryForm,
    errorMessage,
    isAuthLoading,
    isDailyLoading,
    isEntryLoading,
    selectedDate,
    user,
    createEntry,
    deleteEntry,
    initializeSession,
    loadDailyUsage,
    logout,
    submitAuth,
    toggleAuthMode,
  }
}
