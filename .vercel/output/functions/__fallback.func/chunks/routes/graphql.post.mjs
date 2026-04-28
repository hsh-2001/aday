import { d as defineEventHandler, r as readBody, g as getHeader } from '../nitro/nitro.mjs';
import { GraphQLError, graphql, buildSchema } from 'graphql';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { g as getPrisma } from '../_/prisma.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-change-me";
const JWT_EXPIRES_IN = "7d";
const hashPassword = (password) => {
  return bcrypt.hash(password, 12);
};
const verifyPassword = (password, passwordHash) => {
  return bcrypt.compare(password, passwordHash);
};
const createToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};
const getUserFromAuthorization = (authorization) => {
  if (!authorization) {
    return null;
  }
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return {
      id: payload.sub,
      username: payload.username
    };
  } catch {
    return null;
  }
};
const requireAuth = (context) => {
  if (!context.user) {
    throw new GraphQLError("You must be logged in.", {
      extensions: { code: "UNAUTHENTICATED" }
    });
  }
  return context.user;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const toDateString = (date = /* @__PURE__ */ new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const getDayRange = (dateString, timezoneOffset = 0) => {
  const normalizedDateString = dateString || toDateString();
  if (!DATE_PATTERN.test(normalizedDateString)) {
    throw new Error("Date must use YYYY-MM-DD format.");
  }
  const normalizedTimezoneOffset = Number(timezoneOffset);
  if (!Number.isFinite(normalizedTimezoneOffset)) {
    throw new Error("Timezone offset must be a number.");
  }
  const [year, month, day] = normalizedDateString.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day) + normalizedTimezoneOffset * 60 * 1e3);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1e3);
  return {
    date: normalizedDateString,
    start,
    end
  };
};
const parseSpentAt = (spentAt) => {
  if (!spentAt) {
    return /* @__PURE__ */ new Date();
  }
  const date = new Date(spentAt);
  if (Number.isNaN(date.getTime())) {
    throw new Error("spentAt must be a valid date.");
  }
  return date;
};
const toCents = (amount) => {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number.");
  }
  return Math.round(amount * 100);
};

const DEFAULT_CATEGORIES = ["Food", "Transport", "Coffee", "Shopping", "Bills"];
const SUPPORTED_CURRENCIES = /* @__PURE__ */ new Set(["USD", "KHR", "THB", "EUR", "JPY", "CNY"]);
const serializeUser = (user) => {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt.toISOString()
  };
};
const serializeMoneyEntry = (entry) => ({
  id: entry.id,
  amount: entry.amountCents / 100,
  category: entry.category,
  currency: entry.currency || "USD",
  note: entry.note,
  spentAt: entry.spentAt.toISOString(),
  createdAt: entry.createdAt.toISOString()
});
const normalizeCategory = (category) => {
  const trimmedCategory = category.trim();
  if (!trimmedCategory) {
    throw new GraphQLError("Category is required.", {
      extensions: { code: "BAD_USER_INPUT" }
    });
  }
  if (trimmedCategory.length > 48) {
    throw new GraphQLError("Category must be 48 characters or fewer.", {
      extensions: { code: "BAD_USER_INPUT" }
    });
  }
  return trimmedCategory;
};
const normalizeCurrency = (currency = "USD") => {
  const normalizedCurrency = (currency || "USD").trim().toUpperCase();
  if (!SUPPORTED_CURRENCIES.has(normalizedCurrency)) {
    throw new GraphQLError("Unsupported currency.", {
      extensions: { code: "BAD_USER_INPUT" }
    });
  }
  return normalizedCurrency;
};
const totalEntriesByCurrency = (entries) => {
  const totals = entries.reduce((result, entry) => {
    const currency = entry.currency || "USD";
    result.set(currency, (result.get(currency) || 0) + entry.amountCents);
    return result;
  }, /* @__PURE__ */ new Map());
  return Array.from(totals.entries()).sort(([leftCurrency], [rightCurrency]) => leftCurrency.localeCompare(rightCurrency)).map(([currency, totalCents]) => ({
    currency,
    total: totalCents / 100
  }));
};
const upsertCategory = async (userId, category) => {
  const prisma = await getPrisma();
  return prisma.category.upsert({
    where: {
      userId_name: {
        userId,
        name: category
      }
    },
    update: {},
    create: {
      userId,
      name: category
    }
  });
};
const createAuthPayload = (user) => ({
  token: createToken(user),
  user: serializeUser(user)
});
const validateUserInput = (username, password) => {
  if (!username.trim()) {
    throw new GraphQLError("Username is required.", {
      extensions: { code: "BAD_USER_INPUT" }
    });
  }
  if (password.length < 6) {
    throw new GraphQLError("Password must be at least 6 characters.", {
      extensions: { code: "BAD_USER_INPUT" }
    });
  }
};
const createUser = async (username, password) => {
  validateUserInput(username, password);
  const prisma = await getPrisma();
  const existingUser = await prisma.user.findUnique({
    where: { username }
  });
  if (existingUser) {
    throw new GraphQLError("Username is already taken.", {
      extensions: { code: "BAD_USER_INPUT" }
    });
  }
  return prisma.user.create({
    data: {
      username,
      password: await hashPassword(password)
    }
  });
};
const rootValue = {
  me: async (_args, context) => {
    const user = requireAuth(context);
    const prisma = await getPrisma();
    const foundUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    return serializeUser(foundUser);
  },
  users: async (_args, context) => {
    requireAuth(context);
    const prisma = await getPrisma();
    const users = await prisma.user.findMany({
      orderBy: { username: "asc" }
    });
    return users.map(serializeUser);
  },
  user: async ({ id }, context) => {
    requireAuth(context);
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({
      where: { id }
    });
    return serializeUser(user);
  },
  userByName: async ({ username }, context) => {
    requireAuth(context);
    const prisma = await getPrisma();
    const user = await prisma.user.findFirst({
      where: { username }
    });
    return serializeUser(user);
  },
  categories: async (_args, context) => {
    const user = requireAuth(context);
    const prisma = await getPrisma();
    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" }
    });
    const categoryNames = new Set(DEFAULT_CATEGORIES);
    categories.forEach((category) => {
      categoryNames.add(category.name);
    });
    return Array.from(categoryNames);
  },
  moneyEntries: async ({ date, timezoneOffset }, context) => {
    const user = requireAuth(context);
    const range = date ? getDayRange(date, timezoneOffset) : null;
    const prisma = await getPrisma();
    const entries = await prisma.moneyEntry.findMany({
      where: {
        userId: user.id,
        ...range ? {
          spentAt: {
            gte: range.start,
            lt: range.end
          }
        } : {}
      },
      orderBy: { spentAt: "desc" }
    });
    return entries.map(serializeMoneyEntry);
  },
  dailyUsage: async ({ date, timezoneOffset }, context) => {
    const user = requireAuth(context);
    const range = getDayRange(date, timezoneOffset);
    const prisma = await getPrisma();
    const entries = await prisma.moneyEntry.findMany({
      where: {
        userId: user.id,
        spentAt: {
          gte: range.start,
          lt: range.end
        }
      },
      orderBy: { spentAt: "desc" }
    });
    const totalCents = entries.reduce((total, entry) => {
      return total + entry.amountCents;
    }, 0);
    return {
      date: range.date,
      total: totalCents / 100,
      totals: totalEntriesByCurrency(entries),
      entries: entries.map(serializeMoneyEntry)
    };
  },
  register: async ({ username, password }) => {
    const user = await createUser(username, password);
    return createAuthPayload(user);
  },
  login: async ({ username, password }) => {
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({
      where: { username }
    });
    if (!user) {
      throw new GraphQLError("Invalid username or password.", {
        extensions: { code: "UNAUTHENTICATED" }
      });
    }
    const isPasswordValid = await verifyPassword(password, user.password) || password === user.password;
    if (!isPasswordValid) {
      throw new GraphQLError("Invalid username or password.", {
        extensions: { code: "UNAUTHENTICATED" }
      });
    }
    if (password === user.password) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: await hashPassword(password) }
      });
    }
    return createAuthPayload(user);
  },
  createUser: async ({ username, password }) => {
    const user = await createUser(username, password);
    return serializeUser(user);
  },
  createMoneyEntry: async ({ amount, category, currency, note, spentAt }, context) => {
    const user = requireAuth(context);
    const normalizedCategory = normalizeCategory(category);
    const normalizedCurrency = normalizeCurrency(currency);
    const prisma = await getPrisma();
    const entry = await prisma.$transaction(async (transaction) => {
      await transaction.category.upsert({
        where: {
          userId_name: {
            userId: user.id,
            name: normalizedCategory
          }
        },
        update: {},
        create: {
          userId: user.id,
          name: normalizedCategory
        }
      });
      return transaction.moneyEntry.create({
        data: {
          amountCents: toCents(amount),
          category: normalizedCategory,
          currency: normalizedCurrency,
          note,
          spentAt: parseSpentAt(spentAt),
          userId: user.id
        }
      });
    });
    return serializeMoneyEntry(entry);
  },
  createCategory: async ({ name }, context) => {
    const user = requireAuth(context);
    const category = normalizeCategory(name);
    await upsertCategory(user.id, category);
    return category;
  },
  deleteMoneyEntry: async ({ id }, context) => {
    const user = requireAuth(context);
    const prisma = await getPrisma();
    const result = await prisma.moneyEntry.deleteMany({
      where: {
        id,
        userId: user.id
      }
    });
    return result.count > 0;
  }
};

const typeDefs = `#graphql
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

const schema = buildSchema(typeDefs);
const graphql_post = defineEventHandler(async (event) => {
  var _a;
  try {
    const body = await readBody(event);
    const result = await graphql({
      schema,
      source: body == null ? void 0 : body.query,
      rootValue,
      contextValue: {
        user: getUserFromAuthorization(getHeader(event, "authorization"))
      },
      variableValues: body == null ? void 0 : body.variables,
      operationName: body == null ? void 0 : body.operationName
    });
    if ((_a = result.errors) == null ? void 0 : _a.length) {
      console.error(
        "GraphQL errors:",
        result.errors.map((error) => {
          var _a2;
          return {
            message: error.message,
            path: error.path,
            originalError: (_a2 = error.originalError) == null ? void 0 : _a2.message
          };
        })
      );
    }
    return result;
  } catch (error) {
    console.error("GraphQL route failed:", error);
    return {
      errors: [
        {
          message: error instanceof Error ? error.message : "GraphQL route failed."
        }
      ]
    };
  }
});

export { graphql_post as default };
//# sourceMappingURL=graphql.post.mjs.map
