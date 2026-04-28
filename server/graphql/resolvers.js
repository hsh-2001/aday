import { GraphQLError } from "graphql";
import { createToken, hashPassword, requireAuth, verifyPassword } from "../utils/auth.js";
import { getDayRange, parseSpentAt, toCents } from "../utils/date.js";
import { prisma } from "../utils/prisma.js";

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
  note: entry.note,
  spentAt: entry.spentAt.toISOString(),
  createdAt: entry.createdAt.toISOString(),
});

const createAuthPayload = (user) => ({
  token: createToken(user),
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
    const foundUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    return serializeUser(foundUser);
  },

  users: async (_args, context) => {
    requireAuth(context);
    const users = await prisma.user.findMany({
      orderBy: { username: "asc" },
    });

    return users.map(serializeUser);
  },

  user: async ({ id }, context) => {
    requireAuth(context);
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return serializeUser(user);
  },

  userByName: async ({ username }, context) => {
    requireAuth(context);
    const user = await prisma.user.findFirst({
      where: { username },
    });

    return serializeUser(user);
  },

  moneyEntries: async ({ date }, context) => {
    const user = requireAuth(context);
    const range = date ? getDayRange(date) : null;
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

  dailyUsage: async ({ date }, context) => {
    const user = requireAuth(context);
    const range = getDayRange(date);
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
      entries: entries.map(serializeMoneyEntry),
    };
  },

  register: async ({ username, password }) => {
    const user = await createUser(username, password);

    return createAuthPayload(user);
  },

  login: async ({ username, password }) => {
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

    return createAuthPayload(user);
  },

  createUser: async ({ username, password }) => {
    const user = await createUser(username, password);

    return serializeUser(user);
  },

  createMoneyEntry: async ({ amount, category, note, spentAt }, context) => {
    const user = requireAuth(context);
    const entry = await prisma.moneyEntry.create({
      data: {
        amountCents: toCents(amount),
        category,
        note,
        spentAt: parseSpentAt(spentAt),
        userId: user.id,
      },
    });

    return serializeMoneyEntry(entry);
  },

  deleteMoneyEntry: async ({ id }, context) => {
    const user = requireAuth(context);
    const result = await prisma.moneyEntry.deleteMany({
      where: {
        id,
        userId: user.id,
      },
    });

    return result.count > 0;
  },
};
