const fifteenMinutes = 15 * 60 * 1000;
const sevenDays = 7 * 24 * 60 * 60 * 1000;

export const authCookieName = "access_token";
export const refreshCookieName = "refresh_token";

export const getAuthCookieOptions = () => {
  const sameSite = process.env.COOKIE_SAMESITE || "lax";

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || sameSite === "none",
    sameSite,
    maxAge: fifteenMinutes,
  };
};

export const getRefreshTokenCookieOptions = () => {
  const sameSite = process.env.COOKIE_SAMESITE || "lax";

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || sameSite === "none",
    sameSite,
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
