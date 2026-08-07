const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("./config/db");
const healthRoutes = require("./routes/healthRoutes");
const statsRoutes = require("./routes/statsRoutes");
const companyRoutes = require("./routes/companyRoutes");
const questionRoutes = require("./routes/questionRoutes");
const experienceRoutes = require("./routes/experienceRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const facultyRoutes = require("./routes/facultyRoutes");

const app = express();
const DEFAULT_PORT = process.env.PORT || 5050;

// Enable CORS for frontend portals and Postman testing
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REST API Routes
app.use("/api", healthRoutes);
app.use("/api", statsRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/experiences", experienceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/faculty", facultyRoutes);

// Root route summary
app.get("/", (req, res) => {
  const host = req.get("host");
  res.json({
    status: "healthy",
    service: "PlacePrep Express API Server",
    database: "MongoDB Atlas",
    endpoints: {
      health: `http://${host}/api/health`,
      stats: `http://${host}/api/stats`,
      companies: `http://${host}/api/companies`,
      companyProfile: `http://${host}/api/companies/google`,
      questions: `http://${host}/api/questions`,
      questionById: `http://${host}/api/questions/:id`,
      experiences: `http://${host}/api/experiences`,
      authCredentials: `http://${host}/api/auth/credentials`,
      authLogin: `http://${host}/api/auth/login`,
    },
  });
});

// Helper to start listening with port fallback if AirPlay/ControlCenter blocks port 5000
const listenPort = (port) => {
  const server = app
    .listen(port, "127.0.0.1", () => {
      console.log(`🚀 Express API Server running on http://localhost:${port}`);
      console.log(`📡 Postman endpoints ready on http://localhost:${port}/api`);
    })
    .on("error", (err) => {
      if (err.code === "EADDRINUSE" && port === 5000) {
        console.warn(`⚠️ Port 5000 occupied by macOS AirPlay. Retrying on port 5050...`);
        listenPort(5050);
      } else if (err.code === "EADDRINUSE" && port === 5050) {
        console.warn(`⚠️ Port 5050 occupied. Retrying on port 5001...`);
        listenPort(5001);
      } else {
        console.error("Server error:", err);
      }
    });
};

// Start Server & Connect Database
const startServer = async () => {
  await connectDB();
  listenPort(DEFAULT_PORT);
};

startServer();
