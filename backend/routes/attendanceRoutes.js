const express = require("express");
const router = express.Router();
// const Attendance = require("../models/attendanceModel");
const { ManualAttendance } = require("../database");
// Check-In Endpoint
router.post("/checkin", async (req, res) => {
  const { staffId, time, location } = req.body;

  if (!staffId || isNaN(Number(staffId))) {
    return res.status(400).json({ message: "Invalid or missing staffId" });
  }

  try {
    const checkIn = new ManualAttendance({
      staffId: parseInt(staffId, 10), // Ensure staffId is a number
      time: new Date(time),
      location,
      type: "checkin",
    });

    await checkIn.save();
    res.status(201).json({ message: "Check-in recorded successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to record check-in", error });
  }
});

// Check-Out Endpoint
router.post("/checkout", async (req, res) => {
  const { staffId, time, location } = req.body;

  if (!staffId || isNaN(Number(staffId))) {
    return res.status(400).json({ message: "Invalid or missing staffId" });
  }

  try {
    const checkOut = new ManualAttendance({
      staffId: parseInt(staffId, 10), // Ensure staffId is a number
      time: new Date(time),
      location,
      type: "checkout",
    });

    await checkOut.save();
    res.status(201).json({ message: "Check-out recorded successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to record check-out", error });
  }
});

module.exports = router;
