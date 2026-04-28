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
    note: String
    spentAt: String!
    createdAt: String!
  }

  type DailyUsage {
    date: String!
    total: Float!
    entries: [MoneyEntry!]!
  }

  type Query {
    me: User
    users: [User!]!
    user(id: ID!): User
    userByName(username: String!): User
    moneyEntries(date: String): [MoneyEntry!]!
    dailyUsage(date: String): DailyUsage!
  }

  type Mutation {
    register(username: String!, password: String!): AuthPayload!
    login(username: String!, password: String!): AuthPayload!
    createUser(username: String!, password: String!): User
    createMoneyEntry(
      amount: Float!
      category: String!
      note: String
      spentAt: String
    ): MoneyEntry!
    deleteMoneyEntry(id: ID!): Boolean!
  }
`;
