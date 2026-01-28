import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { showToast } from '../components/Notification';
import '../styles/Calendar.css';

function CourseCalendar() {
    const { id } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        setCourse(null);
        setLoading(true);
        fetchCourse();
    }, [id]);

    const fetchCourse = async () => {
        try {
            const response = await api.get(`/admin/course/${id}`);
            setCourse(response.data);
        } catch (err) {
            setError('Failed to load course details');
        } finally {
            setLoading(false);
        }
    };

    const handleDayClick = (dateStr) => {
        setSelectedDate(dateStr);
        const existing = course.dailyAssignments && course.dailyAssignments[dateStr];
        setAssignments(Array.isArray(existing) ? existing : []);
        setShowModal(true);
    };

    const handleNoteUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            showToast('Please upload a PDF file', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('date', selectedDate);

        try {
            setUploading(true);
            const response = await api.put(`/admin/course/${id}/notes`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast('Trainer notes uploaded successfully!', 'success');
            setCourse(response.data.course); // Update course data with new notes map
        } catch (err) {
            // Handled by interceptor
        } finally {
            setUploading(false);
        }
    };

    const handleAddAssignment = () => {
        setAssignments([...assignments, {
            name: '',
            link: '',
            platform: 'leetcode',
            category: 'dsa',
            level: 'medium',
            tags: [],
            description: ''
        }]);
    };

    const handleRemoveAssignment = (index) => {
        setAssignments(assignments.filter((_, i) => i !== index));
    };

    const handleAssignmentChange = (index, field, value) => {
        const updated = [...assignments];
        if (field === 'tags') {
            updated[index][field] = value.split(',').map(t => t.trim()).filter(t => t !== '');
        } else {
            updated[index][field] = value;
        }
        setAssignments(updated);
    };

    const handleSaveAssignments = async (e) => {
        e.preventDefault();

        // Strict Validation for all fields
        if (assignments.length > 0) {
            for (let i = 0; i < assignments.length; i++) {
                const asgn = assignments[i];
                const taskNum = assignments.length > 1 ? ` (Task ${i + 1})` : '';

                if (!asgn.name?.trim()) {
                    showToast(`Task name is required${taskNum}`, 'error');
                    return;
                }
                if (!asgn.platform) {
                    showToast(`Please select a platform${taskNum}`, 'error');
                    return;
                }
                if (!asgn.category) {
                    showToast(`Please select a category${taskNum}`, 'error');
                    return;
                }
                if (!asgn.level) {
                    showToast(`Please select a difficulty level${taskNum}`, 'error');
                    return;
                }
                if (!asgn.tags || asgn.tags.length === 0) {
                    showToast(`At least one tag is required${taskNum}`, 'error');
                    return;
                }
                if (!asgn.link?.trim()) {
                    showToast(`Link is required${taskNum}`, 'error');
                    return;
                }
                if (!asgn.link.startsWith('http')) {
                    showToast(`Please enter a valid URL starting with http:// or https://${taskNum}`, 'error');
                    return;
                }
            }
        }

        try {
            await api.put(`/admin/course/${id}/assignments`, {
                date: selectedDate,
                assignments: assignments
            });
            showToast('Roadmap saved successfully!', 'success');
            setShowModal(false);
            fetchCourse();
        } catch (err) {
            // Handled by global interceptor
        }
    };

    const generateCalendarMonths = () => {
        if (!course || !course.startDate || !course.endDate) return [];
        const start = new Date(course.startDate);
        const end = new Date(course.endDate);
        const months = {};

        let current = new Date(start);
        current.setUTCHours(0, 0, 0, 0);
        const endNorm = new Date(end);
        endNorm.setUTCHours(0, 0, 0, 0);

        while (current <= endNorm) {
            const monthKey = current.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!months[monthKey]) {
                months[monthKey] = {
                    title: monthKey,
                    days: [],
                    startOffset: current.getUTCDay()
                };
            }

            const dateStr = current.toISOString().split('T')[0];
            const dailyAssignments = course.dailyAssignments || {};

            months[monthKey].days.push({
                date: new Date(current),
                dateStr,
                isSunday: current.getUTCDay() === 0,
                assignments: dailyAssignments[dateStr] || [],
                hasNote: course.trainerNotes && course.trainerNotes[dateStr]
            });

            current.setUTCDate(current.getUTCDate() + 1);
        }
        return Object.values(months);
    };

    if (loading) return <div className="page flex items-center justify-center"><div className="spinner"></div></div>;
    if (!course) return <div className="page container"><h2>Course not found</h2></div>;

    const monthSections = generateCalendarMonths();

    return (
        <div className="page">
            <div className="container">
                <nav className="nav">
                    <Link to="/admin/courses" className="nav-link">← Courses</Link>
                    <span className="nav-link active">{course.title} - Calendar</span>
                </nav>

                <div className="page-header">
                    <div>
                        <h1>Course Roadmap</h1>
                        <p className="text-muted">Month-wise curriculum planning</p>
                    </div>
                </div>

                {monthSections.map((month) => (
                    <div key={month.title} className="month-section">
                        <h2 className="month-title">{month.title}</h2>
                        <div className="calendar-grid">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="calendar-day-header">{d}</div>
                            ))}

                            {Array.from({ length: month.days[0].date.getUTCDay() }).map((_, i) => (
                                <div key={`empty-${i}`} className="calendar-day empty"></div>
                            ))}

                            {month.days.map((day) => (
                                <div
                                    key={day.dateStr}
                                    className={`calendar-day ${day.isSunday ? 'holiday' : ''} ${day.assignments.length > 0 ? 'has-assignment' : ''}`}
                                    onClick={() => handleDayClick(day.dateStr)}
                                >
                                    <div className="day-number">{day.date.getUTCDate()}</div>

                                    <div className="day-content">
                                        {day.assignments.slice(0, 3).map((asgn, idx) => (
                                            <div key={idx} className="assignment-item-mini">
                                                <span className="assignment-indicator"></span>
                                                {asgn.name}
                                            </div>
                                        ))}
                                        {day.assignments.length > 3 && (
                                            <div className="text-muted" style={{ fontSize: '0.6rem' }}>+ {day.assignments.length - 3} more</div>
                                        )}

                                        {day.assignments.length === 0 && !day.isSunday && (
                                            <div className="add-hint">+ Add Tasks</div>
                                        )}

                                        {day.hasNote && (
                                            <div className="tag-tiny" style={{ marginTop: '5px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', fontSize: '0.6rem' }}>
                                                Notes
                                            </div>
                                        )}

                                        {day.isSunday && <div className="off-label">REST</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Manage Roadmap: ${selectedDate}`} size="lg">
                    <form onSubmit={handleSaveAssignments}>
                        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '1rem', marginBottom: '1.5rem' }}>

                            {/* Trainer Notes Section */}
                            <div className="card-subtle p-4 mb-6" style={{ borderRadius: '12px' }}>
                                <h4 className="flex items-center gap-2 mb-3" style={{ fontSize: '0.9rem', color: 'var(--accent-primary)' }}>
                                    Trainer Notes (PDF)
                                </h4>
                                {course.trainerNotes && course.trainerNotes[selectedDate] ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {/* <span style={{ fontSize: '1.5rem' }}></span> */}
                                            <div>
                                                <p className="font-bold mb-0">PDF Document Ready</p>
                                                <a
                                                    href={course.trainerNotes[selectedDate].startsWith('http') ? course.trainerNotes[selectedDate] : `${import.meta.env.VITE_API_URL}${course.trainerNotes[selectedDate]}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn-link"
                                                    style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}
                                                >
                                                    View / Download Notes →
                                                </a>
                                            </div>
                                        </div>
                                        <Button variant="secondary" size="sm" onClick={() => document.getElementById('note-upload').click()} disabled={uploading}>
                                            {uploading ? 'Updating...' : 'Replace PDF'}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 py-4 border border-dashed border-white-10 rounded-lg">
                                        <p className="text-muted text-sm">No trainer notes uploaded for this day</p>
                                        <Button variant="secondary" size="sm" onClick={() => document.getElementById('note-upload').click()} disabled={uploading}>
                                            {uploading ? 'Uploading...' : 'Upload PDF Notes'}
                                        </Button>
                                    </div>
                                )}
                                <input
                                    id="note-upload"
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleNoteUpload}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            <h4 className="flex items-center gap-2 mb-4" style={{ fontSize: '0.9rem', color: 'var(--accent-secondary)' }}>
                                Assignments & Tasks
                            </h4>

                            {assignments.map((asgn, index) => (
                                <div key={index} className="assignment-form-card">
                                    <button type="button" className="text-xs text-red-500 hover:text-red-400" onClick={() => handleRemoveAssignment(index)}>Remove</button>

                                    <div className="form-group full-width">
                                        <label className="form-label">Task Name</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={asgn.name}
                                            onChange={e => handleAssignmentChange(index, 'name', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Platform</label>
                                        <select
                                            className="form-input"
                                            value={asgn.platform}
                                            onChange={e => handleAssignmentChange(index, 'platform', e.target.value)}
                                        >
                                            <option value="leetcode">LeetCode</option>
                                            <option value="codeforces">Codeforces</option>
                                            <option value="codechef">CodeChef</option>
                                            <option value="atcoder">AtCoder</option>
                                            <option value="hackerrank">HackerRank</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <select
                                            className="form-input"
                                            value={asgn.category}
                                            onChange={e => handleAssignmentChange(index, 'category', e.target.value)}
                                        >
                                            <option value="dsa">DSA</option>
                                            <option value="sql">SQL</option>
                                            <option value="system-design">System Design</option>
                                            <option value="development">Development</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Level</label>
                                        <select
                                            className="form-input"
                                            value={asgn.level}
                                            onChange={e => handleAssignmentChange(index, 'level', e.target.value)}
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>

                                    <div className="form-group full-width">
                                        <label className="form-label">Tags (comma separated)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={asgn.tags?.join(', ')}
                                            onChange={e => handleAssignmentChange(index, 'tags', e.target.value)}
                                            placeholder="Array, BFS, Dynamic Programming"
                                        />
                                    </div>

                                    <div className="form-group full-width" style={{ marginTop: '-0.5rem' }}>
                                        <label className="form-label">Link</label>
                                        <input
                                            type="url"
                                            className="form-input"
                                            value={asgn.link}
                                            onChange={e => handleAssignmentChange(index, 'link', e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            ))}

                            <Button
                                variant="secondary"
                                fullWidth
                                onClick={handleAddAssignment}
                                className="btn-dashed"
                                style={{ marginTop: '0.5rem' }}
                            >
                                + Add Assignment Task
                            </Button>
                        </div>

                        <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button variant="primary" type="submit">Save Roadmap</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
}

export default CourseCalendar;
