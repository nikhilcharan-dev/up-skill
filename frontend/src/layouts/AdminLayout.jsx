import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/Sidebar.css';

function AdminLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="admin-layout flex h-screen overflow-hidden bg-[var(--bg-primary)]">
            {/* Mobile Header */}
            <header className="mobile-header">
                <h1 className="brand-title-mobile">Owl Coder</h1>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="mobile-toggle-btn"
                >
                    {isSidebarOpen ? 'Close' : 'Menu'}
                </button>
            </header>

            {/* Sidebar with mobile overlay behavior */}
            {/* Sidebar Container */}
            <div className={`sidebar-container ${isSidebarOpen ? 'open' : ''}`}>
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </div>

            {/* Overlay */}
            {isSidebarOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <main className="admin-main-content">
                <div className="page-content-wrapper">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default AdminLayout;
