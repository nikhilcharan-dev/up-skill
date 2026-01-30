
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';

dotenv.config();

const email = 'trainee@owlcoder.com';
const password = 'trainee123';

const verifyUser = async () => {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log('Connected to MongoDB');

        const userByEmail = await User.findOne({ workEmail: 'trainee@owlcoder.com' });
        console.log('User found by email:', userByEmail ? 'Yes' : 'No');

        if (!userByEmail) {
            console.log(`User with email ${email} NOT FOUND.`);
        } else {

            const isMatch = await bcrypt.compare(password, user.password);
            console.log(`Password match for '${password}': ${isMatch}`);

            if (!isMatch) {
                // Generate a new hash to see what it should be
                const salt = await bcrypt.genSalt(10);
                const newHash = await bcrypt.hash(password, salt);
                console.log(`Expected Hash for '${password}': ${newHash}`);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

verifyUser();
