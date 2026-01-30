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
router.post('/', authorizeRoles('admin', 'trainer'), createTopic);
router.get('/', authorizeRoles('admin', 'trainer'), getTopics);
router.get('/:id', authorizeRoles('admin', 'trainer'), getTopicById);
router.put('/:id', authorizeRoles('admin', 'trainer'), updateTopicMetadata);
router.put('/:id/content', authorizeRoles('admin', 'trainer'), updateTopicContent);
router.delete('/:id', authorizeRoles('admin', 'trainer'), deleteTopic);

// Trainer notes routes for topics
router.put('/:id/notes', authorizeRoles('admin', 'trainer'), notesUpload.single('file'), uploadTopicTrainerNotes);
router.delete('/:id/notes', authorizeRoles('admin', 'trainer'), deleteTopicTrainerNotes);

export default router;
