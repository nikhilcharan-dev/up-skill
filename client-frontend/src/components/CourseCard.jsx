import { PlayCircle, CheckCircle2, BookOpen } from 'lucide-react';
import './CourseCard.css';

const CourseCard = ({ course, onClick }) => {
    return (
        <div className="course-card glass-panel" onClick={onClick}>
            <div className="card-image-container">
                <img src={course.imageUrl} alt={course.title} className="card-image" />
                <div className="card-overlay">
                    <PlayCircle size={48} className="play-icon" />
                </div>
            </div>

            <div className="card-content">
                <div className="card-header">
                    <h3 className="course-title">{course.title}</h3>
                </div>

                <p className="course-description">{course.description}</p>

                <div className="card-footer">
                    <div className="stats-row">
                        <div className="stat-pill">
                            <BookOpen size={14} />
                            <span>{course.totalModules} Modules</span>
                        </div>
                    </div>

                    <div className="progress-container">
                        <div className="progress-header">
                            <span className="progress-label">Progress</span>
                            <span className="progress-value">{course.progress}%</span>
                        </div>
                        <div className="progress-bar-bg">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${course.progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {course.progress === 100 && (
                <div className="completed-badge">
                    <CheckCircle2 size={16} />
                    <span>Completed</span>
                </div>
            )}
        </div>
    );
};

export default CourseCard;
