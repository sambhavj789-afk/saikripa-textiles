// Centralised rate limiters for the API.
//
// Every limiter returns HTTP 429 with a `Retry-After` header (seconds) when the
// limit is hit, plus standard `RateLimit-*` headers. Tune the numbers here only.
//
//   authLimiter    login / register / password reset  — 5  req / 15 min / IP
//   apiLimiter     general API routes                 — 60 req / 1 min  / IP
//   aiLimiter      AI / LLM proxy endpoints           — 10 req / 1 min  / user
//   uploadLimiter  file upload endpoints              — 5  req / 1 min  / IP

const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

// Shared 429 responder. express-rate-limit exposes `req.rateLimit.resetTime`
// (a Date); we turn it into a whole-second Retry-After value.
function rateLimitHandler(req, res) {
  const resetTime = req.rateLimit && req.rateLimit.resetTime;
  const retryAfter = resetTime
    ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
    : 60;
  res.set("Retry-After", String(retryAfter));
  res.status(429).json({
    error: "Too many requests",
    message: "Rate limit exceeded. Please slow down and retry later.",
    retryAfter,
  });
}

const base = {
  standardHeaders: true, // emit RateLimit-* headers (draft-7)
  legacyHeaders: false, // drop deprecated X-RateLimit-* headers
  handler: rateLimitHandler,
};

// Key AI/LLM limiters by authenticated user, falling back to IP.
// Populate `req.user` (e.g. from a verified Supabase JWT) in an upstream auth
// middleware for true per-user limiting; without it this degrades to per-IP.
function userKeyGenerator(req) {
  const userId = req.user && req.user.id ? req.user.id : req.headers["x-user-id"];
  return userId ? `user:${userId}` : ipKeyGenerator(req.ip);
}

// login, register, password reset — 5 requests / 15 minutes / IP
const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 5,
});

// general API routes — 60 requests / minute / IP
const apiLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 60,
});

// AI / LLM proxy endpoints — 10 requests / minute / user
const aiLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: userKeyGenerator,
});

// file upload endpoints — 5 requests / minute / IP
const uploadLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 5,
});

module.exports = { authLimiter, apiLimiter, aiLimiter, uploadLimiter };
