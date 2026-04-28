import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { GraphQLError } from "graphql";

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-change-me";
const JWT_EXPIRES_IN = "7d";

export const hashPassword = (password) => {
  return bcrypt.hash(password, 12);
};

export const verifyPassword = (password, passwordHash) => {
  return bcrypt.compare(password, passwordHash);
};

export const createToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
};

export const getUserFromAuthorization = (authorization) => {
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
      username: payload.username,
    };
  } catch {
    return null;
  }
};

export const requireAuth = (context) => {
  if (!context.user) {
    throw new GraphQLError("You must be logged in.", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  return context.user;
};
