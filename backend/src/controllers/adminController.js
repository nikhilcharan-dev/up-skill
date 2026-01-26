import Course from '../models/Course.js';
import Batch from '../models/Batch.js';
import User from '../models/User.js';
import Schedule from '../models/Schedule.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { sendMail } from '../utils/sendMail.js';
import multer from 'multer';

// Create a new course
export const createCourse = async (req, res) => {
    try {
        const { title, description, startDate, endDate, excludedDays, customHolidays } = req.body;

        // Check for duplicate title (case-insensitive and escaped)
        const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existingCourse = await Course.findOne({ title: { $regex: new RegExp(`^${escapedTitle}$`, 'i') } });

        if (existingCourse) {
            console.log(`DUPLICATE DETECTED: ${title}`);
            return res.status(400).json({ msg: `A course with the title "${title}" already exists.` });
        }

        const course = new Course({
            title,
            description,
            startDate,
            endDate,
            excludedDays,
            customHolidays,
            createdBy: req.user.id,
            dailyAssignments: new Map()
        });
        await course.save();
        res.status(201).json(course);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Update a course
export const updateCourse = async (req, res) => {
    try {
        const { title, description, startDate, endDate, excludedDays, customHolidays } = req.body;

        // Check for duplicate title (excluding current course)
        const existingCourse = await Course.findOne({
            title: { $regex: new RegExp(`^${title}$`, 'i') },
            _id: { $ne: req.params.id }
        });
        if (existingCourse) {
            return res.status(400).json({ msg: `A course with the title "${title}" already exists.` });
        }

        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { title, description, startDate, endDate, excludedDays, customHolidays },
            { new: true }
        );
        if (!course) return res.status(404).json({ msg: 'Course not found' });
        res.json(course);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Delete a course
export const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) return res.status(404).json({ msg: 'Course not found' });
        res.json({ msg: 'Course deleted successfully' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Get course by ID
export const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ msg: 'Course not found' });
        res.json(course);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Update course assignments for a specific day
export const updateCourseAssignments = async (req, res) => {
    try {
        const { date, assignments } = req.body;
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ msg: 'Course not found' });

        if (!course.dailyAssignments) course.dailyAssignments = new Map();
        course.dailyAssignments.set(date, assignments);

        await course.save();
        res.json(course);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Get all courses
export const getCourses = async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Get all trainers
// Get all trainers
export const getAllTrainers = async (req, res) => {
    try {
        // If all=true, return full list for client-side filtering
        if (req.query.all === 'true') {
            const trainers = await User.find({ role: 'trainer' })
                .select('name workEmail createdAt _id')
                .sort({ createdAt: -1 });
            return res.json(trainers);
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        const query = { role: 'trainer' };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { workEmail: { $regex: search, $options: 'i' } }
            ];
        }

        const trainers = await User.find(query)
            .select('name workEmail createdAt _id')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(query);

        res.json({
            trainers,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalTrainers: total
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Get all batches
export const getBatches = async (req, res) => {
    try {
        const batches = await Batch.find().populate('course').populate('trainer');
        res.json(batches);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Update a batch
export const updateBatch = async (req, res) => {
    try {
        const { name, courseId, trainerId, startDate, endDate } = req.body;

        // Check for duplicate batch name (excluding current batch)
        const existingBatch = await Batch.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            _id: { $ne: req.params.id }
        });
        if (existingBatch) {
            return res.status(400).json({ msg: `A batch with the name "${name}" already exists.` });
        }

        const batch = await Batch.findByIdAndUpdate(
            req.params.id,
            {
                name,
                course: new mongoose.Types.ObjectId(courseId),
                trainer: new mongoose.Types.ObjectId(trainerId),
                startDate,
                endDate
            },
            { new: true }
        );
        if (!batch) return res.status(404).json({ msg: 'Batch not found' });
        res.json(batch);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Delete a batch
export const deleteBatch = async (req, res) => {
    try {
        const batch = await Batch.findByIdAndDelete(req.params.id);
        if (!batch) return res.status(404).json({ msg: 'Batch not found' });

        // Cleanup: remove batch reference from users' assignedBatches array
        await User.updateMany(
            { assignedBatches: req.params.id },
            { $pull: { assignedBatches: req.params.id } }
        );

        res.json({ msg: 'Batch deleted successfully' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Create a batch for a course
export const createBatch = async (req, res) => {
    try {
        const { name, courseId, trainerId, startDate, endDate } = req.body;

        // Check for duplicate batch name
        const existingBatch = await Batch.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existingBatch) {
            return res.status(400).json({ msg: `A batch with the name "${name}" already exists.` });
        }

        const batch = new Batch({
            name,
            course: new mongoose.Types.ObjectId(courseId),
            trainer: new mongoose.Types.ObjectId(trainerId),
            trainees: [],
            startDate,
            endDate,
        });
        await batch.save();
        res.status(201).json(batch);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Bulk add trainees via emails or Excel
export const bulkAddTrainees = async (req, res) => {
    try {
        let { emails, batchId } = req.body;
        const batch = await Batch.findById(batchId);
        if (!batch) return res.status(404).json({ msg: 'Batch not found' });

        // Handle File Upload (Excel)
        if (req.files && req.files.length > 0) {
            const file = req.files[0];
            const workbook = xlsx.read(file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet);

            // Assume the column header is "email" or "Email"
            emails = data.map(row => row.email || row.Email || row.workEmail || row.WorkEmail).filter(e => e);
        }

        if (!emails || emails.length === 0) {
            return res.status(400).json({ msg: 'No emails provided' });
        }

        const addedTrainees = [];
        const salt = await bcrypt.genSalt(10);
        const defaultPassword = await bcrypt.hash('trainee123', salt);

        for (const email of emails) {
            let user = await User.findOne({ workEmail: email });
            if (!user) {
                user = new User({
                    name: email.split('@')[0],
                    workEmail: email,
                    password: defaultPassword,
                    role: 'trainee',
                    assignedBatches: [batch._id]
                });
                await user.save();
            } else {
                // If user exists, ensure they are a trainee and add this batch if not already there
                if (user.role === 'trainee') {
                    if (!user.assignedBatches.includes(batch._id)) {
                        user.assignedBatches.push(batch._id);
                        await user.save();
                    }
                }
            }
            if (user && !batch.trainees.includes(user._id)) {
                batch.trainees.push(user._id);
            }
            if (user) addedTrainees.push(user);
        }

        await batch.save();
        res.json({ msg: `${addedTrainees.length} trainees added/updated`, trainees: addedTrainees });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Get all trainees (with optional pagination and search)
export const getAllTrainees = async (req, res) => {
    try {
        const isAll = req.query.all === 'true';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const batchId = req.query.batchId;
        const skip = (page - 1) * limit;

        console.log('getAllTrainees Request Query:', req.query);

        const query = { role: 'trainee' };

        // Robust batch filtering
        if (batchId) {
            const filters = [batchId];
            if (mongoose.Types.ObjectId.isValid(batchId)) {
                filters.push(new mongoose.Types.ObjectId(batchId));
            }
            query.assignedBatches = { $in: filters };
            console.log(`getAllTrainees: Filtering by batchId (lenient):`, filters);
        } else if (batchId) {
            console.warn(`getAllTrainees: Invalid batchId format: ${batchId}`);
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { workEmail: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } }
            ];
        }

        let trainees;
        let total;

        const population = {
            path: 'assignedBatches',
            select: 'name startDate endDate'
        };

        if (isAll) {
            // "all=true" usually implies list for dropdowns etc, but we adhere to query filters if present
            trainees = await User.find(query)
                .populate(population)
                .sort({ createdAt: -1 });
            total = trainees.length;
        } else {
            trainees = await User.find(query)
                .populate(population)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 });
            total = await User.countDocuments(query);
        }

        res.json({
            trainees,
            page: isAll ? 1 : page,
            totalPages: isAll ? 1 : Math.ceil(total / limit),
            totalTrainees: total,
            debug: { query, batchId, count: trainees.length }
        });
    } catch (err) {
        console.error('getAllTrainees Error:', err);
        res.status(500).json({ msg: err.message });
    }
};

// Delete a trainee
export const deleteTrainee = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Remove from all batches if assigned
        if (user.assignedBatches && user.assignedBatches.length > 0) {
            await Batch.updateMany(
                { _id: { $in: user.assignedBatches } },
                { $pull: { trainees: user._id } }
            );
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Trainee deleted successfully' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Existing assignTrainees logic (still useful for single assignment)
export const assignTrainees = async (req, res) => {
    try {
        const { batchId, traineeIds } = req.body;
        const batch = await Batch.findById(batchId);
        if (!batch) return res.status(404).json({ msg: 'Batch not found' });
        batch.trainees = traineeIds.map(id => new mongoose.Types.ObjectId(id));
        await batch.save();
        res.json(batch);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Generate schedule logic
export const generateSchedule = async (req, res) => {
    try {
        const { batchId, assignments } = req.body;
        const batch = await Batch.findById(batchId);
        if (!batch) return res.status(404).json({ msg: 'Batch not found' });
        const start = new Date(batch.startDate);
        const end = new Date(batch.endDate);
        const dayMs = 24 * 60 * 60 * 1000;
        const scheduleDocs = [];
        let dayNumber = 1;
        for (let d = start; d <= end; d = new Date(d.getTime() + dayMs)) {
            if (d.getDay() === 0) continue;
            const schedule = new Schedule({
                batch: batch._id,
                date: d,
                dayNumber,
                assignments,
            });
            await schedule.save();
            scheduleDocs.push(schedule);
            dayNumber++;
        }
        res.json(scheduleDocs);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};
// Configure multer for trainer notes
const notesStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), 'uploads', 'notes');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `notes-${req.params.id}-${Date.now()}${ext}`);
    },
});

export const notesUpload = multer({
    storage: notesStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

// Get trainees specifically for a batch
export const getTraineesByBatch = async (req, res) => {
    try {
        const { batchId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        if (!mongoose.Types.ObjectId.isValid(batchId)) {
            return res.status(400).json({ msg: 'Invalid Batch ID' });
        }

        // Strict query: MUST match this batch
        const query = {
            role: 'trainee',
            assignedBatches: new mongoose.Types.ObjectId(batchId)
        };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { workEmail: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } }
            ];
        }

        const trainees = await User.find(query)
            .populate('assignedBatches')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(query);

        res.json({
            trainees,
            page,
            totalPages: Math.ceil(total / limit),
            totalTrainees: total,
            batchId // Confirm back the ID used
        });

    } catch (err) {
        console.error('getTraineesByBatch Error:', err);
        res.status(500).json({ msg: err.message });
    }
};

export const uploadTrainerNotes = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
        const { date } = req.body;
        if (!date) return res.status(400).json({ msg: 'Date is required' });

        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ msg: 'Course not found' });

        if (!course.trainerNotes) course.trainerNotes = new Map();

        const notesPath = `/uploads/notes/${req.file.filename}`;
        course.trainerNotes.set(date, notesPath);

        await course.save();
        res.json({ msg: 'Notes uploaded successfully', notesUrl: notesPath, course });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

export const createTrainer = async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ msg: 'Please provide name and email.' });
        }

        const existingUser = await User.findOne({
            $or: [{ workEmail: email }, { collegeEmail: email }]
        });

        if (existingUser) {
            return res.status(400).json({ msg: 'User with this email already exists.' });
        }

        // Auto-generate password
        const password = crypto.randomBytes(4).toString('hex'); // 8 chars

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newTrainer = new User({
            name,
            workEmail: email,
            password: hashedPassword,
            role: 'trainer'
        });

        await newTrainer.save();

        // Send email
        const emailContent = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Welcome to Owl Code!</h2>
                <p>Hello ${name},</p>
                <p>You have been added as a Trainer. Here are your login credentials:</p>
                <ul>
                    <li><strong>Email:</strong> ${email}</li>
                    <li><strong>Password:</strong> ${password}</li>
                </ul>
                <p>Please login at: <a href="http://localhost:5173/login">Owl Code Portal</a></p>
                <p>Happy Onboarding!</p>
            </div>
        `;

        await sendMail({
            to: email,
            subject: 'Welcome to Owl Code - Trainer Credentials',
            html: emailContent
        });

        res.status(201).json({
            msg: 'Trainer created successfully and email sent', trainer: {
                _id: newTrainer._id,
                name: newTrainer.name,
                email: newTrainer.workEmail,
                role: newTrainer.role,
                createdAt: newTrainer.createdAt
            }
        });

    } catch (err) {
        console.error('createTrainer Error:', err);
        res.status(500).json({ msg: err.message });
    }
};

// Get Dashboard Stats
export const getDashboardStats = async (req, res) => {
    try {
        const totalCourses = await Course.countDocuments();
        const totalBatches = await Batch.countDocuments();
        const totalTrainers = await User.countDocuments({ role: 'trainer' });
        const totalTrainees = await User.countDocuments({ role: 'trainee' });

        // Trainees per Batch Distribution
        const batchDistribution = await Batch.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'trainees',
                    foreignField: '_id',
                    as: 'traineeDetails'
                }
            },
            {
                $project: {
                    name: 1,
                    count: { $size: "$trainees" } // or $traineeDetails if using lookup, but trainees array length is enough if accurate
                }
            },
            { $sort: { count: -1 } }, // Show largest batches first
            { $limit: 5 } // Top 5 batches
        ]);

        res.json({
            counts: {
                courses: totalCourses,
                batches: totalBatches,
                trainers: totalTrainers,
                trainees: totalTrainees
            },
            charts: {
                batchDistribution
            }
        });
    } catch (err) {
        console.error('getDashboardStats Error:', err);
        res.status(500).json({ msg: err.message });
    }
};

