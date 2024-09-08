const express = require("express");
const { Location, Employee, AttendanceDetails, EmployeeResgister  } = require("../database");
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require("../config")
let isInside;
router.get("/", (req, res) => {
  return res.json({
    message: "Hello from application",
  });
});


router.post('/emp/signup', async (req, res) => {
  const { staffId, email, password } = req.body;
  console.log("enter signup", req.body)

  try {
    const isStaffExist = await Employee.findOne({staffId}) 
      if (!isStaffExist) {
          return res.status(400).json({ message: 'employee does not exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      console.log("hased password", hashedPassword)
      const newEmployee =  await EmployeeResgister.create({
          staffId,
          email,
          password: hashedPassword,
      });
      console.log(newEmployee)
      const token = jwt.sign({ userId: newEmployee._id }, JWT_SECRET);
      res.status(200).json({ message: 'Signin successful', token });
  } catch (error) {
      res.status(500).json({ message: 'Error registering user', error });
  }
});
router.post('/emp/signin', async (req, res) => {
  console.log("enternsignin", req.body)
  const { email, password } = req.body;
  try {
      const emp = await Employee.findOne({ staffId });
      console.log("employee", emp)
      if (!emp) {
          return res.status(400).json({ message: 'employee does not exit' });
      } 
      const isMatch = await bcrypt.compare(password, emp.password);
      console.log("before insmatch", isMatch)
      console.log("matchh", isMatch)
      if (!isMatch) {
          return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: emp._id }, JWT_SECRET);
      console.log("token", token)
      res.status(200).json({ message: 'Signin successful', token });
  } catch (error) {
      res.status(500).json({ message: 'Error signing in', error });
  }
});

router.post("/profileDetails", async (req, res)=>{
  const { staffId } = req.body 
  console.log(staffId)
  const staffData = await Employee.findOne({
    staffId
  });
  return res.json({
    name : staffData.fullName,
    staffId : staffData.staffId,
    officeId : staffData.OfficeId,
    email : staffData.email,
    Designation : staffData.designation

  })

})
router.post( "/mark-attendance",  async (req, res) => {
  const { latitude, longitude, timestamp } = req.body;
  const isWithinRadius = geolocationCheckMiddleware(req.body)

  console.log("Processing attendance...");

  try {
    let location;
    if (isWithinRadius) {
      location = await Location.create({
        latitude,
        longitude,
        timestamp,
        isInside: true,
      });
      console.log("location after mongoose", location);
      res.json({
        success: true,
        message:
          "User is inside the geofence. Attendance marked successfully!",
        location,
        key: 1,
      });
    } else {
      location = await Location.create({
        latitude,
        longitude,
        timestamp,
        isInside: false,
      });
      console.log("location after mongoose", location);
      res.json({
        success: true,
        message: "User is outside the geofence. Attendance recorded!",
        location,
        key: 0,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error processing attendance." });
  }
}
);
const geolocationCheckMiddleware = async (details) => {
  const userLocation = details;
  console.log("Received user location:", userLocation); 
  const officeLocation = { latitude: 13.009535, longitude: 80.0050148 };

  const distance =  getDistanceFromLatLonInMeters(
    userLocation.latitude,
    userLocation.longitude,
    officeLocation.latitude,
    officeLocation.longitude
  );

  if (distance <= 5) {
    return  true;
  } else {
    return  false;
  }
};



function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; 
  return distance;
}





const geoFenceCheck = async (req, res, next) => {
  console.log("inside middleware", req.body)
  const isInsideGeofence = await geolocationCheckMiddleware(req.body); 
  console.log("afterrrr checcccckkkkkk",isInsideGeofence)
  req.isInsideGeofence = isInsideGeofence;
  next();
};

const getCurrentDate = () => new Date().toISOString().split('T')[0];

const getCurrentTime = () => new Date().toLocaleTimeString();

router.post('/geoFenceCheck', geoFenceCheck, async (req, res) => {
  console.log(req.body);
  const { staffId, latitude, longitude } = req.body;
  const date = getCurrentDate();
  const time = getCurrentTime();

  try {
    let attendance = await AttendanceDetails.findOne({ staffId, date });

    if (req.isInsideGeofence) {
      if (!attendance) {
        attendance = new AttendanceDetails({
          staffId,
          date,
          sessions: [{ checkInTime: time, checkOutTime: null }],
        });
        await attendance.save();
        res.status(200).json({ message: 'Check-in successful', attendance });
      } else {
        const lastSession = attendance.sessions[attendance.sessions.length - 1];
        if (lastSession && !lastSession.checkOutTime) {
          res.status(200).json({ message: 'Already checked in, waiting for checkout', attendance });
        } else {
          attendance.sessions.push({ checkInTime: time, checkOutTime: null });
          await attendance.save();
          res.status(200).json({ message: 'Check-in successful', attendance });
        }
      }
    } else {
      if (attendance) {
        const lastSession = attendance.sessions[attendance.sessions.length - 1];
        if (lastSession && !lastSession.checkOutTime) {
          lastSession.checkOutTime = time;
          await attendance.save();
          res.status(200).json({ message: 'Check-out successful', attendance });
        } else {
          res.status(400).json({ message: 'No active session to check out from' });
        }
      } else {
        res.status(400).json({ message: 'Check-in first' });
      }
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ message: 'Error processing request', error });
  }
});
router.post('/attendanceRecord', async (req, res) => {
  console.log(req.body)
  try {
      const date = new Date().toISOString().split("T")[0]
      const { staffId} = req.body;

      const attendance = await AttendanceDetails.findOne({ staffId, date });

      if (!attendance) {
          return res.status(404).json({ message: 'Attendance record not found' });
      }

      const { sessions } = attendance;

      if (sessions.length === 0) {
          return res.status(404).json({ message: 'No sessions found for the given date' });
      }

      function getLastCheckout(sessions) {
        if (!sessions || sessions.length === 0) {
          console.log("session is null")
          return null; 
        }
        for (let i = sessions.length - 1; i >= 0; i--) {
          if (sessions[i].checkOutTime !== null) {
            return sessions[i].checkOutTime;
          }
        }
        return null;
      }
      const firstCheckIn = sessions[0].checkInTime;
      const lastCheckOut = getLastCheckout(sessions)

      res.json({
          staffId: attendance.staffId,
          date: attendance.date,
          firstCheckIn,
          lastCheckOut,
      });
  } catch (error) {
      console.error('Error fetching attendance details:', error);
      res.status(500).json({ message: 'Server error' });
  }
});
// app.post('/checkin', async (req, res) => {
//   const { employeeId } = req.body;
//   const date = new Date().toISOString().split('T')[0]; // Get the current date
//   const checkInTime = new Date().toLocaleTimeString(); // Get the current time

//   try {
//       // Check if there's already an entry for today
//       let attendance = await AttendanceDetails.findOne({ employeeId, date });

//       if (!attendance) {
//           // Create a new record if no entry exists for today
//           attendance = new AttendanceDetails({
//               employeeId,
//               date,
//               checkInTime,
//               checkOutTime: null,
//           });
//           await attendance.save();
//       } else {
//           return res.status(400).json({ message: 'Already checked in today' });
//       }

//       res.status(200).json({ message: 'Check-in successful', attendance });
//   } catch (error) {
//       res.status(500).json({ message: 'Error checking in', error });
//   }
// });

router.post("/allPairofEmployee", async (req, res)=>{
    const { staffId } =  req.body;
    const staffAttendanceDetails = await AttendanceDetails.findOne({staffId});
    return res.json(staffAttendanceDetails.sessions)
})
module.exports = router;