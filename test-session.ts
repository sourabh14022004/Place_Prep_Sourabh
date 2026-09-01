import connectDB from './backend/src/config/db';
import { sessionRepository } from './backend/src/repositories/session.repository';

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
