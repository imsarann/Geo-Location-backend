const express = require("express");
const cors = require("cors"); // Import the cors package
const app = express();
const PORT = 4000;



app.use(express.json());
app.use(cors());

const webRouter = require("./routes/webRoute");
const appRouter = require("./routes/appRoute");
const attendanceRoute = require("./routes/attendanceRoutes")
app.use('/api/web', webRouter);
app.use('/api/app', appRouter);
app.use('/api/mani', attendanceRoute)

app.listen(PORT,'0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
