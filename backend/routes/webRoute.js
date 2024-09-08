const express = require("express");
const router = express.Router();
const z = require("zod");
const { Admin, Office, Employee, AttendanceDetails, ManualAttendance, RemoteOffice } = require("../database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

router.get("/", (req, res) => {
  return res.json({
    message: "Hello from website",
  });
});

const adminBodyParse = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(32),
});

router.post("/signup", async (req, res) => {
  const reqBody = adminBodyParse.safeParse(req.body);
  if (!reqBody.success) {
    return res.status(411).json({
      message: "please enter a valid details",
    });
  }
  const adminExist = await Admin.findOne({
    email: req.body.email,
  });
  if (adminExist) {
    return res.json({
      message: "Admin already exist",
    });
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);
  console.log(hashedPassword);
  const admin = await Admin.create({
    email: req.body.email,
    password: hashedPassword,
  });

  const adminId = admin._id;
  try {
    const token = jwt.sign({ adminId }, JWT_SECRET);
    res.cookie("authCookie", token, {
      httpOnly: true,
      secure: true,
      maxAge: 3600000,
      sameSite: "Strict",
    });
    return res
      .status(200)
      .json({
        message: "user created successfully",
        token: token,
        userId: req.body.email,
      })
      
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "error  in generating token",
    });
  }
});

const adminSigninBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/signin", async (req, res) => {
  console.log("ENtered backeddn",req.body)
  const reqBody = adminSigninBody.safeParse(req.body);
  if (!reqBody.success) {
    return res.json({
      message: "enter a valid credentials",
    });
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);
  const admin = await Admin.findOne({
    email: req.body.email,
  });
  console.log("admin long in", admin);
  if (!admin) {
    return res.json({
      message: "user does not exist",
    });
  }
  const passCheck = await bcrypt.compare(req.body.password, admin.password);
  console.log("passcheckkkkkkkk",passCheck)
  if (passCheck) {
    try {
      const adminId = req.body.email;
      const token = jwt.sign(
        {
          adminId,
        },
        JWT_SECRET
      );
      console.log("tokennnn",token)
      res.cookie("authCookie", token, {
        httpOnly: true,
        secure: true,
        maxAge: 3600000,
        sameSite: "Strict",
      });
      return res.json({
        message: "user is found",
        token: token,
        userId: adminId,
      })
    } catch (err) {
        console.log(err);
        res.status(500).json({
          error: "error  in generating token",
        });
      }
  }
});


router.post("/employeeDetails", async (req, res) => {
  console.log("Entered employee details endpoint");
  console.log("Request body:", req.body);

  try {
    const { staffId, fullName, email, gender, phone, officeId, designation } = req.body;
    console.log("Destructured data:", { staffId, fullName, email, gender, phone, officeId, designation });

    const newEmployee = await Employee.create({
      staffId,
      fullName,
      email,
      gender,
      phone,
      officeId,
      designation,
    });

    res.status(201).json({
      message: "Employee created successfully",
      employee: newEmployee
    });
  } catch (error) {
    console.error("Error creating employee:", error); // Log the error for debugging
    res.status(500).json({
      message: "Error creating employee",
      error: error.message // Include error message in the response
    });
  }
});


const officeSchema = z.object({
  officeName: z.string(),
  // officeAddress: z.string().min(1, "Office address is required"),
  officeLat: z.string(),
  officeLong: z.string(),
  radius : z.string()
});

router.post("/create-office", async (req, res) => {
  try {
    console.log("req.body", req.body)
    const officeData = officeSchema.parse(req.body);

    const newOffice = await Office.create(req.body);

    res.status(201).json({ message: "Office created successfully", office: newOffice });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ error: "Server error" });
  }
});
router.get('/fetchEmployee', async (req, res) => {
  try {
      const employees = await Employee.find({});
      console.log("emplyeess", employees)
    if (!employees) {
      return res.status(404).json(employees);
    }

    // Respond with the employee data
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/fetchLocation', async (req, res) => {
  try {
    const offices = await Office.find();
    res.json(offices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get('/FetchEmployeeAdmin', async (req, res) => {
  try {
    // Fetch all attendance records
    const attendances = await AttendanceDetails.find({});

    if (!attendances || attendances.length === 0) {
      return res.status(404).json({ message: 'No attendance records found' });
    }

    // Helper function to get the last checkout time from sessions
    function getLastCheckout(sessions) {
      if (!sessions || sessions.length === 0) {
        return null;
      }
      for (let i = sessions.length - 1; i >= 0; i--) {
        if (sessions[i].checkOutTime !== null) {
          return sessions[i].checkOutTime;
        }
      }
      return null;
    }

    // Initialize an array to store the results
    const results = [];

    // Fetch employee details and process each attendance record
    for (const attendance of attendances) {
      const { staffId, date, sessions } = attendance;

      const firstCheckIn = sessions.length > 0 ? sessions[0].checkInTime : null;
      const lastCheckOut = getLastCheckout(sessions);

      // Find the employee details using the staffId
      const employee = await Employee.findOne({ staffId });

      if (employee) {
        results.push({
          staffId,
          fullName: employee.fullName,
          designation: employee.designation,
          date,
          firstCheckIn,
          lastCheckOut,
        });
      } else {
        // If no employee is found for the staffId, handle accordingly
        results.push({
          staffId,
          fullName: 'Unknown',
          designation: 'Unknown',
          date,
          firstCheckIn,
          lastCheckOut,
        });
      }
    }

    res.json(results); // Return the results as an array
  } catch (error) {
    console.error('Error fetching attendance details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.post("/separateEmployee", async( req, res)=>{
    console.log("staff Id", req.body.staffId)
    const empDetails = await AttendanceDetails.findOne({ staffId: req.body.staffId })
    console.log(empDetails)
    res.json(empDetails)
})

router.get("/getOffice", async(req, res)=>{
   const offices  = await Office.find({})
   res.json(offices)
})
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

router.post("/remoteOffice", async (req, res)=>{
    console.log(req.body)
    const remote = await RemoteOffice.create(req.body)
    return res.json({
      message : "completed successfully"
    })
    console.log(remote)
})
module.exports = router;
