import express from 'express';
import { authorizeRoles } from '../middlewares/auth.js';
import {
    createCourse,
    getCourseById,
    getCourses,
    updateCourseAssignments,
    updateCourse,
    deleteCourse,
    createBatch,
    getBatches,
    updateBatch,
    deleteBatch,
    bulkAddTrainees,
    getAllTrainees,
    getTraineesByBatch,
    getAllTrainers,
    deleteTrainee,
    assignTrainees,
    generateSchedule,
    uploadTrainerNotes,
    notesUpload,
    createTrainer,
    getDashboardStats
} from '../controllers/adminController.js';

const router = express.Router();

// Course routes
router.post('/course', authorizeRoles('admin'), createCourse);
router.get('/course', authorizeRoles('admin', 'trainer'), getCourses);
router.get('/course/:id', authorizeRoles('admin', 'trainer'), getCourseById);
router.put('/course/:id', authorizeRoles('admin'), updateCourse);
router.delete('/course/:id', authorizeRoles('admin'), deleteCourse);
router.put('/course/:id/assignments', authorizeRoles('admin'), updateCourseAssignments);
router.put('/course/:id/notes', authorizeRoles('admin'), notesUpload.single('file'), uploadTrainerNotes);

// Batch routes
router.post('/batch', authorizeRoles('admin'), createBatch);
router.get('/batch', authorizeRoles('admin', 'trainer'), getBatches);
router.get('/batch/:batchId/trainees', authorizeRoles('admin', 'trainer'), getTraineesByBatch);
router.put('/batch/:id', authorizeRoles('admin'), updateBatch);
router.delete('/batch/:id', authorizeRoles('admin'), deleteBatch);
router.post('/assign-trainee', authorizeRoles('admin'), assignTrainees);
router.post('/bulk-add-trainees', authorizeRoles('admin'), bulkAddTrainees);
router.post('/generate-schedule', authorizeRoles('admin'), generateSchedule);

// Trainee management routes
router.get('/trainees', authorizeRoles('admin', 'trainer'), getAllTrainees);
router.get('/trainers', authorizeRoles('admin'), getAllTrainers);
router.post('/trainers', authorizeRoles('admin'), createTrainer);
router.delete('/trainee/:id', authorizeRoles('admin'), deleteTrainee);

// Dashboard Stats
// Dashboard Stats
router.get('/stats', authorizeRoles('admin'), getDashboardStats);

// Coding Profile Routes
import { getCodingProfile, updateCodingProfile } from '../controllers/codingProfileController.js';
router.get('/trainee/:userId/coding-profile', authorizeRoles('admin', 'trainer', 'trainee'), getCodingProfile);
router.put('/trainee/:userId/coding-profile', authorizeRoles('admin', 'trainer'), updateCodingProfile);

export default router;
