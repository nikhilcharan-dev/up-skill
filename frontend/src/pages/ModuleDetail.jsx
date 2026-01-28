import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { showToast } from '../components/Notification';
import '../styles/ModuleDetail.css';

function ModuleDetail() {
    const { id, moduleIdx } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [module, setModule] = useState(null);
    const [course, setCourse] = useState(null);

    // Modal State
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false); // For Add/Edit
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);   // For View Details

    const [editingItem, setEditingItem] = useState(null);
    const [viewingDay, setViewingDay] = useState(null); // Day object to view

    const [formData, setFormData] = useState({});
    const [uploading, setUploading] = useState(false);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');

    const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);

    useEffect(() => {
        fetchCourse();
    }, [id, moduleIdx]);

    const fetchCourse = async () => {
        try {
            const response = await api.get(`/admin/course/${id}`);
            setCourse(response.data);
            const mod = response.data.modules[parseInt(moduleIdx)];
            if (!mod) {
                showToast('Module not found', 'error');
                navigate(`/admin/courses/${id}/structure`);
                return;
            }
            setModule(mod);
        } catch (err) {
            showToast('Failed to load course', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveStructure = async (newModules) => {
        try {
            const response = await api.put(`/admin/course/${id}/content`, { modules: newModules });
            setCourse(response.data);
            setModule(response.data.modules[parseInt(moduleIdx)]);
            showToast('Changes saved successfully', 'success');
            setIsConfigModalOpen(false);
        } catch (err) {
            showToast('Failed to save changes', 'error');
        }
    };

    // --- Actions ---

    const openAddDay = () => {
        setEditingItem(null);
        setFormData({

            date: '',
            topicName: '',
            topicDescription: '',
            trainerNotes: '',
            assignments: [],
            additionalAssignments: []
        });
        setIsConfigModalOpen(true);
    };

    const openEditDay = (day, dayIdx) => {
        setEditingItem({ dayIdx, ...day });
        setFormData({

            date: day.date ? new Date(day.date).toISOString().split('T')[0] : '',
            topicName: day.topicName || '',
            topicDescription: day.topicDescription || '',
            trainerNotes: day.trainerNotes || '',
            assignments: JSON.parse(JSON.stringify(day.assignments || [])),
            additionalAssignments: JSON.parse(JSON.stringify(day.additionalAssignments || []))
        });
        setIsConfigModalOpen(true);
    };

    const deleteDay = (dayIdx) => {
        if (!window.confirm('Delete this day?')) return;
        const newModules = [...course.modules];
        newModules[moduleIdx].days.splice(dayIdx, 1);
        handleSaveStructure(newModules);
    };

    const openViewDay = (day) => {
        setViewingDay(day);
        setIsViewModalOpen(true);
    };

    // --- Form Handling ---

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const uploadData = new FormData();
        uploadData.append('file', file);
        setUploading(true);
        try {
            const response = await api.post('/admin/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            console.log('Upload Success, setting URL:', response.data.url);
            setFormData(prev => ({ ...prev, trainerNotes: response.data.url }));
            showToast('File uploaded successfully', 'success');
        } catch (err) {
            showToast('File upload failed', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (formData.date && course) {
            const selectedDate = new Date(formData.date);
            selectedDate.setHours(0, 0, 0, 0);
            const startDate = new Date(course.startDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(course.endDate);
            endDate.setHours(0, 0, 0, 0);

            if (selectedDate < startDate || selectedDate > endDate) {
                showToast(`Date must be between ${startDate.toLocaleDateString()} and ${endDate.toLocaleDateString()}`, 'error');
                return;
                if (selectedDate < startDate || selectedDate > endDate) {
                    showToast(`Date must be between ${startDate.toLocaleDateString()} and ${endDate.toLocaleDateString()}`, 'error');
                    return;
                }
            }

            console.log('Submitting Day Data:', formData);
        }

        const newModules = [...course.modules];

        const dayData = {

            date: formData.date ? new Date(formData.date) : null,
            topicName: formData.topicName,
            topicDescription: formData.topicDescription,
            trainerNotes: formData.trainerNotes,
            assignments: formData.assignments,
            additionalAssignments: formData.additionalAssignments
        };

        if (editingItem && editingItem.dayIdx !== undefined) {
            newModules[moduleIdx].days[editingItem.dayIdx] = dayData;
        } else {
            if (!newModules[moduleIdx].days) newModules[moduleIdx].days = [];
            newModules[moduleIdx].days.push(dayData);
        }

        handleSaveStructure(newModules);
    };

    // --- Assignment Helpers ---
    const addAssignment = (type) => {
        setFormData({
            ...formData,
            [type]: [...(formData[type] || []), {
                name: '', link: '',
                source: 'LEETCODE', category: 'DSA', level: 'MEDIUM', tags: []
            }]
        });
    };

    const updateAssignment = (type, idx, field, value) => {
        const updated = [...formData[type]];
        if (field === 'tags') {
            value = value.split(',').map(t => t.trim());
        }
        updated[idx] = { ...updated[idx], [field]: value };
        setFormData({ ...formData, [type]: updated });
    };

    const removeAssignment = (type, idx) => {
        const updated = [...formData[type]];
        updated.splice(idx, 1);
        setFormData({ ...formData, [type]: updated });
    };


    if (loading) return <div className="page p-5">Loading...</div>;
    if (!module) return <div className="page p-5">Module not found</div>;

    const filteredDays = module.days?.filter(day => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            day.topicName?.toLowerCase().includes(q) ||
            day.dayNumber.toString().includes(q) ||
            day.assignments?.some(a => a.name.toLowerCase().includes(q))
        );
    });

    const handleDeleteNotes = async () => {
        if (!window.confirm('Are you sure you want to remove the specific notes for this day?')) return;

        try {
            // Optimistic update
            const newFormData = { ...formData, trainerNotes: '' };
            setFormData(newFormData);

            // API Call if we are editing an existing item
            if (editingItem && editingItem.dayIdx !== undefined) {
                await api.delete(`/admin/course/${id}/modules/${module._id}/days/${module.days[editingItem.dayIdx]._id}/notes`);
                showToast('Notes removed successfully', 'success');

                // Update local state course/module to reflect deletion
                const newModules = [...course.modules];
                newModules[moduleIdx].days[editingItem.dayIdx].trainerNotes = '';
                setCourse({ ...course, modules: newModules });
                setModule(newModules[moduleIdx]);
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to remove notes', 'error');
        }
    };

    const handleViewNotes = (url) => {
        setPdfPreviewUrl(url);
    };

    return (
        <div className="page">
            <div className="container">
                <nav className="nav">
                    <Link to={`/admin/courses/${id}/structure`} className="nav-link">← Back</Link>
                </nav>

                <div className="module-page-header">
                    <div className="text-sm font-bold text-accent uppercase tracking-wider mb-2">Module {parseInt(moduleIdx) + 1}</div>
                    <h1 className="module-title">{module.title}</h1>
                    <p className="module-description">{module.description}</p>
                </div>

                <div className="toolbar">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Type to search days..."
                            className="search-input-premium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button onClick={openAddDay} variant="primary">+ New Day</Button>
                </div>

                <div className="days-grid">
                    {filteredDays?.length === 0 && (
                        <div className="course-empty-state">
                            <p className="text-secondary mb-4">No days found.</p>
                            <Button onClick={openAddDay}>Create Day</Button>
                        </div>
                    )}

                    {filteredDays?.map((day, idx) => (
                        <DayCard
                            key={idx}
                            day={day}
                            idx={idx}
                            onClick={() => openViewDay(day)}
                            onEdit={() => openEditDay(day, idx)}
                            onDelete={() => deleteDay(idx)}
                        />
                    ))}
                </div>

                {/* PDF PREVIEW MODAL */}
                <Modal isOpen={!!pdfPreviewUrl} onClose={() => setPdfPreviewUrl(null)} title="Trainer Notes" size="xl" zIndex={60}>
                    <div className="h-[80vh] w-full bg-white rounded-lg overflow-hidden">
                        {pdfPreviewUrl && console.log('Previewing:', pdfPreviewUrl)}
                        {pdfPreviewUrl && (
                            <iframe
                                src={pdfPreviewUrl}
                                className="w-full h-full"
                                title="PDF Preview"
                                type="application/pdf"
                            >
                            </iframe>
                        )}
                    </div>
                </Modal>

                {/* VIEW MODAL - Glassmorphism Style */}
                <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="" size="xl">
                    {viewingDay && console.log('Viewing Day Data:', viewingDay)}
                    {viewingDay && (
                        <div className="glass-modal-content">
                            {/* Header Section */}
                            <div className="glass-header flex flex-col md:flex-row justify-between items-start mb-8 pb-6 border-b border-white-10">
                                <div className="flex items-start">
                                    <div className="day-status-badge">
                                        <span className="day-label">Topic</span>
                                    </div>
                                    <div>
                                        {viewingDay.date && <div className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">{new Date(viewingDay.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>}
                                        <h2 className="modal-topic-title">{viewingDay.topicName}</h2>
                                        <p className="text-secondary text-base mt-2 max-w-2xl leading-relaxed">{viewingDay.topicDescription || 'No description available.'}</p>
                                    </div>
                                </div>

                                {viewingDay.trainerNotes ? (
                                    <div className="mt-4 md:mt-0">
                                        <button
                                            onClick={() => handleViewNotes(viewingDay.trainerNotes)}
                                            className="resource-pill hover:bg-white/10 transition-colors flex items-center gap-2 cursor-pointer"
                                        >
                                            📄 View Notes
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-4 md:mt-0 text-xs text-secondary italic opacity-50 px-3 py-2 border border-white-5 rounded-full">
                                        No Notes Attached
                                    </div>
                                )}
                            </div>

                            {/* Content Flex Layout */}
                            <div className="glass-body flex flex-col md:flex-row gap-6">
                                {/* Class Assignments Column */}
                                <div className="flex-1 glass-panel p-4 rounded-xl">
                                    <h3 className="section-title text-green-400 mb-4">Class Assignments</h3>
                                    <div className="assignment-list">
                                        {viewingDay.assignments?.length === 0 && <div className="text-center text-sm text-secondary opacity-50 py-4">No class assignments.</div>}
                                        {viewingDay.assignments?.map((asgn, i) => (
                                            <a key={i} href={asgn.link} target="_blank" className="assignment-row">
                                                <div className="flex-1">
                                                    <div className="asgn-name">{asgn.name}</div>
                                                    <div className="asgn-tags">
                                                        <span className={`tag ${asgn.level.toLowerCase()}`}>{asgn.level}</span>
                                                        <span className="tag source">{asgn.source}</span>
                                                    </div>
                                                </div>
                                                <span className="text-secondary">↗</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>

                                {/* Practice Assignments Column */}
                                <div className="flex-1 glass-panel p-4 rounded-xl">
                                    <h3 className="section-title text-yellow-400 mb-4">Practice Problems</h3>
                                    <div className="assignment-list">
                                        {viewingDay.additionalAssignments?.length === 0 && <div className="text-center text-sm text-secondary opacity-50 py-4">No practice problems.</div>}
                                        {viewingDay.additionalAssignments?.map((asgn, i) => (
                                            <a key={i} href={asgn.link} target="_blank" className="assignment-row">
                                                <div className="flex-1">
                                                    <div className="asgn-name">{asgn.name}</div>
                                                    <div className="asgn-tags">
                                                        <span className={`tag ${asgn.level.toLowerCase()}`}>{asgn.level}</span>
                                                    </div>
                                                </div>
                                                <span className="text-secondary">↗</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* EDIT/ADD MODAL (Configuration) */}
                <Modal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} title="Configure Day" size="xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="form-row">
                            <div className="form-group mb-0">
                                <label className="form-label">Date</label>
                                <input type="date" className="form-input" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group mb-0">
                                <label className="form-label">Topic Name</label>
                                <input className="form-input" value={formData.topicName} onChange={e => setFormData({ ...formData, topicName: e.target.value })} required />
                            </div>
                            <div className="form-group mb-0">
                                <label className="form-label">Trainer Notes (PDF)</label>
                                <div className="flex gap-2 items-center">
                                    <input type="file" className="form-input text-sm flex-1" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={handleFileUpload} disabled={uploading} />
                                    {formData.trainerNotes && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs text-secondary truncate max-w-[200px]">{formData.trainerNotes.split('/').pop()}</span>
                                            <a href={formData.trainerNotes} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline" title="View Current Notes">
                                                View
                                            </a>
                                            <button
                                                type="button"
                                                onClick={handleDeleteNotes}
                                                className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded hover:bg-red-500/20 transition-colors"
                                                title="Remove Notes"
                                            >
                                                Delete Notes
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea className="form-input" rows={2} value={formData.topicDescription} onChange={e => setFormData({ ...formData, topicDescription: e.target.value })} />
                        </div>

                        <div className="space-y-6 pt-6 border-t border-white-10">
                            <AssignmentSection title="Class Assignments" assignments={formData.assignments} type="assignments" onAdd={() => addAssignment('assignments')} onUpdate={updateAssignment} onRemove={removeAssignment} color="blue" />
                            <AssignmentSection title="Practice Problems" assignments={formData.additionalAssignments} type="additionalAssignments" onAdd={() => addAssignment('additionalAssignments')} onUpdate={updateAssignment} onRemove={removeAssignment} color="purple" />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-white-10">
                            <Button variant="secondary" onClick={() => setIsConfigModalOpen(false)}>Cancel</Button>
                            <Button type="submit">Save Day</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
}

const AssignmentSection = ({ title, assignments, type, onAdd, onUpdate, onRemove, color }) => (
    <div className={`p-4 rounded-xl border border-${color}-500/20 bg-${color}-500/5`}>
        <div className="flex justify-between items-center mb-2">
            <h4 className={`font-bold text-sm uppercase tracking-wider text-${color}-400`}>{title}</h4>
            <Button size="sm" variant="secondary" onClick={onAdd} type="button">+ Add</Button>
        </div>
        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            {assignments?.map((asgn, i) => (
                <div key={i} className="p-3 rounded-lg border border-white-10 bg-black/20 relative group">
                    <button type="button" className="absolute top-2 right-2 text-xs text-danger opacity-0 group-hover:opacity-100" onClick={() => onRemove(type, i)}>✕</button>
                    <div className="form-row mb-2" style={{ gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <input className="form-input text-sm py-1" placeholder="Name" value={asgn.name} onChange={e => onUpdate(type, i, 'name', e.target.value)} />
                        <input className="form-input text-sm py-1" placeholder="Link" value={asgn.link} onChange={e => onUpdate(type, i, 'link', e.target.value)} />
                    </div>
                    <div className="assignment-form-grid">
                        <select className="form-input text-sm py-1" value={asgn.source} onChange={e => onUpdate(type, i, 'source', e.target.value)}><option value="LEETCODE">LC</option><option value="CODEFORCES">CF</option><option value="OTHER">Other</option></select>
                        <select className="form-input text-sm py-1" value={asgn.level} onChange={e => onUpdate(type, i, 'level', e.target.value)}><option value="EASY">Easy</option><option value="MEDIUM">Med</option><option value="HARD">Hard</option></select>
                        <select className="form-input text-sm py-1" value={asgn.category} onChange={e => onUpdate(type, i, 'category', e.target.value)}><option value="DSA">DSA</option><option value="SQL">SQL</option></select>
                        <input className="form-input text-sm py-1" placeholder="Tags" value={asgn.tags?.join(',')} onChange={e => onUpdate(type, i, 'tags', e.target.value)} />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const DayCard = ({ day, idx, onClick, onEdit, onDelete }) => {
    return (
        <div className="day-card" onClick={onClick}>
            <div className="day-card-header">
                {/* Main Content: Left aligned Badge + Info */}
                <div className="day-card-main" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1.5rem' }}>
                    {/* Badge on the LEFT */}
                    <div className="day-badge" style={{ order: -1 }}>
                        <span className="day-label">Index</span>
                        <span className="day-number">{idx + 1}</span>
                    </div>

                    {/* Info Text */}
                    <div className="day-info">
                        {day.date && <span className="day-date">{new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })}</span>}
                        <h3>{day.topicName || <span className="italic opacity-50">Untitled</span>}</h3>
                        <div className="flex gap-2 mt-1">
                            {day.assignments?.length > 0 && <span className="tag cat">{day.assignments.length} Assignments</span>}
                            {day.additionalAssignments?.length > 0 && <span className="tag source">{day.additionalAssignments.length} Practice</span>}
                            {day.trainerNotes && <span className="tag" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)' }}>📝 Notes</span>}
                        </div>
                    </div>
                </div>

                {/* Actions on the RIGHT */}
                <div className="day-actions">
                    <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onEdit(); }}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); onDelete(); }}>Delete</Button>
                </div>
            </div>
        </div>
    );
};

export default ModuleDetail;
