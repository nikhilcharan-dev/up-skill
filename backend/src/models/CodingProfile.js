import mongoose from 'mongoose';

const CodingProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    leetcode: { type: String, trim: true },
    codeforces: { type: String, trim: true },
    codechef: { type: String, trim: true },
    hackerrank: { type: String, trim: true },
    lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model('CodingProfile', CodingProfileSchema);
