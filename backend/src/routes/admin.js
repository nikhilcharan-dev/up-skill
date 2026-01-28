import express from 'express';
import { authorizeRoles } from '../middlewares/auth.js';
import multer from 'multer';
import {
    createCourse,
    getCourseById,
    getCourses,
    updateCourseContent,
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
    deleteTrainerNotes,
    uploadResource,
    notesUpload,
    createTrainer,
    getDashboardStats
} from '../controllers/adminController.js';
import { getCodingProfile, updateCodingProfile } from '../controllers/codingProfileController.js';

const router = express.Router();

// Course routes
router.post('/course', authorizeRoles('admin'), createCourse);
router.get('/course', authorizeRoles('admin', 'trainer'), getCourses);
router.get('/course/:id', authorizeRoles('admin', 'trainer'), getCourseById);
router.put('/course/:id', authorizeRoles('admin'), updateCourse);
router.delete('/course/:id', authorizeRoles('admin'), deleteCourse);
router.put('/course/:id/content', authorizeRoles('admin'), updateCourseContent);
router.put('/course/:id/notes', authorizeRoles('admin'), notesUpload.single('file'), uploadTrainerNotes);
router.delete('/course/:id/modules/:moduleId/days/:dayId/notes', authorizeRoles('admin'), deleteTrainerNotes);
router.post('/upload', authorizeRoles('admin'), notesUpload.single('file'), uploadResource);

// Batch routes
router.post('/batch', authorizeRoles('admin'), createBatch);
router.get('/batch', authorizeRoles('admin', 'trainer'), getBatches);
router.get('/batch/:batchId/trainees', authorizeRoles('admin', 'trainer'), getTraineesByBatch);
router.put('/batch/:id', authorizeRoles('admin'), updateBatch);
router.delete('/batch/:id', authorizeRoles('admin'), deleteBatch);
router.post('/assign-trainee', authorizeRoles('admin'), assignTrainees);
router.post('/bulk-add-trainees', authorizeRoles('admin'), multer({ storage: multer.memoryStorage() }).any(), bulkAddTrainees);
router.post('/generate-schedule', authorizeRoles('admin'), generateSchedule);

// Trainee management routes
router.get('/trainees', authorizeRoles('admin', 'trainer'), getAllTrainees);
router.get('/trainers', authorizeRoles('admin'), getAllTrainers);
router.post('/trainers', authorizeRoles('admin'), createTrainer);
router.delete('/trainee/:id', authorizeRoles('admin'), deleteTrainee);

// Dashboard Stats
router.get('/stats', authorizeRoles('admin'), getDashboardStats);

// Coding Profile Routes
router.get('/trainee/:userId/coding-profile', authorizeRoles('admin', 'trainer', 'trainee'), getCodingProfile);
router.put('/trainee/:userId/coding-profile', authorizeRoles('admin', 'trainer'), updateCodingProfile);

export default router;
