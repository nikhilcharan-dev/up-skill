import express from 'express';
import {
    getAllCourses,
    getCourseById,
    saveTopicNote,
    getTopicNote
} from '../controllers/userController.js';

const router = express.Router();

// Get all courses (basic info)
router.get('/courses', getAllCourses);

// Get course by ID (with locked/unlocked filtering)
router.get('/courses/:id', getCourseById);

// Topic notes
router.post('/notes', saveTopicNote);
router.get('/courses/:courseId/topics/:topicId/notes', getTopicNote);

export default router;
