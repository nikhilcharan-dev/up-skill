import Course from '../models/Course.js';
import TopicNote from '../models/TopicNote.js';

// Get all courses (basic info only)
export const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find().select('_id title description');
        res.json(courses);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Get course by ID with locked/unlocked module filtering
export const getCourseById = async (req, res) => {
    try {
        // Fetch course with fully populated modules, topics, and problems
        const course = await Course.findById(req.params.id).populate({
            path: 'modules',
            populate: {
                path: 'topics',
                populate: [
                    { path: 'assignmentProblems' },
                    { path: 'practiceProblems' }
                ]
            }
        });

        if (!course) return res.status(404).json({ msg: 'Course not found' });

        // Transform modules based on isLocked status
        const courseObj = course.toObject();
        courseObj.modules = courseObj.modules.map(module => {
            if (module.isLocked) {
                // Return only basic fields for locked modules
                return {
                    _id: module._id,
                    title: module.title,
                    description: module.description,
                    isLocked: true
                };
            }
            // Return full module data for unlocked modules
            return module;
        });

        res.json(courseObj);
    } catch (err) {
        console.error('[getCourseById] Error:', err);
        res.status(500).json({ msg: err.message });
    }
};

// Save or update topic note
export const saveTopicNote = async (req, res) => {
    try {
        const { courseId, topicId, note } = req.body;
        const userId = req.user.id;

        // Upsert the note
        const topicNote = await TopicNote.findOneAndUpdate(
            { user: userId, course: courseId, topicId: topicId },
            { note },
            { new: true, upsert: true }
        );

        res.json(topicNote);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Get topic note
export const getTopicNote = async (req, res) => {
    try {
        const { courseId, topicId } = req.params;
        const userId = req.user.id;

        const topicNote = await TopicNote.findOne({
            user: userId,
            course: courseId,
            topicId: topicId
        });

        res.json(topicNote || { note: '' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};
