import { Link, useNavigate } from 'react-router-dom';
import { Menu, User, BookOpen, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import './Navbar.css';

const Navbar = ({ onMenuClick }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar-container glass-panel">
            <div className="navbar-left">
                <button className="menu-btn" onClick={onMenuClick}>
                    <Menu size={24} />
                </button>
                <div className="brand-logo">
                    <BookOpen size={24} className="brand-icon" />
                    <span className="brand-name">Owl Coder</span>
                </div>
                <Link to="/dashboard" className="nav-link">
                    Courses
                </Link>
            </div>

            <div className="navbar-right">
                <ThemeToggle />
                <Link to="/profile" className="user-profile-link">
                    <div className="user-profile">
                        <span className="user-name">{user?.name || 'User'}</span>
                        <div className="user-avatar">
                            <User size={20} />
                        </div>
                    </div>
                </Link>
                <button
                    onClick={handleLogout}
                    className="logout-btn"
                    title="Logout"
                    aria-label="Logout"
                >
                    <LogOut size={20} className="logout-icon" />
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
