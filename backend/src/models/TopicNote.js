import mongoose from 'mongoose';

const TopicNoteSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, required: true },
    note: { type: String, default: '' },
}, { timestamps: true });

// Ensure one note per topic per user
TopicNoteSchema.index({ user: 1, topicId: 1 }, { unique: true });

export default mongoose.model('TopicNote', TopicNoteSchema);
