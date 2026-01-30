import express from 'express';
import {
    getAllCourses,
    getCourseById,
    getProfile,
    setupProfile,
    uploadResume,
    deleteResume,
    downloadResume,
    getDashboard,
    getBatchSchedule,
    upload,
    saveTopicNote,
    getTopicNote,
    toggleProblemCompletion,
    changePassword,
} from '../controllers/traineeController.js';
import { getCodingProfile, updateCodingProfile } from '../controllers/codingProfileController.js';

const router = express.Router();

// Course routes
router.get('/courses', getAllCourses);
router.get('/courses/:id', getCourseById);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', setupProfile);
router.put('/password', changePassword);
router.get('/coding-profile', getCodingProfile);
router.put('/coding-profile', updateCodingProfile);

// Resume routes
router.post('/resume', upload.single('resume'), uploadResume);
router.delete('/resume', deleteResume);
router.get('/resume/download', downloadResume);

// Dashboard data for trainee
router.get('/dashboard', getDashboard);
router.get('/batch/:batchId/schedule', getBatchSchedule);

// Topic Notes
router.post('/notes', saveTopicNote);
router.get('/courses/:courseId/topics/:topicId/notes', getTopicNote);

// Progress Routes
router.post('/progress/toggle', toggleProblemCompletion);

export default router;

