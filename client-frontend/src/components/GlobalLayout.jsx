import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import GlobalSidebar from './GlobalSidebar';
import api from '../services/api';
import './GlobalLayout.css';

const GlobalLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                // Fetch dashboard data which contains batches (courses)
                const { data } = await api.get('/trainee/dashboard');
                if (data.batches) {
                    const extractedCourses = data.batches.map(b => b.course).filter(c => c);
                    setCourses(extractedCourses);
                }
            } catch (err) {
                console.error("Failed to load courses for sidebar:", err);
            }
        };

        fetchCourses();
    }, []);

    return (
        <div className="global-layout">
            <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
            <GlobalSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                courses={courses}
            />

            <main className="global-content">
                {children}
            </main>
        </div>
    );
};

export default GlobalLayout;
