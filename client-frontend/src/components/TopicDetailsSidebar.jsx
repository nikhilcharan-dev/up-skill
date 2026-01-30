import { Info, CheckCircle2 } from 'lucide-react';
import './TopicDetailsSidebar.css';

const TopicDetailsSidebar = () => {
    return (
        <div className="topic-sidebar">
            <div className="sidebar-top-icon">
                <Info size={20} />
            </div>

            <div className="sidebar-nav-item active">
                <span>All</span>
            </div>

            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <div key={num} className="sidebar-nav-item">
                    <span className="q-label">Q {num}</span>
                    <CheckCircle2 size={12} className="q-status-icon" />
                </div>
            ))}
        </div>
    );
};

export default TopicDetailsSidebar;
