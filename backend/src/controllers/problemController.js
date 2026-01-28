import Problem from '../models/Problem.js';

// Create a new problem
export const createProblem = async (req, res) => {
    try {
        const { title, link, platform, difficulty, category, tags } = req.body;

        // Check for duplicate link
        const existingProblem = await Problem.findOne({ link });
        if (existingProblem) {
            return res.status(400).json({ msg: 'Problem with this link already exists.' });
        }

        const problem = new Problem({
            title,
            link,
            platform,
            difficulty,
            category,
            tags,
            createdBy: req.user.id
        });

        await problem.save();
        res.status(201).json(problem);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Get all problems with filtering and pagination
export const getProblems = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const platform = req.query.platform;
        const difficulty = req.query.difficulty;
        const category = req.query.category;

        const skip = (page - 1) * limit;

        const query = {};

        if (search) {
            query.$text = { $search: search };
        }

        if (platform) query.platform = platform;
        if (difficulty) query.difficulty = difficulty;
        if (category) query.category = category;

        // If all=true, return without pagination (for dropdowns)
        if (req.query.all === 'true') {
            const problems = await Problem.find(query).sort({ createdAt: -1 });
            return res.json(problems);
        }

        const problems = await Problem.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Problem.countDocuments(query);

        res.json({
            problems,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalProblems: total
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Get single problem
export const getProblemById = async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id);
        if (!problem) return res.status(404).json({ msg: 'Problem not found' });
        res.json(problem);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Update problem
export const updateProblem = async (req, res) => {
    try {
        const { title, link, platform, difficulty, category, tags } = req.body;

        const problem = await Problem.findByIdAndUpdate(
            req.params.id,
            { title, link, platform, difficulty, category, tags },
            { new: true }
        );

        if (!problem) return res.status(404).json({ msg: 'Problem not found' });
        res.json(problem);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Delete problem
export const deleteProblem = async (req, res) => {
    try {
        const problem = await Problem.findByIdAndDelete(req.params.id);
        if (!problem) return res.status(404).json({ msg: 'Problem not found' });
        res.json({ msg: 'Problem deleted successfully' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};
