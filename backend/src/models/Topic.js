import mongoose from 'mongoose';


const TopicSchema = new mongoose.Schema({
    // dayNumber removed - dynamic scheduling
    topicName: { type: String, required: true },
    description: { type: String },
    trainerNotes: { type: String }, // Cloudinary URL

    // References to independent Problem entities
    assignmentProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
    practiceProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Topic', TopicSchema);
