import '../styles/ModuleContentEditor.css';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import { showToast } from '../components/Notification';

function ModuleContentEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [module, setModule] = useState(null);
    const [allTopics, setAllTopics] = useState([]);
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [moduleRes, topicsRes] = await Promise.all([
                api.get(`/modules/${id}`),
                api.get('/topics')
            ]);
            setModule(moduleRes.data);
            setSelectedTopics(moduleRes.data.topics?.map(t => t._id) || []);
            setAllTopics(topicsRes.data);
        } catch (err) {
            console.error(err);
            showToast('Failed to load data', 'error');
            navigate('/admin/modules');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await api.put(`/modules/${id}`, {
                title: module.title,
                description: module.description,
                topics: selectedTopics
            });
            showToast('Module updated successfully', 'success');
            navigate('/admin/modules');
        } catch (err) {
            showToast('Failed to save module', 'error');
        }
    };

    const toggleTopic = (topicId) => {
        if (selectedTopics.includes(topicId)) {
            setSelectedTopics(selectedTopics.filter(id => id !== topicId));
        } else {
            setSelectedTopics([...selectedTopics, topicId]);
        }
    };

    // Derived State
    const linkedTopicsDetails = useMemo(() => {
        return selectedTopics.map(id => allTopics.find(t => t._id === id)).filter(Boolean);
    }, [allTopics, selectedTopics]);

    const availableTopics = useMemo(() => {
        return allTopics.filter(t =>
            !selectedTopics.includes(t._id) &&
            t.topicName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allTopics, selectedTopics, searchQuery]);

    const stats = useMemo(() => {
        const totalAssignments = linkedTopicsDetails.reduce((acc, t) => acc + (t.assignmentProblems?.length || 0), 0);
        const totalPractice = linkedTopicsDetails.reduce((acc, t) => acc + (t.practiceProblems?.length || 0), 0);
        return { totalAssignments, totalPractice };
    }, [linkedTopicsDetails]);

    if (loading) return (
        <div className="module-editor-page">
            <div className="flex h-screen items-center justify-center text-muted">
                <div className="spinner"></div>
            </div>
        </div>
    );

    if (!module) return (
        <div className="module-editor-page p-8 text-center text-red-400">
            Module not found
        </div>
    );

    return (
        <div className="module-editor-page">
            {/* Top Navigation Bar */}
            <div className="editor-header">
                <div className="header-left">
                    <Button variant="ghost" onClick={() => navigate('/admin/modules')} className="module-back-btn">
                        ← Back
                    </Button>
                    <div>
                        <h1 className="module-title text-gradient">
                            {module.title}
                        </h1>
                        <p className="module-subtitle">Course Builder Dashboard</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" onClick={() => navigate('/admin/modules')}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave}>
                        💾 Save Changes
                    </Button>
                </div>
            </div>

            <div className="editor-layout">

                {/* Left Panel: Content Timeline */}
                <div className="flex flex-col h-full overflow-hidden">
                    {/* Stats Widget */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <span className="stat-label">Topics Linked</span>
                            <span className="stat-value">{linkedTopicsDetails.length}</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Total Assignments</span>
                            <span className="stat-value" style={{ color: '#4ade80' }}>{stats.totalAssignments}</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Total Practice</span>
                            <span className="stat-value" style={{ color: '#a855f7' }}>{stats.totalPractice}</span>
                        </div>
                    </div>

                    <div className="timeline-container custom-scrollbar">
                        <h2 className="timeline-header">
                            <span className="opacity-70">📅</span>
                            Module Timeline
                        </h2>

                        {linkedTopicsDetails.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center text-muted border-2 border-dashed border-white-5 rounded-xl opacity-50">
                                <span className="text-4xl mb-4 opacity-50">🧩</span>
                                <p>No topics added yet.</p>
                                <p className="text-sm mt-2">Add topics from the library on the right.</p>
                            </div>
                        ) : (
                            <div className="timeline-list">
                                {linkedTopicsDetails.map((topic, index) => (
                                    <div key={topic._id} className="timeline-item">
                                        {/* Dot on the timeline */}
                                        <div className="timeline-dot"></div>

                                        <div className="timeline-card group">
                                            <div className="timeline-content-header">
                                                <div>
                                                    <div className="flex items-center mb-1 flex-wrap gap-2">
                                                        <span className="day-badge">
                                                            Day {index + 1}
                                                        </span>
                                                        <span className="topic-title">{topic.topicName}</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="bg-red-500/10 text-red-400 border-transparent hover:bg-red-500/20 py-1 px-3 text-xs"
                                                    onClick={() => toggleTopic(topic._id)}
                                                >
                                                    Unlink
                                                </Button>
                                            </div>

                                            <p className="topic-desc">{topic.description || "No description provided."}</p>

                                            <div className="timeline-stats">
                                                <div className="flex items-center">
                                                    <span className="stat-icon">📋</span>
                                                    {topic.assignmentProblems?.length || 0} Assignments
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="stat-icon">💪</span>
                                                    {topic.practiceProblems?.length || 0} Practice
                                                </div>
                                                <div
                                                    className="edit-link"
                                                    onClick={() => navigate(`/admin/topics/${topic._id}/content`)}
                                                >
                                                    Edit Content ↗
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Topic Library */}
                <div className="sidebar-panel rounded-xl border border-white-5 overflow-hidden">
                    <div className="sidebar-header">
                        <h2 className="sidebar-title">
                            <span className="opacity-70">📚</span>
                            Topic Library
                        </h2>
                        <input
                            type="text"
                            placeholder="Search available topics..."
                            className="sidebar-search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="topics-list custom-scrollbar">
                        {availableTopics.length === 0 ? (
                            <p className="text-center text-muted text-sm py-8">
                                {searchQuery ? 'No matching topics found.' : 'All topics added!'}
                            </p>
                        ) : (
                            availableTopics.map(topic => (
                                <div
                                    key={topic._id}
                                    className="topic-item group"
                                    onClick={() => toggleTopic(topic._id)}
                                >
                                    <div className="topic-item-header">
                                        <h4 className="topic-item-name">{topic.topicName}</h4>
                                        <span className="topic-prob-count">
                                            {topic.assignmentProblems?.length || 0} P
                                        </span>
                                    </div>
                                    <p className="topic-item-desc">{topic.description}</p>
                                    <div className="add-btn-hint">
                                        + Add to Module
                                    </div>
                                </div>
                            ))
                        )}
                        <div className="pt-4 text-center">
                            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/topics')} className="text-muted hover:text-white">
                                + Create New Topic
                            </Button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default ModuleContentEditor;
