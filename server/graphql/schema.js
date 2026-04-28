export const typeDefs = `#graphql
  type User {
    id: ID!
    username: String!
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type MoneyEntry {
    id: ID!
    amount: Float!
    category: String!
    currency: String!
    note: String
    spentAt: String!
    createdAt: String!
  }

  type CurrencyTotal {
    currency: String!
    total: Float!
  }

  type DailyUsage {
    date: String!
    total: Float!
    totals: [CurrencyTotal!]!
    entries: [MoneyEntry!]!
  }

  type Query {
    me: User
    users: [User!]!
    user(id: ID!): User
    userByName(username: String!): User
    categories: [String!]!
    moneyEntries(date: String, timezoneOffset: Int): [MoneyEntry!]!
    dailyUsage(date: String, timezoneOffset: Int): DailyUsage!
  }

  type Mutation {
    register(username: String!, password: String!): AuthPayload!
    login(username: String!, password: String!): AuthPayload!
    createUser(username: String!, password: String!): User
    createMoneyEntry(
      amount: Float!
      category: String!
      currency: String
      note: String
      spentAt: String
    ): MoneyEntry!
    createCategory(name: String!): String!
    deleteMoneyEntry(id: ID!): Boolean!
  }
`;
