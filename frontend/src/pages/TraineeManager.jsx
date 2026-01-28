import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';

function TraineeManager() {
    const [trainees, setTrainees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTrainees();
    }, []);

    const fetchTrainees = async () => {
        try {
            // This would need a dedicated endpoint to list all trainees
            // For now, we'll show a placeholder
            setTrainees([]);
        } catch (err) {
            setError('Failed to load trainees');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                <nav className="nav">
                    <Link to="/admin" className="nav-link">← Dashboard</Link>
                    <Link to="/admin/courses" className="nav-link">Courses</Link>
                    <Link to="/admin/batches" className="nav-link">Batches</Link>
                    <Link to="/admin/trainees" className="nav-link active">Trainees</Link>
                </nav>

                <div className="page-header">
                    <h1>Trainee Overview</h1>
                    <Button variant="primary">+ Add Trainee</Button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <div className="card">
                    <p className="text-muted text-center">
                        Trainee listing requires a dedicated API endpoint.<br />
                        Use the Batch Manager to assign trainees to batches.
                    </p>
                </div>

                <div className="grid grid-2 mt-2">
                    <div className="card">
                        <h3>Progress Tracking</h3>
                        <p className="text-muted mt-2">Monitor individual trainee progress across assignments</p>
                    </div>

                    <div className="card">
                        <h3>Resume Management</h3>
                        <p className="text-muted mt-2">View and manage uploaded trainee resumes</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TraineeManager;
