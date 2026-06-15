// Server-side input validation with Zod.
//
// `validate({ body, params, query })` returns an Express middleware that checks
// each provided request part against its schema. On the first failing part it
// logs the attempt (method, path, client IP, and which fields failed — never
// the raw values, to avoid logging PII) and responds 400 Bad Request. On
// success it overwrites req[part] with the parsed/coerced (trimmed, lowercased)
// data so handlers only ever see clean input.
//
// All DB access in this project goes through the Supabase SDK
// (.from().insert()/.eq()/.delete()), which uses parameterized queries — no
// user input is ever interpolated into raw SQL.

const { z } = require("zod");

// Letters (any script), marks, spaces, and a few name-safe punctuation marks.
const NAME_CHARS = /^[\p{L}\p{M}.'\- ]+$/u;
const PLACE_CHARS = /^[\p{L}\p{M}.,'\- ]+$/u;
// Phone: leading + or digit, then digits/space/()-. between 7 and 20 chars total.
const PHONE_CHARS = /^[+\d][\d\s().-]{6,19}$/;
// Google Calendar event id charset (base32hex-ish): alphanumerics, _ and -.
const EVENT_ID_CHARS = /^[A-Za-z0-9_-]+$/;
// Time as H:MM / HH:MM, optionally with AM/PM.
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d\s*([AaPp][Mm])?$/;

// Optional free-text field that may legitimately arrive as "".
const optionalText = (max, charset) =>
  z
    .union([z.literal(""), z.string().trim().max(max).regex(charset, "invalid characters")])
    .optional();

const appointmentSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "name must be 2-100 characters")
      .max(100, "name must be 2-100 characters")
      .regex(NAME_CHARS, "name contains invalid characters"),
    phone: z
      .string()
      .trim()
      .regex(PHONE_CHARS, "phone must be 7-20 digits (may include + ( ) - and spaces)"),
    email: z
      .union([z.literal(""), z.string().trim().toLowerCase().email("invalid email").max(254)])
      .optional(),
    city: optionalText(100, PLACE_CHARS),
    state: optionalText(100, PLACE_CHARS),
    // Free-text for now. Tighten to an enum once the allowed set is fixed, e.g.:
    //   appointment_type: z.enum(["Showroom Visit", "Video Consultation", "Sample Request"]),
    appointment_type: z
      .string()
      .trim()
      .min(2, "appointment_type must be 2-60 characters")
      .max(60, "appointment_type must be 2-60 characters")
      .regex(/^[\p{L}\p{M}\d .,'\-/&]+$/u, "appointment_type contains invalid characters"),
    preferred_date: z
      .string()
      .trim()
      .max(30)
      .regex(/^\d{4}-\d{2}-\d{2}/, "preferred_date must be YYYY-MM-DD")
      .refine((v) => !Number.isNaN(Date.parse(v)), "preferred_date is not a valid date"),
    preferred_time: z
      .string()
      .trim()
      .max(10)
      .regex(TIME_RE, "preferred_time must be HH:MM (optionally with AM/PM)"),
  })
  .strict(); // reject unexpected fields

const idParamSchema = z.object({
  id: z.string().uuid("id must be a valid UUID"),
});

const eventIdParamSchema = z.object({
  eventId: z
    .string()
    .trim()
    .min(1, "eventId is required")
    .max(1024, "eventId is too long")
    .regex(EVENT_ID_CHARS, "eventId contains invalid characters"),
});

function validate(schemas) {
  return (req, res, next) => {
    for (const part of ["body", "params", "query"]) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part]);
      if (!result.success) {
        const issues = result.error.issues.map((i) => ({
          field: [part, ...i.path].join("."),
          message: i.message,
        }));
        console.warn(
          `[validation] 400 ${req.method} ${req.originalUrl} from ${req.ip} — ` +
            issues.map((i) => `${i.field}: ${i.message}`).join("; ")
        );
        return res.status(400).json({ error: "Invalid input", details: issues });
      }
      // Express 4 params/query are writable; assign the cleaned values back.
      req[part] = result.data;
    }
    next();
  };
}

module.exports = {
  validate,
  schemas: { appointmentSchema, idParamSchema, eventIdParamSchema },
};
