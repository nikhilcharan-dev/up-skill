import mongoose from 'mongoose';

export const AssignmentSchema = new mongoose.Schema({
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }, // Link to Problem Library
    name: { type: String, required: true }, // Problem Name
    link: { type: String }, // Problem Link
    source: {
        type: String,
        enum: ['LEETCODE', 'CODEFORCES', 'CODECHEF', 'GFG', 'HACKERRANK', 'OTHER'], // Normalized uppercase as per request
        default: 'OTHER'
    },
    category: {
        type: String,
        enum: ['DSA', 'CP', 'SQL', 'OS', 'OTHER'],
        default: 'DSA'
    },
    level: {
        type: String,
        enum: ['EASY', 'MEDIUM', 'HARD'],
        default: 'MEDIUM'
    },
    tags: [String], // Problem Tags
    description: String
});
