import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from './src/models/Course.js';
import Module from './src/models/Module.js';
import Topic from './src/models/Topic.js';

dotenv.config();

const seedOwlCoder = async () => {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log('✅ Connected to MongoDB for seeding Owl Coder course...\n');

        console.log('═══════════════════════════════════════════════════════');
        console.log('           SEEDING OWL CODER COURSE DATA               ');
        console.log('═══════════════════════════════════════════════════════\n');

        // ============================================
        // 1. CREATE TOPICS
        // ============================================
        console.log('📝 Step 1: Creating Topics...');
        console.log('─────────────────────────────────────');

        const topicsData = {
            // DSA 1 Topics
            dsa1: [
                { name: 'Maths Session', description: 'Introduction to mathematical concepts' },
                { name: 'Lab Session on Maths', description: 'Hands-on practice with maths problems' },
                { name: 'Practice Session on Maths', description: 'Practice problems for maths' },
                { name: 'Lab Session on Bit Manipulation-1', description: 'Basic bit manipulation techniques' },
                { name: 'Lab Session on Bit Manipulation', description: 'Advanced bit manipulation' },
                { name: 'Practice Session on Bit Manipulation', description: 'Bit manipulation practice' },
                { name: 'Lab Session on Implementation', description: 'Implementation techniques' },
                { name: 'Practice Session on Implementation', description: 'Implementation practice' },
                { name: 'Task', description: 'Task assignment' },
                { name: 'Prefix Sum & Difference Array', description: 'Prefix sum and difference array concepts' },
                { name: 'Lab Session on Prefix Sum & Difference Array', description: 'Practice on prefix sums' },
                { name: 'Practice Session on Prefix Sum & Difference Array', description: 'Additional practice' },
            ],
            // DSA 2 Topics
            dsa2: [
                { name: 'Sliding Window', description: 'Sliding window technique' },
                { name: 'Lab Session on Sliding Window - 1', description: 'Basic sliding window problems' },
                { name: 'Lab Session on Sliding Window - 2', description: 'Advanced sliding window' },
                { name: 'Lab Session on Sliding Window - 3', description: 'Complex sliding window' },
                { name: 'Task', description: 'Task assignment' },
                { name: 'Two Pointer', description: 'Two pointer technique' },
                { name: 'Lab Session on Two Pointer - 1', description: 'Basic two pointer' },
                { name: 'Lab Session on Two Pointer - 2', description: 'Intermediate two pointer' },
                { name: 'Lab Session on Two Pointer - 3', description: 'Advanced two pointer' },
                { name: 'Divide and Conquer', description: 'Divide and conquer paradigm' },
                { name: 'Lab Session on Divide and Conquer - 1', description: 'D&C practice 1' },
                { name: 'Lab Session on Divide and Conquer - 2', description: 'D&C practice 2' },
            ],
            // DSA 3 Topics
            dsa3: [
                { name: 'Binary Search', description: 'Binary search algorithm' },
                { name: 'Lab Session on Binary Search on Answer - 1', description: 'Binary search on answer space' },
                { name: 'Lab Session on Binary Search on Answer - 2', description: 'Advanced BS on answer' },
                { name: 'Lab Session on Binary Search on Answer - 3', description: 'Expert BS on answer' },
                { name: 'Practice Session on Binary Search', description: 'Binary search practice' },
                { name: 'Task', description: 'Task assignment' },
                { name: 'Greedy Algorithms', description: 'Greedy algorithm paradigm' },
                { name: 'Lab Session on Greedy - 1', description: 'Basic greedy problems' },
                { name: 'Lab Session on Greedy - 2', description: 'Intermediate greedy' },
                { name: 'Lab Session on Greedy - 3', description: 'Advanced greedy' },
                { name: 'Task', description: 'Task assignment' },
            ],
            // DSA 4 Topics
            dsa4: [
                { name: 'GCD & LCM', description: 'Greatest common divisor and least common multiple' },
                { name: 'Lab Session on GCD & LCM', description: 'GCD & LCM practice' },
                { name: 'Practice Session on GCD & LCM', description: 'Additional practice' },
                { name: 'Recursion & Backtracking', description: 'Recursion and backtracking concepts' },
                { name: 'Lab Session on Recursion & Backtracking - 1', description: 'Basic recursion' },
                { name: 'Lab Session on Recursion & Backtracking - 2', description: 'Intermediate backtracking' },
                { name: 'Lab Session on Recursion & Backtracking - 3', description: 'Advanced recursion' },
                { name: 'Task', description: 'Task assignment' },
                { name: 'Combinatorics & Permutations', description: 'Combinatorics concepts' },
                { name: 'Lab Session on Combinatorics & Permutations - 1', description: 'Basic combinatorics' },
                { name: 'Lab Session on Combinatorics & Permutations - 2', description: 'Advanced permutations' },
                { name: 'Lab Session on Combinatorics & Permutations - 3', description: 'Expert level' },
                { name: 'Linked List', description: 'Linked list data structure' },
                { name: 'Lab Session on Linked List - 1', description: 'Basic linked list' },
                { name: 'Lab Session on Linked List - 2', description: 'Intermediate linked list' },
                { name: 'Lab Session on Linked List - 3', description: 'Advanced linked list' },
                { name: 'Task', description: 'Task assignment' },
                { name: 'Stacks', description: 'Stack data structure' },
                { name: 'Queues', description: 'Queue data structure' },
                { name: 'Lab Session on Stack & Queues - 1', description: 'Basic stack/queue' },
                { name: 'Lab Session on Stack & Queues - 2', description: 'Advanced stack/queue' },
                { name: 'Task', description: 'Task assignment' },
                { name: 'Trees (Binary Tree + BST)', description: 'Tree data structures' },
                { name: 'Practice Session on Trees & Graphs', description: 'Trees and graphs practice' },
                { name: 'Lab Session on Trees - 1', description: 'Basic trees' },
                { name: 'Lab Session on Trees - 2', description: 'Intermediate trees' },
                { name: 'Lab Session on Trees - 3', description: 'Advanced trees' },
                { name: 'Practice Session on Trees & Graphs', description: 'Additional practice' },
                { name: 'Dynamic Programming Introduction', description: 'Introduction to DP' },
                { name: '1D DP', description: 'One-dimensional DP' },
                { name: 'Lab Session on DP - 1', description: 'Basic DP' },
                { name: 'Lab Session on DP - 2', description: 'Intermediate DP' },
                { name: 'Lab Session on DP - 3', description: 'Advanced DP' },
                { name: 'Lab Session on DP - 4', description: 'Expert DP' },
                { name: 'Lab Session on DP - 5', description: 'Master DP' },
                { name: 'Task', description: 'Task assignment' },
                { name: 'Modular Arithmetic', description: 'Modular arithmetic concepts' },
                { name: 'Probability Basics', description: 'Basic probability' },
                { name: 'Lab Session on Maths for DP - 1', description: 'Math for DP part 1' },
                { name: 'Task', description: 'Task assignment' },
                { name: 'Digit DP', description: 'Digit dynamic programming' },
                { name: 'Bit masking DP', description: 'Bitmask DP technique' },
                { name: 'Lab Session on Advanced DP & Strings - 1', description: 'Advanced DP 1' },
                { name: 'Lab Session on Advanced DP & Strings - 2', description: 'Advanced DP 2' },
            ],
            // DSA 5 Topics (All to be planned)
            dsa5: [
                { name: 'Game Theory (Nim, Grundy)', description: 'Game theory concepts - Yet to be planned' },
                { name: 'Lab Session on Game Theory - 1', description: 'Game theory practice - Yet to be planned' },
                { name: 'Graphs (Beginner -> Advanced)', description: 'Graph algorithms - Yet to be planned' },
                { name: 'Lab Session on Graph - 1', description: 'Graph practice 1 - Yet to be planned' },
                { name: 'Lab Session on Graph - 2', description: 'Graph practice 2 - Yet to be planned' },
                { name: 'Lab Session on Graph - 3', description: 'Graph practice 3 - Yet to be planned' },
                { name: 'Lab Session on Graphs - 1', description: 'Graphs practice 1 - Yet to be planned' },
                { name: 'Lab Session on Graphs - 2', description: 'Graphs practice 2 - Yet to be planned' },
                { name: 'Lab Session on Graphs - 3', description: 'Graphs practice 3 - Yet to be planned' },
                { name: 'Lab Session on Graphs - 4', description: 'Graphs practice 4 - Yet to be planned' },
                { name: 'Segment Tree', description: 'Segment tree data structure - Yet to be planned' },
                { name: 'Fenwick Tree', description: 'Fenwick tree (BIT) - Yet to be planned' },
                { name: 'String Matching Algorithms', description: 'String matching - Yet to be planned' },
                { name: 'Lab Session on Advanced Data Structures', description: 'Advanced DS - Yet to be planned' },
            ],
        };

        const createdTopics = {};

        for (const [module, topics] of Object.entries(topicsData)) {
            createdTopics[module] = [];
            for (const topicData of topics) {
                const topic = new Topic({
                    topicName: topicData.name,
                    description: topicData.description,
                });
                await topic.save();
                createdTopics[module].push(topic);
            }
            console.log(`   ✅ Created ${topics.length} topics for ${module.toUpperCase()}`);
        }

        console.log('');

        // ============================================
        // 2. CREATE MODULES
        // ============================================
        console.log('📦 Step 2: Creating Modules...');
        console.log('─────────────────────────────────────');

        const dsa1Module = new Module({
            title: 'DSA 1',
            description: 'Fundamentals: Maths, Bit Manipulation, Arrays',
            topics: createdTopics.dsa1.map(t => t._id),
        });
        await dsa1Module.save();
        console.log('   ✅ Created DSA 1 module');

        const dsa2Module = new Module({
            title: 'DSA 2',
            description: 'Problem Solving Techniques: Sliding Window, Two Pointer, Divide & Conquer',
            topics: createdTopics.dsa2.map(t => t._id),
        });
        await dsa2Module.save();
        console.log('   ✅ Created DSA 2 module');

        const dsa3Module = new Module({
            title: 'DSA 3',
            description: 'Binary Search & Greedy Algorithms',
            topics: createdTopics.dsa3.map(t => t._id),
        });
        await dsa3Module.save();
        console.log('   ✅ Created DSA 3 module');

        const dsa4Module = new Module({
            title: 'DSA 4',
            description: 'Advanced Topics: Recursion, Data Structures, DP Introduction',
            topics: createdTopics.dsa4.map(t => t._id),
        });
        await dsa4Module.save();
        console.log('   ✅ Created DSA 4 module');

        const dsa5Module = new Module({
            title: 'DSA 5',
            description: 'Expert Level: Game Theory, Advanced Graphs, Advanced Data Structures',
            topics: createdTopics.dsa5.map(t => t._id),
        });
        await dsa5Module.save();
        console.log('   ✅ Created DSA 5 module');

        console.log('');

        // ============================================
        // 3. CREATE COURSE WITH SCHEDULING
        // ============================================
        console.log('📚 Step 3: Creating Course "Owl Coder"...');
        console.log('─────────────────────────────────────');

        const parseDate = (dateStr) => {
            const [day, month, year] = dateStr.split('/');
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        };

        // DSA 1 Schedule (from spreadsheet)
        const dsa1Schedule = {
            moduleId: dsa1Module._id,
            topicSchedules: [
                { topicId: createdTopics.dsa1[0]._id, date: parseDate('12/12/2025') }, // Maths Session
                { topicId: createdTopics.dsa1[1]._id, date: parseDate('13/12/2025') }, // Lab Session on Maths
                { topicId: createdTopics.dsa1[1]._id, date: parseDate('15/12/2025') }, // Lab Session on Maths (multi-day)
                { topicId: createdTopics.dsa1[2]._id, date: parseDate('16/12/2025') }, // Practice Session on Maths
                { topicId: createdTopics.dsa1[3]._id, date: parseDate('17/12/2025') }, // Lab Session on Bit Manipulation-1
                { topicId: createdTopics.dsa1[4]._id, date: parseDate('18/12/2025') }, // Lab Session on Bit Manipulation
                { topicId: createdTopics.dsa1[5]._id, date: parseDate('19/12/2025') }, // Practice Session on Bit Manipulation
                { topicId: createdTopics.dsa1[6]._id, date: parseDate('20/12/2025') }, // Lab Session on Implementation
                { topicId: createdTopics.dsa1[7]._id, date: parseDate('21/12/2025') }, // Practice Session on Implementation
                { topicId: createdTopics.dsa1[8]._id, date: parseDate('23/12/2025') }, // Task
                { topicId: createdTopics.dsa1[9]._id, date: parseDate('22/12/2025') }, // Prefix Sum
                { topicId: createdTopics.dsa1[10]._id, date: parseDate('24/12/2025') }, // Lab Session Prefix Sum
                { topicId: createdTopics.dsa1[10]._id, date: parseDate('25/12/2025') }, // Lab Session Prefix Sum (multi-day)
                { topicId: createdTopics.dsa1[11]._id, date: parseDate('26/12/2025') }, // Practice Session
            ],
        };

        // DSA 2 Schedule (from spreadsheet)
        const dsa2Schedule = {
            moduleId: dsa2Module._id,
            topicSchedules: [
                { topicId: createdTopics.dsa2[0]._id, date: parseDate('28/12/2025') }, // Sliding Window
                { topicId: createdTopics.dsa2[1]._id, date: parseDate('01/01/2026') }, // Lab Session SW - 1
                { topicId: createdTopics.dsa2[1]._id, date: parseDate('02/01/2026') }, // Lab Session SW - 1 (multi-day)
                { topicId: createdTopics.dsa2[2]._id, date: parseDate('27/12/2025') }, // Lab Session SW - 2
                { topicId: createdTopics.dsa2[3]._id, date: parseDate('06/01/2026') }, // Lab Session SW - 3
                { topicId: createdTopics.dsa2[4]._id, date: parseDate('07/01/2026') }, // Task
                { topicId: createdTopics.dsa2[5]._id, date: parseDate('21/01/2026') }, // Two Pointer
                { topicId: createdTopics.dsa2[6]._id, date: parseDate('22/01/2026') }, // Lab Two Pointer - 1
                { topicId: createdTopics.dsa2[7]._id, date: parseDate('23/01/2026') }, // Lab Two Pointer - 2
                { topicId: createdTopics.dsa2[8]._id, date: parseDate('24/01/2026') }, // Lab Two Pointer - 3
                { topicId: createdTopics.dsa2[9]._id, date: parseDate('28/01/2026') }, // Divide and Conquer
                { topicId: createdTopics.dsa2[10]._id, date: parseDate('29/01/2026') }, // Lab D&C - 1
                { topicId: createdTopics.dsa2[11]._id, date: parseDate('30/01/2026') }, // Lab D&C - 2
            ],
        };

        // Create the course
        const owlCoderCourse = new Course({
            title: 'Owl Coder',
            description: 'Comprehensive DSA training program from fundamentals to expert level',
            startDate: parseDate('12/12/2025'),
            endDate: parseDate('30/01/2026'), // Based on last scheduled date
            excludedDays: [0], // Exclude Sundays
            modules: [
                dsa1Module._id,
                dsa2Module._id,
                dsa3Module._id,
                dsa4Module._id,
                dsa5Module._id,
            ],
            moduleSchedule: [
                dsa1Schedule,
                dsa2Schedule,
                // DSA 3, 4, 5 are NOT scheduled (locked modules)
            ],
            lockedModules: [
                dsa3Module._id,
                dsa4Module._id,
                dsa5Module._id,
            ], // 🔒 Lock DSA 3, 4, 5 for this course
        });

        await owlCoderCourse.save();
        console.log('   ✅ Created course "Owl Coder"');
        console.log(`   📅 Start Date: ${owlCoderCourse.startDate.toDateString()}`);
        console.log(`   📅 End Date: ${owlCoderCourse.endDate.toDateString()}`);
        console.log('');

        // ============================================
        // 4. SUMMARY
        // ============================================
        console.log('═══════════════════════════════════════════════════════');
        console.log('                  SEEDING SUMMARY                      ');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`   📚 Course: Owl Coder`);
        console.log(`   📦 Modules: 5 (2 scheduled, 3 locked)`);
        console.log(`   📝 Topics: ${Object.values(createdTopics).flat().length}`);
        console.log('');
        console.log('   ✅ DSA 1 - Scheduled with ${dsa1Schedule.topicSchedules.length} topic dates');
        console.log('   ✅ DSA 2 - Scheduled with ${dsa2Schedule.topicSchedules.length} topic dates');
        console.log('   🔒 DSA 3 - Locked (no scheduling)');
        console.log('   🔒 DSA 4 - Locked (no scheduling)');
        console.log('   🔒 DSA 5 - Locked (no scheduling)');
        console.log('═══════════════════════════════════════════════════════\n');
        console.log('✅ Owl Coder course seeding completed successfully!\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        console.error(err);
        process.exit(1);
    }
};

seedOwlCoder();
