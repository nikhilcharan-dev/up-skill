import mongoose from 'mongoose';

const ProblemSchema = new mongoose.Schema({
    problemName: { type: String, required: true },
    problemLink: { type: String },
    category: {
        type: String,
        enum: ['DSA', 'CP', 'OS', 'SQL'],
        required: true
    },
    problemSource: {
        type: String,
        enum: ['Leetcode', 'Codeforces', 'Codechef', 'Hackerrank'],
        required: true
    },
    problemTag: { type: String }
});

export { ProblemSchema };
