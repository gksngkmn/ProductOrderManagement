function createRateLimiter({ windowMs, max, message }) {
  const attempts = new Map();
  let requestCount = 0;

  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    requestCount += 1;

    if (requestCount % 100 === 0) {
      for (const [storedKey, entry] of attempts) {
        if (entry.resetAt <= now) attempts.delete(storedKey);
      }
    }
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const current = attempts.get(key);

    if (!current || current.resetAt <= now) {
      attempts.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;

    if (current.count > max) {
      res.set("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
      return res.status(429).json({ message });
    }

    return next();
  };
}

const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please try again later."
});

const verificationRequestRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many verification requests. Please try again later."
});

const verificationAttemptRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: "Too many verification attempts. Please try again later."
});

module.exports = {
  loginRateLimiter,
  verificationRequestRateLimiter,
  verificationAttemptRateLimiter
};
