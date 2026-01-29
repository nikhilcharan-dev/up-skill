import Topic from '../models/Topic.js';
import Module from '../models/Module.js';

// Create a new topic
export const createTopic = async (req, res) => {
    try {
        const { dayNumber, topicName, description, assignedModules } = req.body;

        const newTopic = new Topic({
            dayNumber,
            topicName,
            description,
            assignmentProblems: [],
            practiceProblems: [],
            createdBy: req.user.id
        });

        await newTopic.save();

        // If modules are assigned, add this topic to those modules
        if (assignedModules && assignedModules.length > 0) {
            await Module.updateMany(
                { _id: { $in: assignedModules } },
                { $addToSet: { topics: newTopic._id } }
            );
        }

        res.status(201).json(newTopic);
    } catch (err) {
        console.error('createTopic Error:', err);
        res.status(500).json({ msg: err.message });
    }
};

// Get all topics
export const getTopics = async (req, res) => {
    try {
        const topics = await Topic.find()
            .populate('createdBy', 'name email')
            .populate('assignmentProblems', 'title difficulty platform')
            .populate('practiceProblems', 'title difficulty platform');
        res.json(topics);
    } catch (err) {
        console.error('getTopics Error:', err);
        res.status(500).json({ msg: err.message });
    }
};

// Get topic by ID
export const getTopicById = async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.id)
            .populate('assignmentProblems')
            .populate('practiceProblems');
        if (!topic) return res.status(404).json({ msg: 'Topic not found' });

        // Get modules that have this topic
        const assignedModules = await Module.find({ topics: topic._id }).select('_id title');

        res.json({
            ...topic.toObject(),
            assignedModules: assignedModules.map(m => m._id)
        });
    } catch (err) {
        console.error('getTopicById Error:', err);
        res.status(500).json({ msg: err.message });
    }
};

// Update topic metadata (dayNumber, topicName, description, module assignments)
export const updateTopicMetadata = async (req, res) => {
    try {
        const { dayNumber, topicName, description, assignedModules } = req.body;

        const topic = await Topic.findById(req.params.id);
        if (!topic) return res.status(404).json({ msg: 'Topic not found' });

        // Update basic fields
        if (dayNumber) topic.dayNumber = dayNumber;
        if (topicName) topic.topicName = topicName;
        if (description !== undefined) topic.description = description;

        await topic.save();

        // Handle module assignments if provided
        if (assignedModules !== undefined) {
            // Get current modules that have this topic
            const currentModules = await Module.find({ topics: topic._id }).select('_id');
            const currentModuleIds = currentModules.map(m => m._id.toString());
            const newModuleIds = assignedModules.map(id => id.toString());

            // Find modules to add and remove
            const modulesToAdd = newModuleIds.filter(id => !currentModuleIds.includes(id));
            const modulesToRemove = currentModuleIds.filter(id => !newModuleIds.includes(id));

            // Add topic to new modules
            if (modulesToAdd.length > 0) {
                await Module.updateMany(
                    { _id: { $in: modulesToAdd } },
                    { $addToSet: { topics: topic._id } }
                );
            }

            // Remove topic from modules
            if (modulesToRemove.length > 0) {
                await Module.updateMany(
                    { _id: { $in: modulesToRemove } },
                    { $pull: { topics: topic._id } }
                );
            }
        }

        res.json(topic);
    } catch (err) {
        console.error('updateTopicMetadata Error:', err);
        res.status(500).json({ msg: err.message });
    }
};

// Update topic content (problems, trainer notes)
export const updateTopicContent = async (req, res) => {
    try {
        const { assignmentProblems, practiceProblems, trainerNotes } = req.body;

        const topic = await Topic.findById(req.params.id);
        if (!topic) return res.status(404).json({ msg: 'Topic not found' });

        if (assignmentProblems) topic.assignmentProblems = assignmentProblems;
        if (practiceProblems) topic.practiceProblems = practiceProblems;
        if (trainerNotes !== undefined) topic.trainerNotes = trainerNotes;

        await topic.save();
        res.json(topic);
    } catch (err) {
        console.error('updateTopicContent Error:', err);
        res.status(500).json({ msg: err.message });
    }
};

// Delete topic
export const deleteTopic = async (req, res) => {
    try {
        const topic = await Topic.findByIdAndDelete(req.params.id);
        if (!topic) return res.status(404).json({ msg: 'Topic not found' });

        // Remove topic from all modules
        await Module.updateMany(
            { topics: topic._id },
            { $pull: { topics: topic._id } }
        );

        res.json({ msg: 'Topic deleted successfully' });
    } catch (err) {
        console.error('deleteTopic Error:', err);
        res.status(500).json({ msg: err.message });
    }
};

// Upload trainer notes
export const uploadTopicTrainerNotes = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

        const topic = await Topic.findById(req.params.id);
        if (!topic) return res.status(404).json({ msg: 'Topic not found' });

        topic.trainerNotes = req.file.path; // Cloudinary URL
        await topic.save();

        res.json({ msg: 'Trainer notes uploaded successfully', url: req.file.path });
    } catch (err) {
        console.error('uploadTopicTrainerNotes Error:', err);
        res.status(500).json({ msg: err.message });
    }
};

// Delete trainer notes
export const deleteTopicTrainerNotes = async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.id);
        if (!topic) return res.status(404).json({ msg: 'Topic not found' });

        topic.trainerNotes = '';
        await topic.save();

        res.json({ msg: 'Trainer notes removed successfully' });
    } catch (err) {
        console.error('deleteTopicTrainerNotes Error:', err);
        res.status(500).json({ msg: err.message });
    }
};
