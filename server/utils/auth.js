import bcrypt from "bcryptjs";
import { GraphQLError } from "graphql";
import { getServerEnvValue } from "./env.js";

const JWT_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60;
const textEncoder = new TextEncoder();

const getJwtSecret = () => {
  return getServerEnvValue("JWT_SECRET") || "dev-only-change-me";
};

const base64UrlEncode = (input) => {
  const bytes = input instanceof Uint8Array ? input : textEncoder.encode(input);

  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64url");
  }

  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};

const base64UrlDecode = (input) => {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(input, "base64url"));
  }

  const base64 = input.replaceAll("-", "+").replaceAll("_", "/");
  const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(paddedBase64);

  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const getJwtCryptoKey = () => {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto is not available for JWT signing.");
  }

  return globalThis.crypto.subtle.importKey(
    "raw",
    textEncoder.encode(getJwtSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
};

const parseJsonSegment = (segment) => {
  return JSON.parse(new TextDecoder().decode(base64UrlDecode(segment)));
};

export const hashPassword = (password) => {
  return bcrypt.hash(password, 12);
};

export const verifyPassword = (password, passwordHash) => {
  return bcrypt.compare(password, passwordHash);
};

export const createToken = async (user) => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const encodedHeader = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const encodedPayload = base64UrlEncode(
    JSON.stringify({
      sub: user.id,
      username: user.username,
      iat: issuedAt,
      exp: issuedAt + JWT_EXPIRES_IN_SECONDS,
    }),
  );
  const tokenBody = `${encodedHeader}.${encodedPayload}`;
  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    await getJwtCryptoKey(),
    textEncoder.encode(tokenBody),
  );

  return `${tokenBody}.${base64UrlEncode(new Uint8Array(signature))}`;
};

export const getUserFromAuthorization = async (authorization) => {
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      return null;
    }

    const header = parseJsonSegment(encodedHeader);

    if (header.alg !== "HS256") {
      return null;
    }

    const tokenBody = `${encodedHeader}.${encodedPayload}`;
    const isValidSignature = await globalThis.crypto.subtle.verify(
      "HMAC",
      await getJwtCryptoKey(),
      base64UrlDecode(encodedSignature),
      textEncoder.encode(tokenBody),
    );

    if (!isValidSignature) {
      return null;
    }

    const payload = parseJsonSegment(encodedPayload);
    const now = Math.floor(Date.now() / 1000);

    if (typeof payload.exp === "number" && payload.exp < now) {
      return null;
    }

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
