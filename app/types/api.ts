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
  note: string | null
  spentAt: string
  createdAt: string
}

export type DailyUsage = {
  date: string
  total: number
  entries: MoneyEntry[]
}

export type EntryForm = {
  amount: number | null
  category: string
  note: string
  spentAt: string
}

export type GraphQLResponse<T> = {
  data?: T
  errors?: Array<{ message: string }>
}
