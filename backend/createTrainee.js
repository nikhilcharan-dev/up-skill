import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const DB_URI = process.env.DB_URI || 'mongodb://localhost:27017/fullstack';

const createTrainee = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log('Connected to MongoDB');

        const traineeEmail = 'trainee@owlcoder.com';
        const password = 'password123';

        // Check if exists
        const existingUser = await User.findOne({ workEmail: email });
        if (existingUser) {
            console.log('User already exists');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newTrainee = new User({
            name: 'Test Trainee',
            workEmail: email,
            password: hashedPassword,
            role: 'trainee'
        });

        await newTrainee.save();
        console.log('Trainee created successfully');
        process.exit(0);
    } catch (err) {
        await mongoose.disconnect();
    }
};

createTrainee();
