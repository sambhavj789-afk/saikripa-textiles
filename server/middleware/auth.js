// Authentication & authorization for the API.
//
// These routes run with the Supabase SERVICE key, which BYPASSES Row Level
// Security. That makes app-layer auth the ONLY gate here, so every route that
// reads/updates/deletes a resource must sit behind requireAuth (+ requireAdmin
// for admin actions). The browser talks to Supabase directly and is gated by
// RLS instead (see db/rls-policies.sql).
//
//   requireAuth   — verifies the caller's Supabase JWT (Authorization: Bearer
//                   <access_token>). 401 if missing/invalid. Attaches req.user.
//   requireAdmin  — 403 unless the authenticated user is an admin.
//
// This is a single-tenant admin app: there is no per-user resource ownership,
// so authorization is a role check (admin), not a per-row owner check. If a
// multi-user ownership model is introduced later (e.g. a user_id column on
// sales_records), add an ownerOf(table) middleware that loads the row and
// compares row.user_id === req.user.id, returning 403 on mismatch.

const { createClient } = require("@supabase/supabase-js");

// A client used only to verify user JWTs — never the service key for this.
const authClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY
);

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

async function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    console.warn(`[authz] 401 ${req.method} ${req.originalUrl} from ${req.ip} — no bearer token`);
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const { data, error } = await authClient.auth.getUser(token);
    if (error || !data || !data.user) {
      console.warn(`[authz] 401 ${req.method} ${req.originalUrl} from ${req.ip} — invalid/expired token`);
      return res.status(401).json({ error: "Invalid or expired session" });
    }
    req.user = data.user;
    next();
  } catch (err) {
    console.error(`[authz] token verification failed: ${err.message}`);
    return res.status(401).json({ error: "Authentication failed" });
  }
}

// Admin = role claim 'admin' (app_metadata/user_metadata) OR email in the
// ADMIN_EMAILS allowlist (comma-separated env var). If NEITHER mechanism is
// configured, any authenticated user is treated as admin (this is an admin-only
// portal) but a warning is logged — set ADMIN_EMAILS to enforce a hard gate.
function requireAdmin(req, res, next) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Authentication required" });

  const roleClaim =
    (user.app_metadata && user.app_metadata.role) ||
    (user.user_metadata && user.user_metadata.role);
  const allowlist = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const adminConfigured = Boolean(roleClaim) || allowlist.length > 0;
  const isAdmin =
    roleClaim === "admin" ||
    (user.email && allowlist.includes(user.email.toLowerCase()));

  if (!adminConfigured) {
    console.warn(
      `[authz] no admin mechanism configured — allowing authenticated user ${user.email}. ` +
        `Set ADMIN_EMAILS or app_metadata.role='admin' to enforce admin-only access.`
    );
    return next();
  }
  if (!isAdmin) {
    console.warn(`[authz] 403 ${req.method} ${req.originalUrl} — ${user.email} is not an admin`);
    return res.status(403).json({ error: "Forbidden: admin access required" });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
