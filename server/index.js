const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");
const { createCalendarEvent, deleteCalendarEvent } = require("./utils/googleCalendar");
const { apiLimiter } = require("./middleware/rateLimit");
const { validate, schemas } = require("./middleware/validate");
const { requireAuth, requireAdmin } = require("./middleware/auth");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust the first proxy hop so req.ip reflects the real client IP behind a
// reverse proxy / host platform (Render, Railway, Nginx, etc.). Required for
// the IP-based rate limiters below to key on the correct address.
app.set("trust proxy", 1);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

app.use(cors());
app.use(express.json());

// Rate limiting — every /api route is capped at 60 req/min/IP (returns 429 +
// Retry-After when exceeded). When auth / AI / upload routes are added, import
// the matching limiter from ./middleware/rateLimit and attach it on that route:
//   const { authLimiter } = require("./middleware/rateLimit");
//   app.post("/api/auth/login", authLimiter, handler);   // 5 / 15 min / IP
//   app.post("/api/ai/chat",    aiLimiter,   handler);   // 10 / min / user
//   app.post("/api/upload",     uploadLimiter, handler); // 5 / min / IP
app.use("/api", apiLimiter);

app.get("/", (req, res) => {
  res.json({ message: "Saikripa Textiles Backend is running!" });
});

// Public, by design: this is the customer booking endpoint (no login required).
// It is hardened by rate limiting + input validation. The DELETE routes below,
// which act on existing resources, require an authenticated admin.
app.post("/api/appointments", validate({ body: schemas.appointmentSchema }), async (req, res) => {
  try {
    const { name, phone, email, city, state, appointment_type, preferred_date, preferred_time } = req.body;

    const { data: appointment, error: dbError } = await supabase
      .from("appointments")
      .insert([{ name, phone, email, city, state, appointment_type, preferred_date, preferred_time }])
      .select()
      .single();

    if (dbError) throw new Error("Supabase error: " + dbError.message);
    console.log("Appointment saved to Supabase");

    const calendarEvent = await createCalendarEvent({
      name: name,
      email: email,
      phone: phone,
      date: preferred_date,
      time: preferred_time,
      service: appointment_type,
      message: "City: " + city + ", State: " + state,
    });

    console.log("Calendar event created with ID:", calendarEvent.id);
    console.log("Trying to update appointment ID:", appointment.id);

    const updateResult = await supabase
      .from("appointments")
      .update({ google_event_id: calendarEvent.id })
      .eq("id", appointment.id)
      .select();

    if (updateResult.error) {
      console.error("UPDATE FAILED:", updateResult.error);
    } else {
      console.log("UPDATE succeeded. Rows affected:", updateResult.data?.length);
      console.log("Updated row:", JSON.stringify(updateResult.data, null, 2));
    }

    res.status(201).json({
      message: "Appointment booked successfully!",
      appointment: { ...appointment, google_event_id: calendarEvent.id },
      calendarLink: calendarEvent.htmlLink,
    });

  } catch (err) {
    console.error("Booking error: " + err.message);
    res.status(500).json({ error: "Failed to book appointment" });
  }
});
app.delete("/api/appointments/:id", requireAuth, requireAdmin, validate({ params: schemas.idParamSchema }), async (req, res) => {
  try {
    const { id } = req.params;

    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("google_event_id")
      .eq("id", id)
      .single();

    if (fetchError) throw new Error("Could not find appointment: " + fetchError.message);

    if (appointment.google_event_id) {
      const { google } = require("googleapis");
      const path = require("path");
      const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, "service-account.json"),
        scopes: ["https://www.googleapis.com/auth/calendar"],
      });
      const calendar = google.calendar({ version: "v3", auth });
      await calendar.events.delete({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        eventId: appointment.google_event_id,
      });
      console.log("Calendar event deleted");
    }

    const { error: deleteError } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);

    if (deleteError) throw new Error("Could not delete appointment: " + deleteError.message);

    res.json({ message: "Appointment deleted successfully!" });

  } catch (err) {
    console.error("Delete error: " + err.message);
    res.status(500).json({ error: "Failed to delete appointment" });
  }
});
app.delete("/api/calendar/:eventId", requireAuth, requireAdmin, validate({ params: schemas.eventIdParamSchema }), async (req, res) => {
  try {
    const result = await deleteCalendarEvent(req.params.eventId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.listen(PORT, function () {
  console.log("Server running on http://localhost:" + PORT);
});