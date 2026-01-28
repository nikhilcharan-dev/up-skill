import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import Modal from '../components/Modal';
import TraineeProfileModal from '../components/TraineeProfileModal';
import { showToast } from '../components/Notification';
import '../styles/TraineeList.css';

function TraineeList() {
    const [trainees, setTrainees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedTrainee, setSelectedTrainee] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);

    useEffect(() => {
        fetchTrainees();
    }, []);

    const fetchTrainees = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/admin/trainees?all=true`);
            setTrainees(response.data.trainees || []);
        } catch (err) {
            // Handled by global interceptor
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1); // Reset to first page on search
    };

    // Filter and Paginate locally
    const filteredTrainees = trainees.filter(t =>
        t.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.workEmail?.toLowerCase().includes(search.toLowerCase()) ||
        t.studentId?.toLowerCase().includes(search.toLowerCase())
    );

    const limit = 10;
    const totalPages = Math.ceil(filteredTrainees.length / limit);
    const paginatedTrainees = filteredTrainees.slice((page - 1) * limit, page * limit);

    const handleOpenProfile = (trainee) => {
        setSelectedTrainee(trainee);
        setShowProfileModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this trainee? This will remove them from all batches.')) {
            return;
        }

        try {
            await api.delete(`/admin/trainee/${id}`);
            showToast('Trainee deleted successfully', 'success');
            setTrainees(trainees.filter(t => t._id !== id));
        } catch (err) {
            // Handled by interceptor
        }
    };

    if (loading) return <div className="page flex items-center justify-center"><div className="spinner"></div></div>;

    return (
        <div className="page">
            <div className="container">
                {/* Navbar removed - moved to Sidebar */}

                <div className="page-header page-header-column">
                    <div>
                        <h1>Trainee Management</h1>
                        <p className="text-secondary">Manage all registered trainees across all batches</p>
                    </div>
                    <div className="flex gap-2 items-center" style={{ width: '100%' }}>
                        <div className="search-container">
                            {/* <span className="search-icon"></span> */}
                            <input
                                type="text"
                                className="form-input search-input"
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>
                </div>

                <div className="card">
                    {filteredTrainees.length === 0 ? (
                        <p className="text-muted text-center" style={{ padding: '40px' }}>
                            {search ? `No trainees matching "${search}"` : 'No trainees found.'}
                        </p>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name / Email</th>
                                    <th>Assigned Batch</th>
                                    <th>Joined Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedTrainees.map((t) => (
                                    <tr key={t._id} onClick={() => handleOpenProfile(t)} className="profile-row">
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="profile-avatar-sm">
                                                    {t.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <strong>{t.name}</strong>
                                                        {t.studentId && <span className="tag-tiny" style={{ fontSize: '0.6rem' }}>{t.studentId}</span>}
                                                    </div>
                                                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>{t.workEmail}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-wrap gap-1">
                                                {t.assignedBatches && t.assignedBatches.length > 0 ? (
                                                    t.assignedBatches.map(b => (
                                                        <span key={b._id} className="btn btn-secondary batch-badge">
                                                            {b.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-muted">Unassigned</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(t._id); }}>
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

                {/* Detailed Profile Modal */}
                <TraineeProfileModal
                    isOpen={showProfileModal}
                    onClose={() => setShowProfileModal(false)}
                    trainee={selectedTrainee}
                />
            </div>
        </div>
    );
}

export default TraineeList;
