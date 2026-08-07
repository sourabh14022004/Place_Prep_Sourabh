const mongoose = require("mongoose");
const path = require("path");
const dns = require("dns");

// Enforce IPv4 DNS resolution for MongoDB Atlas SRV connection strings in Node
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI;
    if (!connStr) {
      console.warn("⚠️ MONGODB_URI environment variable is not defined");
      return null;
    }

    console.log("Connecting to MongoDB Atlas...");
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host} / DB: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ MongoDB Atlas Connection Note: ${error.message}`);
    console.warn(`💡 Tip: If using MongoDB Atlas, make sure your current IP address (0.0.0.0/0) is added to IP Access List in Atlas Console.`);
    console.warn(`🚀 Backend will continue running in resilient fallback mode.`);
    return null;
  }
};

module.exports = connectDB;
