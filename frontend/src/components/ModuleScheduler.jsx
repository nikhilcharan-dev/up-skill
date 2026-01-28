import { useState, useEffect } from 'react';
import Button from './Button';
import Modal from './Modal';
import { showToast } from './Notification';

function ModuleScheduler({ isOpen, onClose, module, course, onSave }) {
    const [daySchedules, setDaySchedules] = useState([]);

    useEffect(() => {
        if (module && isOpen) {
            // Initialize with existing schedule or empty dates
            const existingSchedule = course.moduleSchedule?.find(s => s.moduleId === module._id);

            setDaySchedules(module.days.map(day => ({
                dayNumber: day.dayNumber,
                topicName: day.topicName,
                date: existingSchedule?.daySchedules?.find(ds => ds.dayNumber === day.dayNumber)?.date || ''
            })));
        }
    }, [module, course, isOpen]);

    const handleDateChange = (dayNumber, date) => {
        setDaySchedules(prev => prev.map(ds =>
            ds.dayNumber === dayNumber ? { ...ds, date } : ds
        ));
    };

    const autoAssignDates = () => {
        const startDate = new Date(course.startDate);
        const endDate = new Date(course.endDate);
        const excludedDays = course.excludedDays || [0]; // Default: skip Sundays

        let currentDate = new Date(startDate);
        const assignments = [];

        for (let i = 0; i < daySchedules.length; i++) {
            // Skip excluded days and custom holidays
            while (excludedDays.includes(currentDate.getDay()) ||
                course.customHolidays?.some(h => new Date(h).toDateString() === currentDate.toDateString())) {
                currentDate.setDate(currentDate.getDate() + 1);
                if (currentDate > endDate) {
                    showToast('Not enough available days in course schedule!', 'error');
                    return;
                }
            }

            assignments.push({
                ...daySchedules[i],
                date: currentDate.toISOString().split('T')[0]
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        setDaySchedules(assignments);
    };

    const handleSave = () => {
        // Validate all days have dates
        if (daySchedules.some(ds => !ds.date)) {
            showToast('Please assign dates to all days', 'error');
            return;
        }

        onSave({
            moduleId: module._id,
            daySchedules: daySchedules.map(ds => ({
                dayNumber: ds.dayNumber,
                date: new Date(ds.date)
            }))
        });
    };

    if (!module) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Schedule: ${module.title}`} size="lg">
            <div className="p-1">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-muted text-sm">Assign dates to each day in this module.</p>
                    <Button size="sm" variant="secondary" onClick={autoAssignDates}>
                        Auto-Assign Dates
                    </Button>
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-3">
                    {daySchedules.map((ds, idx) => (
                        <div key={ds.dayNumber} className="flex items-center gap-3 p-3 bg-white-5 border border-white-10 rounded-lg">
                            <div className="text-sm font-bold text-blue-400 w-16">Day {ds.dayNumber}</div>
                            <div className="flex-1 text-sm text-white truncate">{ds.topicName}</div>
                            <input
                                type="date"
                                className="form-input text-sm w-40"
                                value={ds.date}
                                onChange={e => handleDateChange(ds.dayNumber, e.target.value)}
                                min={course.startDate?.split('T')[0]}
                                max={course.endDate?.split('T')[0]}
                            />
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white-10">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Schedule</Button>
                </div>
            </div>
        </Modal>
    );
}

export default ModuleScheduler;
