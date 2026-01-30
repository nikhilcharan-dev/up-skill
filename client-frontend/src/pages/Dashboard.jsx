import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const { data } = await api.get('/trainee/dashboard');
                // Extract courses from batches
                // Batches structure: [{ course: { _id, title, description, ... }, ... }]
                const fetchedCourses = data.batches
                    .filter(batch => batch.course) // Ensure course exists
                    .map(batch => ({
                        id: batch.course._id,
                        title: batch.course.title,
                        description: batch.course.description,
                        // Mocking progress for now as backend might not calculate it fully yet
                        progress: 0,
                        totalModules: batch.course.modules ? batch.course.modules.length : 0,
                        completedModules: 0,
                        imageUrl: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' // Default image
                    }));
                setCourses(fetchedCourses);
            } catch (err) {
                console.error("Failed to load dashboard:", err);
                setError("Failed to load your courses.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const handleCourseClick = (courseId) => {
        navigate(`/course/${courseId}`);
    };

    if (loading) return (
        <div className="loading-container">
            <div className="spinner"></div>
            <span>Loading dashboard...</span>
        </div>
    );

    if (error) return (
        <div className="error-container">
            <div className="error-card">
                <div className="error-icon-wrapper">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <div className="error-title">Unable to Load Dashboard</div>
                <div className="error-message">{error}</div>
                <button className="retry-btn" onClick={() => window.location.reload()}>
                    Retry
                </button>
            </div>
        </div>
    );

    return (
        <div className="dashboard-container">
            <div className="dashboard-hero mobile-hero">
                <div className="hero-content">
                    <h1>Welcome back, Learner!</h1>
                    <p>You have {courses.length} courses in progress. Keep up the momentum.</p>
                </div>
                <div className="hero-stats">
                    <div className="stat-item">
                        <span className="stat-value">{courses.length}</span>
                        <span className="stat-label">Total Courses</span>
                    </div>
                </div>
            </div>

            <h3 className="section-title">Your Courses</h3>

            <div className="modules-grid">
                {courses.length > 0 ? (
                    courses.map((course) => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            onClick={() => handleCourseClick(course.id)}
                        />
                    ))
                ) : (
                    <p className="no-courses-msg">You are not enrolled in any courses yet.</p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
