import express from 'express';
import {
    createProblem,
    getProblems,
    getProblemById,
    updateProblem,
    deleteProblem
} from '../controllers/problemController.js';
import { authorizeRoles } from '../middlewares/auth.js';

const router = express.Router();

// Public read access? Or Admin only? 
// Assuming all authenticated users (even trainees) might need to see problems eventually, 
// but for now creating/editing is Admin/Trainer only.
// Let's stick to the pattern: authorizeRoles('admin', 'trainer') for modification.

router.post('/', authorizeRoles('admin', 'trainer'), createProblem);
router.get('/', authorizeRoles('admin', 'trainer', 'trainee'), getProblems); // Trainees might need to see list?
router.get('/:id', authorizeRoles('admin', 'trainer', 'trainee'), getProblemById);
router.put('/:id', authorizeRoles('admin', 'trainer'), updateProblem);
router.delete('/:id', authorizeRoles('admin'), deleteProblem);

export default router;
