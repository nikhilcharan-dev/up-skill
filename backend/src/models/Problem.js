import mongoose from 'mongoose';

const ProblemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Problem title is required'],
        trim: true
    },
    link: {
        type: String,
        required: [true, 'Problem link is required'],
        trim: true
    },
    platform: {
        type: String,
        enum: ['LeetCode', 'CodeForces', 'CodeChef', 'HackerRank', 'GeeksForGeeks', 'Other'],
        default: 'Other'
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    category: {
        type: String,
        enum: ['DSA', 'SQL', 'System Design', 'Web Dev', 'CS Fundamentals'],
        default: 'DSA'
    },
    tags: [{
        type: String,
        trim: true
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Index for searching
ProblemSchema.index({ title: 'text', tags: 'text' });

export default mongoose.model('Problem', ProblemSchema);
