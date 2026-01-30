import User from '../models/User.js';
import TopicNote from '../models/TopicNote.js';
import TraineeProgress from '../models/TraineeProgress.js';
import Batch from '../models/Batch.js';
import Schedule from '../models/Schedule.js';
import Course from '../models/Course.js';
import multer from 'multer';
import { storage } from '../config/cloudinary.js';

export const upload = multer({ storage });

// Get all courses (basic info only)
export const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find().select('_id title description');
        res.json(courses);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Get course by ID with locked/unlocked module filtering
export const getCourseById = async (req, res) => {
    try {
        // Fetch course with fully populated modules, topics, and problems
        const course = await Course.findById(req.params.id).populate({
            path: 'modules',
            populate: {
                path: 'topics',
                populate: [
                    { path: 'assignmentProblems' },
                    { path: 'practiceProblems' }
                ]
            }
        });

        if (!course) return res.status(404).json({ msg: 'Course not found' });

        // Create a map of topicId -> date from moduleSchedule
        const topicDateMap = {};
        if (course.moduleSchedule) {
            course.moduleSchedule.forEach(sch => {
                if (sch.topicSchedules) {
                    sch.topicSchedules.forEach(ts => {
                        if (ts.topicId && ts.date) {
                            topicDateMap[ts.topicId.toString()] = ts.date;
                        }
                    });
                }
            });
        }

        // Global day counter for the entire course
        let globalDayCounter = 1;

        // Create a Set of locked module IDs for efficient lookup
        const lockedModuleIds = new Set((course.lockedModules || []).map(id => id.toString()));

        // --- Fetch User Progress ---
        // Find batch for this trainee and course
        const batch = await Batch.findOne({
            course: req.params.id,
            trainees: req.user.id
        });

        // Find progress
        let completedProblemIds = new Set();
        if (batch) {
            const progress = await TraineeProgress.findOne({
                batch: batch._id,
                trainee: req.user.id
            });
            if (progress && progress.completedAssignments) {
                completedProblemIds = new Set(progress.completedAssignments.map(id => id.toString()));
            }
        }

        // Helper to check problem completion
        const isProblemCompleted = (pId) => completedProblemIds.has(pId.toString());

        // Helper: Check Topic Completion
        // Logic: Completed if all assignment problems are solved (even if 0 assignments).
        const isTopicCompleted = (topic) => {
            const assignments = topic.assignmentProblems || [];
            if (assignments.length === 0) return true;
            return assignments.every(p => isProblemCompleted(p._id));
        };

        // --- Calculate Course-Level Stats (Across ALL modules) ---
        const courseStats = {
            completedLectures: 0,
            totalLectures: 0,
            completedAssignments: 0,
            totalAssignments: 0,
            completedPractice: 0,
            totalPractice: 0
        };

        // We iterate over the original course.modules (which has ALL data) to calculate stats
        course.modules.forEach(module => {
            if (module.topics) {
                // Handle Scheduled Topics (repeats) + Unscheduled
                // The logic below replicates the "What the user actually sees" structure for stats

                // Get Schedule for this module
                const moduleSchedule = (course.moduleSchedule || []).find(ms => ms.moduleId.toString() === module._id.toString());
                const topicSchedules = moduleSchedule?.topicSchedules || [];
                const topicMap = new Map();
                module.topics.forEach(t => topicMap.set(t._id.toString(), t));

                // Determine effective list of topics (Scheduled instances + Unscheduled)
                const scheduledTopicIds = new Set();

                // 1. Scheduled
                topicSchedules.forEach(ts => {
                    if (ts.date && topicMap.has(ts.topicId.toString())) {
                        scheduledTopicIds.add(ts.topicId.toString());
                        const t = topicMap.get(ts.topicId.toString());

                        // Add to stats
                        courseStats.totalLectures++;
                        if (isTopicCompleted(t)) courseStats.completedLectures++; // Note: Time-based completion removed

                        if (t.assignmentProblems) {
                            courseStats.totalAssignments += t.assignmentProblems.length;
                            courseStats.completedAssignments += t.assignmentProblems.filter(p => isProblemCompleted(p._id)).length;
                        }
                        if (t.practiceProblems) {
                            courseStats.totalPractice += t.practiceProblems.length;
                            courseStats.completedPractice += t.practiceProblems.filter(p => isProblemCompleted(p._id)).length;
                        }
                    }
                });

                // 2. Unscheduled
                module.topics.forEach(t => {
                    // If not in schedule (or if we count repeats differently? stick to simpler "unique topics" or "scheduled instances"?)
                    // The frontend "activeDays" logic includes BOTH scheduled instances AND unscheduled topics.
                    // The "scheduledTopicIds" set above tracks what was scheduled. 
                    // But `topicSchedules` might have multiple entries for same topic (parts).
                    // The previous logic was: Filter t => !scheduledTopicIds.has(t._id).
                    // Let's use that same logic.

                    // Important: The set should track IDs found in schedule.
                    // Re-scan schedule to be sure we match frontend exclusion logic
                });

                const scheduledIdsSet = new Set(topicSchedules.map(ts => ts.topicId.toString()));

                module.topics.forEach(t => {
                    if (!scheduledIdsSet.has(t._id.toString())) {
                        courseStats.totalLectures++;
                        if (isTopicCompleted(t)) courseStats.completedLectures++;

                        if (t.assignmentProblems) {
                            courseStats.totalAssignments += t.assignmentProblems.length;
                            courseStats.completedAssignments += t.assignmentProblems.filter(p => isProblemCompleted(p._id)).length;
                        }
                        if (t.practiceProblems) {
                            courseStats.totalPractice += t.practiceProblems.length;
                            courseStats.completedPractice += t.practiceProblems.filter(p => isProblemCompleted(p._id)).length;
                        }
                    }
                });
            }
        });


        // Transform modules based on isLocked status and inject dates/dayNumbers
        const courseObj = course.toObject();
        courseObj.modules = courseObj.modules.map(module => {
            const isLocked = lockedModuleIds.has(module._id.toString());

            if (isLocked) {
                // Return only basic fields for locked modules so they appear in sidebar
                return {
                    _id: module._id,
                    title: module.title,
                    description: module.description,
                    isLocked: true,
                    topics: []
                };
            }

            // --- Multi-Day Logic Integration ---
            if (module.topics) {
                // 1. Get Schedule for this module
                const moduleSchedule = (course.moduleSchedule || []).find(ms => ms.moduleId.toString() === module._id.toString());
                const topicSchedules = moduleSchedule?.topicSchedules || [];

                // 2. Map Topic ID to Topic Object for easy lookup
                const topicMap = new Map();
                module.topics.forEach(t => topicMap.set(t._id.toString(), t));

                // 3. Separate Scheduled vs Unscheduled
                // Determine how many times each topic is scheduled (for "Part X" naming)
                const topicScheduleCount = {};
                topicSchedules.forEach(ts => {
                    const tId = ts.topicId.toString();
                    topicScheduleCount[tId] = (topicScheduleCount[tId] || 0) + 1;
                });

                // Track which "Part" we are on for each topic during iteration
                const topicCurrentPart = {};

                // Build Scheduled Sessions List
                const scheduledSessions = topicSchedules
                    .filter(ts => ts.date && topicMap.has(ts.topicId.toString()))
                    .map(ts => {
                        const tId = ts.topicId.toString();
                        const originalTopic = topicMap.get(tId);

                        // Increment part counter
                        topicCurrentPart[tId] = (topicCurrentPart[tId] || 0) + 1;

                        // Clone topic
                        const sessionTopic = { ...originalTopic };
                        sessionTopic.date = ts.date;

                        // Check Topic Completion (Assignment Based)
                        sessionTopic.isCompleted = isTopicCompleted(originalTopic);

                        // Map Problems with Status
                        if (sessionTopic.assignmentProblems) {
                            sessionTopic.assignmentProblems = sessionTopic.assignmentProblems.map(p => ({
                                ...p,
                                status: isProblemCompleted(p._id) ? 'Solved' : 'Unsolved'
                            }));
                        }
                        if (sessionTopic.practiceProblems) {
                            sessionTopic.practiceProblems = sessionTopic.practiceProblems.map(p => ({
                                ...p,
                                status: isProblemCompleted(p._id) ? 'Solved' : 'Unsolved'
                            }));
                        }

                        // Append ": Part X"
                        if (topicScheduleCount[tId] > 1) {
                            sessionTopic.topicName = `${sessionTopic.topicName || sessionTopic.title}: Part ${topicCurrentPart[tId]}`;
                        } else {
                            sessionTopic.topicName = sessionTopic.topicName || sessionTopic.title;
                        }

                        return sessionTopic;
                    });

                // Sort Scheduled Sessions by Date
                scheduledSessions.sort((a, b) => new Date(a.date) - new Date(b.date));

                // Build Unscheduled List
                const scheduledTopicIds = new Set(topicSchedules.map(ts => ts.topicId.toString()));
                const unscheduledSessions = module.topics
                    .filter(t => !scheduledTopicIds.has(t._id.toString()))
                    .map(t => {
                        const tObj = { ...t };
                        tObj.topicName = t.topicName || t.title;

                        // Check Topic Completion
                        tObj.isCompleted = isTopicCompleted(t);

                        // Map Problems with Status
                        if (tObj.assignmentProblems) {
                            tObj.assignmentProblems = tObj.assignmentProblems.map(p => ({
                                ...p,
                                status: isProblemCompleted(p._id) ? 'Solved' : 'Unsolved'
                            }));
                        }
                        if (tObj.practiceProblems) {
                            tObj.practiceProblems = tObj.practiceProblems.map(p => ({
                                ...p,
                                status: isProblemCompleted(p._id) ? 'Solved' : 'Unsolved'
                            }));
                        }
                        return tObj;
                    });

                // 4. Combine: Scheduled first, then Unscheduled
                const finalTopicList = [...scheduledSessions, ...unscheduledSessions];

                // 5. Assign Global Day Numbers
                finalTopicList.forEach(topic => {
                    topic.dayNumber = globalDayCounter++;
                });

                module.topics = finalTopicList;
            }

            return module;
        });

        // Remove the raw moduleSchedule from the response
        delete courseObj.moduleSchedule;

        // Inject Course Stats
        courseObj.stats = courseStats;

        res.json(courseObj);
    } catch (err) {
        console.error('[getCourseById] Error:', err);
        res.status(500).json({ msg: err.message });
    }
};

// Get trainee profile
export const getProfile = async (req, res) => {
    try {
        const trainee = await User.findById(req.user.id).select('-password');
        if (!trainee) return res.status(404).json({ msg: 'Profile not found' });
        res.json(trainee);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Setup or update trainee profile (basic info)
export const setupProfile = async (req, res) => {
    try {
        const { name, studentId, codingHandles } = req.body;
        // Explicitly NOT updating emails
        const trainee = await User.findByIdAndUpdate(
            req.user.id,
            { name, studentId, codingHandles },
            { new: true }
        ).select('-password');
        res.json(trainee);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Change Password
import bcrypt from 'bcryptjs';

export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const trainee = await User.findById(req.user.id);

        if (!trainee) return res.status(404).json({ msg: 'User not found' });

        const isMatch = await bcrypt.compare(oldPassword, trainee.password);
        if (!isMatch) return res.status(400).json({ msg: 'Incorrect current password' });

        const salt = await bcrypt.genSalt(10);
        trainee.password = await bcrypt.hash(newPassword, salt);
        await trainee.save();

        res.json({ msg: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Upload resume file
// Upload resume file
export const uploadResume = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
        const resumeUrl = req.file.path;
        await User.findByIdAndUpdate(req.user.id, { resume: resumeUrl });
        res.json({ msg: 'Resume uploaded', resume: resumeUrl });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Download resume
// Delete resume
export const deleteResume = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { $unset: { resume: "" } });
        res.json({ msg: 'Resume removed successfully' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Download resume (Redirect to Cloudinary URL)
export const downloadResume = async (req, res) => {
    try {
        const trainee = await User.findById(req.user.id);
        if (!trainee || !trainee.resume) {
            return res.status(404).json({ msg: 'Resume not found' });
        }
        res.redirect(trainee.resume);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Get trainee dashboard data (progress, batches)
export const getDashboard = async (req, res) => {
    try {
        const traineeId = req.user.id;
        const progress = await TraineeProgress.find({ trainee: traineeId }).populate('batch');
        const batches = await Batch.find({ trainees: traineeId }).populate('course');

        // Filter out locked modules for trainees
        const sanitizedBatches = batches.map(batch => {
            const batchObj = batch.toObject();
            if (batchObj.course && batchObj.course.modules) {
                batchObj.course.modules = batchObj.course.modules.filter(module => !module.isLocked);
            }
            return batchObj;
        });

        res.json({ progress, batches: sanitizedBatches });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Get schedule for a specific batch (must be assigned)
export const getBatchSchedule = async (req, res) => {
    try {
        const traineeId = req.user.id;
        const batchId = req.params.batchId;

        const batch = await Batch.findOne({ _id: batchId, trainees: traineeId });
        if (!batch) return res.status(403).json({ msg: 'Access denied to this batch' });

        const schedule = await Schedule.find({ batch: batchId }).sort('dayNumber');
        res.json(schedule);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Save or Update a Topic Note
export const saveTopicNote = async (req, res) => {
    try {
        const { courseId, topicId, note } = req.body;
        const traineeId = req.user.id;

        // Upsert the note
        const topicNote = await TopicNote.findOneAndUpdate(
            { user: traineeId, course: courseId, topicId: topicId },
            { note },
            { new: true, upsert: true }
        );

        res.json(topicNote);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Get a Topic Note
export const getTopicNote = async (req, res) => {
    try {
        const { courseId, topicId } = req.params;
        const traineeId = req.user.id;

        const topicNote = await TopicNote.findOne({
            user: traineeId,
            course: courseId,
            topicId: topicId
        });

        res.json(topicNote || { note: '' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};


// Toggle Problem Completion Status
export const toggleProblemCompletion = async (req, res) => {
    try {
        const { courseId, problemId, status } = req.body; // status: 'Solved' or 'Unsolved'
        const traineeId = req.user.id;

        // Find the batch for this trainee and course
        const batch = await Batch.findOne({
            course: courseId,
            trainees: traineeId
        });

        if (!batch) {
            return res.status(404).json({ msg: 'Batch not found for this course.' });
        }

        // Find or Create Progress
        let progress = await TraineeProgress.findOne({
            batch: batch._id,
            trainee: traineeId
        });

        if (!progress) {
            progress = new TraineeProgress({
                trainee: traineeId,
                batch: batch._id,
                date: new Date(),
                completedAssignments: []
            });
        }

        // Update completedAssignments based on status
        const pIdStr = problemId.toString();
        const currentCompleted = new Set(progress.completedAssignments.map(id => id.toString()));

        if (status === 'Solved') {
            currentCompleted.add(pIdStr);
        } else {
            currentCompleted.delete(pIdStr);
        }

        progress.completedAssignments = Array.from(currentCompleted);
        await progress.save();

        res.json({
            msg: 'Progress updated',
            completedAssignments: progress.completedAssignments
        });

    } catch (err) {
        console.error('Error toggling problem:', err);
        res.status(500).json({ msg: err.message });
    }
};
