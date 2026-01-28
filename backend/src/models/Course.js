import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    excludedDays: { type: [Number], default: [0] }, // default skip Sundays
    customHolidays: { type: [Date] },

    // References to independent Module entities
    modules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],

    // Course-specific date assignments for modules and their topics
    moduleSchedule: [{
        moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
        testLink: { type: String, default: '' }, // Unstop test link for this module
        topicSchedules: [{
            topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
            date: Date
        }]
    }],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Course', CourseSchema);
