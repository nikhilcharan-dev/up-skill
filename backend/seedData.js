
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Topic from './src/models/Topic.js';
import Module from './src/models/Module.js';
import Course from './src/models/Course.js';
import User from './src/models/User.js'; // Assuming we need an admin to assign createdBy

dotenv.config();

const DB_URI = process.env.DB_URI || 'mongodb://localhost:27017/fullstack';

// Hardcoded Data from Image
const modulesData = [
    {
        name: "DSA 1",
        topics: [
            { name: "Maths Session", dates: ["12/12/2025"] },
            { name: "Lab Session on Maths", dates: ["13/12/2025", "15/12/2025"] },
            { name: "Practice Session on Maths", dates: ["Task"] },
            { name: "Bit Manipulation (Basics + Advanced)", dates: ["16/12/2025", "17/12/2025"] },
            { name: "Lab Session on Bit Manipulation", dates: ["18/12/2025"] },
            { name: "Practice Session on Bit Manipulation", dates: ["Task"] },
            { name: "Implementation", dates: ["19/12/2025"] },
            { name: "Lab Session on Implementation", dates: ["20/12/2025"] },
            { name: "Practice Session on Implementation", dates: ["Task"] }
        ]
    },
    {
        name: "DSA 2",
        topics: [
            { name: "Prefix Sum & Difference Array", dates: ["22/12/2025", "23/12/2025"] },
            { name: "Lab Session on Prefix Sum & Difference Array", dates: ["24/12/2025", "25/12/2025"] },
            { name: "Practice Session on Prefix Sum & Difference Array", dates: ["Task"] },
            { name: "Sliding Window", dates: ["26/12/2025"] },
            { name: "Lab Session on Sliding Window – 1", dates: ["27/12/2025"] },
            { name: "Lab Session on Sliding Window – 2", dates: ["06/01/2026"] },
            { name: "Lab Session on Sliding Window – 3", dates: ["07/01/2026"] },
            { name: "Practice Session on Sliding Window", dates: ["Task"] },
            { name: "Two Pointer", dates: ["21/01/2026"] },
            { name: "Lab Session on Two Pointer – 1", dates: ["22/01/2026"] },
            { name: "Lab Session on Two Pointer – 2", dates: ["23/01/2026"] },
            { name: "Lab Session on Two Pointer – 3", dates: ["24/01/2026"] }
        ]
    },
    {
        name: "DSA 3",
        topics: [
            { name: "Divide and Conquer", dates: ["27/01/2026", "28/01/2026"] },
            { name: "Lab Session on Divide and Conquer – 1", dates: ["29/01/2026"] },
            { name: "Lab Session on Divide and Conquer – 2", dates: ["30/01/2026"] },
            { name: "Practice Session on Divide and Conquer", dates: ["Task"] },
            { name: "Binary Search", dates: ["31/01/2026"] },
            { name: "Lab Session on Binary Search", dates: ["09/02/2026"] },
            { name: "Binary Search on Answer", dates: ["10/02/2026"] },
            { name: "Lab Session on Binary Search on Answer – 1", dates: ["11/02/2026"] },
            { name: "Lab Session on Binary Search on Answer – 2", dates: ["12/02/2026"] },
            { name: "Lab Session on Binary Search on Answer – 3", dates: ["13/02/2026"] },
            { name: "Practice Session on Binary Search", dates: ["Task"] },
            { name: "Greedy Algorithms", dates: ["16/02/2026"] },
            { name: "Lab Session on Greedy – 1", dates: ["17/02/2026"] },
            { name: "Lab Session on Greedy – 2", dates: ["18/02/2026"] },
            { name: "Lab Session on Greedy – 3", dates: ["19/02/2026"] },
            { name: "Practice Session on Greedy", dates: ["Task"] },
            { name: "GCD, LCM, Euclid Algorithm", dates: ["20/02/2026"] },
            { name: "Lab Session on GCD & LCM", dates: ["21/02/2026"] },
            { name: "Practice Session on GCD & LCM", dates: ["22/02/2026"] }
        ]
    },
    {
        name: "DSA 4",
        topics: [
            { name: "Recursion & Backtracking", dates: ["23/02/2026", "24/02/2026"] },
            { name: "Lab Session on Recursion & Backtracking – 1", dates: ["25/02/2026"] },
            { name: "Lab Session on Recursion & Backtracking – 2", dates: ["26/02/2026"] },
            { name: "Lab Session on Recursion & Backtracking – 3", dates: ["27/02/2026"] },
            { name: "Practice Session on Recursion & Backtracking", dates: ["Task"] },
            { name: "Combinations & Permutations", dates: ["28/02/2026", "02/03/2026"] },
            { name: "Lab Session on Combinations & Permutations – 1", dates: ["03/03/2026"] },
            { name: "Lab Session on Combinations & Permutations – 2", dates: ["04/03/2026"] },
            { name: "Practice Session on Combinations & Permutations", dates: ["Task"] },
            { name: "Linked List", dates: ["05/03/2026", "06/03/2026"] },
            { name: "Lab Session on Linked List – 1", dates: ["07/03/2026"] },
            { name: "Lab Session on Linked List – 2", dates: ["09/03/2026"] },
            { name: "Practice Session on Linked List", dates: ["Task"] },
            { name: "Stacks", dates: ["10/03/2026", "11/03/2026"] },
            { name: "Queues", dates: ["12/03/2026", "13/03/2026"] },
            { name: "Lab Session on Stacks & Queues – 1", dates: ["14/03/2026"] },
            { name: "Lab Session on Stacks & Queues – 2", dates: ["16/03/2026"] },
            { name: "Practice Session on Stacks & Queues", dates: ["Task"] }
        ]
    },
    {
        name: "DSA 5",
        topics: [
            { name: "Trees (Binary Tree + BST)", dates: ["Yet to be planned"] },
            { name: "Lab Session on Trees – 1", dates: ["Yet to be planned"] },
            { name: "Lab Session on Trees – 2", dates: ["Yet to be planned"] },
            { name: "Lab Session on Trees – 3", dates: ["Yet to be planned"] },
            { name: "Practice Session on Trees", dates: ["Yet to be planned"] },
            { name: "Dynamic Programming Introduction", dates: ["Yet to be planned"] },
            { name: "1D DP", dates: ["Yet to be planned"] },
            { name: "2D DP", dates: ["Yet to be planned"] },
            { name: "Lab Session on DP – 1", dates: ["Yet to be planned"] },
            { name: "Lab Session on DP – 2", dates: ["Yet to be planned"] },
            { name: "Lab Session on DP – 3", dates: ["Yet to be planned"] },
            { name: "Lab Session on DP – 4", dates: ["Yet to be planned"] },
            { name: "Lab Session on DP – 5", dates: ["Yet to be planned"] },
            { name: "Modular Arithmetic", dates: ["Yet to be planned"] },
            { name: "Probability Basics", dates: ["Yet to be planned"] },
            { name: "Lab Session on Maths for DP – 1", dates: ["Yet to be planned"] },
            { name: "Digit DP", dates: ["Yet to be planned"] },
            { name: "Bit masking DP", dates: ["Yet to be planned"] },
            { name: "Lab Session on Advanced DP – 1", dates: ["Yet to be planned"] },
            { name: "Lab Session on Advanced DP – 2", dates: ["Yet to be planned"] },
            { name: "Lab Session on Advanced DP – 3", dates: ["Yet to be planned"] },
            { name: "Game Theory (Nim, Grundy)", dates: ["Yet to be planned"] },
            { name: "Lab Session on Game Theory – 1", dates: ["Yet to be planned"] },
            { name: "Graphs (Beginner → Advanced)", dates: ["Yet to be planned"] },
            { name: "Lab Session on Graphs – 1", dates: ["Yet to be planned"] },
            { name: "Lab Session on Graphs – 2", dates: ["Yet to be planned"] },
            { name: "Lab Session on Graphs – 3", dates: ["Yet to be planned"] },
            { name: "Lab Session on Graphs – 4", dates: ["Yet to be planned"] },
            { name: "Segment Tree", dates: ["Yet to be planned"] },
            { name: "Fenwick Tree (BIT)", dates: ["Yet to be planned"] },
            { name: "Trie", dates: ["Yet to be planned"] },
            { name: "String Matching Algorithms", dates: ["Yet to be planned"] },
            { name: "Lab Session on Advanced DS & Strings – 1", dates: ["Yet to be planned"] },
            { name: "Lab Session on Advanced DS & Strings – 2", dates: ["Yet to be planned"] },
            { name: "Lab Session on Advanced DS & Strings – 3", dates: ["Yet to be planned"] }
        ]
    }
];

// Helper to parse DD/MM/YYYY
const parseDate = (dateStr) => {
    if (!dateStr || dateStr === "Task" || dateStr === "Yet to be planned") return null;
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month}-${day}`);
};

const seed = async () => {
    try {
        await mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB');

        // Find an admin user to assign createdBy
        const admin = await User.findOne({ role: 'admin' });
        const adminId = admin ? admin._id : new mongoose.Types.ObjectId(); // Fallback if no admin

        const moduleIds = [];
        const moduleSchedules = [];

        // Track Modules to Lock (DSA 3, 4, 5)
        // IDs to lock
        const modulesToLock = [];

        for (const modData of modulesData) {
            console.log(`Processing Module: ${modData.name}`);

            const topicIds = [];
            const topicSchedulesForModule = []; // Schedules specific to this module

            for (const topicData of modData.topics) {
                // Create Topic
                const topic = new Topic({
                    topicName: topicData.name,
                    description: `Topic for ${modData.name}: ${topicData.name}`,
                    createdBy: adminId,
                    assignmentProblems: [],
                    practiceProblems: []
                });
                const savedTopic = await topic.save();
                topicIds.push(savedTopic._id);

                // Handle Schedule
                for (const dateStr of topicData.dates) {
                    const date = parseDate(dateStr);
                    if (date) {
                        topicSchedulesForModule.push({
                            topicId: savedTopic._id,
                            date: date
                        });
                    }
                }
            }

            // Create Module
            const module = new Module({
                title: modData.name,
                description: `Module covering ${modData.name} topics.`,
                topics: topicIds,
                createdBy: adminId
            });
            const savedModule = await module.save();
            moduleIds.push(savedModule._id);

            // Add to Schedule object
            moduleSchedules.push({
                moduleId: savedModule._id,
                topicSchedules: topicSchedulesForModule
            });

            // Check if this module should be locked
            if (["DSA 3", "DSA 4", "DSA 5"].includes(modData.name)) {
                modulesToLock.push(savedModule._id);
            }
        }

        // Create Course
        const course = new Course({
            title: "Owl Coder",
            description: "Complete DSA Course",
            startDate: parseDate("12/12/2025"),
            endDate: parseDate("13/04/2026"), // Est end date
            modules: moduleIds,
            moduleSchedule: moduleSchedules,
            lockedModules: modulesToLock,
            createdBy: adminId
        });

        await course.save();
        console.log('Course "Owl Coder" created successfully.');

    } catch (err) {
        console.error('Seeding Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

seed();
