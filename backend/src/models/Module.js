import mongoose from 'mongoose';

const ModuleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,

    // References to independent Topic entities
    topics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],

    isLocked: { type: Boolean, default: false },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Module', ModuleSchema);
