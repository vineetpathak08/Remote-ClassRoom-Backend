

import mongoose from 'mongoose';
import User from '../models/User.model.js';
import dotenv from 'dotenv';

dotenv.config();

const createDemoUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Create instructor
    const instructor = await User.create({
      name: 'Dr. Sharma',
      email: 'instructor@test.com',
      password: 'password123',
      role: 'instructor',
      subject: 'Artificial Intelligence'
    });
    
    // Create student
    const student = await User.create({
      name: 'Rahul Kumar',
      email: 'student@test.com',
      password: 'password123',
      role: 'student'
    });
    
    console.log('Demo users created:');
    console.log('Instructor:', instructor.email);
    console.log('Student:', student.email);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createDemoUsers();