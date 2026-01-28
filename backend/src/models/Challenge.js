import mongoose from 'mongoose';
import { AssignmentSchema } from './AssignmentSchema.js';

const ChallengeSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    description: { type: String },
    duration: { type: Number, required: true }, // in days
    dailyAssignments: {
        type: Map,
        of: [AssignmentSchema]
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
});

const ChallengeParticipationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
    streak: { type: Number, default: 0 },
    completedDays: [Number], // Store completed day numbers (1, 2, ...)
    startDate: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
});

export const Challenge = mongoose.model('Challenge', ChallengeSchema);
export const ChallengeParticipation = mongoose.model('ChallengeParticipation', ChallengeParticipationSchema);
