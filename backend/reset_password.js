
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';

dotenv.config();

const email = 'trainee@owlcoder.com';
const newPassword = 'trainee123';

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ workEmail: email });

        if (!user) {
            console.log(`User with email ${email} NOT FOUND.`);
        } else {
            console.log(`User found: ${user.name}. Resetting password...`);

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            user.password = hashedPassword;
            await user.save();

            console.log('Password reset successfully.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

resetPassword();
