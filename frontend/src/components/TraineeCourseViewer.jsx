import { useState, useEffect } from 'react';
import api from '../services/api';
import Button from './Button';
import { showToast } from './Notification';

function TraineeCourseViewer({ course, batchId }) {
    const [expandedModule, setExpandedModule] = useState(null);
    const [expandedTopic, setExpandedTopic] = useState(null);
    const [topicNote, setTopicNote] = useState('');
    const [loadingNote, setLoadingNote] = useState(false);
    const [savingNote, setSavingNote] = useState(false);

    // Accordion toggle
    const toggleModule = (idx) => {
        setExpandedModule(expandedModule === idx ? null : idx);
        setExpandedTopic(null); // Reset topic
    };

    const toggleTopic = async (modIdx, topicIdx, topic) => {
        const key = `${modIdx}-${topicIdx}`;
        if (expandedTopic === key) {
            setExpandedTopic(null);
        } else {
            setExpandedTopic(key);
            fetchTopicNote(topic._id);
        }
    };

    const fetchTopicNote = async (topicId) => {
        setLoadingNote(true);
        try {
            const response = await api.get(`/trainee/course/${course._id}/topic/${topicId}/note`);
            setTopicNote(response.data.note || '');
        } catch (err) {
            console.error('Failed to fetch note');
        } finally {
            setLoadingNote(false);
        }
    };

    const handleSaveNote = async (topicId) => {
        setSavingNote(true);
        try {
            await api.post('/trainee/note', {
                courseId: course._id,
                topicId,
                note: topicNote
            });
            showToast('Note saved successfully!', 'success');
        } catch (err) {
            showToast('Failed to save note', 'error');
        } finally {
            setSavingNote(false);
        }
    };

    if (!course || !course.modules) return <div className="p-4 text-muted">No course content available.</div>;

    return (
        <div className="course-viewer">
            {course.modules.map((module, modIdx) => (
                <div key={modIdx} className="module-block mb-3 border rounded-lg overflow-hidden bg-white-5">
                    <div
                        className="module-header p-4 cursor-pointer bg-white-10 flex justify-between items-center"
                        onClick={() => toggleModule(modIdx)}
                    >
                        <h3 className="text-lg font-bold m-0">{module.title}</h3>
                        <span className="text-xl">{expandedModule === modIdx ? '−' : '+'}</span>
                    </div>

                    {expandedModule === modIdx && (
                        <div className="module-content p-2">
                            {module.description && <p className="text-sm text-gray-400 px-2 py-1">{module.description}</p>}

                            <div className="topics-list flex flex-col gap-2 mt-2">
                                {module.topics.map((topic, topicIdx) => {
                                    const isTopicOpen = expandedTopic === `${modIdx}-${topicIdx}`;
                                    return (
                                        <div key={topicIdx} className="topic-block border border-white-10 rounded bg-black-subtle">
                                            <div
                                                className="topic-header p-3 cursor-pointer hover:bg-white-5 flex justify-between items-center"
                                                onClick={() => toggleTopic(modIdx, topicIdx, topic)}
                                            >
                                                <span className="font-semibold">{topic.title}</span>
                                                <span className="text-sm text-muted">{isTopicOpen ? 'Hide' : 'View'}</span>
                                            </div>

                                            {isTopicOpen && (
                                                <div className="topic-body p-3 border-t border-white-10">
                                                    {topic.days && topic.days.length > 0 ? (
                                                        <div className="days-grid grid gap-4 mb-4">
                                                            {topic.days.map((day, dayIdx) => (
                                                                <div key={dayIdx} className="day-card p-3 bg-white-5 rounded">
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className="badge">Day {day.dayNumber}</span>
                                                                        {day.trainerNotes && (
                                                                            <a href={day.trainerNotes.startsWith('http') ? day.trainerNotes : `${import.meta.env.VITE_API_URL}${day.trainerNotes}`} target="_blank" className="text-sm text-blue-400 underline">
                                                                                Trainer Notes
                                                                            </a>
                                                                        )}
                                                                    </div>

                                                                    {/* Assignments */}
                                                                    {day.assignments?.length > 0 && (
                                                                        <div className="assignments-list text-sm">
                                                                            <strong>Assignments:</strong>
                                                                            <ul className="list-disc pl-4 mt-1">
                                                                                {day.assignments.map((asgn, i) => (
                                                                                    <li key={i}>
                                                                                        <a href={asgn.link} target="_blank" className="hover:text-primary">
                                                                                            {asgn.name} <span className="text-xs text-muted">({asgn.platform})</span>
                                                                                        </a>
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-muted mb-4">No schedule details for this topic.</p>
                                                    )}

                                                    {/* Topic Note */}
                                                    <div className="topic-note-section mt-4 pt-4 border-t border-white-10">
                                                        <h4 className="text-sm font-bold mb-2">My Notes for {topic.title}</h4>
                                                        {loadingNote ? (
                                                            <div className="spinner-sm"></div>
                                                        ) : (
                                                            <div className="note-editor">
                                                                <textarea
                                                                    className="form-input w-full p-2 text-sm bg-black border border-white-20 rounded"
                                                                    rows={4}
                                                                    placeholder="Write your key takeaways here..."
                                                                    value={topicNote}
                                                                    onChange={(e) => setTopicNote(e.target.value)}
                                                                />
                                                                <div className="mt-2 text-right">
                                                                    <Button
                                                                        variant="primary"
                                                                        size="sm"
                                                                        onClick={() => handleSaveNote(topic._id)}
                                                                        disabled={savingNote}
                                                                    >
                                                                        {savingNote ? 'Saving...' : 'Save Notes'}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default TraineeCourseViewer;
