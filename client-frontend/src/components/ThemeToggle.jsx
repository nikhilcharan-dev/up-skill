import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
            {theme === 'dark' ? (
                <Sun size={20} className="theme-icon sun" />
            ) : (
                <Moon size={20} className="theme-icon moon" />
            )}
            <span className="theme-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
    );
};

export default ThemeToggle;
