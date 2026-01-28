import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from './src/models/Course.js';
import Module from './src/models/Module.js';
import Topic from './src/models/Topic.js';
import User from './src/models/User.js';

dotenv.config();

const seedVerificationData = async () => {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log('Connected to MongoDB for verification seeding...');

        // 1. Create a Dummy Course
        const courseTitle = "Day Numbering Verification Course " + Date.now(); // Ensure unique
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 30); // 30 day course

        const course = new Course({
            title: courseTitle,
            description: "A course to verify automatic day numbering logic.",
            startDate: startDate,
            endDate: endDate,
            excludedDays: [0], // Sundays
            modules: [],
            moduleSchedule: []
        });

        // 2. Create Dummy Topics
        const topicNames = ['Introduction (Day 1)', 'Variables (Day 2)', 'Data Types (Day 2 - Same Day)', 'Functions (Day 3)', 'Classes (Day 4 - Gap Day)'];
        const topics = [];

        for (const name of topicNames) {
            const topic = new Topic({
                topicName: name,
                description: `Description for ${name}`,
                // dayNumber field removed from schema, so we don't set it
                assignmentProblems: [],
                practiceProblems: []
            });
            await topic.save();
            topics.push(topic);
        }
        console.log(`Created ${topics.length} topics.`);

        // 3. Create a Dummy Module
        const module = new Module({
            title: "Core Concepts",
            description: "Module for verification",
            topics: topics.map(t => t._id)
        });
        await module.save();
        console.log(`Created Module: ${module.title}`);

        // 4. Link Module to Course
        course.modules.push(module._id);

        // 5. Schedule Topics (The Core Verification Step)
        // We will schedule them on:
        // T1: Today (Date 1) -> Should be Day 1
        // T2: Tomorrow (Date 2) -> Should be Day 2
        // T3: Tomorrow (Date 2) -> Should be Day 2 (Testing Day Grouping)
        // T4: Day After Tomorrow (Date 3) -> Should be Day 3
        // T5: 5 Days from now (Date 5) -> Should be Day 4 (Testing Sequence works despite date gap)

        const d1 = new Date(startDate);
        const d2 = new Date(startDate); d2.setDate(d2.getDate() + 1);
        const d3 = new Date(startDate); d3.setDate(d3.getDate() + 2);
        const d5 = new Date(startDate); d5.setDate(d5.getDate() + 4); // +4 days = Date 5

        const schedule = {
            moduleId: module._id,
            topicSchedules: [
                { topicId: topics[0]._id, date: d1 },
                { topicId: topics[1]._id, date: d2 },
                { topicId: topics[2]._id, date: d2 },
                { topicId: topics[3]._id, date: d3 },
                { topicId: topics[4]._id, date: d5 }
            ]
        };

        course.moduleSchedule.push(schedule);
        await course.save();

        console.log(`\nSuccessfully created Verification Course: "${courseTitle}"`);
        console.log(`Course ID: ${course._id}`);
        console.log('--------------------------------------------------');
        console.log('Expected Outcome in UI:');
        console.log(`${topicNames[0]} -> Day 1 (${d1.toDateString()})`);
        console.log(`${topicNames[1]} -> Day 2 (${d2.toDateString()})`);
        console.log(`${topicNames[2]} -> Day 2 (${d2.toDateString()})`);
        console.log(`${topicNames[3]} -> Day 3 (${d3.toDateString()})`);
        console.log(`${topicNames[4]} -> Day 4 (${d5.toDateString()}) - Note the date gap`);
        console.log('--------------------------------------------------');

        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seedVerificationData();
