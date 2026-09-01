import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('No MONGODB_URI');
  console.log('Connecting to', uri);
  await mongoose.connect(uri);
  
  const User = mongoose.connection.collection('users');
  const StudentProfile = mongoose.connection.collection('studentprofiles');
  const FacultyProfile = mongoose.connection.collection('facultyprofiles');
  
  console.log('Users:', await User.countDocuments());
  console.log('Students:', await StudentProfile.countDocuments());
  console.log('Faculty:', await FacultyProfile.countDocuments());
  process.exit(0);
}
main().catch(console.error);
