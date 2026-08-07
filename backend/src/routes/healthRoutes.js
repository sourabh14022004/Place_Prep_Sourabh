const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

router.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  
  res.json({
    status: "ok",
    service: "PlacePrep Express Backend",
    database: states[dbState] || "unknown",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
