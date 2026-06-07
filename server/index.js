const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");
const { createCalendarEvent, deleteCalendarEvent } = require("./utils/googleCalendar");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Saikripa Textiles Backend is running!" });
});

app.post("/api/appointments", async (req, res) => {
  try {
    const { name, phone, email, city, state, appointment_type, preferred_date, preferred_time } = req.body;

    if (!name || !phone || !preferred_date || !preferred_time || !appointment_type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

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

    res.status(201).json({
      message: "Appointment booked successfully!",
      appointment: appointment,
      calendarLink: calendarEvent.htmlLink,
    });

  } catch (err) {
    console.error("Booking error: " + err.message);
    res.status(500).json({ error: "Failed to book appointment" });
  }
});
app.delete("/api/appointments/:id", async (req, res) => {
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
app.delete("/api/calendar/:eventId", async (req, res) => {
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