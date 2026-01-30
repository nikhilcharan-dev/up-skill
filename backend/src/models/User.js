import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    workEmail: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'trainer', 'trainee'], required: true },
    studentId: { type: String, unique: true, sparse: true },
    codingHandles: { type: [String] },
    resume: { type: String }, // URL or file path
    assignedBatches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', UserSchema);