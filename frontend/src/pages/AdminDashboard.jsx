import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import api from '../services/api';
import Button from '../components/Button';
import { showToast } from '../components/Notification';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/admin/stats');
                setStats(response.data);
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
                if (err.response && err.response.status === 404) {
                    showToast('Dashboard stats endpoint not found. Please restart backend.', 'error');
                } else {
                    showToast('Failed to load dashboard statistics', 'error');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Custom coloring for charts
    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

    return (
        <div className="page">
            <div className="container dashboard-container">
                <div className="page-header dashboard-header">
                    <div>
                        <h1>Admin Dashboard</h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            Overview of your academy's performance
                        </p>
                    </div>
                </div>

                {/* Navbar removed - moved to Sidebar */}

                {/* Quick Actions Grid */}
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Management</h2>
                <div className="dashboard-grid" style={{ marginBottom: '3rem' }}>
                    <Link to="/admin/courses" className="dashboard-link">
                        <div className="card dashboard-card">
                            <h3 className="dashboard-card-title">Course Management</h3>
                            <p className="dashboard-card-desc">Create, edit, and manage training courses</p>
                        </div>
                    </Link>

                    <Link to="/admin/batches" className="dashboard-link">
                        <div className="card dashboard-card">
                            <h3 className="dashboard-card-title">Batch Management</h3>
                            <p className="dashboard-card-desc">Organize batches and assign trainees</p>
                        </div>
                    </Link>

                    <Link to="/admin/trainers" className="dashboard-link">
                        <div className="card dashboard-card">
                            <h3 className="dashboard-card-title">Trainer Management</h3>
                            <p className="dashboard-card-desc">Add and manage trainers for your batches</p>
                        </div>
                    </Link>

                    <Link to="/admin/trainees" className="dashboard-link">
                        <div className="card dashboard-card">
                            <h3 className="dashboard-card-title">Trainee Overview</h3>
                            <p className="dashboard-card-desc">Monitor trainee progress and performance</p>
                        </div>
                    </Link>

                    <Link to="/admin/challenges" className="dashboard-link">
                        <div className="card dashboard-card">
                            <h3 className="dashboard-card-title">Open Challenges</h3>
                            <p className="dashboard-card-desc">Create day-based skill tracks and curriculums</p>
                        </div>
                    </Link>
                </div>

                {/* Analytics Stats Cards */}
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Analytics Overview</h2>
                <div className="stats-grid">
                    <div className="stats-card">
                        <span className="stats-number">{loading ? '-' : stats?.counts?.courses || 0}</span>
                        <span className="stats-label">Active Courses</span>
                    </div>
                    <div className="stats-card">
                        <span className="stats-number">{loading ? '-' : stats?.counts?.batches || 0}</span>
                        <span className="stats-label">Total Batches</span>
                    </div>
                    <div className="stats-card">
                        <span className="stats-number">{loading ? '-' : stats?.counts?.trainers || 0}</span>
                        <span className="stats-label">Trainers</span>
                    </div>
                    <div className="stats-card">
                        <span className="stats-number">{loading ? '-' : stats?.counts?.trainees || 0}</span>
                        <span className="stats-label">Active Trainees</span>
                    </div>
                </div>

                {/* Charts Section */}
                {!loading && stats?.charts?.batchDistribution?.length > 0 && (
                    <div className="charts-section">
                        <div className="chart-container" style={{ gridColumn: 'span 2' }}>
                            <div className="chart-header">
                                <h3 className="chart-title">Trainee Distribution by Batch</h3>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={stats.charts.batchDistribution}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="var(--text-muted)"
                                        tick={{ fill: 'var(--text-muted)' }}
                                    />
                                    <YAxis
                                        stroke="var(--text-muted)"
                                        tick={{ fill: 'var(--text-muted)' }}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--bg-surface)',
                                            borderColor: 'var(--border-color)',
                                            color: 'var(--text-primary)'
                                        }}
                                        itemStyle={{ color: 'var(--text-primary)' }}
                                    />
                                    <Bar dataKey="count" name="Trainees" radius={[4, 4, 0, 0]}>
                                        {stats.charts.batchDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;
