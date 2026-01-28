import express from 'express';
import { authorizeRoles } from '../middlewares/auth.js';
import {
    createModule,
    getModules,
    getModuleById,
    updateModuleMetadata,
    deleteModule
} from '../controllers/moduleController.js';

const router = express.Router();

// Module routes
router.post('/', authorizeRoles('admin'), createModule);
router.get('/', authorizeRoles('admin', 'trainer'), getModules);
router.get('/:id', authorizeRoles('admin', 'trainer'), getModuleById);
router.put('/:id', authorizeRoles('admin'), updateModuleMetadata);
router.delete('/:id', authorizeRoles('admin'), deleteModule);

export default router;
