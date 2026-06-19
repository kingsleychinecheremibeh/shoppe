const fifteenMinutes = 15 * 60 * 1000;
const sevenDays = 7 * 24 * 60 * 60 * 1000;

export const authCookieName = "access_token";
export const refreshCookieName = "refresh_token";

const configuredClientOrigins = () => [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  ...(process.env.CORS_ORIGINS || "").split(","),
];

const isLocalOrigin = (origin) => {
  if (!origin) return false;

  try {
    const { hostname } = new URL(origin.trim());
    return ["localhost", "127.0.0.1", "::1"].includes(hostname);
  } catch {
    return false;
  }
};

const usesLocalClient = () => configuredClientOrigins().some(isLocalOrigin);

const getCookieSameSite = () => {
  const defaultSameSite = process.env.NODE_ENV === "production" && !usesLocalClient() ? "none" : "lax";
  const sameSite = (process.env.COOKIE_SAMESITE || defaultSameSite).trim().toLowerCase();

  if (["lax", "strict", "none"].includes(sameSite)) {
    return sameSite;
  }

  return defaultSameSite;
};

const getCookieDomain = () => {
  return process.env.COOKIE_DOMAIN?.trim() || undefined;
};

export const shouldUseSecureCookies = () => {
  const explicitSecure = process.env.COOKIE_SECURE?.trim().toLowerCase();

  if (["true", "1", "yes"].includes(explicitSecure)) return true;
  if (["false", "0", "no"].includes(explicitSecure)) return false;

  return process.env.NODE_ENV === "production" && !usesLocalClient();
};

export const getAuthCookieOptions = () => {
  const sameSite = getCookieSameSite();

  return {
    httpOnly: true,
    secure: sameSite === "none" || shouldUseSecureCookies(),
    sameSite,
    domain: getCookieDomain(),
    maxAge: fifteenMinutes,
  };
};

export const getRefreshTokenCookieOptions = () => {
  const sameSite = getCookieSameSite();

  return {
    httpOnly: true,
    secure: sameSite === "none" || shouldUseSecureCookies(),
    sameSite,
    domain: getCookieDomain(),
    maxAge: sevenDays,
  };
};

export const getClearAuthCookieOptions = () => {
  const { maxAge, ...options } = getAuthCookieOptions();
  return options;
};

export const getClearRefreshTokenCookieOptions = () => {
  const { maxAge, ...options } = getRefreshTokenCookieOptions();
  return options;
};
