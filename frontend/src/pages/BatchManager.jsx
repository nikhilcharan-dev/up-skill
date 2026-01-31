import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import Modal from '../components/Modal';
import TraineeProfileModal from '../components/TraineeProfileModal';
import { showToast } from '../components/Notification';
import '../styles/TraineeList.css'; // Reusing premium styles

function BatchManager() {
    const [batches, setBatches] = useState([]);
    const [courses, setCourses] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentBatchId, setCurrentBatchId] = useState(null);
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [bulkEmails, setBulkEmails] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [trainerSearch, setTrainerSearch] = useState('');
    const [showTrainerResults, setShowTrainerResults] = useState(false);
    const [searchTerm, setSearchTerm] = useState(''); // Added search state

    // View Trainees Modal State
    const [showViewTraineesModal, setShowViewTraineesModal] = useState(false);
    const [viewTraineesBatch, setViewTraineesBatch] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        courseId: '',
        trainerId: '',
        startDate: '',
        endDate: '',
    });
    const trainerSearchRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (trainerSearchRef.current && !trainerSearchRef.current.contains(event.target)) {
                setShowTrainerResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [batchRes, courseRes, trainerRes] = await Promise.all([
                api.get('/admin/batch'),
                api.get('/admin/course'),
                api.get('/admin/trainers?all=true'),
            ]);
            setBatches(batchRes.data || []);
            setCourses(courseRes.data || []);
            setTrainers(trainerRes.data || []);
        } catch (err) {
            // Handled by global interceptor
        } finally {
            setLoading(false);
        }
    };

    // Filtered Batches
    const filteredBatches = batches.filter(batch =>
        batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.course?.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenEditModal = (batch) => {
        setIsEditing(true);
        setCurrentBatchId(batch._id);
        setFormData({
            name: batch.name,
            courseId: batch.course?._id || '',
            trainerId: batch.trainer?._id || '',
            startDate: batch.startDate ? new Date(batch.startDate).toISOString().split('T')[0] : '',
            endDate: batch.endDate ? new Date(batch.endDate).toISOString().split('T')[0] : '',
        });
        setTrainerSearch(batch.trainer?.name || '');
        setShowCreateModal(true);
    };

    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setFormData({ name: '', courseId: '', trainerId: '', startDate: '', endDate: '' });
        setTrainerSearch('');
        setShowCreateModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            showToast('Batch name is required', 'error');
            return;
        }
        if (!formData.courseId) {
            showToast('Please select a course', 'error');
            return;
        }
        if (!formData.trainerId) {
            showToast('Please select a trainer', 'error');
            return;
        }
        if (!formData.startDate) {
            showToast('Start date is required', 'error');
            return;
        }
        if (!formData.endDate) {
            showToast('End date is required', 'error');
            return;
        }

        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        if (start >= end) {
            showToast('Start date must be earlier than end date', 'error');
            return;
        }

        try {
            if (isEditing) {
                await api.put(`/admin/batch/${currentBatchId}`, formData);
                showToast('Batch updated successfully!', 'success');
            } else {
                await api.post('/admin/batch', formData);
                showToast('Batch created successfully!', 'success');
            }
            setShowCreateModal(false);
            fetchData();
        } catch (err) {
            // Handled by global interceptor
        }
    };

    const handleDeleteBatch = async (id) => {
        if (!window.confirm('Are you sure you want to delete this batch? All associated data will be removed.')) return;

        try {
            await api.delete(`/admin/batch/${id}`);
            showToast('Batch deleted successfully', 'success');
            fetchData();
        } catch (err) {
            // Handled by interceptor
        }
    };

    const handleBulkAdd = async (e) => {
        e.preventDefault();

        const data = new FormData();
        data.append('batchId', selectedBatchId);

        if (selectedFile) {
            data.append('file', selectedFile);
        } else {
            const emailArray = bulkEmails.split('\n').map(e => e.trim()).filter(e => e !== '');
            if (emailArray.length === 0) {
                showToast('Please upload an Excel file or enter at least one email address.', 'error');
                return;
            }
            emailArray.forEach(email => data.append('emails[]', email));
        }

        try {
            await api.post('/admin/bulk-add-trainees', data);
            showToast('Trainees added/updated successfully!', 'success');
            setShowBulkModal(false);
            setBulkEmails('');
            setSelectedFile(null);
            fetchData();
        } catch (err) {
            // Handled by global interceptor
        }
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (loading) return <div className="page flex items-center justify-center"><div className="spinner"></div></div>;

    return (
        <div className="page">
            <div className="container">
                <div className="page-header page-header-column">
                    <div>
                        <h1>Batch Management</h1>
                        <p className="text-secondary">Organize, schedule, and manage trainee batches</p>
                    </div>
                    <div className="flex justify-between items-center w-full">
                        <div className="search-container">
                            <input
                                type="text"
                                className="form-input search-input"
                                placeholder="Search by batch name or course..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="primary" onClick={handleOpenCreateModal}>+ Add Batch</Button>
                    </div>
                </div>

                <div className="card">
                    {filteredBatches.length === 0 ? (
                        <p className="text-muted text-center p-8">No batches found matching your search.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table min-w-full">
                                <thead>
                                    <tr>
                                        <th>Batch Name</th>
                                        <th>Course</th>
                                        <th>Dates</th>
                                        <th>Stats</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBatches.map((batch) => (
                                        <tr key={batch._id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="profile-avatar-sm" style={{ background: 'var(--accent-primary)', fontSize: '0.7rem' }}>
                                                        {batch.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <strong>{batch.name}</strong>
                                                </div>
                                            </td>
                                            <td><span className="text-secondary">{batch.course?.title || 'Unknown'}</span></td>
                                            <td className="batch-date">
                                                <div className="text-xs text-muted">
                                                    {new Date(batch.startDate).toLocaleDateString()} &rarr; {new Date(batch.endDate).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="tag-tiny bg-glass">{batch.trainees?.length || 0} Trainees</span>
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <Button variant="secondary" size="sm" onClick={() => handleOpenEditModal(batch)}>
                                                        Edit
                                                    </Button>
                                                    <Button variant="danger" size="sm" onClick={() => handleDeleteBatch(batch._id)}>
                                                        Delete
                                                    </Button>
                                                    <Button variant="primary" size="sm" onClick={() => { setSelectedBatchId(batch._id); setShowBulkModal(true); }}>
                                                        Add Trainees
                                                    </Button>
                                                    <Button variant="secondary" size="sm" onClick={() => { setViewTraineesBatch(batch); setShowViewTraineesModal(true); }}>
                                                        View Trainees
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Create/Edit Batch Modal */}
                <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title={isEditing ? "Edit Batch" : "Create New Batch"}>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Batch Name</label>
                            <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Course</label>
                            <select name="courseId" className="form-input" value={formData.courseId} onChange={handleChange} required>
                                <option value="">Select a course</option>
                                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                            </select>
                        </div>
                        <div className="form-group trainer-search-container" ref={trainerSearchRef}>
                            <label className="form-label">Trainer</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search by trainer name..."
                                value={trainerSearch}
                                onChange={(e) => {
                                    setTrainerSearch(e.target.value);
                                    setShowTrainerResults(true);
                                }}
                                onFocus={() => setShowTrainerResults(true)}
                                required
                            />
                            {showTrainerResults && trainerSearch && (
                                <div className="search-results-dropdown">
                                    {trainers
                                        .filter(t => t.name.toLowerCase().includes(trainerSearch.toLowerCase()))
                                        .map(t => (
                                            <div
                                                key={t._id}
                                                className="search-result-item"
                                                onClick={() => {
                                                    setFormData({ ...formData, trainerId: t._id });
                                                    setTrainerSearch(t.name);
                                                    setShowTrainerResults(false);
                                                }}
                                            >
                                                <div className="search-result-name">{t.name}</div>
                                                <div className="search-result-email">{t.workEmail}</div>
                                            </div>
                                        ))}
                                    {trainers.filter(t => t.name.toLowerCase().includes(trainerSearch.toLowerCase())).length === 0 && (
                                        <div className="no-results">
                                            No matching trainers found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="form-label">Start Date</label>
                                <input type="date" name="startDate" className="form-input" value={formData.startDate} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">End Date</label>
                                <input type="date" name="endDate" className="form-input" value={formData.endDate} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="modal-actions">
                            <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                            <Button variant="primary" type="submit">{isEditing ? "Update Batch" : "Create Batch"}</Button>
                        </div>
                    </form>
                </Modal>

                {/* Add Trainees Modal */}
                <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Add Trainees">
                    <form onSubmit={handleBulkAdd}>
                        <p className="modal-hint">
                            Upload an Excel file or enter emails manually (one per line).
                            Default password will be <strong>trainee123</strong>.
                        </p>

                        <div className="form-group">
                            <label className="form-label">Excel File (.xlsx)</label>
                            <input
                                type="file"
                                accept=".xlsx"
                                className="form-input"
                                onChange={handleFileChange}
                            />
                        </div>

                        {!selectedFile && (
                            <div className="form-group">
                                <label className="form-label">Emails (Manual)</label>
                                <textarea
                                    className="form-input"
                                    rows={6}
                                    value={bulkEmails}
                                    onChange={e => setBulkEmails(e.target.value)}
                                    placeholder="trainee1@gmail.com&#10;trainee2@gmail.com"
                                />
                            </div>
                        )}
                        <div className="modal-actions">
                            <Button variant="secondary" type="button" onClick={() => setShowBulkModal(false)}>Cancel</Button>
                            <Button variant="primary" type="submit">Add Trainees</Button>
                        </div>
                    </form>
                </Modal>
            </div>

            {/* View Trainees Modal */}
            {showViewTraineesModal && viewTraineesBatch && (
                <ViewTraineesModal
                    batch={viewTraineesBatch}
                    isOpen={showViewTraineesModal}
                    onClose={() => setShowViewTraineesModal(false)}
                />
            )}
        </div>
    );
}

function ViewTraineesModal({ batch, isOpen, onClose }) {
    const [trainees, setTrainees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedTrainee, setSelectedTrainee] = useState(null);
    const [showProfile, setShowProfile] = useState(false);

    useEffect(() => {
        if (isOpen && batch) {
            fetchTrainees();
        }
    }, [isOpen, batch, page, search]);

    const fetchTrainees = async () => {
        if (!batch || !batch._id) return;
        try {
            setLoading(true);
            // Explicitly passing batchId in params, but verified batch._id existence above
            console.log("Fetching trainees for batch (Dedicated Endpoint):", batch._id);
            const response = await api.get(`/admin/batch/${batch._id}/trainees`, {
                params: {
                    page,
                    limit: 5,
                    search
                }
            });
            setTrainees(response.data.trainees);
            setTotalPages(response.data.totalPages);
        } catch (err) {
            // Handled by interceptor, or we can toast
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Trainees in ${batch.name}`} size="lg">
                <div className="flex flex-col gap-4">
                    <div className="form-group">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search trainees..."
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-4"><div className="spinner"></div></div>
                    ) : trainees.length === 0 ? (
                        <div className="text-center p-4 text-muted">No trainees found in this batch.</div>
                    ) : (
                        <>
                            <div className="card" style={{ padding: '0.5rem' }}>
                                <div className="overflow-x-auto">
                                    <table className="table min-w-full">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Joined</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {trainees.map(t => (
                                                <tr
                                                    key={t._id}
                                                    onClick={() => { setSelectedTrainee(t); setShowProfile(true); }}
                                                    style={{ cursor: 'pointer' }}
                                                    className="hover-bg-subtle"
                                                >
                                                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                                                    <td className="text-secondary">{t.workEmail}</td>
                                                    <td className="text-xs">{new Date(t.createdAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {totalPages > 1 && (
                                <div className="pagination-container">
                                    <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                                        &larr; Prev
                                    </Button>
                                    <span className="text-sm">Page <strong className="text-primary">{page}</strong> of {totalPages}</span>
                                    <Button size="sm" variant="secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                                        Next &rarr;
                                    </Button>
                                </div>
                            )}
                        </>
                    )}

                    <div className="modal-actions">
                        <Button variant="secondary" onClick={onClose}>Close</Button>
                    </div>
                </div>
            </Modal>

            {/* Nested Profile Modal */}
            <TraineeProfileModal
                isOpen={showProfile}
                onClose={() => setShowProfile(false)}
                trainee={selectedTrainee}
            />
        </>
    );
}

export default BatchManager;
