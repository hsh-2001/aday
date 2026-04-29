import type { AuthForm, AuthMode, AuthPayload, CurrencyOption, DailyUsage, EntryForm, MoneyEntry, User } from '../types/api'
import { toDateInputValue } from '../utils/formatters'

const AUTH_TOKEN_KEY = 'aday_auth_token'
const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'USD', label: 'USD - US Dollar' },
  { code: 'KHR', label: 'KHR - Cambodian Riel' },
  { code: 'THB', label: 'THB - Thai Baht' },
  { code: 'EUR', label: 'EUR - Euro' },
  { code: 'JPY', label: 'JPY - Japanese Yen' },
  { code: 'CNY', label: 'CNY - Chinese Yuan' },
]

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
    currency: 'USD',
    note: '',
    spentAt: '',
  })
  const categoryName = ref('')
  const categories = ref<string[]>([])
  const selectedDate = ref(toDateInputValue(new Date()))
  const dailyUsage = ref<DailyUsage | null>(null)
  const errorMessage = ref('')
  const isAuthLoading = ref(false)
  const isCategoryLoading = ref(false)
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

  const getTimezoneOffset = () => {
    if (!import.meta.client) {
      return 0
    }

    return new Date().getTimezoneOffset()
  }

  const loadCategories = async () => {
    if (!user.value) {
      return
    }

    try {
      const data = await execute<{ categories: string[] }>(`
        query Categories {
          categories
        }
      `)

      categories.value = data.categories
    } catch (error) {
      setError(error)
      categories.value = ['Food', 'Transport', 'Coffee', 'Shopping', 'Bills']
    }
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
      await loadCategories()
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
        await loadCategories()
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
        query DailyUsage($date: String, $timezoneOffset: Int) {
          dailyUsage(date: $date, timezoneOffset: $timezoneOffset) {
            date
            total
            totals {
              currency
              total
            }
            entries {
              id
              amount
              category
              currency
              note
              spentAt
              createdAt
            }
          }
        }
      `, {
        date: selectedDate.value,
        timezoneOffset: getTimezoneOffset(),
      })

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
      return false
    }

    errorMessage.value = ''
    isEntryLoading.value = true

    try {
      await execute<{ createMoneyEntry: MoneyEntry }>(`
        mutation CreateMoneyEntry($amount: Float!, $category: String!, $currency: String, $note: String, $spentAt: String) {
          createMoneyEntry(amount: $amount, category: $category, currency: $currency, note: $note, spentAt: $spentAt) {
            id
          }
        }
      `, {
        amount: entryForm.amount,
        category: entryForm.category,
        currency: entryForm.currency,
        note: entryForm.note || null,
        spentAt: entryForm.spentAt ? new Date(entryForm.spentAt).toISOString() : null,
      })

      resetEntryForm()
      await loadCategories()
      await loadDailyUsage()
      return true
    } catch (error) {
      setError(error)
      return false
    } finally {
      isEntryLoading.value = false
    }
  }

  const createCategory = async () => {
    const name = categoryName.value.trim()

    if (!name) {
      errorMessage.value = 'Category name is required.'
      return
    }

    errorMessage.value = ''
    isCategoryLoading.value = true

    try {
      const data = await execute<{ createCategory: string }>(`
        mutation CreateCategory($name: String!) {
          createCategory(name: $name)
        }
      `, { name })

      entryForm.category = data.createCategory
      categoryName.value = ''
      await loadCategories()
    } catch (error) {
      setError(error)
    } finally {
      isCategoryLoading.value = false
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
      return true
    } catch (error) {
      setError(error)
      return false
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    categories.value = []
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
    categories,
    categoryName,
    currencyOptions: CURRENCY_OPTIONS,
    dailyUsage,
    entryForm,
    errorMessage,
    isAuthLoading,
    isCategoryLoading,
    isDailyLoading,
    isEntryLoading,
    selectedDate,
    user,
    createCategory,
    createEntry,
    deleteEntry,
    initializeSession,
    loadDailyUsage,
    logout,
    submitAuth,
    toggleAuthMode,
  }
}
