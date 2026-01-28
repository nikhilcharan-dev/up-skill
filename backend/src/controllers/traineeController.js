import User from '../models/User.js';
import TopicNote from '../models/TopicNote.js';

// ... existing code ...

// Save or Update a Topic Note
export const saveTopicNote = async (req, res) => {
    try {
        const { courseId, topicId, note } = req.body;
        const traineeId = req.user.id;

        // Upsert the note
        const topicNote = await TopicNote.findOneAndUpdate(
            { user: traineeId, course: courseId, topicId: topicId },
            { note },
            { new: true, upsert: true }
        );

        res.json(topicNote);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Get a Topic Note
export const getTopicNote = async (req, res) => {
    try {
        const { courseId, topicId } = req.params;
        const traineeId = req.user.id;

        const topicNote = await TopicNote.findOne({
            user: traineeId,
            course: courseId,
            topicId: topicId
        });

        res.json(topicNote || { note: '' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};
import TraineeProgress from '../models/TraineeProgress.js';
import Batch from '../models/Batch.js';
import Schedule from '../models/Schedule.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for resume uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), 'uploads', 'resumes');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${req.user.id}-${Date.now()}${ext}`);
    },
});
export const upload = multer({ storage });

// Setup or update trainee profile (basic info)
export const setupProfile = async (req, res) => {
    try {
        const { name, collegeEmail, workEmail, codingHandles } = req.body;
        const trainee = await User.findByIdAndUpdate(
            req.user.id,
            { name, collegeEmail, workEmail, codingHandles },
            { new: true }
        );
        res.json(trainee);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Upload resume file
export const uploadResume = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
        const resumePath = `/uploads/resumes/${req.file.filename}`;
        await User.findByIdAndUpdate(req.user.id, { resume: resumePath });
        res.json({ msg: 'Resume uploaded', resume: resumePath });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Get trainee dashboard data (progress, batches)
export const getDashboard = async (req, res) => {
    try {
        const traineeId = req.user.id;
        const progress = await TraineeProgress.find({ trainee: traineeId }).populate('batch');
        const batches = await Batch.find({ trainees: traineeId }).populate('course');

        // Filter out locked modules for trainees
        const sanitizedBatches = batches.map(batch => {
            const batchObj = batch.toObject();
            if (batchObj.course && batchObj.course.modules) {
                batchObj.course.modules = batchObj.course.modules.filter(module => !module.isLocked);
            }
            return batchObj;
        });

        res.json({ progress, batches: sanitizedBatches });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Get schedule for a specific batch (must be assigned)
export const getBatchSchedule = async (req, res) => {
    try {
        const traineeId = req.user.id;
        const batchId = req.params.batchId;

        const batch = await Batch.findOne({ _id: batchId, trainees: traineeId });
        if (!batch) return res.status(403).json({ msg: 'Access denied to this batch' });

        const schedule = await Schedule.find({ batch: batchId }).sort('dayNumber');
        res.json(schedule);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};
