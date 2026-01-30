import { ChevronRight, ChevronDown, Trophy, FileText, FileEdit } from 'lucide-react';
import TopicDetails from './TopicDetails';
import './DayRow.css';

const DayRow = ({ day, onClick, onOpenNotes, onOpenUserNotes, isExpanded, onProgressUpdate }) => {
    const handleNotesClick = (e) => {
        e.stopPropagation();
        if (day.lectureNotesPdf) {
            onOpenNotes(day);
        }
    };

    // Calculate completion stats from mockProblems
    // Calculate completion stats from props
    // Calculate completion stats from props
    const assignmentTotal = day.assignmentProblems?.length || 0;
    const assignmentSolved = day.assignmentProblems?.filter(p => p.status === 'Solved').length || 0;

    const additionalTotal = day.practiceProblems?.length || 0;
    const additionalSolved = day.practiceProblems?.filter(p => p.status === 'Solved').length || 0;

    return (
        <div className={`day-row-container ${isExpanded ? 'expanded' : ''}`}>
            <div className="day-row glass-panel" onClick={onClick}>
                <div className="day-date-col">
                    <span className="day-full">{day.day}, {day.date}</span>
                </div>

                <div className="day-topic-col">
                    <h4 className="topic-title">{day.topic}</h4>
                </div>

                <div className="day-stats-col">
                    <div className="stat-group box-stat">
                        <span className="stat-label">Notes</span>
                        <div
                            className="file-icon-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenUserNotes(day);
                            }}
                            title="Open My Notes"
                        >
                            <FileEdit size={18} />
                        </div>
                    </div>

                    <div className="stat-group lecture-group">
                        <span className="stat-label">Lecture Notes</span>
                        {day.lectureNotesPdf ? (
                            <div
                                className="file-icon-btn"
                                onClick={handleNotesClick}
                                title="Open Lecture Notes"
                            >
                                <FileText size={18} />
                            </div>
                        ) : (
                            <span className="stat-val">-</span>
                        )}
                    </div>

                    <div className="stat-group box-stat">
                        <span className="stat-label">Assignment</span>
                        <span className={`stat-val ${assignmentSolved === assignmentTotal && assignmentTotal > 0 ? 'perfect-green' : ''}`}>
                            {assignmentSolved} / {assignmentTotal}
                        </span>
                    </div>

                    <div className="stat-group box-stat">
                        <span className="stat-label">Additional Problem</span>
                        <span className={`stat-val ${additionalSolved === additionalTotal && additionalTotal > 0 ? 'perfect-green' : ''}`}>
                            {additionalSolved} / {additionalTotal}
                        </span>
                    </div>
                </div>

                <div className="day-action-col">
                    {isExpanded ? <ChevronDown size={20} className="action-icon" /> : <ChevronRight size={20} className="action-icon" />}
                </div>

            </div>

            {isExpanded && (
                <TopicDetails day={day} onProgressUpdate={onProgressUpdate} />
            )}
        </div>
    );
};

export default DayRow;
