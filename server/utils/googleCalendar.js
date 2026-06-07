const { google } = require("googleapis");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const auth = new google.auth.GoogleAuth({
  keyFile: path.resolve(__dirname, "../service-account.json"),
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

const calendar = google.calendar({ version: "v3", auth });

async function createCalendarEvent(appointment) {
  const { name, email, phone, date, time, service, message } = appointment;

  // --- FIX 1: Normalize date — strip any time portion if present ---
  // Handles both "2026-06-08" and "2026-06-08T18:30:00.000Z" formats.
  // Always extract just the YYYY-MM-DD part as raw string (NO Date object — that would re-introduce timezone shift)
  const dateOnly = String(date).split("T")[0];

  // --- FIX 2: Robust time parsing (handles "2:30 PM", "14:30", "2:30PM") ---
  const timeStr = String(time).trim();
  const hasAmPm = /AM|PM/i.test(timeStr);
  const modifier = hasAmPm ? timeStr.slice(-2).toUpperCase() : null;
  const timePart = hasAmPm ? timeStr.slice(0, -2).trim() : timeStr;

  let [hours, minutes] = timePart.split(":").map(Number);
  if (isNaN(minutes)) minutes = 0;
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  // --- FIX 3: Calculate end time safely (handles midnight wrap-around) ---
  // Build a proper Date in IST, add 1 hour, then extract pieces.
  const startDateObj = new Date(`${dateOnly}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+05:30`);
  const endDateObj = new Date(startDateObj.getTime() + 60 * 60 * 1000); // +1 hour

  // Format end time back in IST (not UTC)
  const endInIST = new Date(endDateObj.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const endDate = endInIST.toISOString().split("T")[0];
  const endHours = String(endInIST.getHours()).padStart(2, "0");
  const endMinutes = String(endInIST.getMinutes()).padStart(2, "0");

  const startStr = `${dateOnly}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  const endStr = `${endDate}T${endHours}:${endMinutes}:00`;

  console.log("Received → date:", date, "time:", time);
  console.log("Parsed → dateOnly:", dateOnly, "hours:", hours, "minutes:", minutes);
  console.log("Creating event → start:", startStr, "end:", endStr);

  const event = {
    summary: "Appointment: " + name,
    description: "Service: " + service + "\nPhone: " + phone + "\nEmail: " + email + "\nMessage: " + (message || "None"),
    start: { dateTime: startStr, timeZone: "Asia/Kolkata" },
    end: { dateTime: endStr, timeZone: "Asia/Kolkata" },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 30 },
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    resource: event,
  });

  console.log("Calendar event created: " + response.data.htmlLink);
  return response.data;
}

module.exports = { createCalendarEvent };