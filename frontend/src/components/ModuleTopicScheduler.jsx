import { useState, useEffect, useMemo } from 'react';
import Button from './Button';
import { showToast } from './Notification';
import '../styles/ModuleTopicScheduler.css';

function ModuleTopicScheduler({ course, module, onSave, onClose }) {
    const [topicSchedules, setTopicSchedules] = useState([]);
    const [testLink, setTestLink] = useState('');
    const [loading, setLoading] = useState(true);
    const [showManualAssignModal, setShowManualAssignModal] = useState(false);
    const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);

    // Auto-assign state
    const [autoAssignStartTopic, setAutoAssignStartTopic] = useState(null);
    const [autoAssignStartDate, setAutoAssignStartDate] = useState('');

    // Range-assign state (modal specific)
    const [editingTopicId, setEditingTopicId] = useState(null); // Which topic we are editing ranges for
    const [showRangeModal, setShowRangeModal] = useState(false);
    const [rangeStart, setRangeStart] = useState('');
    const [rangeEnd, setRangeEnd] = useState('');

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

        // Initialize test link from existing schedule
        setTestLink(existingSchedule?.testLink || '');

        // Group existing schedules by topicId
        const scheduleMap = new Map(); // topicId -> Set(dates)
        existingSchedule?.topicSchedules?.forEach(ts => {
            const tId = ts.topicId.toString();
            if (!scheduleMap.has(tId)) scheduleMap.set(tId, new Set());
            if (ts.date) scheduleMap.get(tId).add(new Date(ts.date).toISOString().split('T')[0]);
        });

        // Initialize schedule for each topic
        const schedules = module.topics.map(topic => {
            const tId = topic._id.toString();
            const datesSet = scheduleMap.get(tId) || new Set();
            const sortedDates = Array.from(datesSet).sort();

            return {
                topicId: topic._id,
                // Handle potential schema inconsistency (topicName vs title)
                topicName: topic.topicName || topic.title || 'Untitled Topic',
                description: topic.description,
                assignmentCount: (topic.assignmentProblems?.length || 0) + (topic.practiceProblems?.length || 0),
                dates: sortedDates // Array of date strings 'YYYY-MM-DD'
            };
        });

        // Sort by first date if available
        schedules.sort((a, b) => {
            const dateA = a.dates[0];
            const dateB = b.dates[0];
            if (dateA && dateB) return new Date(dateA) - new Date(dateB);
            if (dateA) return -1;
            if (dateB) return 1;
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
            ts.dates.forEach(d => allDates.add(d));
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

    const handleSingleDateChange = (topicId, newDate) => {
        setTopicSchedules(prev => {
            return prev.map(ts => {
                if (ts.topicId === topicId) {
                    // If clearing date
                    if (!newDate) return { ...ts, dates: [] };

                    // Replace all existing dates with this single date (Single Date mode)
                    return { ...ts, dates: [newDate] };
                }
                return ts;
            });
        });
    };

    const handleSaveRange = () => {
        if (!editingTopicId || !rangeStart || !rangeEnd) {
            showToast('Please select valid start and end dates', 'error');
            return;
        }

        const start = new Date(rangeStart);
        const end = new Date(rangeEnd);

        if (start > end) {
            showToast('Start date cannot be after end date', 'error');
            return;
        }

        const generatedDates = [];
        const excludedDays = course.excludedDays || [0];
        const holidays = (course.customHolidays || []).map(h => new Date(h).toISOString().split('T')[0]);

        const current = new Date(start);
        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            const dayOfWeek = current.getDay();

            if (!excludedDays.includes(dayOfWeek) && !holidays.includes(dateStr)) {
                generatedDates.push(dateStr);
            }
            current.setDate(current.getDate() + 1);
        }

        if (generatedDates.length === 0) {
            showToast('No valid dates in selected range (all are holidays/excluded)', 'warning');
            return;
        }

        setTopicSchedules(prev => prev.map(ts =>
            ts.topicId === editingTopicId ? { ...ts, dates: generatedDates } : ts
        ));

        setShowRangeModal(false);
        setEditingTopicId(null);
        setRangeStart('');
        setRangeEnd('');
        showToast(`Assigned ${generatedDates.length} days to topic`, 'success');
    };

    const validateDates = () => {
        const courseStart = new Date(course.startDate);
        const courseEnd = new Date(course.endDate);
        const dateMap = new Map();

        for (const schedule of topicSchedules) {
            for (const dateStr of schedule.dates) {
                const topicDate = new Date(dateStr);

                // Check if date is within course range
                if (topicDate < courseStart || topicDate > courseEnd) {
                    showToast(
                        `${schedule.topicName}: Date ${dateStr} must be between ${courseStart.toLocaleDateString()} and ${courseEnd.toLocaleDateString()}`,
                        'error'
                    );
                    return false;
                }

                // Check for duplicate dates (across different topics)
                // dateMap stores: dateString -> topicName
                if (dateMap.has(dateStr)) {
                    showToast(
                        `Multiple topics assigned to ${topicDate.toLocaleDateString()}: "${dateMap.get(dateStr)}" and "${schedule.topicName}"`,
                        'error'
                    );
                    return false;
                }
                dateMap.set(dateStr, schedule.topicName);
            }
        }
        return true;
    };

    const handleSave = () => {
        if (!validateDates()) return;

        // Flatten: Create one entry per date per topic
        const schedulesToSave = [];
        topicSchedules.forEach(ts => {
            ts.dates.forEach(date => {
                schedulesToSave.push({
                    topicId: ts.topicId,
                    date: date
                });
            });
        });

        onSave(schedulesToSave, testLink);
    };

    const clearAllDates = () => {
        setTopicSchedules(prev => prev.map(ts => ({ ...ts, dates: [] })));
    };

    const handleAutoAssign = () => {
        if (!autoAssignStartTopic || !autoAssignStartDate) {
            showToast('Please select a topic and date', 'error');
            return;
        }

        const courseEnd = new Date(course.endDate);
        const excludedDays = course.excludedDays || [0];
        const holidays = (course.customHolidays || []).map(h => new Date(h).toISOString().split('T')[0]);

        let currentDate = new Date(autoAssignStartDate);
        const updatedSchedules = [...topicSchedules];

        // Find the starting topic index
        const startIndex = updatedSchedules.findIndex(ts => ts.topicId === autoAssignStartTopic);

        if (startIndex === -1) return;

        // Assign dates starting from the selected topic
        for (let i = startIndex; i < updatedSchedules.length; i++) {
            // Skip to next valid date
            while (
                currentDate <= courseEnd &&
                (excludedDays.includes(currentDate.getDay()) ||
                    holidays.includes(currentDate.toISOString().split('T')[0]))
            ) {
                currentDate.setDate(currentDate.getDate() + 1);
            }

            if (currentDate > courseEnd) {
                showToast('Not enough valid dates for all topics', 'warning');
                break;
            }

            // In Auto Assign, we treat topics as SINGLE DAY by default for simplicity,
            // or we could preserve existing duration?
            // User requirement: "auto assign... starting from a user-selected topic".
            // Implementation: Assign 1 day per topic for now.
            updatedSchedules[i].dates = [currentDate.toISOString().split('T')[0]];

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        setTopicSchedules(updatedSchedules);
        setShowAutoAssignModal(false);
        setAutoAssignStartTopic(null);
        setAutoAssignStartDate('');
        showToast('Dates auto-assigned successfully', 'success');
    };

    const openRangeModal = (topicId) => {
        const topic = topicSchedules.find(ts => ts.topicId === topicId);
        if (topic) {
            setEditingTopicId(topicId);
            // Pre-fill if existing
            if (topic.dates.length > 0) {
                const dates = [...topic.dates].sort();
                setRangeStart(dates[0]);
                setRangeEnd(dates[dates.length - 1]);
            } else {
                setRangeStart('');
                setRangeEnd('');
            }
            setShowRangeModal(true);
        }
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

                {/* Date Range and Test Link - Side by Side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    {/* Course Date Range Info */}
                    <div className="date-range-info" style={{ marginTop: 0 }}>
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

                    {/* Test Link Input */}
                    <div className="date-range-info" style={{ marginTop: 0 }}>
                        <div className="info-icon">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <label htmlFor="testLink" className="info-label">Module Test Link (Optional)</label>
                            <input
                                id="testLink"
                                type="url"
                                className="form-input mt-1"
                                value={testLink}
                                onChange={(e) => setTestLink(e.target.value)}
                                placeholder="https://unstop.com/test/..."
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    color: 'var(--text-primary)',
                                    fontSize: '14px'
                                }}
                            />
                            <p className="text-xs text-muted mt-1" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Unstop link for module test/assessment</p>
                        </div>
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

            {/* Action Buttons Area */}
            <div className="scheduler-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                        How would you like to assign dates?
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Choose manual assignment for full control, or auto-assign for quick sequential scheduling.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                        onClick={() => setShowManualAssignModal(true)}
                        style={{
                            padding: '1rem 2rem',
                            borderRadius: '10px',
                            border: '2px solid var(--accent-primary)',
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: 'var(--accent-primary)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            transition: 'all 0.2s',
                            minWidth: '160px'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.background = 'var(--accent-primary)';
                            e.target.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                            e.target.style.color = 'var(--accent-primary)';
                        }}
                    >
                        📝 Assign Manually
                    </button>

                    <button
                        onClick={() => setShowAutoAssignModal(true)}
                        style={{
                            padding: '1rem 2rem',
                            borderRadius: '10px',
                            border: '2px solid var(--accent-secondary)',
                            background: 'rgba(139, 92, 246, 0.1)',
                            color: 'var(--accent-secondary)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            transition: 'all 0.2s',
                            minWidth: '160px'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.background = 'var(--accent-secondary)';
                            e.target.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.background = 'rgba(139, 92, 246, 0.1)';
                            e.target.style.color = 'var(--accent-secondary)';
                        }}
                    >
                        ⚡ Auto Assign
                    </button>
                </div>

                <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <strong>Manual:</strong> Assign dates to each topic individually
                        </div>
                        <div>
                            <strong>Auto:</strong> Select a starting topic and date, auto-assign the rest
                        </div>
                    </div>
                </div>
            </div>

            {/* HIDDEN - Old Topics List (kept for reference but not rendered) */}
            <div style={{ display: 'none' }} className="scheduler-body">
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

            {/* Manual Assignment Modal */}
            {showManualAssignModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000
                    }}
                    onClick={() => setShowManualAssignModal(false)}
                >
                    <div
                        style={{
                            background: 'var(--bg-card)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            maxWidth: '700px',
                            width: '90%',
                            maxHeight: '80vh',
                            overflow: 'auto',
                            border: '1px solid var(--border-color)',
                            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                    Assign Dates Manually
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    Assign a date to each topic individually.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowManualAssignModal(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '1.5rem',
                                    padding: '0.25rem'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {topicSchedules.map((schedule, index) => {
                                const dates = schedule.dates || [];
                                const hasDates = dates.length > 0;
                                // Get day numbers for all assigned dates
                                const dayNums = dates.map(d => globalDayMap.get(d)).filter(d => d).join(', ');

                                return (
                                    <div
                                        key={schedule.topicId}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '1rem',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)'
                                        }}
                                    >
                                        <div style={{ minWidth: '60px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Day(s)</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 700, color: hasDates ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                                                {dayNums || '-'}
                                            </div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{schedule.topicName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {schedule.assignmentCount} problems • {dates.length} day(s) assigned
                                            </div>

                                        </div>

                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            {hasDates && (
                                                <div style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    background: 'var(--bg-primary)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    padding: '4px 8px',
                                                    fontSize: '0.8rem',
                                                    color: 'var(--text-primary)',
                                                    fontWeight: 500,
                                                    marginRight: '4px'
                                                }}>
                                                    <svg width="14" height="14" fill="none" stroke="var(--text-secondary)" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {dates.length === 1
                                                        ? new Date(dates[0]).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                                                        : (
                                                            <span>
                                                                {new Date(dates[0]).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                                <span style={{ color: 'var(--text-secondary)', margin: '0 4px' }}>→</span>
                                                                {new Date(dates[dates.length - 1]).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>
                                                        )
                                                    }
                                                </div>
                                            )}
                                            {/* Single Date Picker - Quick Action */}
                                            <input
                                                type="date"
                                                title="Assign Single Date"
                                                value={dates.length === 1 ? dates[0] : ''}
                                                onChange={(e) => handleSingleDateChange(schedule.topicId, e.target.value)}
                                                min={new Date(course.startDate).toISOString().split('T')[0]}
                                                max={new Date(course.endDate).toISOString().split('T')[0]}
                                                style={{
                                                    padding: '0.5rem',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--border-color)',
                                                    background: 'var(--input-bg)',
                                                    color: 'var(--text-primary)',
                                                    width: '40px', // Compact, just the calendar icon usually
                                                    cursor: 'pointer'
                                                }}
                                            />

                                            {/* Range / Advanced Button */}
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => openRangeModal(schedule.topicId)}
                                                style={{ padding: '0.5rem' }}
                                                title="Assign Date Range"
                                            >
                                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                            <Button variant="secondary" onClick={() => setShowManualAssignModal(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Range Selection Modal */}
            {showRangeModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10001
                    }}
                    onClick={() => setShowRangeModal(false)}
                >
                    <div
                        style={{
                            background: 'var(--bg-card)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            maxWidth: '400px',
                            width: '90%',
                            border: '1px solid var(--border-color)',
                            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
                            Assign Date Range
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Start Date</label>
                                <input
                                    type="date"
                                    value={rangeStart}
                                    onChange={(e) => setRangeStart(e.target.value)}
                                    className="form-input"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>End Date</label>
                                <input
                                    type="date"
                                    value={rangeEnd}
                                    onChange={(e) => setRangeEnd(e.target.value)}
                                    className="form-input"
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                This will assign the topic to all valid days between the start and end dates (inclusive).
                            </p>

                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                <Button variant="secondary" onClick={() => setShowRangeModal(false)}>
                                    Cancel
                                </Button>
                                <Button variant="primary" onClick={handleSaveRange}>
                                    Apply Range
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Auto Assignment Modal */}
            {showAutoAssignModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000
                    }}
                    onClick={() => setShowBulkAssignModal(false)}
                >
                    <div
                        style={{
                            background: 'var(--bg-card)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            maxWidth: '500px',
                            width: '90%',
                            border: '1px solid var(--border-color)',
                            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                    Auto-Assign Dates
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    Select a starting topic and date. Subsequent topics will be auto-assigned.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAutoAssignModal(false);
                                    setAutoAssignStartTopic(null);
                                    setAutoAssignStartDate('');
                                }}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '1.5rem',
                                    padding: '0.25rem'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                Starting Topic
                            </label>
                            <select
                                value={autoAssignStartTopic || ''}
                                onChange={(e) => setAutoAssignStartTopic(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'var(--input-bg)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.95rem'
                                }}
                            >
                                <option value="">-- Select a topic to start from --</option>
                                {topicSchedules.map((schedule) => (
                                    <option key={schedule.topicId} value={schedule.topicId}>
                                        {schedule.topicName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={autoAssignStartDate}
                                onChange={(e) => setAutoAssignStartDate(e.target.value)}
                                min={new Date(course.startDate).toISOString().split('T')[0]}
                                max={new Date(course.endDate).toISOString().split('T')[0]}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'var(--input-bg)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.95rem'
                                }}
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                The selected topic and all subsequent topics will be assigned dates sequentially,
                                automatically skipping {course.excludedDays?.includes(0) ? 'Sundays' : 'excluded days'}
                                {course.customHolidays?.length > 0 && ` and ${course.customHolidays.length} holiday(s)`}.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setShowAutoAssignModal(false);
                                    setAutoAssignStartTopic(null);
                                    setAutoAssignStartDate('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleAutoAssign}
                                disabled={!autoAssignStartTopic || !autoAssignStartDate}
                            >
                                Auto Assign
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ModuleTopicScheduler;

