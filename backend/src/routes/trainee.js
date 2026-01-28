import express from 'express';
import {
    getAllCourses,
    getCourseById,
    getProfile,
    setupProfile,
    uploadResume,
    downloadResume,
    getDashboard,
    getBatchSchedule,
    upload,
    saveTopicNote,
    getTopicNote
} from '../controllers/traineeController.js';

const router = express.Router();

// Course routes
router.get('/courses', getAllCourses);
router.get('/courses/:id', getCourseById);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', setupProfile);

// Resume routes
router.post('/resume', upload.single('resume'), uploadResume);
router.get('/resume/download', downloadResume);

// Dashboard data for trainee
router.get('/dashboard', getDashboard);
router.get('/batch/:batchId/schedule', getBatchSchedule);

// Topic Notes
router.post('/notes', saveTopicNote);
router.get('/courses/:courseId/topics/:topicId/notes', getTopicNote);

export default router;

