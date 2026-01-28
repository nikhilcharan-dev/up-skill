import { useState, useEffect, useMemo } from 'react';
import Button from './Button';
import { showToast } from './Notification';
import '../styles/ModuleTopicScheduler.css';

function ModuleTopicScheduler({ course, module, onSave, onClose }) {
    const [topicSchedules, setTopicSchedules] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initializeSchedules();
    }, [module, course]);

    const initializeSchedules = () => {
        if (!module || !module.topics) {
            setLoading(false);
            return;
        }

        // Find existing schedule for this module in this course
        const existingSchedule = course.moduleSchedule?.find(
            s => s.moduleId.toString() === module._id.toString()
        );

        // Initialize schedule for each topic
        const schedules = module.topics.map(topic => {
            const existingTopicSchedule = existingSchedule?.topicSchedules?.find(
                ts => ts.topicId.toString() === topic._id.toString()
            );

            return {
                topicId: topic._id,
                // Handle potential schema inconsistency (topicName vs title)
                topicName: topic.topicName || topic.title || 'Untitled Topic',
                description: topic.description,
                assignmentCount: (topic.assignmentProblems?.length || 0) + (topic.practiceProblems?.length || 0),
                date: existingTopicSchedule?.date || ''
            };
        });

        // Sort by existing date if available
        schedules.sort((a, b) => {
            if (a.date && b.date) return new Date(a.date) - new Date(b.date);
            if (a.date) return -1;
            if (b.date) return 1;
            return 0;
        });

        setTopicSchedules(schedules);
        setLoading(false);
    };

    // Calculate all unique scheduled dates across the ENTIRE course to determine "Day X"
    const globalDayMap = useMemo(() => {
        const allDates = new Set();

        // 1. Add dates from OTHER modules
        course.moduleSchedule?.forEach(modSched => {
            if (modSched.moduleId.toString() !== module._id.toString()) {
                modSched.topicSchedules?.forEach(ts => {
                    if (ts.date) allDates.add(new Date(ts.date).toISOString().split('T')[0]);
                });
            }
        });

        // 2. Add dates from CURRENT module state
        topicSchedules.forEach(ts => {
            if (ts.date) allDates.add(new Date(ts.date).toISOString().split('T')[0]);
        });

        // Sort dates chronologically
        const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));

        // Create Map: dateString -> dayNumber (1-based)
        const map = new Map();
        sortedDates.forEach((date, idx) => {
            map.set(date, idx + 1);
        });

        return map;
    }, [course.moduleSchedule, topicSchedules, module._id]);

    const handleDateChange = (topicId, newDate) => {
        if (newDate) {
            const duplicateTopic = topicSchedules.find(
                ts => ts.topicId !== topicId && ts.date === newDate
            );

            if (duplicateTopic) {
                showToast(
                    `Date ${new Date(newDate).toLocaleDateString()} is already assigned to "${duplicateTopic.topicName}"`,
                    'error'
                );
                return;
            }
        }

        setTopicSchedules(prev => {
            const updated = prev.map(ts =>
                ts.topicId === topicId ? { ...ts, date: newDate } : ts
            );
            return updated;
        });
    };

    const validateDates = () => {
        const courseStart = new Date(course.startDate);
        const courseEnd = new Date(course.endDate);
        const dateMap = new Map();

        for (const schedule of topicSchedules) {
            if (!schedule.date) continue;

            const topicDate = new Date(schedule.date);

            // Check if date is within course range
            if (topicDate < courseStart || topicDate > courseEnd) {
                showToast(
                    `${schedule.topicName}: Date must be between ${courseStart.toLocaleDateString()} and ${courseEnd.toLocaleDateString()}`,
                    'error'
                );
                return false;
            }

            // Check for duplicate dates
            if (dateMap.has(schedule.date)) {
                showToast(
                    `Multiple topics assigned to ${topicDate.toLocaleDateString()}: "${dateMap.get(schedule.date)}" and "${schedule.topicName}"`,
                    'error'
                );
                return false;
            }
            dateMap.set(schedule.date, schedule.topicName);
        }
        return true;
    };

    const handleSave = () => {
        if (!validateDates()) return;

        // Filter out topics without dates and format for backend
        const schedulesToSave = topicSchedules
            .filter(ts => ts.date)
            .map(ts => ({
                topicId: ts.topicId,
                date: ts.date
            }));

        onSave(schedulesToSave);
    };

    const clearAllDates = () => {
        setTopicSchedules(prev => prev.map(ts => ({ ...ts, date: '' })));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!module.topics || module.topics.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon-circle">
                    {/* No Emoji, using simple icon */}
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </div>
                <h3 className="section-title">No Topics Yet</h3>
                <p className="text-muted mb-6">This module doesn't have any topics to schedule.</p>
                <Button variant="secondary" onClick={onClose}>Close</Button>
            </div>
        );
    }

    const courseStart = new Date(course.startDate).toISOString().split('T')[0];
    const courseEnd = new Date(course.endDate).toISOString().split('T')[0];
    const scheduledCount = topicSchedules.filter(ts => ts.date).length;
    const totalCount = topicSchedules.length;
    const progressPercent = (scheduledCount / totalCount) * 100;

    return (
        <div className="scheduler-container">
            {/* Header Section */}
            <div className="scheduler-header">
                <div className="scheduler-title-row">
                    <div>
                        <h2 className="scheduler-title">
                            Schedule Topics
                        </h2>
                        <p className="scheduler-subtitle">Assign dates to topics within the course timeline</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="close-btn"
                        type="button"
                    >
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Course Date Range Info */}
                <div className="date-range-info">
                    <div className="info-icon">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="info-label">Course Date Range</p>
                        <p className="info-value">
                            {new Date(course.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            <span>→</span>
                            {new Date(course.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="progress-section">
                    <div className="progress-header">
                        <span>Scheduling Progress</span>
                        <span>{scheduledCount}/{totalCount} Topics</span>
                    </div>
                    <div className="progress-track">
                        <div
                            className="progress-fill"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Topics List */}
            <div className="scheduler-body">
                <div className="topics-list">
                    {topicSchedules.map((schedule, index) => {
                        const dayNum = schedule.date ? globalDayMap.get(new Date(schedule.date).toISOString().split('T')[0]) : null;

                        return (
                            <div
                                key={schedule.topicId}
                                className={`topic-schedule-card ${schedule.date ? 'scheduled' : ''}`}
                            >
                                {/* Day Number Badge */}
                                <div className="day-badge-container">
                                    <div className={`day-badge ${dayNum ? 'active' : ''}`}>
                                        <div className="day-label">Day</div>
                                        <div className="day-value">{dayNum || '-'}</div>
                                    </div>
                                </div>

                                {/* Topic Info */}
                                <div className="topic-info-col">
                                    <h4 className="topic-name">{schedule.topicName}</h4>
                                    <div className="topic-meta">
                                        {schedule.description && (
                                            <p className="desc-text">{schedule.description}</p>
                                        )}
                                        <span className="problem-tag">
                                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            {schedule.assignmentCount} problems
                                        </span>
                                    </div>
                                </div>

                                {/* Date Input with Icon */}
                                <div className="date-input-wrapper flex items-center gap-2">
                                    <input
                                        id={`date-input-${schedule.topicId}`}
                                        type="date"
                                        className="date-input"
                                        value={schedule.date ? new Date(schedule.date).toISOString().split('T')[0] : ''}
                                        onChange={(e) => handleDateChange(schedule.topicId, e.target.value)}
                                        onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                        min={courseStart}
                                        max={courseEnd}
                                        placeholder="dd-mm-yyyy"
                                    />
                                    <button
                                        type="button"
                                        className="calendar-icon-btn text-gray-400 hover:text-blue-400 transition-colors"
                                        onClick={() => {
                                            const input = document.getElementById(`date-input-${schedule.topicId}`);
                                            if (input && input.showPicker) input.showPicker();
                                        }}
                                    >
                                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="scheduler-footer">
                <button
                    onClick={clearAllDates}
                    className="clear-btn"
                    type="button"
                >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear All
                </button>

                <div className="footer-actions">
                    <Button variant="secondary" onClick={onClose} size="md">
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        size="md"
                    >
                        <svg width="16" height="16" className="mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Schedule
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default ModuleTopicScheduler;

