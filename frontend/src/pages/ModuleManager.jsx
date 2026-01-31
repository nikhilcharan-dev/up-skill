import '../styles/ModuleManager.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { showToast } from '../components/Notification';

function ModuleManager() {
    const navigate = useNavigate();
    const [modules, setModules] = useState([]);
    const [courses, setCourses] = useState([]); // All available courses
    const [loading, setLoading] = useState(true);
    const [modalType, setModalType] = useState(null); // 'create' or 'edit'
    const [editingModule, setEditingModule] = useState(null);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchModules();
        fetchCourses();
    }, []);

    const fetchModules = async () => {
        try {
            const response = await api.get('/modules');
            setModules(response.data);
        } catch (err) {
            showToast('Failed to load modules', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await api.get('/admin/course');
            setCourses(response.data);
        } catch (err) {
            showToast('Failed to load courses', 'error');
        }
    };

    const openCreate = () => {
        setEditingModule(null);
        setFormData({ title: '', description: '', assignedCourses: [] });
        setModalType('create');
    };

    const openEdit = async (module) => {
        setEditingModule(module);
        // Fetch assigned courses for this module
        try {
            const response = await api.get(`/modules/${module._id}`);
            setFormData({
                title: module.title,
                description: module.description,
                assignedCourses: response.data.assignedCourses || []
            });
            setModalType('edit');
        } catch (err) {
            showToast('Failed to load module details', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingModule) {
                await api.put(`/modules/${editingModule._id}`, formData);
                showToast('Module updated successfully', 'success');
            } else {
                await api.post('/modules', formData);
                showToast('Module created successfully', 'success');
            }
            setModalType(null);
            fetchModules();
        } catch (err) {
            showToast('Failed to save module', 'error');
        }
    };

    const handleDelete = async (moduleId) => {
        if (!window.confirm('Delete this module? This will remove it from all courses.')) return;
        try {
            await api.delete(`/modules/${moduleId}`);
            showToast('Module deleted successfully', 'success');
            fetchModules();
        } catch (err) {
            showToast('Failed to delete module', 'error');
        }
    };



    if (loading) return <div className="page p-4 flex items-center justify-center h-full"><div className="spinner"></div></div>;

    return (
        <div className="page module-manager">
            <div className="container">
                <div className="page-header">
                    <div>
                        <h1 className="text-3xl font-bold text-gradient">
                            Module Library
                        </h1>
                        <p className="text-muted mt-2">Create and manage reusable learning modules.</p>
                    </div>
                    <Button onClick={openCreate} variant="primary">+ Create Module</Button>
                </div>

                <div className="module-grid">
                    {modules.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-icon">📦</div>
                            <h3 className="text-xl font-bold mb-2">No Modules Found</h3>
                            <p className="text-muted mb-6">Get started by creating your first module.</p>
                            <Button onClick={openCreate} variant="primary">Create First Module</Button>
                        </div>
                    )}

                    {modules.map((module) => (
                        <div key={module._id} className="module-card">
                            <div className="module-card-header">
                                <div className="flex-between-start mb-2">
                                    <h3 className="module-title mb-0">{module.title}</h3>
                                </div>
                                <p className="module-desc">{module.description || 'No description provided.'}</p>
                            </div>

                            <div>
                                <div className="module-meta">
                                    <span className="meta-item">
                                        <span className="dot dot-blue"></span>
                                        {module.topics?.length || 0} Topics
                                    </span>
                                    {module.duration && (
                                        <span className="meta-item">
                                            ⏱️ {module.duration}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="module-actions">
                                <Button size="sm" variant="primary" onClick={() => navigate(`/admin/modules/${module._id}/content`)}>
                                    Edit Content
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => openEdit(module)}>
                                    Settings
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => handleDelete(module._id)}>
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <Modal isOpen={!!modalType} onClose={() => setModalType(null)} title={editingModule ? 'Edit Module Settings' : 'Create New Module'}>
                    <form onSubmit={handleSubmit} className="p-2">
                        <div className="form-group">
                            <label className="label-premium">Module Title</label>
                            <input
                                className="input-premium w-full"
                                value={formData.title || ''}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Introduction to Algorithms"
                                required
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label className="label-premium">Description</label>
                            <textarea
                                className="input-premium w-full"
                                rows={4}
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Briefly describe what this module covers..."
                            />
                        </div>

                        <div className="form-group">
                            <label className="label-premium">Assign to Courses</label>
                            <div className="courses-list-container">
                                {courses.length === 0 ? (
                                    <p className="text-muted text-sm p-2">No courses available</p>
                                ) : (
                                    courses.map(course => (
                                        <label key={course._id} className="checkbox-item">
                                            <input
                                                type="checkbox"
                                                checked={(formData.assignedCourses || []).includes(course._id)}
                                                onChange={(e) => {
                                                    const currentAssigned = formData.assignedCourses || [];
                                                    if (e.target.checked) {
                                                        setFormData({ ...formData, assignedCourses: [...currentAssigned, course._id] });
                                                    } else {
                                                        setFormData({ ...formData, assignedCourses: currentAssigned.filter(id => id !== course._id) });
                                                    }
                                                }}
                                                className="checkbox-input"
                                            />
                                            <span className="text-sm text-gray-300">{course.title}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                            <p className="text-xs text-muted mt-2">💡 Modules can be shared across multiple courses.</p>
                        </div>
                        <div className="flex-end-gap">
                            <Button variant="secondary" onClick={() => setModalType(null)} type="button">Cancel</Button>
                            <Button type="submit" variant="primary">Save Module</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div >
    );
}

export default ModuleManager;
