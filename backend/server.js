const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://task-manager-i8j3.vercel.app",
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// Database connection middleware
const ensureDB = async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  const connected = await connectDB();
  if (!connected) {
    return res.status(503).json({
      success: false,
      message: "Database is unavailable",
    });
  }

  return next();
};

// Root route
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Team Task Manager API is running" });
});

// Routes
app.use("/api/auth", ensureDB, require("./routes/auth"));
app.use("/api/projects", ensureDB, require("./routes/projects"));
app.use("/api/tasks", ensureDB, require("./routes/tasks"));

// Health check
app.get("/api/health", (req, res) =>
  res.json({ status: "OK", timestamp: new Date() }),
);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Local development server
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5003;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

// Export for Vercel serverless function
module.exports = app;