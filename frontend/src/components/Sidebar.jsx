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
        <aside className="sidebar h-full">
            <div className="sidebar-header">
                <h1 className="brand-title">Owl Coder</h1>
                <p className="brand-subtitle">Hello, {adminName}</p>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/admin" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                    {/* <span className="sidebar-icon"></span> */}
                    Dashboard
                </NavLink>

                <NavLink to="/admin/courses" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                    {/* <span className="sidebar-icon"></span> */}
                    Courses
                </NavLink>

                <NavLink to="/admin/batches" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                    {/* <span className="sidebar-icon"></span> */}
                    Batches
                </NavLink>

                <NavLink to="/admin/trainees" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                    {/* <span className="sidebar-icon"></span> */}
                    Trainees
                </NavLink>

                <NavLink to="/admin/trainers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                    {/* <span className="sidebar-icon"></span> */}
                    Trainers
                </NavLink>

                <NavLink to="/admin/challenges" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                    {/* <span className="sidebar-icon"></span> */}
                    Challenges
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <div style={{ marginBottom: '1rem' }}>
                    <ThemeToggle />
                </div>
                <button onClick={handleLogout} className="logout-btn">
                    Logout
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
