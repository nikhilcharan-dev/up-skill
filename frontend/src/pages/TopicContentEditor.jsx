import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { showToast } from '../components/Notification';
import '../styles/TopicContentEditor.css';

function TopicContentEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [topic, setTopic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [assignmentProblems, setAssignmentProblems] = useState([]);
    const [practiceProblems, setPracticeProblems] = useState([]);
    const [uploading, setUploading] = useState(false);

    // Modal State
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectionType, setSelectionType] = useState(null);
    const [availableProblems, setAvailableProblems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTopicData();
    }, [id]);

    useEffect(() => {
        if (detailsModalOpen) fetchProblems();
    }, [detailsModalOpen, searchQuery]);

    const fetchTopicData = async () => {
        try {
            const { data } = await api.get(`/topics/${id}`);
            setTopic(data);
            if (data.assignmentProblems) setAssignmentProblems(data.assignmentProblems);
            if (data.practiceProblems) setPracticeProblems(data.practiceProblems);
        } catch (err) {
            showToast('Failed to load topic', 'error');
            navigate('/admin/topics');
        } finally {
            setLoading(false);
        }
    };

    const fetchProblems = async () => {
        try {
            const { data } = await api.get('/problems', {
                params: { search: searchQuery, limit: 20 }
            });
            setAvailableProblems(data.problems || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        try {
            const payload = {
                assignmentProblems: assignmentProblems.map(p => p._id),
                practiceProblems: practiceProblems.map(p => p._id),
                trainerNotes: topic.trainerNotes
            };
            // Based on checking the controller, updateTopicContent expects these keys.
            // I will assume the route is /:id/content based on typical patterns, but I will check the route file next.
            // If the route file shows something different, I'll adjust.
            // For now, let's fix the keys first as that's definitely wrong.
            await api.put(`/topics/${id}/content`, payload);
            showToast('Topic updated successfully', 'success');
        } catch (err) {
            console.error("Save failed", err);
            showToast('Failed to save changes', 'error');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.put(`/topics/${id}/notes`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setTopic(prev => ({ ...prev, trainerNotes: response.data.url }));
            showToast('Notes uploaded', 'success');
        } catch (err) {
            showToast('Failed to upload', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteNotes = async () => {
        if (!confirm('Delete trainer notes?')) return;
        try {
            await api.delete(`/topics/${id}/notes`);
            setTopic(prev => ({ ...prev, trainerNotes: '' }));
            showToast('Notes deleted', 'success');
        } catch (err) {
            showToast('Failed to delete', 'error');
        }
    };

    // Helper functions
    const openSelectionModal = (type) => {
        setSelectionType(type);
        setSearchQuery('');
        setDetailsModalOpen(true);
    };

    const addToTopic = (problem) => {
        const targetList = selectionType === 'assignment' ? assignmentProblems : practiceProblems;
        const setTargetList = selectionType === 'assignment' ? setAssignmentProblems : setPracticeProblems;

        if (targetList.some(p => p._id === problem._id)) return;
        setTargetList([...targetList, problem]);
        showToast('Problem added', 'success');
    };

    const removeProblem = (type, index) => {
        if (type === 'assignment') {
            setAssignmentProblems(assignmentProblems.filter((_, i) => i !== index));
        } else {
            setPracticeProblems(practiceProblems.filter((_, i) => i !== index));
        }
    };

    const getDiffClass = (diff) => {
        switch (diff) {
            case 'Easy': return 'diff-easy';
            case 'Medium': return 'diff-medium';
            case 'Hard': return 'diff-hard';
            default: return 'diff-default';
        }
    };

    if (loading) return <div className="topic-editor-page flex items-center justify-center">Loading Editor...</div>;
    if (!topic) return <div className="topic-editor-page flex items-center justify-center text-red-500">Topic not found</div>;

    return (
        <div className="topic-editor-page">
            {/* Top Bar */}
            <div className="top-bar">
                <div className="top-bar-left">
                    <Button variant="ghost" onClick={() => navigate('/admin/topics')} className="back-btn">
                        ← Back
                    </Button>
                    <div className="topic-info">
                        <div className="topic-header-row">
                            <span className="day-badge">
                                Day {topic.dayNumber}
                            </span>
                            <h1 className="topic-title">{topic.topicName}</h1>
                        </div>
                    </div>
                </div>
                <div className="top-bar-right">
                    <Button variant="secondary" onClick={() => navigate('/admin/topics')}>Cancel</Button>
                    <Button onClick={handleSave} variant="primary">
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="editor-container">

                {/* Trainer Notes Section (Full Width) */}
                <div className="trainer-section">
                    <h2 className="section-title">Trainer Resources</h2>
                    <div className="resources-box">
                        {topic.trainerNotes ? (
                            <div className="notes-display">
                                <div className="notes-label">
                                    Notes Attached
                                </div>
                                <div className="notes-actions">
                                    <a
                                        href={topic.trainerNotes}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="view-notes-btn"
                                    >
                                        View Notes
                                    </a>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={handleDeleteNotes}
                                        className="flex-1"
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <label className="upload-area group">
                                <span className="upload-text">
                                    {uploading ? 'Uploading...' : 'Click to Upload Notes'}
                                </span>
                                <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    hidden
                                    disabled={uploading}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                                />
                            </label>
                        )}
                    </div>
                    <div className="supported-formats">
                        <p>Supported formats: PDF, DOCX, PPTX.</p>
                    </div>
                </div>

                {/* Problems Grid (2 Cols) */}
                <div className="problems-grid">

                    {/* Assignment Panel */}
                    <div className="problem-panel">
                        <div className="panel-header">
                            <h2 className="section-title panel-title-group">
                                <span className="panel-title">Assignment Problems</span>
                                <span className="problem-count">{assignmentProblems.length}</span>
                            </h2>
                            <Button size="sm" onClick={() => openSelectionModal('assignment')}>+ Add Problem</Button>
                        </div>
                        <div className="panel-content">
                            {assignmentProblems.length === 0 ? (
                                <div className="empty-state">
                                    <p>No assignments yet.</p>
                                </div>
                            ) : (
                                assignmentProblems.map((p, idx) => (
                                    <div key={idx} className="problem-item group">
                                        <div className="problem-info">
                                            <span className="problem-index">#{idx + 1}</span>
                                            <div>
                                                <div className="problem-name">{p.title || p.problemName}</div>
                                                <div className="problem-meta">
                                                    <span className={`problem-tag ${getDiffClass(p.difficulty || p.category)}`}>
                                                        {p.difficulty || p.category || 'Medium'}
                                                    </span>
                                                    <span className="problem-source">{p.platform || p.problemSource}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeProblem('assignment', idx)}
                                            className="remove-btn"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Practice Panel */}
                    <div className="problem-panel">
                        <div className="panel-header">
                            <h2 className="section-title panel-title-group">
                                <span className="panel-title">Practice Problems</span>
                                <span className="problem-count">{practiceProblems.length}</span>
                            </h2>
                            <Button size="sm" onClick={() => openSelectionModal('practice')}>+ Add Problem</Button>
                        </div>
                        <div className="panel-content">
                            {practiceProblems.length === 0 ? (
                                <div className="empty-state">
                                    <p>No practice problems yet.</p>
                                </div>
                            ) : (
                                practiceProblems.map((p, idx) => (
                                    <div key={idx} className="problem-item group">
                                        <div className="problem-info">
                                            <span className="problem-index">#{idx + 1}</span>
                                            <div>
                                                <div className="problem-name">{p.title || p.problemName}</div>
                                                <div className="problem-meta">
                                                    <span className={`problem-tag ${getDiffClass(p.difficulty || p.category)}`}>
                                                        {p.difficulty || p.category || 'Medium'}
                                                    </span>
                                                    <span className="problem-source">{p.platform || p.problemSource}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeProblem('practice', idx)}
                                            className="remove-btn"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Selection Modal */}
            <Modal
                isOpen={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                title={`Add ${selectionType === 'assignment' ? 'Assignment' : 'Practice'} Problem`}
            >
                <div className="space-y-4">
                    <input
                        type="text"
                        className="modal-search-input"
                        placeholder="Search problems..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                    <div className="modal-list-container custom-scrollbar">
                        {availableProblems.map(problem => {
                            const isAssigned = selectionType === 'assignment'
                                ? assignmentProblems.some(p => p._id === problem._id)
                                : practiceProblems.some(p => p._id === problem._id);

                            return (
                                <div key={problem._id} className="modal-item">
                                    <div>
                                        <h4 className="modal-item-title">{problem.title}</h4>
                                        <div className="problem-meta">
                                            <span className={`problem-tag ${getDiffClass(problem.difficulty)}`}>
                                                {problem.difficulty}
                                            </span>
                                            <span className="problem-source">{problem.platform}</span>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={isAssigned ? "ghost" : "primary"}
                                        disabled={isAssigned}
                                        onClick={() => addToTopic(problem)}
                                        className={isAssigned ? "text-green-500" : ""}
                                    >
                                        {isAssigned ? 'Added' : 'Add'}
                                    </Button>
                                </div>
                            );
                        })}
                        {availableProblems.length === 0 && <p className="text-[var(--text-muted)] text-center py-4">No matching problems found.</p>}
                    </div>
                    <div className="flex justify-end pt-4 border-t border-[var(--border-color)]">
                        <Button variant="secondary" onClick={() => setDetailsModalOpen(false)}>Done</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default TopicContentEditor;
