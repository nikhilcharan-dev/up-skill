import { useState, useEffect } from 'react';
import Button from './Button';
import Modal from './Modal';

function CourseScheduleCalendar({ course }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [topicsByDate, setTopicsByDate] = useState({});
    const [selectedDateDetails, setSelectedDateDetails] = useState(null); // { date: string, topics: [] }

    useEffect(() => {
        buildTopicsMap();
    }, [course]);

    const buildTopicsMap = () => {
        if (!course || !course.modules || !course.moduleSchedule) return;

        // 1. Calculate Day Numbers based on course-wide sorted unique dates
        const allDates = new Set();
        course.moduleSchedule.forEach(ms => {
            ms.topicSchedules?.forEach(ts => {
                if (ts.date) allDates.add(new Date(ts.date).toISOString().split('T')[0]);
            });
        });
        const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));
        const dateToDayNum = new Map();
        sortedDates.forEach((date, idx) => {
            dateToDayNum.set(date, idx + 1);
        });

        // 2. Build Topics Map
        const dateMap = {};

        course.moduleSchedule.forEach(moduleSchedule => {
            const module = course.modules.find(m => m._id.toString() === moduleSchedule.moduleId.toString());
            if (!module || !moduleSchedule.topicSchedules) return;

            moduleSchedule.topicSchedules.forEach(topicSchedule => {
                if (!topicSchedule.date) return;

                const topic = module.topics?.find(t => t._id.toString() === topicSchedule.topicId.toString());
                if (!topic) return;

                const dateKey = new Date(topicSchedule.date).toISOString().split('T')[0];

                if (!dateMap[dateKey]) {
                    dateMap[dateKey] = [];
                }

                dateMap[dateKey].push({
                    topicName: topic.topicName || topic.title || 'Untitled',
                    description: topic.description,
                    dayNumber: dateToDayNum.get(dateKey), // Dynamic Day Number
                    moduleName: module.title,
                    moduleId: module._id,
                    problemCount: (topic.assignmentProblems?.length || 0) + (topic.practiceProblems?.length || 0)
                });
            });
        });

        setTopicsByDate(dateMap);
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek, year, month };
    };

    const handleDayClick = (dateKey, topics) => {
        if (topics && topics.length > 0) {
            setSelectedDateDetails({
                date: new Date(dateKey).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                topics: topics
            });
        }
    };

    const renderCalendar = () => {
        const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
        const days = [];

        // Empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Actual days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            // Fix: Use local date components string construction to avoid UTC shift
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const topics = topicsByDate[dateKey] || [];
            const isToday = new Date().toDateString() === date.toDateString();

            days.push(
                <div
                    key={day}
                    className={`calendar-day ${topics.length > 0 ? 'has-topics cursor-pointer' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => handleDayClick(dateKey, topics)}
                >
                    <div className="day-number">{day}</div>
                    {topics.length > 0 && (
                        <div className="topics-list">
                            {topics.map((topic, idx) => (
                                <div key={idx} className="topic-pill" title={`${topic.moduleName} - ${topic.topicName}`}>
                                    <span className="topic-badge">Day {topic.dayNumber}</span>
                                    <span className="topic-name">{topic.topicName}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        return days;
    };

    const previousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const goToToday = () => {
        setCurrentMonth(new Date());
    };

    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const totalScheduled = Object.values(topicsByDate).reduce((sum, topics) => sum + topics.length, 0);

    return (
        <div className="calendar-container">
            {/* Header */}
            <div className="calendar-header">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Course Schedule
                    </h2>
                    <p className="text-sm text-muted mt-1">{totalScheduled} topics scheduled</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button size="sm" variant="secondary" onClick={goToToday}>Today</Button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={previousMonth}
                            className="nav-btn group"
                            aria-label="Previous month"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="month-label">{monthName}</span>
                        <button
                            onClick={nextMonth}
                            className="nav-btn group"
                            aria-label="Next month"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="calendar-grid">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="day-header">{day}</div>
                ))}

                {/* Calendar days */}
                {renderCalendar()}
            </div>

            {/* Topic Details Modal */}
            <Modal
                isOpen={!!selectedDateDetails}
                onClose={() => setSelectedDateDetails(null)}
                title={selectedDateDetails?.date || 'Day Details'}
                size="md"
            >
                <div className="p-2 space-y-4">
                    {selectedDateDetails?.topics.map((topic, idx) => (
                        <div key={idx} className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <div className="text-xs font-semibold text-blue-400 mb-1 uppercase tracking-wide">
                                        {topic.moduleName} • Day {topic.dayNumber}
                                    </div>
                                    <h3 className="text-lg font-bold text-[var(--text-primary)]">{topic.topicName}</h3>
                                </div>
                                <span className="bg-purple-500/10 text-purple-400 text-xs px-2 py-1 rounded-full border border-purple-500/20">
                                    {topic.problemCount} Problems
                                </span>
                            </div>
                            {topic.description ? (
                                <p className="text-[var(--text-muted)] text-sm leading-relaxed">{topic.description}</p>
                            ) : (
                                <p className="text-[var(--text-muted)] text-sm italic">No description provided.</p>
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-end mt-6">
                    <Button variant="secondary" onClick={() => setSelectedDateDetails(null)}>Close</Button>
                </div>
            </Modal>

            <style jsx>{`
                .calendar-container {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 24px;
                }

                .calendar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid var(--border-color);
                }

                .nav-btn {
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    color: var(--text-muted);
                    transition: all 0.2s;
                    cursor: pointer;
                    display: flex; /* Ensure SVG is centered */
                    align-items: center;
                    justify-content: center;
                }

                .nav-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--text-primary);
                    border-color: rgba(59, 130, 246, 0.5);
                }

                .month-label {
                    font-weight: 600;
                    color: var(--text-primary);
                    min-width: 150px;
                    text-align: center;
                    font-size: 1rem;
                }

                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 8px;
                }

                .day-header {
                    text-align: center;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--text-muted);
                    padding: 12px 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .calendar-day {
                    min-height: 100px;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 8px;
                    transition: all 0.2s;
                    position: relative;
                }

                .calendar-day.empty {
                    background: transparent;
                    border-color: transparent;
                }

                .calendar-day.today {
                    border-color: rgba(59, 130, 246, 0.5);
                    background: rgba(59, 130, 246, 0.05);
                }

                .calendar-day.has-topics {
                    border-color: rgba(168, 85, 247, 0.3);
                    background: rgba(168, 85, 247, 0.05);
                }

                .calendar-day.has-topics.cursor-pointer {
                    cursor: pointer;
                }

                .calendar-day.has-topics:hover {
                    border-color: rgba(168, 85, 247, 0.5);
                    background: rgba(168, 85, 247, 0.1);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(168, 85, 247, 0.15);
                }

                .day-number {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 4px;
                }

                .topics-list {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    max-height: 72px;
                    overflow-y: auto;
                }

                .topics-list::-webkit-scrollbar {
                    width: 3px;
                }

                .topics-list::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 3px;
                }

                .topics-list::-webkit-scrollbar-thumb {
                    background: rgba(168, 85, 247, 0.5);
                    border-radius: 3px;
                }

                .topic-pill {
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2));
                    border: 1px solid rgba(168, 85, 247, 0.3);
                    border-radius: 6px;
                    padding: 4px 6px;
                    font-size: 0.7rem;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    cursor: default;
                }

                .topic-badge {
                    background: rgba(59, 130, 246, 0.3);
                    color: rgb(96, 165, 250);
                    padding: 1px 4px;
                    border-radius: 3px;
                    font-weight: 600;
                    font-size: 0.65rem;
                    flex-shrink: 0;
                }

                .topic-name {
                    color: var(--text-primary);
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    flex: 1;
                }

                @media (max-width: 768px) {
                    .calendar-day {
                        min-height: 80px;
                    }
                    
                    .calendar-header {
                        flex-direction: column;
                        gap: 16px;
                        align-items: flex-start;
                    }
                }
            `}</style>
        </div>
    );
}

export default CourseScheduleCalendar;
