const fifteenMinutes = 15 * 60 * 1000;
const sevenDays = 7 * 24 * 60 * 60 * 1000;

export const authCookieName = "access_token";
export const refreshCookieName = "refresh_token";

const getCookieSameSite = () => {
  const sameSite = (process.env.COOKIE_SAMESITE || (process.env.NODE_ENV === "production" ? "none" : "lax")).trim().toLowerCase();

  if (["lax", "strict", "none"].includes(sameSite)) {
    return sameSite;
  }

  return process.env.NODE_ENV === "production" ? "none" : "lax";
};

const getCookieDomain = () => {
  return process.env.COOKIE_DOMAIN?.trim() || undefined;
};

export const getAuthCookieOptions = () => {
  const sameSite = getCookieSameSite();

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || sameSite === "none",
    sameSite,
    domain: getCookieDomain(),
    maxAge: fifteenMinutes,
  };
};

export const getRefreshTokenCookieOptions = () => {
  const sameSite = getCookieSameSite();

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || sameSite === "none",
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
