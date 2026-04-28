export type User = {
  id: string
  username: string
  createdAt: string
}

export type AuthPayload = {
  token: string
  user: User
}

export type AuthMode = 'login' | 'register'

export type AuthForm = {
  username: string
  password: string
}

export type MoneyEntry = {
  id: string
  amount: number
  category: string
  currency: string
  note: string | null
  spentAt: string
  createdAt: string
}

export type CurrencyTotal = {
  currency: string
  total: number
}

export type DailyUsage = {
  date: string
  total: number
  totals: CurrencyTotal[]
  entries: MoneyEntry[]
}

export type EntryForm = {
  amount: number | null
  category: string
  currency: string
  note: string
  spentAt: string
}

export type CurrencyOption = {
  code: string
  label: string
}

export type GraphQLResponse<T> = {
  data?: T
  errors?: Array<{ message: string }>
}
