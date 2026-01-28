import '../styles/TopicManager.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { showToast } from '../components/Notification';

function TopicManager() {
    const navigate = useNavigate();
    const [topics, setTopics] = useState([]);
    const [modules, setModules] = useState([]); // All available modules
    const [loading, setLoading] = useState(true);
    const [modalType, setModalType] = useState(null); // 'create' or 'edit'
    const [editingTopic, setEditingTopic] = useState(null);
    const [formData, setFormData] = useState({});

    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTopics();
        fetchModules();
    }, []);

    const fetchTopics = async () => {
        try {
            const response = await api.get('/topics');
            setTopics(response.data);
        } catch (err) {
            showToast('Failed to load topics', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchModules = async () => {
        try {
            const response = await api.get('/modules');
            setModules(response.data);
        } catch (err) {
            showToast('Failed to load modules', 'error');
        }
    };

    const openCreate = () => {
        setEditingTopic(null);
        setFormData({ topicName: '', description: '', assignedModules: [] });
        setModalType('create');
    };

    const openEdit = async (topic) => {
        setEditingTopic(topic);
        // Fetch assigned modules for this topic
        try {
            const response = await api.get(`/topics/${topic._id}`);
            setFormData({
                topicName: topic.topicName,
                description: topic.description,
                assignedModules: response.data.assignedModules || []
            });
            setModalType('edit');
        } catch (err) {
            showToast('Failed to load topic details', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTopic) {
                await api.put(`/topics/${editingTopic._id}`, formData);
                showToast('Topic updated successfully', 'success');
            } else {
                await api.post('/topics', formData);
                showToast('Topic created successfully', 'success');
            }
            setModalType(null);
            fetchTopics();
        } catch (err) {
            showToast('Failed to save topic', 'error');
        }
    };

    const handleDelete = async (topicId) => {
        if (!window.confirm('Delete this topic? This will remove it from all modules.')) return;
        try {
            await api.delete(`/topics/${topicId}`);
            showToast('Topic deleted successfully', 'success');
            fetchTopics();
        } catch (err) {
            showToast('Failed to delete topic', 'error');
        }
    };

    // Filter topics based on search query
    const filteredTopics = topics.filter(topic =>
        topic.topicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (topic.description && topic.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Helper to calculate total problems (just for display if data exists)
    const getStats = (topic) => {
        const assignments = topic.assignmentProblems?.length || 0;
        const practice = topic.practiceProblems?.length || 0;
        return { assignments, practice };
    };

    if (loading) return <div className="page p-4 flex items-center justify-center h-full"><div className="spinner"></div></div>;

    return (
        <div className="page topic-manager">
            <div className="container">
                <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gradient">
                            Topic Library
                        </h1>
                        <p className="text-muted mt-2">Create and manage reusable topics across modules.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative group flex-1 md:w-64">
                            <input
                                type="text"
                                placeholder="Search topics..."
                                className="topic-search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button onClick={openCreate} variant="primary" className="whitespace-nowrap flex-shrink-0">+ Create Topic</Button>
                    </div>
                </div>

                <div className="topic-grid">
                    {filteredTopics.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon text-4xl mb-4 text-[var(--text-muted)] opacity-50"></div>
                            <h3 className="text-xl font-bold mb-2">No Topics Found</h3>
                            <p className="text-muted mb-6">
                                {searchQuery ? `No topics match "${searchQuery}"` : "Create your first topic to get started."}
                            </p>
                            <Button onClick={openCreate} variant="primary">Create First Topic</Button>
                        </div>
                    ) : (
                        filteredTopics.map((topic) => {
                            const stats = getStats(topic);
                            return (
                                <div key={topic._id} className="topic-card" onClick={() => navigate(`/admin/topics/${topic._id}/content`)} style={{ cursor: 'pointer' }}>
                                    <div className="topic-card-header">
                                        <h3 className="topic-title">{topic.topicName}</h3>
                                        <p className="topic-desc">{topic.description || 'No description'}</p>
                                    </div>

                                    <div className="topic-stats">
                                        <div className="stat-item">
                                            <span className="stat-value text-green-400">{stats.assignments}</span>
                                            <span className="stat-label">Assignments</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-value text-purple-500">{stats.practice}</span>
                                            <span className="stat-label">Practice</span>
                                        </div>
                                    </div>

                                    {/* Floating Actions (Visible on Hover) */}
                                    <div className="topic-actions" onClick={(e) => e.stopPropagation()}>
                                        <button className="action-btn" onClick={() => openEdit(topic)}>
                                            Settings
                                        </button>
                                        <button className="action-btn delete" onClick={() => handleDelete(topic._id)}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <Modal isOpen={!!modalType} onClose={() => setModalType(null)} title={editingTopic ? 'Edit Topic Settings' : 'Create New Topic'}>
                    <form onSubmit={handleSubmit} className="p-2">
                        <div className="form-group">
                            <label className="label-premium">Topic Name</label>
                            <input
                                className="input-premium w-full"
                                value={formData.topicName || ''}
                                onChange={e => setFormData({ ...formData, topicName: e.target.value })}
                                placeholder="e.g. Binary Search"
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
                                placeholder="Briefly describe what students will learn..."
                            />
                        </div>

                        <div className="form-group">
                            <label className="label-premium">Assign to Modules</label>
                            <div className="checkbox-list">
                                {modules.length === 0 ? (
                                    <p className="text-muted text-sm">No modules available</p>
                                ) : (
                                    modules.map(module => (
                                        <label key={module._id} className="checkbox-option">
                                            <input
                                                type="checkbox"
                                                checked={(formData.assignedModules || []).includes(module._id)}
                                                onChange={(e) => {
                                                    const currentAssigned = formData.assignedModules || [];
                                                    if (e.target.checked) {
                                                        setFormData({ ...formData, assignedModules: [...currentAssigned, module._id] });
                                                    } else {
                                                        setFormData({ ...formData, assignedModules: currentAssigned.filter(id => id !== module._id) });
                                                    }
                                                }}
                                                className="accent-purple-500"
                                            />
                                            <span className="text-sm text-gray-300">{module.title}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                            <p className="text-xs text-muted mt-2">💡 Select modules this topic belongs to.</p>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <Button variant="secondary" onClick={() => setModalType(null)} type="button">Cancel</Button>
                            <Button type="submit" variant="primary">Save Topic</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
}

export default TopicManager;
