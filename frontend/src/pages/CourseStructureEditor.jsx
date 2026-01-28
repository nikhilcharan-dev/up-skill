import '../styles/CourseStructureEditor.css';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { showToast } from '../components/Notification';

function CourseStructureEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [modalType, setModalType] = useState(null); // 'module'
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchCourse();
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

    const handleSaveStructure = async (newModules) => {
        try {
            const response = await api.put(`/admin/course/${id}/content`, { modules: newModules });
            setCourse(response.data);
            showToast('Changes saved successfully', 'success');
            setModalType(null);
        } catch (err) {
            showToast('Failed to save changes', 'error');
        }
    };

    // --- Action Handlers ---

    const openAddModule = () => {
        setEditingItem(null);
        setFormData({ title: '', description: '' });
        setModalType('module');
    };

    const openEditModule = (e, module, idx) => {
        e.stopPropagation();
        setEditingItem({ ...module, idx });
        setFormData({ title: module.title, description: module.description });
        setModalType('module');
    };

    const deleteModule = (e, idx) => {
        e.stopPropagation();
        if (!window.confirm('Delete this module and all its contents?')) return;
        const newModules = [...course.modules];
        newModules.splice(idx, 1);
        handleSaveStructure(newModules);
    };

    const toggleLockModule = (e, idx) => {
        e.stopPropagation();
        const newModules = [...course.modules];
        newModules[idx].isLocked = !newModules[idx].isLocked;
        handleSaveStructure(newModules);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newModules = [...(course.modules || [])];

        if (modalType === 'module') {
            const moduleData = {
                title: formData.title,
                description: formData.description,
                days: editingItem?.idx !== undefined ? newModules[editingItem.idx].days : []
            };

            if (editingItem && editingItem.idx !== undefined) {
                newModules[editingItem.idx] = moduleData;
            } else {
                newModules.push(moduleData);
            }
        }
        handleSaveStructure(newModules);
    };

    if (loading) return <div className="page p-5">Loading...</div>;
    if (!course) return <div className="page p-5">Course not found</div>;

    return (
        <div className="page course-structure-editor">
            <div className="container">
                <nav className="nav mb-4">
                    <Link to="/admin/courses" className="nav-link">← Back to Courses</Link>
                </nav>

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            {course.title} Modules
                        </h1>
                        <p className="text-muted">Select a module to view its curriculum.</p>
                    </div>
                    <Button onClick={openAddModule} variant="primary">+ Add Module</Button>
                </div>

                <div className="structure-content">
                    {course.modules?.length === 0 && (
                        <div className="text-center p-8 border border-dashed border-white-10 rounded-lg">
                            <p className="text-muted mb-4">No modules yet.</p>
                            <Button onClick={openAddModule}>Create First Module</Button>
                        </div>
                    )}

                    <div className="modules-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {course.modules?.map((module, mIdx) => (
                            <div
                                key={mIdx}
                                className="card module-card bg-white-5 border border-white-10 hover:border-blue-500/50 hover:bg-white-10 transition-all duration-300 relative group p-5 rounded-xl flex flex-col h-full"
                                onClick={() => navigate(`/admin/courses/${id}/modules/${mIdx}`)}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-bold uppercase tracking-wider">Module {mIdx + 1}</div>
                                    <div className="action-group">
                                        {/* Lock Toggle Switch */}
                                        <div
                                            className="lock-toggle-container"
                                            onClick={(e) => toggleLockModule(e, mIdx)}
                                            title={module.isLocked ? "Currently Locked" : "Currently Unlocked"}
                                        >
                                            <span className={`lock-label ${module.isLocked ? 'locked' : 'unlocked'}`}>
                                                {module.isLocked ? 'LOCKED' : 'UNLOCKED'}
                                            </span>
                                            <div className={`toggle-switch ${module.isLocked ? 'locked' : 'unlocked'}`}>
                                                <div className="toggle-thumb"></div>
                                            </div>
                                        </div>

                                        <div className="h-4 w-px bg-white/10 mx-1"></div>

                                        <div className="button-group">
                                            <Button size="sm" variant="secondary" onClick={(e) => openEditModule(e, module, mIdx)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Edit</Button>
                                            <Button size="sm" variant="danger" onClick={(e) => deleteModule(e, mIdx)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Delete</Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-xl font-bold text-white group-hover:text-blue-200 transition-colors">{module.title}</h3>
                                    {module.isLocked && <span className="text-xs text-red-400 border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 rounded">Locked</span>}
                                </div>
                                <p className="text-muted text-sm line-clamp-3 mb-6 flex-grow">{module.description || 'No description provided.'}</p>

                                <div className="mt-auto border-t border-white-5 pt-4 flex justify-between text-xs font-mono text-muted">
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                        {module.days?.length || 0} Days
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                        {module.days?.reduce((acc, d) => acc + (d.assignments?.length || 0), 0) || 0} Assignments
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- MODAL --- */}
                <Modal isOpen={modalType === 'module'} onClose={() => setModalType(null)} title={editingItem?.idx !== undefined ? 'Edit Module' : 'Add Module'}>
                    <form onSubmit={handleSubmit} className="p-1">
                        <div className="form-group">
                            <label className="form-label">Title</label>
                            <input
                                className="form-input"
                                value={formData.title || ''}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Module Title"
                                required
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-input"
                                rows={3}
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Briefly describe this module..."
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="secondary" onClick={() => setModalType(null)}>Cancel</Button>
                            <Button type="submit">Save Module</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
}

export default CourseStructureEditor;
