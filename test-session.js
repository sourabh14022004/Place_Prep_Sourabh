require('ts-node').register({ transpileOnly: true });
const mongoose = require('mongoose');
const { sessionRepository } = require('./backend/src/repositories/session.repository');
const connectDB = require('./backend/src/config/db').default;

async function run() {
  await connectDB();
  const sessions = await sessionRepository.findAll();
  console.log("Sessions:", sessions.length);
  if (sessions.length > 0) {
    console.log("First session ID:", sessions[0]._id.toString());
    console.log("Status:", sessions[0].status);
    console.log("Faculty ID:", sessions[0].facultyId.toString());
  }
  process.exit(0);
}
run();
