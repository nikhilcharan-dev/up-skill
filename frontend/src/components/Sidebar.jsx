import { NavLink, useNavigate } from 'react-router-dom';
import '../styles/Sidebar.css';
import ThemeToggle from './ThemeToggle';

function Sidebar({ onClose }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('jwt');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
        navigate('/login');
    };

    const adminName = localStorage.getItem('name') || 'Admin';

    const handleLinkClick = () => {
        if (onClose && window.innerWidth < 768) {
            onClose();
        }
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h1 className="brand-title">Upskill</h1>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/admin" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                    Dashboard
                </NavLink>

                <NavLink to="/admin/courses" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                    Courses
                </NavLink>

                <NavLink to="/admin/modules" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                    Modules
                </NavLink>

                <NavLink to="/admin/topics" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                    Topics
                </NavLink>

                <NavLink to="/admin/problems" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                    Problems
                </NavLink>

                <NavLink to="/admin/challenges" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                    Challenges
                </NavLink>

                <NavLink to="/admin/trainers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                    Trainers
                </NavLink>

                <NavLink to="/admin/trainees" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                    Trainees
                </NavLink>

                <NavLink to="/admin/batches" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                    Batches
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <ThemeToggle />
                <button onClick={handleLogout} className="logout-btn">
                    Logout
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
