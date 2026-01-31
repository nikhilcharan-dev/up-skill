import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import api from '../services/api';
import Button from '../components/Button';
import '../styles/ChallengeManager.css';
import Modal from '../components/Modal';
import { showToast } from '../components/Notification';

function ChallengeManager() {
    const navigate = useNavigate();
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentChallengeId, setCurrentChallengeId] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        duration: 7,
        status: 'active'
    });

    const cardsContainerRef = useRef();

    useEffect(() => {
        fetchChallenges();
    }, []);

    useLayoutEffect(() => {
        if (!loading && challenges.length > 0) {
            gsap.fromTo(".animate-card",
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out", clearProps: "all" }
            );
        }
    }, [loading, challenges]);

    const fetchChallenges = async () => {
        try {
            const response = await api.get('/challenges');
            setChallenges(response.data);
        } catch (err) {
            // Handled by interceptor
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setFormData({ title: '', description: '', duration: 7, status: 'active' });
        setShowModal(true);
    };

    const handleOpenEditModal = (challenge) => {
        setIsEditing(true);
        setCurrentChallengeId(challenge._id);
        setFormData({
            title: challenge.title,
            description: challenge.description || '',
            duration: challenge.duration,
            status: challenge.status || 'active'
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            showToast('Challenge title is required', 'error');
            return;
        }

        if (formData.duration < 1) {
            showToast('Duration must be at least 1 day', 'error');
            return;
        }

        try {
            if (isEditing) {
                await api.put(`/challenges/${currentChallengeId}`, formData);
                showToast('Challenge updated successfully!', 'success');
            } else {
                await api.post('/challenges', formData);
                showToast('Challenge created successfully!', 'success');
            }
            setShowModal(false);
            fetchChallenges();
        } catch (err) {
            // Global Axios interceptor handles showToast
        }
    };

    const handleDeleteChallenge = async (id) => {
        if (!window.confirm('Are you sure you want to delete this challenge? All daily roadmaps for this challenge will be lost.')) return;

        try {
            await api.delete(`/challenges/${id}`);
            showToast('Challenge deleted successfully', 'success');
            fetchChallenges();
        } catch (err) {
            // Handled by global interceptor
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: name === 'duration' ? parseInt(value) || 0 : value });
    };

    if (loading) return <div className="page flex items-center justify-center"><div className="spinner"></div></div>;

    return (
        <div className="page">
            <div className="container">
                {/* Navbar removed - moved to Sidebar */}

                <div className="page-header">
                    <div>
                        <h1>Open Challenges</h1>
                        <p className="text-secondary">Create time-bound skill tracks for trainees</p>
                    </div>
                    <Button variant="primary" onClick={handleOpenCreateModal}>+ Create New Challenge</Button>
                </div>

                {challenges.length === 0 ? (
                    <div className="card challenge-empty-state">
                        <p className="text-muted">No challenges found. Create a new one to engage your trainees!</p>
                    </div>
                ) : (
                    <div className="challenge-grid" ref={cardsContainerRef}>
                        {challenges.map((challenge) => (
                            <div key={challenge._id} className="card course-card animate-card">
                                <div className="challenge-card-header">
                                    <h3 className="challenge-title">
                                        {challenge.title}
                                    </h3>
                                    <div className="challenge-actions">
                                        <Button variant="secondary" size="sm" onClick={() => handleOpenEditModal(challenge)}>
                                            <span>Edit</span>
                                        </Button>
                                        <Button variant="danger" size="sm" onClick={() => handleDeleteChallenge(challenge._id)}>
                                            <span>Delete</span>
                                        </Button>
                                    </div>
                                </div>
                                <p className="challenge-description">
                                    {challenge.description || 'No description provided.'}
                                </p>
                                <div className="challenge-footer">
                                    <div className="challenge-tags">
                                        <span className="tag-tiny tag-duration">
                                            {challenge.duration} Days
                                        </span>
                                        <span className={`tag-tiny ${challenge.status === 'active' ? 'tag-success' : 'tag-muted'}`}>
                                            {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                                        </span>
                                    </div>
                                    <Button variant="primary" size="sm" onClick={() => navigate(`/admin/challenges/${challenge._id}/roadmap`)}>
                                        Manage
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? 'Edit Challenge' : 'Create New Challenge'} size="sm">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Challenge Title</label>
                            <input
                                type="text"
                                name="title"
                                className="form-input"
                                placeholder="e.g. 7 Days of SQL"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                name="description"
                                className="form-input"
                                placeholder="What is this challenge about?"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                            />
                        </div>

                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label">Duration (Days)</label>
                                <input
                                    type="number"
                                    name="duration"
                                    className="form-input"
                                    value={formData.duration}
                                    onChange={handleChange}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select
                                    name="status"
                                    className="form-input"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit">
                                {isEditing ? 'Update Challenge' : 'Create Challenge'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
}

export default ChallengeManager;
