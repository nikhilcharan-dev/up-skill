import Module from '../models/Module.js';
import Course from '../models/Course.js';

// Create new module
export const createModule = async (req, res) => {
    try {
        const { title, description, assignedCourses } = req.body;

        const newModule = new Module({
            title,
            description,
            days: [],
            createdBy: req.user.id
        });

        await newModule.save();

        // If courses are assigned, add this module to those courses
        if (assignedCourses && assignedCourses.length > 0) {
            await Course.updateMany(
                { _id: { $in: assignedCourses } },
                { $addToSet: { modules: newModule._id } }
            );
        }

        res.status(201).json(newModule);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Get all modules
export const getModules = async (req, res) => {
    try {
        const modules = await Module.find().populate('createdBy', 'name email');
        res.json(modules);
    } catch (err) {
        console.error('getModules Error:', err);
        res.status(500).json({ msg: err.message });
    }
};

// Get module by ID
export const getModuleById = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id).populate('topics');
        if (!module) return res.status(404).json({ msg: 'Module not found' });

        // Get courses that have this module
        const assignedCourses = await Course.find({ modules: module._id }).select('_id title');

        res.json({
            ...module.toObject(),
            assignedCourses: assignedCourses.map(c => c._id)
        });
    } catch (err) {
        console.error('getModuleById Error:', err);
        res.status(500).json({ msg: err.message });
    }
};

// Update module metadata (title, description, course assignments, topics)
export const updateModuleMetadata = async (req, res) => {
    try {
        const { title, description, assignedCourses, topics, isLocked } = req.body;

        const module = await Module.findById(req.params.id);
        if (!module) return res.status(404).json({ msg: 'Module not found' });

        // Update basic fields
        if (title) module.title = title;
        if (description !== undefined) module.description = description;
        if (isLocked !== undefined) module.isLocked = isLocked;

        // Update topics if provided
        if (topics !== undefined) {
            module.topics = topics;
        }

        await module.save();

        // Handle course assignments if provided
        if (assignedCourses !== undefined) {
            // Get current courses that have this module
            const currentCourses = await Course.find({ modules: module._id }).select('_id');
            const currentCourseIds = currentCourses.map(c => c._id.toString());
            const newCourseIds = assignedCourses.map(id => id.toString());

            // Find courses to add and remove
            const coursesToAdd = newCourseIds.filter(id => !currentCourseIds.includes(id));
            const coursesToRemove = currentCourseIds.filter(id => !newCourseIds.includes(id));

            // Add module to new courses
            if (coursesToAdd.length > 0) {
                await Course.updateMany(
                    { _id: { $in: coursesToAdd } },
                    { $addToSet: { modules: module._id } }
                );
            }

            // Remove module from courses
            if (coursesToRemove.length > 0) {
                await Course.updateMany(
                    { _id: { $in: coursesToRemove } },
                    {
                        $pull: { modules: module._id, moduleSchedule: { moduleId: module._id } }
                    }
                );
            }
        }

        // Return populated module
        const populated = await Module.findById(module._id).populate('topics');
        res.json(populated);
    } catch (err) {
        console.error('updateModuleMetadata Error:', err);
        res.status(500).json({ msg: err.message });
    }
};

// Delete module
export const deleteModule = async (req, res) => {
    try {
        const module = await Module.findByIdAndDelete(req.params.id);
        if (!module) return res.status(404).json({ msg: 'Module not found' });

        // Remove module from all courses
        await Course.updateMany(
            { modules: module._id },
            { $pull: { modules: module._id, moduleSchedule: { moduleId: module._id } } }
        );

        res.json({ msg: 'Module deleted successfully' });
    } catch (err) {
        console.error('deleteModule Error:', err);
        res.status(500).json({ msg: err.message });
    }
};
