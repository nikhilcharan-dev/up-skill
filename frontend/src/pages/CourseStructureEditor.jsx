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

    const handleScheduleSave = (topicSchedules) => {
        // topicSchedules is array of { topicId, date }
        if (!selectedModuleForScheduling) return;

        const moduleId = selectedModuleForScheduling._id;
        const newSchedule = [...(course.moduleSchedule || [])];

        // Remove existing schedule for this module if any
        const existingIdx = newSchedule.findIndex(s => s.moduleId.toString() === moduleId.toString());

        const moduleScheduleEntry = {
            moduleId: moduleId,
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

    if (loading) return <div className="page p-8 flex items-center justify-center text-muted">Loading Course...</div>;
    if (!course) return <div className="page p-8 text-center text-red-500">Course not found</div>;

    return (
        <div className="page course-structure-editor">
            <div className="container">
                <nav className="nav">
                    <Link to="/admin/courses" className="nav-link">← Back to Courses</Link>
                </nav>

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gradient mb-2">
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
                            <div className="text-center p-12 border-2 border-dashed border-white-5 rounded-xl bg-glass">
                                <span className="text-4xl block mb-4 opacity-50">Folder Empty</span>
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
                                            <div className="card-actions">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedModuleForScheduling(module);
                                                        setModalType('schedule');
                                                    }}
                                                    className="py-1 px-2 text-xs"
                                                >
                                                    Schedule
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    onClick={(e) => unlinkModule(e, mIdx)}
                                                    className="py-1 px-2 text-xs"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>

                                        <h3 className="module-title group-hover:text-blue-400 transition-colors">{module.title}</h3>
                                        <p className="module-desc">{module.description || 'No description provided.'}</p>

                                        <div className="card-footer">
                                            <div className="meta-stats">
                                                <span className="stat-item">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                    {totalTopics} Topics
                                                </span>
                                                <span className="stat-item">
                                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                                    {totalProblems} Problems
                                                </span>
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
                        <div className="flex justify-end gap-3 mt-6">
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
        </div>
    );
}

export default CourseStructureEditor;

