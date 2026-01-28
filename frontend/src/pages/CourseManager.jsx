import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import api from '../services/api';
import Button from '../components/Button';
import '../styles/CourseManager.css';
import Modal from '../components/Modal';
import { showToast } from '../components/Notification';

function CourseManager() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCourseId, setCurrentCourseId] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
    });

    const cardsContainerRef = useRef();

    useEffect(() => {
        fetchCourses();
    }, []);

    useLayoutEffect(() => {
        if (!loading && courses.length > 0) {
            gsap.fromTo(".animate-card",
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out", clearProps: "all" }
            );
        }
    }, [loading, courses]);

    const fetchCourses = async () => {
        try {
            const response = await api.get('/admin/course');
            setCourses(response.data);
        } catch (err) {
            // Handled by interceptor or silent for read
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setFormData({ title: '', description: '', startDate: '', endDate: '' });
        setShowModal(true);
    };

    const handleOpenEditModal = (course) => {
        setIsEditing(true);
        setCurrentCourseId(course._id);
        setFormData({
            title: course.title,
            description: course.description || '',
            startDate: course.startDate ? new Date(course.startDate).toISOString().split('T')[0] : '',
            endDate: course.endDate ? new Date(course.endDate).toISOString().split('T')[0] : '',
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            showToast('Course title is required', 'error');
            return;
        }

        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);

        if (start > end) {
            showToast('Start Date cannot be later than End Date', 'error');
            return;
        }

        try {
            if (isEditing) {
                await api.put(`/admin/course/${currentCourseId}`, formData);
                showToast('Course updated successfully!', 'success');
            } else {
                await api.post('/admin/course', formData);
                showToast('Course created successfully!', 'success');
            }
            setShowModal(false);
            fetchCourses();
        } catch (err) {
            // Global Axios interceptor handles showToast for us
        }
    };

    const handleDeleteCourse = async (id) => {
        if (!window.confirm('Are you sure you want to delete this course? All associated data will be removed.')) return;

        try {
            await api.delete(`/admin/course/${id}`);
            showToast('Course deleted successfully', 'success');
            fetchCourses();
        } catch (err) {
            // Handled by global interceptor
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (loading) return <div className="page flex items-center justify-center"><div className="spinner"></div></div>;

    return (
        <div className="page">
            <div className="container">
                {/* Navbar removed - moved to Sidebar */}

                <div className="page-header">
                    <div>
                        <h1>Course Management</h1>
                        <p className="text-secondary">Define curriculum and roadmap dates</p>
                    </div>
                    <Button variant="primary" onClick={handleOpenCreateModal}>+ Create New Course</Button>
                </div>

                {courses.length === 0 ? (
                    <div className="card course-empty-state">
                        <p className="text-muted">No courses found. Start by defining your first training curriculum.</p>
                    </div>
                ) : (
                    <div className="grid grid-2" ref={cardsContainerRef}>
                        {courses.map((course) => (
                            <div key={course._id} className="card course-card animate-card">
                                <div className="course-card-header">
                                    <h3 className="course-title">{course.title}</h3>
                                    <div className="course-actions">
                                        <Button variant="secondary" size="sm" onClick={() => handleOpenEditModal(course)}>
                                            Edit
                                        </Button>
                                        <Button variant="danger" size="sm" onClick={() => handleDeleteCourse(course._id)}>
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                                <p className="course-description">
                                    {course.description || 'No description provided.'}
                                </p>
                                <div className="course-footer">
                                    <div className="course-date">
                                        {/* <span className="calendar-icon"></span> */}
                                        {new Date(course.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — {new Date(course.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <Button variant="primary" size="sm" onClick={() => navigate(`/admin/courses/${course._id}/structure`)}>
                                        Manage Structure
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? 'Edit Course' : 'Create New Course'} size="sm">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Course Title</label>
                            <input
                                type="text"
                                name="title"
                                className="form-input"
                                placeholder="e.g. Full Stack Web Development"
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
                                placeholder="What will trainees learn in this course?"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="form-label">Start Date</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    className="form-input"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">End Date</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    className="form-input"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit">
                                {isEditing ? 'Update Course' : 'Create Course'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
}

export default CourseManager;
