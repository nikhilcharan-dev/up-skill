import '../styles/ProblemLibrary.css';
import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import Button from '../components/Button';
import { showToast } from '../components/Notification';

function ProblemLibrary() {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters State
    const [filters, setFilters] = useState({
        search: '',
        platform: '',
        difficulty: '',
        category: ''
    });

    const [modalType, setModalType] = useState(null); // 'create', 'edit'
    const [selectedProblem, setSelectedProblem] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        link: '',
        platform: 'LeetCode',
        difficulty: 'Medium',
        category: 'DSA',
        tags: ''
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProblems();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, filters]);

    const fetchProblems = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 15,
                ...filters
            };
            const response = await api.get('/problems', { params });
            setProblems(response.data.problems);
            setTotalPages(response.data.totalPages);
        } catch (err) {
            console.error(err);
            showToast('Failed to load problems', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setSelectedProblem(null);
        setFormData({ title: '', link: '', platform: 'LeetCode', difficulty: 'Medium', category: 'DSA', tags: '' });
        setModalType('create');
    };

    const handleOpenEdit = (problem) => {
        setSelectedProblem(problem);
        setFormData({
            title: problem.title,
            link: problem.link,
            platform: problem.platform,
            difficulty: problem.difficulty,
            category: problem.category,
            tags: problem.tags ? problem.tags.join(', ') : ''
        });
        setModalType('edit');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this problem?')) return;
        try {
            await api.delete(`/problems/${id}`);
            showToast('Problem deleted successfully', 'success');
            fetchProblems();
        } catch (err) {
            showToast('Failed to delete problem', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
            };

            if (modalType === 'create') {
                await api.post('/problems', payload);
                showToast('Problem created', 'success');
            } else {
                await api.put(`/problems/${selectedProblem._id}`, payload);
                showToast('Problem updated', 'success');
            }
            setModalType(null);
            fetchProblems();
        } catch (err) {
            showToast(err.response?.data?.msg || 'Operation failed', 'error');
        }
    };

    // Helper for difficulty styles
    const getDiffClass = (diff) => {
        switch (diff) {
            case 'Easy': return 'diff-easy';
            case 'Medium': return 'diff-medium';
            case 'Hard': return 'diff-hard';
            default: return '';
        }
    };

    return (
        <div className="page problem-library">
            <div className="container">

                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1 className="text-3xl font-bold text-gradient">
                            Problem Library
                        </h1>
                        <p className="text-muted mt-2">Centralized bank of coding problems for assignments.</p>
                    </div>
                    <Button onClick={handleOpenCreate} variant="primary">
                        + Add New Problem
                    </Button>
                </div>

                {/* Dashboard Controls */}
                <div className="dashboard-controls">
                    <div className="controls-wrapper">
                        <div className="search-box">
                            <span className="search-icon">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search by title, tag..."
                                className="search-input"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>

                        <div className="filter-group">
                            <select
                                className="filter-select"
                                value={filters.platform}
                                onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
                            >
                                <option value="">All Platforms</option>
                                <option value="LeetCode">LeetCode</option>
                                <option value="CodeForces">CodeForces</option>
                                <option value="HackerRank">HackerRank</option>
                                <option value="CodeChef">CodeChef</option>
                            </select>

                            <select
                                className="filter-select"
                                value={filters.difficulty}
                                onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                            >
                                <option value="">All Difficulties</option>
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>

                            <select
                                className="filter-select"
                                value={filters.category}
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            >
                                <option value="">All Categories</option>
                                <option value="DSA">DSA</option>
                                <option value="SQL">SQL</option>
                                <option value="System Design">System Design</option>
                                <option value="Web Dev">Web Dev</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Data Grid */}
                <div className="data-grid-container">
                    <div className="grid-header">
                        <div>Problem Title</div>
                        <div>Platform</div>
                        <div>Category</div>
                        <div>Difficulty</div>
                        <div className="text-right">Actions</div>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner mb-4"></div>
                            <p>Loading Data...</p>
                        </div>
                    ) : problems.length === 0 ? (
                        <div className="empty-result">
                            <span className="opacity-30 mb-4">
                                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                                </svg>
                            </span>
                            <p>No problems found matching your filters.</p>
                        </div>
                    ) : (
                        <div className="grid-body">
                            {problems.map(problem => (
                                <div key={problem._id} className="grid-row">
                                    <div className="col-main">
                                        <div className="problem-title" title={problem.title}>
                                            {problem.title}
                                            <a
                                                href={problem.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="problem-link-icon"
                                                title="Open Problem Link"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        </div>
                                        <div className="problem-tags">
                                            {problem.tags.slice(0, 3).map((tag, i) => (
                                                <span key={i} className="tag">#{tag}</span>
                                            ))}
                                            {problem.tags.length > 3 && <span className="tag">+{problem.tags.length - 3}</span>}
                                        </div>
                                    </div>
                                    <div className="col-info">
                                        <div className="platform-badge">
                                            <span className="dot dot-blue"></span>
                                            {problem.platform}
                                        </div>
                                    </div>
                                    <div className="col-info">
                                        {problem.category}
                                    </div>
                                    <div className="col-info">
                                        <span className={`difficulty-badge ${getDiffClass(problem.difficulty)}`}>
                                            {problem.difficulty}
                                        </span>
                                    </div>
                                    <div className="col-actions">
                                        <button
                                            onClick={() => handleOpenEdit(problem)}
                                            className="action-text-btn"
                                            title="Edit"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(problem._id)}
                                            className="action-text-btn delete"
                                            title="Delete"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && problems.length > 0 && (
                        <div className="grid-footer">
                            <div className="text-xs text-muted">
                                Showing {(page - 1) * 15 + 1}-{Math.min(page * 15, (page - 1) * 15 + problems.length)}
                            </div>
                            <div className="pagination-controls">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    Previous
                                </Button>
                                <div className="page-info">
                                    {page} / {totalPages}
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Create/Edit Modal */}
                <Modal
                    isOpen={!!modalType}
                    onClose={() => setModalType(null)}
                    title={modalType === 'create' ? 'Add New Problem' : 'Edit Problem Details'}
                >
                    <form onSubmit={handleSubmit} className="p-2 space-y-4">
                        <div>
                            <label className="label-premium">Problem Title</label>
                            <input
                                className="input-premium w-full"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. valid-palindrome"
                                required
                            />
                        </div>

                        <div>
                            <label className="label-premium">Problem Link</label>
                            <input
                                className="input-premium w-full"
                                value={formData.link}
                                onChange={e => setFormData({ ...formData, link: e.target.value })}
                                placeholder="https://leetcode.com/problems/..."
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label-premium">Platform</label>
                                <select
                                    className="input-premium w-full cursor-pointer"
                                    value={formData.platform}
                                    onChange={e => setFormData({ ...formData, platform: e.target.value })}
                                >
                                    <option value="LeetCode">LeetCode</option>
                                    <option value="CodeForces">CodeForces</option>
                                    <option value="HackerRank">HackerRank</option>
                                    <option value="CodeChef">CodeChef</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="label-premium">Difficulty</label>
                                <select
                                    className="input-premium w-full cursor-pointer"
                                    value={formData.difficulty}
                                    onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                                >
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label-premium">Category</label>
                                <select
                                    className="input-premium w-full cursor-pointer"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="DSA">DSA</option>
                                    <option value="SQL">SQL</option>
                                    <option value="System Design">System Design</option>
                                    <option value="Web Dev">Web Dev</option>
                                </select>
                            </div>
                            <div>
                                <label className="label-premium">Tags (comma separated)</label>
                                <input
                                    className="input-premium w-full"
                                    value={formData.tags}
                                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                    placeholder="stack, string, arrays"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-white-5 mt-6">
                            <Button variant="secondary" onClick={() => setModalType(null)} type="button">Cancel</Button>
                            <Button type="submit" variant="primary">
                                {modalType === 'create' ? 'Create Problem' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
}

export default ProblemLibrary;
