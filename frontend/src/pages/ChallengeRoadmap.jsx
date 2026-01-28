import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { showToast } from '../components/Notification';
import '../styles/ChallengeRoadmap.css';
import '../styles/TraineeList.css'; // Reusing premium inputs

function ChallengeRoadmap() {
    const { id } = useParams();
    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Day Selection
    const [selectedDay, setSelectedDay] = useState(null);
    const [assignments, setAssignments] = useState([]);

    // Pagination & Search
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const ITEMS_PER_PAGE = 28; // 4 weeks

    // Problem Library Integration
    const [showProblemModal, setShowProblemModal] = useState(false);
    const [problems, setProblems] = useState([]);
    const [problemLoading, setProblemLoading] = useState(false);
    const [problemSearch, setProblemSearch] = useState('');
    const [selectedProblems, setSelectedProblems] = useState([]);

    useEffect(() => {
        fetchChallenge();
    }, [id]);

    const fetchChallenge = async () => {
        try {
            const response = await api.get(`/challenges/${id}`);
            setChallenge(response.data);
        } catch (err) {
            // Handled by interceptor
        } finally {
            setLoading(false);
        }
    };

    const fetchProblems = useCallback(async () => {
        try {
            setProblemLoading(true);
            const response = await api.get('/problems', {
                params: {
                    search: problemSearch,
                    limit: 20
                }
            });
            setProblems(response.data.problems || []);
        } catch (err) {
            console.error(err);
        } finally {
            setProblemLoading(false);
        }
    }, [problemSearch]);

    useEffect(() => {
        if (showProblemModal) {
            const delayDebounceFn = setTimeout(() => {
                fetchProblems();
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [showProblemModal, problemSearch, fetchProblems]);

    const handleDayClick = (dayNum) => {
        setSelectedDay(dayNum);
        const existing = challenge.dailyAssignments && challenge.dailyAssignments[dayNum.toString()];
        setAssignments(Array.isArray(existing) ? existing : []);
        setShowModal(true);
    };

    const handleRemoveAssignment = (index) => {
        setAssignments(assignments.filter((_, i) => i !== index));
    };

    const handleToggleProblem = (problem) => {
        const exists = selectedProblems.some(p => p._id === problem._id);
        if (exists) {
            setSelectedProblems(selectedProblems.filter(p => p._id !== problem._id));
        } else {
            setSelectedProblems([...selectedProblems, problem]);
        }
    };

    const handleAddSelectedProblems = () => {
        const newAssignments = selectedProblems.map(problem => ({
            name: problem.title,
            link: problem.link,
            source: problem.platform ? problem.platform.toUpperCase() : 'OTHER',
            category: problem.topics?.[0]?.toUpperCase() || 'DSA',
            level: problem.difficulty ? problem.difficulty.toUpperCase() : 'MEDIUM',
            tags: problem.tags || [],
            problemId: problem._id
        }));

        setAssignments([...assignments, ...newAssignments]);
        setShowProblemModal(false);
        setSelectedProblems([]);
    };

    const handleSaveAssignments = async (e) => {
        e.preventDefault();
        // Validation logic...
        try {
            await api.put(`/challenges/${id}/assignments`, {
                dayNumber: selectedDay,
                assignments: assignments
            });
            showToast(`Day ${selectedDay} roadmap saved!`, 'success');
            setShowModal(false);
            fetchChallenge();
        } catch (err) {
            // Handled by interceptor
        }
    };

    if (loading) return <div className="page flex items-center justify-center"><div className="spinner"></div></div>;
    if (!challenge) return <div className="page container"><h2>Challenge not found</h2></div>;

    const filteredDays = Array.from({ length: challenge.duration }, (_, i) => ({ dayNum: i + 1 }))
        .filter(day => day.dayNum.toString().includes(searchTerm.replace(/\D/g, '')));

    const totalPages = Math.ceil(filteredDays.length / ITEMS_PER_PAGE);
    const displayedDays = filteredDays.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="page">
            <div className="container">
                <nav className="nav mb-6">
                    <Link to="/admin/challenges" className="dashboard-link text-muted hover:text-primary transition-colors">
                        &larr; Back to Challenges
                    </Link>
                </nav>

                <div className="roadmap-header page-header-column">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{challenge.title}</h1>
                        <p className="text-secondary">{challenge.duration} Day Curriculum Plan</p>
                    </div>

                    <div className="flex justify-between items-center w-full mt-4">
                        <div className="search-container">
                            <input
                                type="text"
                                className="form-input search-input"
                                placeholder="Search for a Day (e.g. '50')"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <div className="text-secondary text-sm">
                            Showing {displayedDays.length} of {challenge.duration} days
                        </div>
                    </div>
                </div>

                <div className="roadmap-grid">
                    {displayedDays.map((day) => {
                        const { dayNum } = day;
                        const dayAssignments = challenge.dailyAssignments?.[dayNum.toString()] || [];
                        const isActive = dayAssignments.length > 0;

                        return (
                            <div
                                key={dayNum}
                                className={`day-card ${isActive ? 'active' : 'empty'}`}
                                onClick={() => handleDayClick(dayNum)}
                            >
                                <div className="day-header">
                                    <span className="day-number">Day {dayNum}</span>
                                    {isActive && <span className="task-count-badge">{dayAssignments.length} Tasks</span>}
                                </div>

                                {isActive ? (
                                    <div className="task-preview-list">
                                        {dayAssignments.slice(0, 3).map((a, idx) => (
                                            <div key={idx} className="task-preview-item" title={a.name}>
                                                {a.name}
                                            </div>
                                        ))}
                                        {dayAssignments.length > 3 && (
                                            <div className="more-tasks">+ {dayAssignments.length - 3} more</div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="empty-day-text">
                                        <span>Click to add<br />curriculum</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {totalPages > 1 && (
                    <div className="pagination-container">
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        >
                            &larr; Previous
                        </Button>
                        <span className="text-muted text-sm">
                            Page <strong className="text-primary">{currentPage}</strong> of {totalPages}
                        </span>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        >
                            Next &rarr;
                        </Button>
                    </div>
                )}

                {/* Assignment Management Modal - Read Only List */}
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title={`Day ${selectedDay} Curriculum`}
                    size="lg"
                >
                    <form onSubmit={handleSaveAssignments}>
                        <div className="modal-scroll-area">
                            {assignments.length === 0 ? (
                                <div className="modal-empty-state">
                                    <span className="empty-icon">📚</span>
                                    <p className="font-medium mb-1">No problems added for this day yet.</p>
                                    <p className="text-sm">Click "Add Problems" to select from the library.</p>
                                </div>
                            ) : (
                                <div>
                                    {assignments.map((asgn, index) => (
                                        <div key={index} className="read-only-item group">
                                            <div className="item-main">
                                                <div className="item-content">
                                                    <h4>
                                                        <a href={asgn.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                            {asgn.name}
                                                        </a>
                                                        <span className={`item-badge ${asgn.level?.toUpperCase() === 'EASY' ? 'badge-easy' : asgn.level?.toUpperCase() === 'MEDIUM' ? 'badge-medium' : 'badge-hard'}`}>
                                                            {asgn.level}
                                                        </span>
                                                    </h4>
                                                </div>
                                                <div className="item-meta">
                                                    <span>{asgn.source || asgn.platform}</span>
                                                    <span>•</span>
                                                    <span>{asgn.category}</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="remove-icon-btn"
                                                onClick={() => handleRemoveAssignment(index)}
                                                title="Remove Problem"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Button
                                variant="secondary"
                                fullWidth
                                onClick={() => { setShowProblemModal(true); setProblemSearch(''); setSelectedProblems([]); }}
                                className="border-dashed mt-6 py-3"
                            >
                                + Add Problems from Library
                            </Button>
                        </div>

                        <div className="modal-footer">
                            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button variant="primary" type="submit">Save Changes</Button>
                        </div>
                    </form>
                </Modal>

                {/* Problem Selection Modal - Multi Select */}
                <Modal
                    isOpen={showProblemModal}
                    onClose={() => setShowProblemModal(false)}
                    title="Select Problems"
                    size="lg"
                >
                    <div className="problem-search-container">
                        <input
                            type="text"
                            className="search-input-premium"
                            placeholder="Search problems..."
                            value={problemSearch}
                            onChange={(e) => setProblemSearch(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="problem-list-scroll">
                        {problemLoading ? (
                            <div className="spinner"></div>
                        ) : problems.length === 0 ? (
                            <div className="p-8 text-center text-muted">No problems found.</div>
                        ) : (
                            problems.map(problem => {
                                const isSelected = selectedProblems.some(p => p._id === problem._id);
                                return (
                                    <div
                                        key={problem._id}
                                        className={`multi-select-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleToggleProblem(problem)}
                                    >
                                        <div className="flex items-center w-full">
                                            <div className="checkbox-visual">
                                                {isSelected && <span className="checkmark">✓</span>}
                                            </div>
                                            <div className="item-main">
                                                <div className="item-title">{problem.title}</div>
                                                <div className="item-details">
                                                    <span className={`item-badge ${problem.difficulty === 'Easy' ? 'badge-easy' : problem.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard'}`}>
                                                        {problem.difficulty}
                                                    </span>
                                                    <span>{problem.platform}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="modal-footer">
                        <span className="selection-count">
                            {selectedProblems.length} problems selected
                        </span>
                        <Button variant="secondary" onClick={() => setShowProblemModal(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleAddSelectedProblems} disabled={selectedProblems.length === 0}>
                            Add Selected ({selectedProblems.length})
                        </Button>
                    </div>
                </Modal>
            </div>
        </div>
    );
}

export default ChallengeRoadmap;
