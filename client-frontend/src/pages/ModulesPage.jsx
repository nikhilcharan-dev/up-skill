import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ModuleSidebarBlock from '../components/ModuleSidebarBlock';
import DayRow from '../components/DayRow';
import ModuleTestRow from '../components/ModuleTestRow';
import PDFModal from '../components/PDFModal';
import UserNotesModal from '../components/UserNotesModal';
import api from '../services/api';

import './ModulesPage.css';

const ModulesPage = () => {
    const navigate = useNavigate();
    const { courseId } = useParams();

    const [course, setCourse] = useState(null);
    const [activeModuleId, setActiveModuleId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // UI State
    const [pdfModalOpen, setPdfModalOpen] = useState(false);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const [expandedDayId, setExpandedDayId] = useState(null);

    // User Notes State
    const [notesModalOpen, setNotesModalOpen] = useState(false);
    const [currentNoteDay, setCurrentNoteDay] = useState(null);
    const [notesData, setNotesData] = useState({});

    // Fetch Course Data
    const fetchCourse = async (silent = false) => {
        if (!courseId) {
            // If no courseId (e.g. root path), fetch dashboard first to find a course
            try {
                const { data } = await api.get('/trainee/dashboard');
                if (data.batches && data.batches.length > 0) {
                    const firstCourseId = data.batches[0].course._id;
                    navigate(`/course/${firstCourseId}`, { replace: true });
                    return; // Will match route on next render
                } else {
                    if (!silent) setLoading(false);
                    setError("No courses available.");
                    return;
                }
            } catch (e) {
                if (!silent) setLoading(false);
                setError("Failed to load courses.");
                return;
            }
        }

        try {
            if (!silent) setLoading(true);
            const { data } = await api.get(`/trainee/courses/${courseId}`);
            setCourse(data);

            // Set active module to first one if not set
            if (!activeModuleId && data.modules && data.modules.length > 0) {
                setActiveModuleId(data.modules[0]._id);
            }
        } catch (err) {
            console.error("Failed to load course:", err);
            if (!silent) setError("Failed to load course content.");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourse();
    }, [courseId, navigate]);

    // Derived active module
    const activeModule = course?.modules?.find(m => m._id === activeModuleId);

    // Transform backend data to UI format if needed
    const getModuleDays = (module) => {
        if (!module || !module.topics) return [];
        return module.topics.map((topic, index) => ({
            id: topic._id,
            dayNumber: topic.dayNumber || (index + 1), // Use backend dayNumber if available
            day: `Day ${topic.dayNumber || (index + 1)}`, // Use backend dayNumber if available
            topic: topic.topicName,
            isLocked: false,
            isCompleted: topic.isCompleted || false,
            // Format: "Day 1, 2 Jan"
            date: topic.date
                ? new Date(topic.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                : "Scheduled",
            lectureNotesPdf: topic.trainerNotes,
            // Map problems ensuring valid objects and default properties to prevent crash
            assignmentProblems: (topic.assignmentProblems || []).map(p => ({
                id: p._id,
                title: p.title,
                difficulty: p.difficulty || 'Medium',
                status: p.status || 'Unsolved', // Use backend status
                link: p.link || '#'
            })),
            practiceProblems: (topic.practiceProblems || []).map(p => ({
                id: p._id,
                title: p.title,
                difficulty: p.difficulty || 'Medium',
                status: p.status || 'Unsolved', // Use backend status
                link: p.link || '#'
            })),
            assignments: topic.assignmentProblems ? topic.assignmentProblems.length : 0,
            practice: topic.practiceProblems ? topic.practiceProblems.length : 0,
            courseId: course._id // Inject courseId for API calls
        }));
    };

    const activeDays = getModuleDays(activeModule);

    // Calculate Stats based on activeDays
    // Replaced local calculation with backend course-level stats
    // Fallback to local 0 if undefined during initial load or error
    const stats = course?.stats || {
        completedLectures: 0,
        totalLectures: 0,
        completedAssignments: 0,
        totalAssignments: 0,
        completedPractice: 0,
        totalPractice: 0
    };

    const totalItems = stats.totalLectures + stats.totalAssignments + stats.totalPractice;
    const completedItems = stats.completedLectures + stats.completedAssignments + stats.completedPractice;
    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    const handleOpenNotes = (day) => {
        if (day.lectureNotesPdf) {
            setSelectedPdf({
                url: day.lectureNotesPdf,
                title: `${day.topic} - Lecture Notes`
            });
            setPdfModalOpen(true);
        }
    };

    const handleCloseModal = () => {
        setPdfModalOpen(false);
        setSelectedPdf(null);
    };

    const [notesLoading, setNotesLoading] = useState(false);

    const handleOpenUserNotes = async (day) => {
        setCurrentNoteDay(day);
        setNotesModalOpen(true);
        setNotesLoading(true);

        try {
            // Check if we already have the note in state to avoid unnecessary fetches
            // But we might want to refresh to get latest. For now, let's fetch.

            // API Call to get notes
            // Route: GET /trainee/courses/:courseId/topics/:topicId/notes
            // Note: day.id is the topicId
            const { data } = await api.get(`/trainee/courses/${course._id}/topics/${day.id}/notes`);

            if (data && data.note !== undefined) {
                setNotesData(prev => ({ ...prev, [day.id]: data.note }));
            } else {
                setNotesData(prev => ({ ...prev, [day.id]: '' }));
            }

        } catch (err) {
            console.error("Failed to load notes", err);
            // If error (e.g. 404), just assume empty note
            setNotesData(prev => ({ ...prev, [day.id]: '' }));
        } finally {
            setNotesLoading(false);
        }
    };

    const handleSaveNotes = async (content) => {
        if (currentNoteDay) {
            const previousContent = notesData[currentNoteDay.id] || '';

            // Only save if content has changed
            if (content !== previousContent) {
                // Update local state immediately for UI responsiveness
                setNotesData(prev => ({
                    ...prev,
                    [currentNoteDay.id]: content
                }));

                try {
                    // API Call to save notes
                    // Route: POST /trainee/notes
                    await api.post('/trainee/notes', {
                        courseId: course._id,
                        topicId: currentNoteDay.id,
                        note: content
                    });

                    console.log('Notes saved successfully.');
                } catch (error) {
                    console.error('Error saving notes:', error);
                    // Revert local state on error? 
                    // For now, let's keep it in the editor/state but maybe show a toast (omitted for now)
                }
            }
        }
    };

    const handleProgressUpdate = () => {
        // Silent refresh to update stats and progress bar
        fetchCourse(true);
    };

    if (loading) return (
        <div className="loading-container">
            <div className="spinner"></div>
            <span>Loading course content...</span>
        </div>
    );

    if (error) return (
        <div className="error-container">
            <div className="error-card">
                <div className="error-icon-wrapper">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <div className="error-title">Unable to Load Content</div>
                <div className="error-message">{error}</div>
                <button className="retry-btn" onClick={() => window.location.reload()}>
                    Retry
                </button>
            </div>
        </div>
    );

    if (!course) return (
        <div className="error-container">
            <div className="error-card">
                <div className="error-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </div>
                <div className="error-title">Course Not Found</div>
                <div className="error-message">The requested course could not be found or you do not have access.</div>
                <button className="retry-btn" onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                </button>
            </div>
        </div>
    );

    return (
        <div className="modules-page-container">
            {/* Left Sidebar */}
            <div className="modules-sidebar-list">
                {course.modules.map((module, index) => (
                    <ModuleSidebarBlock
                        key={module._id}
                        module={{
                            ...module,
                            id: module._id, // Map _id to id for component
                            title: `Module - ${index + 1}`,
                            subtitle: module.title,
                            isLocked: module.isLocked
                        }}
                        isActive={activeModuleId === module._id}
                        onClick={(m) => !m.isLocked && setActiveModuleId(m.id)}
                    />
                ))}
            </div>

            {/* Right Content */}
            <div className="modules-content-area">
                <div className="content-header-row">
                    <div className="header-titles">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span className="module-top-label" style={{ marginBottom: 0 }}>{course.title}</span>
                            {course.startDate && course.endDate && (
                                <span style={{
                                    fontSize: '0.75rem',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    color: 'var(--accent-primary)',
                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                    fontWeight: 500,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    {new Date(course.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    {' - '}
                                    {new Date(course.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            )}
                        </div>
                        <h2 className="module-main-title">{activeModule?.title || 'Select a Module'}</h2>
                        <p>{activeModule?.description}</p>
                    </div>

                    <div className="header-actions">
                        <div className="progress-tracker-card glass-panel">
                            {/* Main Progress Row */}
                            <div className="progress-main-row">
                                <div className="progress-info">
                                    <span className="progress-percentage">{progressPercentage}%</span>
                                    <span className="progress-label">Completed</span>
                                    <div className="info-tooltip-icon">i</div>
                                </div>
                            </div>

                            {/* Progress Bar Container */}
                            <div className="progress-bar-container">
                                <div className="progress-track">
                                    <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
                                </div>
                                {/* Milestones */}
                                <div className="milestone m-40">
                                    <div className="milestone-bubble">40%</div>
                                    <div className="milestone-dot"></div>
                                </div>
                                <div className="milestone m-60">
                                    <div className="milestone-bubble">60%</div>
                                    <div className="milestone-dot"></div>
                                </div>
                                <div className="milestone m-80">
                                    <div className="milestone-bubble">80%</div>
                                    <div className="milestone-dot"></div>
                                </div>
                                <div className="milestone m-100">
                                    <div className="milestone-flag">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M4 15C4 15 5 14 8 14C11 14 13 16 16 16C19 16 20 15 20 15V3C20 3 19 4 16 4C13 4 11 2 8 2C5 2 4 3 4 3V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M4 22V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M4 9H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                                            <path d="M8 4V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                                            <path d="M12 4V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                                            <path d="M16 4V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                                        </svg>
                                    </div>
                                    <div className="milestone-dot"></div>
                                </div>
                            </div>

                            {/* Stats Pills Row */}
                            <div className="tracker-stats-row">
                                <div className="tracker-stat-pill green-pill">
                                    <span className="pill-label">Topics</span>
                                    <span className="pill-val">{stats.completedLectures}/{stats.totalLectures}</span>
                                </div>
                                <div className="tracker-stat-pill blue-pill">
                                    <span className="pill-label">Assignment Problems</span>
                                    <span className="pill-val">{stats.completedAssignments}/{stats.totalAssignments}</span>
                                </div>
                                <div className="tracker-stat-pill yellow-pill">
                                    <span className="pill-label">Practice Problems</span>
                                    <span className="pill-val">{stats.completedPractice}/{stats.totalPractice}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="days-list section-divider">
                    {activeDays.length > 0 ? (
                        activeDays.map((day, index) => (
                            <DayRow
                                key={`${day.id}-${index}`}
                                day={day}
                                isExpanded={expandedDayId === day.id}
                                onClick={() => setExpandedDayId(expandedDayId === day.id ? null : day.id)}
                                onOpenNotes={handleOpenNotes}
                                onOpenUserNotes={handleOpenUserNotes}
                                onProgressUpdate={handleProgressUpdate}
                            />
                        ))
                    ) : (
                        <div className="empty-state">
                            <p>{activeModule.isLocked ? "This module is locked." : "No content available yet."}</p>
                        </div>
                    )}

                    {/* Module Test Row */}
                    {activeModule.moduleTest && (
                        <ModuleTestRow test={activeModule.moduleTest} />
                    )}
                </div>
            </div>

            {/* PDF Modal */}
            <PDFModal
                isOpen={pdfModalOpen}
                onClose={handleCloseModal}
                pdfUrl={selectedPdf?.url}
                title={selectedPdf?.title}
            />

            {/* User Notes Modal */}
            <UserNotesModal
                isOpen={notesModalOpen}
                onClose={() => setNotesModalOpen(false)}
                title={currentNoteDay ? `Notes: ${currentNoteDay.topic}` : 'My Notes'}
                initialText={currentNoteDay ? notesData[currentNoteDay.id] : ''}
                onSave={handleSaveNotes}
                isLoading={notesLoading}
            />
        </div>
    );
};

export default ModulesPage;
