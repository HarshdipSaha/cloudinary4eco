type RuntimeEnvironment = "development" | "test" | "production";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function isPrivateHostname(hostname: string) {
  if (LOCAL_HOSTS.has(hostname)) return true;
  if (/^10\./.test(hostname) || /^192\.168\./.test(hostname)) return true;
  const match = hostname.match(/^172\.(\d{1,3})\./);
  return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
}

export function resolvePublicOrigin({
  appOrigin,
  environment,
}: {
  appOrigin?: string;
  environment: RuntimeEnvironment;
}) {
  const value = appOrigin?.trim() || (environment === "development" ? "http://localhost:3000" : "");
  if (!value) {
    throw new Error("A public APP_ORIGIN is required in production and must be an HTTPS public origin.");
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("APP_ORIGIN must be a valid HTTP(S) origin.");
  }

  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error("APP_ORIGIN must be a valid HTTP(S) origin.");
  }
  if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("APP_ORIGIN must contain only an origin, without a path, query, or fragment.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (environment === "production" && (parsed.protocol !== "https:" || isPrivateHostname(hostname))) {
    throw new Error("Production requires an HTTPS public APP_ORIGIN; localhost and private hosts are not allowed.");
  }

  return parsed.origin.replace(/\/$/, "");
}

export function publicOrigin() {
  const environment: RuntimeEnvironment = process.env.NODE_ENV === "production" ? "production" : "development";
  return resolvePublicOrigin({ appOrigin: process.env.APP_ORIGIN, environment });
}
