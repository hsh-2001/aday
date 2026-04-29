import { neon } from "@neondatabase/serverless";
import { getServerEnvValue } from "./env.js";

const globalForDb = globalThis;

const createId = () => {
  return globalThis.crypto.randomUUID();
};

const createSqlClient = () => {
  const databaseUrl = getServerEnvValue("DATABASE_URL");

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return neon(databaseUrl, { disableWarningInBrowsers: true });
};

export const getSql = () => {
  if (!globalForDb.__adaySql) {
    globalForDb.__adaySql = createSqlClient();
  }

  return globalForDb.__adaySql;
};

export const pingDatabase = async () => {
  const sql = getSql();

  await sql`SELECT 1`;
};

export const findUserById = async (id) => {
  const sql = getSql();
  const users = await sql`
    SELECT "id", "username", "password", "createdAt"
    FROM "users"
    WHERE "id" = ${id}
    LIMIT 1
  `;

  return users[0] || null;
};

export const findUserByUsername = async (username) => {
  const sql = getSql();
  const users = await sql`
    SELECT "id", "username", "password", "createdAt"
    FROM "users"
    WHERE "username" = ${username}
    LIMIT 1
  `;

  return users[0] || null;
};

export const listUsers = async () => {
  const sql = getSql();

  return await sql`
    SELECT "id", "username", "password", "createdAt"
    FROM "users"
    ORDER BY "username" ASC
  `;
};

export const createUserRecord = async ({ username, password }) => {
  const sql = getSql();
  const users = await sql`
    INSERT INTO "users" ("id", "username", "password")
    VALUES (${createId()}, ${username}, ${password})
    RETURNING "id", "username", "password", "createdAt"
  `;

  return users[0];
};

export const updateUserPassword = async ({ id, password }) => {
  const sql = getSql();
  const users = await sql`
    UPDATE "users"
    SET "password" = ${password}
    WHERE "id" = ${id}
    RETURNING "id", "username", "password", "createdAt"
  `;

  return users[0] || null;
};

export const upsertCategoryRecord = async ({ userId, name }) => {
  const sql = getSql();
  const categories = await sql`
    INSERT INTO "categories" ("id", "userId", "name")
    VALUES (${createId()}, ${userId}, ${name})
    ON CONFLICT ("userId", "name") DO UPDATE SET "name" = EXCLUDED."name"
    RETURNING "id", "name", "createdAt", "userId"
  `;

  return categories[0];
};

export const listCategories = async (userId) => {
  const sql = getSql();

  return await sql`
    SELECT "id", "name", "createdAt", "userId"
    FROM "categories"
    WHERE "userId" = ${userId}
    ORDER BY "name" ASC
  `;
};

export const listMoneyEntries = async ({ userId, range }) => {
  const sql = getSql();

  if (range) {
    return await sql`
      SELECT "id", "amountCents", "category", "currency", "note", "spentAt", "createdAt", "userId"
      FROM "money_entries"
      WHERE "userId" = ${userId}
        AND "spentAt" >= ${range.start}
        AND "spentAt" < ${range.end}
      ORDER BY "spentAt" DESC
    `;
  }

  return await sql`
    SELECT "id", "amountCents", "category", "currency", "note", "spentAt", "createdAt", "userId"
    FROM "money_entries"
    WHERE "userId" = ${userId}
    ORDER BY "spentAt" DESC
  `;
};

export const createMoneyEntryRecord = async ({
  userId,
  amountCents,
  category,
  currency,
  note,
  spentAt,
}) => {
  const sql = getSql();
  const [, entries] = await sql.transaction((txn) => [
    txn`
      INSERT INTO "categories" ("id", "userId", "name")
      VALUES (${createId()}, ${userId}, ${category})
      ON CONFLICT ("userId", "name") DO UPDATE SET "name" = EXCLUDED."name"
      RETURNING "id"
    `,
    txn`
      INSERT INTO "money_entries" ("id", "amountCents", "category", "currency", "note", "spentAt", "userId")
      VALUES (${createId()}, ${amountCents}, ${category}, ${currency}, ${note}, ${spentAt}, ${userId})
      RETURNING "id", "amountCents", "category", "currency", "note", "spentAt", "createdAt", "userId"
    `,
  ]);

  return entries[0];
};

export const deleteMoneyEntryRecord = async ({ id, userId }) => {
  const sql = getSql();
  const entries = await sql`
    DELETE FROM "money_entries"
    WHERE "id" = ${id}
      AND "userId" = ${userId}
    RETURNING "id"
  `;

  return { count: entries.length };
};
