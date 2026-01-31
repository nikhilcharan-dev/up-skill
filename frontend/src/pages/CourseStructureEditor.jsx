import '../styles/CourseStructureEditor.css';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ModuleTopicScheduler from '../components/ModuleTopicScheduler';
import CourseScheduleCalendar from '../components/CourseScheduleCalendar';
import { showToast } from '../components/Notification';

function CourseStructureEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [availableModules, setAvailableModules] = useState([]); // All modules from library
    const [showCalendar, setShowCalendar] = useState(false); // Toggle for calendar view

    // Modal State
    const [modalType, setModalType] = useState(null); // 'selectModule' or 'schedule'
    const [formData, setFormData] = useState({});
    const [selectedModuleForScheduling, setSelectedModuleForScheduling] = useState(null); // For scheduler modal

    useEffect(() => {
        fetchCourse();
        fetchAvailableModules();
    }, [id]);

    const fetchCourse = async () => {
        try {
            const response = await api.get(`/admin/course/${id}`);
            setCourse(response.data);
        } catch (err) {
            showToast('Failed to load course', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableModules = async () => {
        try {
            const response = await api.get('/modules');
            setAvailableModules(response.data);
        } catch (err) {
            showToast('Failed to load modules library', 'error');
        }
    };

    const handleSaveStructure = async (newModuleIds) => {
        try {
            const response = await api.put(`/admin/course/${id}/content`, { modules: newModuleIds });
            setCourse(response.data);
            showToast('Changes saved successfully', 'success');
            setModalType(null);
        } catch (err) {
            showToast('Failed to save changes', 'error');
        }
    };

    // --- Helper Functions ---

    const isModuleLocked = (moduleId) => {
        return course.lockedModules?.some(id => id.toString() === moduleId.toString()) || false;
    };

    const toggleModuleLock = async (e, module) => {
        e.stopPropagation();
        const isLocked = isModuleLocked(module._id);
        let newLockedModules = [...(course.lockedModules || [])];

        if (isLocked) {
            // Unlock - remove from array
            newLockedModules = newLockedModules.filter(id => id.toString() !== module._id.toString());
        } else {
            // Lock - add to array
            newLockedModules.push(module._id);
        }

        try {
            const response = await api.put(`/admin/course/${id}/content`, {
                modules: course.modules.map(m => m._id),
                lockedModules: newLockedModules
            });
            setCourse(response.data);
            showToast(`Module ${isLocked ? 'unlocked' : 'locked'} successfully`, 'success');
        } catch (err) {
            showToast('Failed to update lock status', 'error');
        }
    };

    // --- Action Handlers ---

    const openAddModule = () => {
        setFormData({ selectedModuleId: '' });
        setModalType('selectModule');
    };

    const unlinkModule = (e, idx) => {
        e.stopPropagation();
        if (!window.confirm('Remove this module from the course?')) return;
        const newModuleIds = course.modules.map(m => m._id);
        newModuleIds.splice(idx, 1);
        handleSaveStructure(newModuleIds);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (modalType === 'selectModule' && formData.selectedModuleId) {
            // Find the selected module and open scheduler
            const selectedModule = availableModules.find(m => m._id === formData.selectedModuleId);
            setSelectedModuleForScheduling(selectedModule);
            setModalType('schedule'); // Switch to scheduler modal
        }
    };

    const handleScheduleSave = (topicSchedules, testLink = '') => {
        // topicSchedules is array of { topicId, date }
        // testLink is optional Unstop URL string
        if (!selectedModuleForScheduling) return;

        const moduleId = selectedModuleForScheduling._id;
        const newSchedule = [...(course.moduleSchedule || [])];

        // Remove existing schedule for this module if any
        const existingIdx = newSchedule.findIndex(s => s.moduleId.toString() === moduleId.toString());

        const moduleScheduleEntry = {
            moduleId: moduleId,
            testLink: testLink,
            topicSchedules: topicSchedules
        };

        if (existingIdx !== -1) {
            newSchedule[existingIdx] = moduleScheduleEntry;
        } else {
            newSchedule.push(moduleScheduleEntry);
        }

        // Save schedule (module is already in course)
        saveCourseStructure(course.modules.map(m => m._id), newSchedule);
    };

    const saveCourseStructure = async (moduleIds, moduleSchedule) => {
        try {
            const response = await api.put(`/admin/course/${id}/content`, {
                modules: moduleIds,
                moduleSchedule: moduleSchedule
            });
            setCourse(response.data);
            showToast('Module added and scheduled successfully', 'success');
            setModalType(null);
            setSelectedModuleForScheduling(null);
        } catch (err) {
            showToast('Failed to save changes', 'error');
        }
    };

    if (loading) return <div className="page-loading">Loading Course...</div>;
    if (!course) return <div className="page-error">Course not found</div>;

    return (
        <div className="page course-structure-editor">
            <div className="container">
                <nav className="nav">
                    <Link to="/admin/courses" className="nav-link">← Back to Courses</Link>
                </nav>

                <div className="flex-between mb-8">
                    <div>
                        <h1 className="course-title-large">
                            {course.title}
                        </h1>
                        <p className="text-muted">Manage modules and schedule for this course.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* View Toggle */}
                        <div className="view-toggle-container">
                            <button
                                onClick={() => setShowCalendar(false)}
                                className={`view-toggle-btn ${!showCalendar ? 'active active-modules' : ''}`}
                            >
                                <span className="mr-2"></span> Modules
                            </button>
                            <button
                                onClick={() => setShowCalendar(true)}
                                className={`view-toggle-btn ${showCalendar ? 'active active-calendar' : ''}`}
                            >
                                <span className="mr-2"></span> Calendar
                            </button>
                        </div>
                        {!showCalendar && (
                            <Button onClick={openAddModule} variant="primary">+ Add Module</Button>
                        )}
                    </div>
                </div>

                {/* Calendar View */}
                {showCalendar && (
                    <div className="mb-8 animate">
                        <CourseScheduleCalendar course={course} />
                    </div>
                )}

                {!showCalendar && (
                    <div className="structure-content animate">
                        {course.modules?.length === 0 && (
                            <div className="empty-modules-state">
                                <span className="empty-icon">Folder Empty</span>
                                <p className="text-muted mb-6">No modules added yet.</p>
                                <Button onClick={openAddModule} variant="primary">Add Module from Library</Button>
                            </div>
                        )}

                        <div className="structure-grid">
                            {course.modules?.map((module, mIdx) => {
                                // Get schedule info for this module
                                const moduleSchedule = course.moduleSchedule?.find(
                                    s => s.moduleId.toString() === module._id.toString()
                                );
                                const scheduledTopicsCount = moduleSchedule?.topicSchedules?.filter(ts => ts.date).length || 0;
                                const totalTopics = module.topics?.length || 0;
                                const totalProblems = module.topics?.reduce((acc, t) => acc + (t.assignmentProblems?.length || 0) + (t.practiceProblems?.length || 0), 0) || 0;

                                return (
                                    <div
                                        key={module._id}
                                        className="module-structure-card group"
                                        onClick={() => navigate(`/admin/modules/${module._id}/content`)}
                                    >
                                        <div className="card-header">
                                            <div className="module-index-badge">Module {mIdx + 1}</div>
                                            {isModuleLocked(module._id) && (
                                                <span className="lock-badge-custom">
                                                    🔒 Locked
                                                </span>
                                            )}
                                            <div className="card-actions">
                                                <Button
                                                    size="sm"
                                                    variant={isModuleLocked(module._id) ? "success" : "warning"}
                                                    onClick={(e) => toggleModuleLock(e, module)}
                                                    className="action-btn-sm"
                                                    title={isModuleLocked(module._id) ? "Unlock module for trainees" : "Lock module from trainees"}
                                                >
                                                    {isModuleLocked(module._id) ? '🔓 Unlock' : '🔒 Lock'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedModuleForScheduling(module);
                                                        setModalType('schedule');
                                                    }}
                                                    className="action-btn-sm"
                                                >
                                                    Schedule
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    onClick={(e) => unlinkModule(e, mIdx)}
                                                    className="action-btn-sm"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>

                                        <h3 className="module-title">{module.title}</h3>
                                        <p className="module-desc">{module.description || 'No description provided.'}</p>


                                        <div className="card-footer">
                                            <div className="meta-stats">
                                                <span className="stat-item">
                                                    <span className="status-dot bg-blue-500"></span>
                                                    {totalTopics} Topics
                                                </span>
                                                <span className="stat-item">
                                                    <span className="status-dot bg-purple-500"></span>
                                                    {totalProblems} Problems
                                                </span>
                                                {moduleSchedule?.testLink && (
                                                    <span className="stat-item">
                                                        <a
                                                            href={moduleSchedule.testLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="link-with-icon"
                                                        >
                                                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                            </svg>
                                                            Test Link
                                                        </a>
                                                    </span>
                                                )}
                                            </div>

                                            {totalTopics > 0 && (
                                                <div className="schedule-status">
                                                    <span className={`status-text ${scheduledTopicsCount === totalTopics ? 'complete' : scheduledTopicsCount > 0 ? 'partial' : 'none'}`}>
                                                        {scheduledTopicsCount === totalTopics ? 'Fully Scheduled' : scheduledTopicsCount > 0 ? 'Partially Scheduled' : 'Not Scheduled'}
                                                    </span>
                                                    <span className="text-muted ml-auto text-xs">
                                                        {scheduledTopicsCount}/{totalTopics}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- SELECT MODULE MODAL --- */}
                <Modal isOpen={modalType === 'selectModule'} onClose={() => setModalType(null)} title="Add Module to Course">
                    <form onSubmit={handleSubmit} className="p-1">
                        <div className="form-group">
                            <label className="form-label">Select Module from Library</label>
                            <select
                                className="form-input"
                                value={formData.selectedModuleId || ''}
                                onChange={e => setFormData({ ...formData, selectedModuleId: e.target.value })}
                                required
                                autoFocus
                            >
                                <option value="">-- Select a Module --</option>
                                {availableModules
                                    .filter(m => !course.modules?.some(cm => cm._id === m._id))
                                    .map(module => (
                                        <option key={module._id} value={module._id}>
                                            {module.title} ({module.topics?.length || 0} topics)
                                        </option>
                                    ))}
                            </select>
                            <p className="text-xs text-muted mt-2">Modules are managed in the Modules Library. Go to Modules → Edit Content to add days/topics.</p>
                        </div>
                        <div className="modal-actions-custom">
                            <Button variant="secondary" onClick={() => setModalType(null)}>Cancel</Button>
                            <Button type="submit" variant="primary">Add Module</Button>
                        </div>
                    </form>
                </Modal>

                {/* --- MODULE TOPIC SCHEDULER MODAL --- */}
                <Modal
                    isOpen={modalType === 'schedule'}
                    onClose={() => {
                        setModalType(null);
                        setSelectedModuleForScheduling(null);
                    }}
                    title={`Schedule: ${selectedModuleForScheduling?.title || 'Module'}`}
                    size="lg"
                >
                    {selectedModuleForScheduling && (
                        <ModuleTopicScheduler
                            course={course}
                            module={selectedModuleForScheduling}
                            onSave={handleScheduleSave}
                            onClose={() => {
                                setModalType(null);
                                setSelectedModuleForScheduling(null);
                            }}
                        />
                    )}
                </Modal>
            </div>
        </div >
    );
}

export default CourseStructureEditor;

