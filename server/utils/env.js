export const getServerEnvValue = (key) => {
  const cloudflareValue = globalThis.__env__?.[key];

  if (cloudflareValue !== undefined) {
    return cloudflareValue;
  }

  if (typeof process !== "undefined") {
    return process.env?.[key];
  }

  return undefined;
};

export const hasServerEnvValue = (key) => {
  return Boolean(getServerEnvValue(key));
};
