import { useState, useEffect } from 'react';
import TopicDetailsHeader from './TopicDetailsHeader';
import ProblemList from './ProblemList';
import api from '../services/api';
import './TopicDetails.css';

const TopicDetails = ({ day, onProgressUpdate }) => {
    const [activeTab, setActiveTab] = useState('assignment'); // 'assignment' | 'additional'
    const [problems, setProblems] = useState([]);

    // Initialize problems from props
    useEffect(() => {
        if (day) {
            if (activeTab === 'assignment') {
                setProblems(day.assignmentProblems || []);
            } else {
                setProblems(day.practiceProblems || []);
            }
        }
    }, [day, activeTab]);

    // Calculate counts dynamically from local state/props
    // Note: We need to update the PARENT (ActiveDays) to reflect changes in DayRow stats if we want perfection.
    // However, for this component scope, we can track local changes.
    // Ideally, we should lift state up or refetch course data.
    // For now, let's update local problems state.

    // To keep synced with DayRow, we might need to update the day object itself if it's passed by reference, 
    // or trigger a refetch in ModulesPage. 
    // Given the complexity, let's just make sure this view is correct.

    // Actually, `day` prop is immutable here usually. 
    // Let's compute counts based on the `problems` state IF we were modifying it.
    // But `problems` only has the *active tab's* problems.

    // Better approach: Maintain two lists in state if we want to update logical counts for both tabs.
    const [allAssignmentProblems, setAllAssignmentProblems] = useState(day?.assignmentProblems || []);
    const [allPracticeProblems, setAllPracticeProblems] = useState(day?.practiceProblems || []);

    useEffect(() => {
        setAllAssignmentProblems(day?.assignmentProblems || []);
        setAllPracticeProblems(day?.practiceProblems || []);
    }, [day]);

    useEffect(() => {
        if (activeTab === 'assignment') {
            setProblems(allAssignmentProblems);
        } else {
            setProblems(allPracticeProblems);
        }
    }, [activeTab, allAssignmentProblems, allPracticeProblems]);


    const assignmentTotal = allAssignmentProblems.length;
    const assignmentSolved = allAssignmentProblems.filter(p => p.status === 'Solved').length;

    const additionalTotal = allPracticeProblems.length;
    const additionalSolved = allPracticeProblems.filter(p => p.status === 'Solved').length;


    const handleRefreshStatus = async (problemId) => {
        // Optimistic UI Update
        const toggleStatus = (list) => list.map(p => {
            if (p.id === problemId) {
                return { ...p, status: p.status === 'Solved' ? 'Unsolved' : 'Solved' };
            }
            return p;
        });

        // Determine which list contains the problem
        const isAssignment = allAssignmentProblems.some(p => p.id === problemId);
        const originalAssignmentList = [...allAssignmentProblems];
        const originalPracticeList = [...allPracticeProblems];

        let targetStatus = '';

        if (isAssignment) {
            const problem = allAssignmentProblems.find(p => p.id === problemId);
            targetStatus = problem.status === 'Solved' ? 'Unsolved' : 'Solved';
            setAllAssignmentProblems(toggleStatus(allAssignmentProblems));
        } else {
            const problem = allPracticeProblems.find(p => p.id === problemId);
            targetStatus = problem.status === 'Solved' ? 'Unsolved' : 'Solved';
            setAllPracticeProblems(toggleStatus(allPracticeProblems));
        }

        try {
            await api.post('/trainee/progress/toggle', {
                courseId: day.courseId,
                problemId: problemId,
                status: targetStatus
            });
            // Success
            // Success - trigger global update
            if (onProgressUpdate) onProgressUpdate();
        } catch (err) {
            console.error('Failed to toggle status:', err);
            // Revert on error
            if (isAssignment) setAllAssignmentProblems(originalAssignmentList);
            else setAllPracticeProblems(originalPracticeList);
        }
    };

    return (
        <div className="topic-details-inline">
            <TopicDetailsHeader
                day={day}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                assignmentCount={`${assignmentSolved}/${assignmentTotal}`}
                additionalCount={`${additionalSolved}/${additionalTotal}`}
                compact={true}
            />

            <div className="topic-content-inline">
                <ProblemList problems={problems} onRefresh={handleRefreshStatus} />
            </div>
        </div>
    );
};

export default TopicDetails;
