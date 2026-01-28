import mongoose from 'mongoose';

import { AssignmentSchema } from './AssignmentSchema.js';

const DaySchema = new mongoose.Schema({
    dayNumber: { type: Number, required: true }, // Chronological day (1, 2, 3...)
    date: { type: Date }, // Specific calendar date (1 Jan)

    // Topic Details (Moved here)
    topicName: { type: String },
    topicDescription: { type: String },

    trainerNotes: { type: String }, // URL to PDF/PPT

    assignments: [AssignmentSchema],
    additionalAssignments: [AssignmentSchema]
});

const ModuleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    days: [DaySchema],
    isLocked: { type: Boolean, default: false }
});

const CourseSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    excludedDays: { type: [Number], default: [0] }, // default skip Sundays
    customHolidays: { type: [Date] },

    // New Hierarchy
    modules: [ModuleSchema],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Course', CourseSchema);
