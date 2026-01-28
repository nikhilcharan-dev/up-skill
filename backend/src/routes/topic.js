import express from 'express';
import { authorizeRoles } from '../middlewares/auth.js';
import {
    createTopic,
    getTopics,
    getTopicById,
    updateTopicMetadata,
    updateTopicContent,
    deleteTopic,
    uploadTopicTrainerNotes,
    deleteTopicTrainerNotes
} from '../controllers/topicController.js';
import { notesUpload } from '../controllers/adminController.js';

const router = express.Router();

// Topic routes
router.post('/', authorizeRoles('admin'), createTopic);
router.get('/', authorizeRoles('admin', 'trainer'), getTopics);
router.get('/:id', authorizeRoles('admin', 'trainer'), getTopicById);
router.put('/:id', authorizeRoles('admin'), updateTopicMetadata);
router.put('/:id/content', authorizeRoles('admin'), updateTopicContent);
router.delete('/:id', authorizeRoles('admin'), deleteTopic);

// Trainer notes routes for topics
router.put('/:id/notes', authorizeRoles('admin'), notesUpload.single('file'), uploadTopicTrainerNotes);
router.delete('/:id/notes', authorizeRoles('admin'), deleteTopicTrainerNotes);

export default router;
