import { PlayCircle, CheckCircle2 } from 'lucide-react';
import './ModuleCard.css';

const ModuleCard = ({ module, onClick }) => {
    return (
        <div className="module-card glass-panel" onClick={onClick}>
            <div className="card-image-container">
                <img src={module.imageUrl} alt={module.title} className="card-image" />
                <div className="card-overlay">
                    <PlayCircle size={48} className="play-icon" />
                </div>
            </div>

            <div className="card-content">
                <div className="card-header">
                    <h3 className="module-title">{module.title}</h3>
                </div>

                <p className="module-description">{module.description}</p>

                <div className="card-footer">
                    <div className="progress-container">
                        <div className="progress-header">
                            <span className="progress-label">Progress</span>
                            <span className="progress-value">{module.progress}%</span>
                        </div>
                        <div className="progress-bar-bg">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${module.progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {module.progress === 100 && (
                <div className="completed-badge">
                    <CheckCircle2 size={16} />
                    <span>Completed</span>
                </div>
            )}
        </div>
    );
};

export default ModuleCard;
