import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import CourseManager from './pages/CourseManager';
import CourseStructureEditor from './pages/CourseStructureEditor';
import CourseCalendar from './pages/CourseCalendar';
import BatchManager from './pages/BatchManager';
import TraineeList from './pages/TraineeList';
import TrainerManager from './pages/TrainerManager';
import ChallengeManager from './pages/ChallengeManager';
import ChallengeRoadmap from './pages/ChallengeRoadmap';
import TraineeDashboard from './pages/TraineeDashboard';
import ModuleDetail from './pages/ModuleDetail';
import ThemeToggle from './components/ThemeToggle';
import Notification from './components/Notification';

function App() {
    return (
        <>
            <Notification />

            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />

                {/* Admin Routes with Sidebar Layout */}
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="courses" element={<CourseManager />} />
                    <Route path="courses/:id/structure" element={<CourseStructureEditor />} />
                    <Route path="courses/:id/modules/:moduleIdx" element={<ModuleDetail />} />
                    <Route path="courses/:id/calendar" element={<CourseCalendar />} />
                    <Route path="challenges" element={<ChallengeManager />} />
                    <Route path="challenges/:id/roadmap" element={<ChallengeRoadmap />} />
                    <Route path="batches" element={<BatchManager />} />
                    <Route path="trainees" element={<TraineeList />} />
                    <Route path="trainers" element={<TrainerManager />} />
                </Route>

                <Route path="/trainee" element={<TraineeDashboard />} />
            </Routes>
        </>
    );
}

export default App;
