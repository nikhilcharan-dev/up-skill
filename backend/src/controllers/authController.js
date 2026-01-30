import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ workEmail: email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ msg: 'Invalid credentials' });
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, role: user.role, name: user.name });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

export const registerAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ msg: 'Name, email, and password are required' });
        }
        const existingUser = await User.findOne({ workEmail: email });
        if (existingUser) {
            return res.status(400).json({ msg: 'Email already registered' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);
        const admin = new User({ name, workEmail: email, password: hashed, role: 'admin' });
        await admin.save();
        res.status(201).json({ msg: 'Admin created' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};
