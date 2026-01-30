import { HelpCircle, RefreshCw } from 'lucide-react';
import './ProblemList.css';

const ProblemList = ({ problems, onRefresh }) => {
    return (
        <div className="problem-list-container">
            {/* Table Header */}
            <div className="problem-table-header">
                <div className="col-name">Name of the Problem</div>
                <div className="col-diff">Difficulty</div>
                <div className="col-status">Status</div>
            </div>

            {/* Rows */}
            <div className="problem-table-body">
                {problems.length > 0 ? (
                    problems.map(prob => (
                        <div key={prob.id} className="problem-row">
                            <div className="col-name title-text">{prob.title}</div>

                            <div className="col-diff">
                                <span className={`diff-badge ${(prob.difficulty || 'medium').toLowerCase().replace(' ', '-')}`}>
                                    {prob.difficulty || 'Medium'}
                                </span>
                            </div>

                            <div className="col-status">
                                <span className={`status-badge ${(prob.status || 'unsolved').toLowerCase()}`}>
                                    {prob.status === 'Solved' ? '✓ Solved' : 'Unsolved'}
                                </span>
                                <button
                                    className="refresh-btn"
                                    onClick={() => onRefresh && onRefresh(prob.id)}
                                    title="Refresh status"
                                >
                                    <RefreshCw size={14} />
                                </button>
                            </div>

                            <div className="col-actions action-group">
                                <a
                                    href={prob.link || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="solve-btn"
                                    style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}
                                >
                                    Solve
                                </a>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-problems-msg">No problems available</div>
                )}
            </div>
        </div>
    );
};

export default ProblemList;
