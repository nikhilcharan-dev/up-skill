
import { useState, useEffect } from 'react';
import api from '../services/api';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { showToast } from '../components/Notification';
import '../styles/TraineeList.css'; // Reusing similar styles for consistency

function TrainerManager() {
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: ''
    });

    useEffect(() => {
        fetchTrainers();
    }, []);

    const fetchTrainers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/trainers?all=true');
            // Backend returns array directly when all=true
            setTrainers(response.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this trainer?')) return;
        try {
            await api.delete(`/admin/trainee/${id}`);
            showToast('Trainer deleted successfully', 'success');
            setTrainers(trainers.filter(t => t._id !== id));
        } catch (err) {
            // Handled by interceptor
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/trainers', formData);
            showToast('Trainer created successfully! Email sent.', 'success');
            setShowCreateModal(false);
            setFormData({ name: '', email: '' });
            fetchTrainers();
        } catch (err) {
            // Handled by interceptor
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Client-side Filtering & Pagination
    const filteredTrainers = trainers.filter(t =>
        t.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.workEmail?.toLowerCase().includes(search.toLowerCase())
    );

    const limit = 10;
    const totalPages = Math.ceil(filteredTrainers.length / limit);
    const paginatedTrainers = filteredTrainers.slice((page - 1) * limit, page * limit);

    if (loading) return <div className="page flex items-center justify-center"><div className="spinner"></div></div>;

    return (
        <div className="page">
            <div className="container">
                <div className="page-header page-header-column">
                    <div>
                        <h1>Trainer Management</h1>
                        <p className="text-secondary">Manage trainer accounts and credentials</p>
                    </div>
                    <div className="flex justify-between items-center w-full">
                        <div className="search-container">
                            <input
                                type="text"
                                className="form-input search-input"
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={handleSearchChange}
                            />
                        </div>
                        <Button variant="primary" onClick={() => setShowCreateModal(true)}>+ Add Trainer</Button>
                    </div>
                </div>

                <div className="card">
                    {filteredTrainers.length === 0 ? (
                        <p className="text-muted text-center p-8">
                            {search ? `No trainers matching "${search}"` : 'No trainers found.'}
                        </p>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Joined Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedTrainers.map((trainer) => (
                                    <tr key={trainer._id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="profile-avatar-sm" style={{ background: 'var(--accent-secondary)' }}>
                                                    {trainer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <strong>{trainer.name}</strong>
                                            </div>
                                        </td>
                                        <td className="text-secondary">{trainer.workEmail}</td>
                                        <td className="text-xs">{new Date(trainer.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <Button variant="danger" size="sm" onClick={() => handleDelete(trainer._id)}>
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="pagination-container">
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                        >
                            &larr; Prev
                        </Button>
                        <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                            Page <strong className="text-primary">{page}</strong> of {totalPages}
                        </span>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                        >
                            Next &rarr;
                        </Button>
                    </div>
                )}

                {/* Create Trainer Modal */}
                <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Trainer">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Name</label>
                            <input
                                type="text"
                                name="name"
                                className="form-input"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="modal-actions">
                            <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                            <Button variant="primary" type="submit">Create Trainer</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
}

export default TrainerManager;
