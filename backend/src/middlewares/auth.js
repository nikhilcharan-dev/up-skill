import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ msg: 'No token provided' });
    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload; // { id, role }
        next();
    } catch (err) {
        return res.status(401).json({ msg: 'Invalid token' });
    }
};

export const authorizeRoles = (...roles) => (req, res, next) => {
    console.log(`[AuthDebug] User Role: ${req.user?.role}, Required Roles: ${roles}`);
    if (!roles.includes(req.user.role)) {
        console.log('[AuthDebug] Access Denied');
        return res.status(403).json({ msg: 'Access denied' });
    }
    next();
};
