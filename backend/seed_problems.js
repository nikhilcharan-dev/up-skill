import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Problem from './src/models/Problem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const seedProblems = async () => {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log('✅ Connected to MongoDB for seeding problems...\n');

        console.log('═══════════════════════════════════════════════════════');
        console.log('           IMPORTING PROBLEM BANK                      ');
        console.log('═══════════════════════════════════════════════════════\n');

        // Read the JSON file
        const jsonPath = path.join(__dirname, 'src', 'test.questionbanks.json');
        console.log(`📖 Reading problems from: ${jsonPath}`);

        const jsonData = fs.readFileSync(jsonPath, 'utf-8');
        const problems = JSON.parse(jsonData);

        console.log(`📊 Total problems in JSON: ${problems.length}\n`);

        console.log('🔄 Processing and importing problems...');
        console.log('─────────────────────────────────────\n');

        let imported = 0;
        let skipped = 0;
        let errors = 0;

        // Process in batches for better performance
        const batchSize = 100;
        const batches = Math.ceil(problems.length / batchSize);

        for (let i = 0; i < batches; i++) {
            const start = i * batchSize;
            const end = Math.min((i + 1) * batchSize, problems.length);
            const batch = problems.slice(start, end);

            const transformedProblems = batch.map(problem => ({
                title: problem.name,
                link: problem.link,
                platform: problem.platform || 'Other',
                difficulty: problem.difficulty || 'Medium',
                category: 'DSA', // All problems default to DSA category
                tags: problem.topics || [], // Map topics to tags
            }));

            try {
                // Use insertMany with ordered: false to continue on duplicates
                const result = await Problem.insertMany(transformedProblems, {
                    ordered: false,
                    rawResult: true
                });

                imported += result.insertedCount || transformedProblems.length;

                // Progress indicator
                if ((i + 1) % 10 === 0 || i === batches - 1) {
                    const progress = Math.round(((i + 1) / batches) * 100);
                    console.log(`   Progress: ${progress}% (${imported} imported, ${skipped} skipped, ${errors} errors)`);
                }
            } catch (err) {
                // Handle duplicate key errors (E11000)
                if (err.code === 11000) {
                    // Some problems in the batch were duplicates
                    const insertedCount = err.result?.result?.insertedCount || 0;
                    imported += insertedCount;
                    skipped += transformedProblems.length - insertedCount;
                } else {
                    console.error(`   ⚠️  Batch ${i + 1} error:`, err.message);
                    errors += transformedProblems.length;
                }
            }
        }

        console.log('\n═══════════════════════════════════════════════════════');
        console.log('                  IMPORT SUMMARY                       ');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`   ✅ Successfully Imported: ${imported} problems`);
        console.log(`   ⏭️  Skipped (Duplicates):  ${skipped} problems`);
        console.log(`   ❌ Errors:                ${errors} problems`);
        console.log(`   📊 Total Processed:       ${problems.length} problems`);
        console.log('═══════════════════════════════════════════════════════\n');

        if (imported > 0) {
            console.log('✅ Problem bank import completed successfully!\n');
            console.log('💡 Field Mapping Applied:');
            console.log('   • name → title');
            console.log('   • topics → tags');
            console.log('   • category → DSA (default)');
            console.log('   • difficulty, platform, link → preserved as-is\n');
        } else {
            console.log('ℹ️  No new problems were imported (all might already exist).\n');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Import failed:', err.message);
        console.error(err);
        process.exit(1);
    }
};

seedProblems();
