import { Flame, Bell, MonitorPlay, Puzzle } from 'lucide-react';
import './TopicDetailsHeader.css';

const TopicDetailsHeader = ({ day, activeTab, onTabChange, assignmentCount = "0/0", additionalCount = "0/0", compact = false }) => {
    return (
        <div className="topic-header-container">
            {/* Top Bar */}
            {!compact && (
                <div className="topic-top-bar glass-panel">
                    <div className="topic-info">

                        <div className="topic-titles">
                            <h2 className="topic-main-title">{day?.topic || "Topic Name"}</h2>
                            <span className="topic-date">{day?.date || "Date"} 2025</span>
                        </div>

                    </div>


                </div>
            )}

            {/* Tabs Bar */}
            <div className="topic-tabs-bar">
                <div className="left-tabs">

                    <div
                        className={`tab-link ${activeTab === 'assignment' ? 'active-tab' : ''}`}
                        onClick={() => onTabChange('assignment')}
                    >
                        Assignment {assignmentCount}
                    </div>

                    <div
                        className={`tab-link ${activeTab === 'additional' ? 'active-tab' : ''}`}
                        onClick={() => onTabChange('additional')}
                    >
                        Additional Problems {additionalCount}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TopicDetailsHeader;
