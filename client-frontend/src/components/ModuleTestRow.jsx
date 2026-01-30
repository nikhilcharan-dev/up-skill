import { ChevronRight } from 'lucide-react';
import './ModuleTestRow.css';

const ModuleTestRow = ({ test }) => {
    return (
        <div className="module-test-row glass-panel test-highlight">
            <div className="test-date-col">
                <span className="test-date-text">{test.date}</span>
            </div>

            <div className="test-info-col">
                <div className="test-meta">
                    <span className="test-badge">Module Test</span>
                    <h3 className="test-title">{test.title}</h3>
                </div>
            </div>

            <div className="test-action-col">
                <a
                    href={test.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="take-test-btn"
                >
                    Take Test
                    <ChevronRight size={16} />
                </a>
            </div>
        </div>
    );
};

export default ModuleTestRow;
