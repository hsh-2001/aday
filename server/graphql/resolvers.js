import { GraphQLError } from "graphql";
import { createToken, hashPassword, requireAuth, verifyPassword } from "../utils/auth.js";
import { getDayRange, parseSpentAt, toCents } from "../utils/date.js";
import { getPrisma } from "../utils/prisma.js";

const DEFAULT_CATEGORIES = ["Food", "Transport", "Coffee", "Shopping", "Bills"];
const SUPPORTED_CURRENCIES = new Set(["USD", "KHR", "THB", "EUR", "JPY", "CNY"]);

const serializeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt.toISOString(),
  };
};

const serializeMoneyEntry = (entry) => ({
  id: entry.id,
  amount: entry.amountCents / 100,
  category: entry.category,
  currency: entry.currency || "USD",
  note: entry.note,
  spentAt: entry.spentAt.toISOString(),
  createdAt: entry.createdAt.toISOString(),
});

const normalizeCategory = (category) => {
  const trimmedCategory = category.trim();

  if (!trimmedCategory) {
    throw new GraphQLError("Category is required.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  if (trimmedCategory.length > 48) {
    throw new GraphQLError("Category must be 48 characters or fewer.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  return trimmedCategory;
};

const normalizeCurrency = (currency = "USD") => {
  const normalizedCurrency = (currency || "USD").trim().toUpperCase();

  if (!SUPPORTED_CURRENCIES.has(normalizedCurrency)) {
    throw new GraphQLError("Unsupported currency.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  return normalizedCurrency;
};

const totalEntriesByCurrency = (entries) => {
  const totals = entries.reduce((result, entry) => {
    const currency = entry.currency || "USD";
    result.set(currency, (result.get(currency) || 0) + entry.amountCents);

    return result;
  }, new Map());

  return Array.from(totals.entries())
    .sort(([leftCurrency], [rightCurrency]) => leftCurrency.localeCompare(rightCurrency))
    .map(([currency, totalCents]) => ({
      currency,
      total: totalCents / 100,
    }));
};

const upsertCategory = async (userId, category) => {
  const prisma = await getPrisma();

  return prisma.category.upsert({
    where: {
      userId_name: {
        userId,
        name: category,
      },
    },
    update: {},
    create: {
      userId,
      name: category,
    },
  });
};

const createAuthPayload = async (user) => ({
  token: await createToken(user),
  user: serializeUser(user),
});

const validateUserInput = (username, password) => {
  if (!username.trim()) {
    throw new GraphQLError("Username is required.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  if (password.length < 6) {
    throw new GraphQLError("Password must be at least 6 characters.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
};

const createUser = async (username, password) => {
  validateUserInput(username, password);

  const prisma = await getPrisma();
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    throw new GraphQLError("Username is already taken.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  return prisma.user.create({
    data: {
      username,
      password: await hashPassword(password),
    },
  });
};

export const rootValue = {
  me: async (_args, context) => {
    const user = requireAuth(context);
    const prisma = await getPrisma();
    const foundUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    return serializeUser(foundUser);
  },

  users: async (_args, context) => {
    requireAuth(context);
    const prisma = await getPrisma();
    const users = await prisma.user.findMany({
      orderBy: { username: "asc" },
    });

    return users.map(serializeUser);
  },

  user: async ({ id }, context) => {
    requireAuth(context);
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return serializeUser(user);
  },

  userByName: async ({ username }, context) => {
    requireAuth(context);
    const prisma = await getPrisma();
    const user = await prisma.user.findFirst({
      where: { username },
    });

    return serializeUser(user);
  },

  categories: async (_args, context) => {
    const user = requireAuth(context);
    const prisma = await getPrisma();
    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
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
        ...(range
          ? {
              spentAt: {
                gte: range.start,
                lt: range.end,
              },
            }
          : {}),
      },
      orderBy: { spentAt: "desc" },
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
          lt: range.end,
        },
      },
      orderBy: { spentAt: "desc" },
    });
    const totalCents = entries.reduce((total, entry) => {
      return total + entry.amountCents;
    }, 0);

    return {
      date: range.date,
      total: totalCents / 100,
      totals: totalEntriesByCurrency(entries),
      entries: entries.map(serializeMoneyEntry),
    };
  },

  register: async ({ username, password }) => {
    const user = await createUser(username, password);

    return await createAuthPayload(user);
  },

  login: async ({ username, password }) => {
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new GraphQLError("Invalid username or password.", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    const isPasswordValid =
      (await verifyPassword(password, user.password)) || password === user.password;

    if (!isPasswordValid) {
      throw new GraphQLError("Invalid username or password.", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    if (password === user.password) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: await hashPassword(password) },
      });
    }

    return await createAuthPayload(user);
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
            name: normalizedCategory,
          },
        },
        update: {},
        create: {
          userId: user.id,
          name: normalizedCategory,
        },
      });

      return transaction.moneyEntry.create({
        data: {
          amountCents: toCents(amount),
          category: normalizedCategory,
          currency: normalizedCurrency,
          note,
          spentAt: parseSpentAt(spentAt),
          userId: user.id,
        },
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
        userId: user.id,
      },
    });

    return result.count > 0;
  },
};
