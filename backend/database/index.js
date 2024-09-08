const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/getAtDatabase", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Schemas
const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minLength: 10,
    maxLength: 30,
  },
  password: {
    type: String,
    required: true,
    minLength: 8,
  },
});

const locationSchema = new mongoose.Schema({
  latitude: { 
    type: Number, 
    required: true 
  },
  longitude: { 
    type: Number,
    required: true 
  },
  timestamp: {
    type: Date, 
    required: true
  },
  isInside: {
    type: Boolean
  }
});

const employeeSchema = new mongoose.Schema({
  staffId: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'], 
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  officeId: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  }
}, { timestamps: true }); 

const officeSchema = new mongoose.Schema({
  officeName: {
    type: String,
    required: true,
  },
  officeLat: {
    type: String,
    required: true,
  },
  officeLong: {
    type: String,
    required: true,
  },
  radius :{
    type : String,
    required : true 
  }
});

const attendanceSchema = new mongoose.Schema({
  staffId: String,
  date: String,
  sessions: [
    {
      checkInTime: String,
      checkOutTime: String,
    }
  ],
});
const EmployeeRegisterSchema = new mongoose.Schema({
  staffId: {
      type: String,
      required: true,
      unique: true,
  },
  email: {
      type: String,
      required: true,
      unique: true,
  },
  password: {
      type: String,
      required: true,
  }
});
const ManualAttendanceSchema = new mongoose.Schema({
  staffId: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String,  required: true },
});
// const OffsiteAttendanceSchema = new mongoose.Schema({
//   staffId: { type: Number, required: true },
//   time: { type: Date, required: true },
//   location: { type: String, required: true },
//   type: { type: String, enum: ["checkin", "checkout"], required: true },
// });

// Create the model
// const OffsiteAttendance = mongoose.model("Attendance", OffsiteAttendanceSchema);
// Create the model
const ManualAttendance = mongoose.model("Attendance", ManualAttendanceSchema);
const EmployeeResgister = mongoose.model("EmployeeResgister", EmployeeRegisterSchema)
const AttendanceDetails = mongoose.model('AttendanceDetails', attendanceSchema);
const Office = mongoose.model("Office", officeSchema);
const Location = mongoose.model("Location", locationSchema);
const Employee = mongoose.model("Employee", employeeSchema); 
const Admin = mongoose.model("Admin", adminSchema);
const RemoteOffice = mongoose.model("RemoteOffice", officeSchema)
module.exports = {
  Admin,
  Location,
  Office,
  Employee,
  AttendanceDetails,
  EmployeeResgister,
  ManualAttendance,
  RemoteOffice
};
