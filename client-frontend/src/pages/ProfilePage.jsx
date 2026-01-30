import { useState, useEffect } from 'react';
import { User, Mail, Hash, Code, Save, X, Edit2, Lock, Eye, EyeOff, Github, Linkedin, Globe, Upload, FileText, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

const ProfilePage = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [activeTab, setActiveTab] = useState('coding'); // 'coding' or 'personal'

    // Coding Profile Stats
    const [leetcodeData, setLeetcodeData] = useState(null);
    const [codeforcesData, setCodeforcesData] = useState(null);
    const [codechefData, setCodechefData] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        studentId: '',
        codingHandles: []
    });

    // Password Change State
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({ old: false, new: false, confirm: false });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        fetchProfileAndStats();
    }, []);

    const fetchProfileAndStats = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/trainee/profile');
            setProfile(data);
            setFormData({
                name: data.name || '',
                studentId: data.studentId || '',
                codingHandles: data.codingHandles || []
            });

            // Fetch Stats
            fetchCodingProfileStats();

        } catch (err) {
            setError("Failed to load profile.");
            setLoading(false);
        }
    };

    const fetchCodingProfileStats = async () => {
        try {
            setLoadingStats(true);
            const { data } = await api.get('/trainee/coding-profile');

            if (data.leetcodeData) setLeetcodeData(data.leetcodeData);
            if (data.codeforcesData) setCodeforcesData(data.codeforcesData);
            if (data.codechefData) setCodechefData(data.codechefData);

        } catch (err) {
            console.error("Failed to load coding stats", err);
        } finally {
            setLoadingStats(false);
            setLoading(false);
        }
    };

    const handleEditToggle = () => {
        if (isEditing) {
            // Cancel edit - reset form
            setFormData({
                name: profile.name || '',
                studentId: profile.studentId || '',
                codingHandles: profile.codingHandles || []
            });
            setError(null);
        }
        setIsEditing(!isEditing);
    };

    const handleHandleChange = (index, value) => {
        const newHandles = [...formData.codingHandles];
        newHandles[index] = value;
        setFormData({ ...formData, codingHandles: newHandles });
    };

    const addHandle = () => {
        setFormData({ ...formData, codingHandles: [...formData.codingHandles, ''] });
    };

    const removeHandle = (index) => {
        const newHandles = formData.codingHandles.filter((_, i) => i !== index);
        setFormData({ ...formData, codingHandles: newHandles });
    };

    const handleSaveProfile = async () => {
        try {
            setError(null);
            setSuccessMsg('');
            // Filter out empty handles
            const cleanedHandles = formData.codingHandles.filter(h => h.trim() !== '');

            const payload = {
                name: formData.name,
                studentId: formData.studentId,
                codingHandles: cleanedHandles
            };

            const { data } = await api.put('/trainee/profile', payload);
            setProfile(data);
            setSuccessMsg("Profile updated successfully!");
            setIsEditing(false);
        } catch (err) {
            setError(err.response?.data?.msg || "Failed to update profile.");
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordError("Password must be at least 6 characters.");
            return;
        }

        try {
            await api.put('/trainee/password', {
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            });
            setPasswordSuccess("Password changed successfully.");
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setShowPasswordChange(false), 2000);
        } catch (err) {
            setPasswordError(err.response?.data?.msg || "Failed to change password.");
        }
    };

    // Helper to get icon for handle
    const getPlatformIcon = (url) => {
        if (!url) return <Globe size={16} />;
        if (url.includes('github')) return <Github size={16} />;
        if (url.includes('linkedin')) return <Linkedin size={16} />;
        if (url.includes('leetcode')) return <Code size={16} />;
        return <Globe size={16} />;
    };

    const [statsHandles, setStatsHandles] = useState({
        leetcode: '',
        codeforces: '',
        codechef: '',
        hackerrank: ''
    });
    const [isEditingStats, setIsEditingStats] = useState(false);

    useEffect(() => {
        if (!loadingStats) {
            const fetchHandles = async () => {
                try {
                    const { data } = await api.get('/trainee/coding-profile');
                    setStatsHandles({
                        leetcode: data.leetcode || '',
                        codeforces: data.codeforces || '',
                        codechef: data.codechef || '',
                        hackerrank: data.hackerrank || ''
                    });
                } catch (e) {
                    console.error("Failed to fetch handles", e);
                }
            };
            fetchHandles();
        }
    }, [loadingStats]);

    // Resume State
    const [resumeFile, setResumeFile] = useState(null);
    const [uploadingResume, setUploadingResume] = useState(false);

    const handleResumeChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setResumeFile(file);
        }
    };

    const handleResumeUpload = async () => {
        if (!resumeFile) return;

        const formData = new FormData();
        formData.append('resume', resumeFile);

        try {
            setUploadingResume(true);
            const { data } = await api.post('/trainee/resume', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Update profile with new resume path/url
            setProfile(prev => ({ ...prev, resume: data.resume }));
            setResumeFile(null);
            setSuccessMsg('Resume uploaded successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.msg || 'Failed to upload resume');
        } finally {
            setUploadingResume(false);
        }
    };

    const handleRemoveResume = async () => {
        if (!window.confirm("Are you sure you want to remove your resume?")) return;
        try {
            await api.delete('/trainee/resume');
            setProfile(prev => ({ ...prev, resume: null })); // Clear resume in state
            setSuccessMsg("Resume removed successfully.");
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.msg || "Failed to remove resume.");
        }
    };

    const handleSaveStatsHandles = async () => {
        try {
            await api.put('/trainee/coding-profile', statsHandles);
            setSuccessMsg("Coding handles updated. Refreshing stats...");
            setIsEditingStats(false);
            fetchCodingProfileStats();
        } catch (err) {
            setError("Failed to update coding handles.");
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div className="profile-page-container">
            <div className="profile-header-card glass-panel">
                <div className="profile-avatar-large">
                    <User size={48} />
                </div>
                <div className="profile-identity">
                    <h1>{profile?.name}</h1>
                    <div className="role-badge">Trainee</div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="profile-tabs">
                <button
                    className={`tab-btn ${activeTab === 'coding' ? 'active' : ''}`}
                    onClick={() => setActiveTab('coding')}
                >
                    <Code size={18} /> Coding Profiles
                </button>
                <button
                    className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('personal')}
                >
                    <User size={18} /> Personal Info
                </button>
            </div>

            <div className="profile-grid">
                {/* Left Col: Dynamic Content */}
                <div className="profile-col-left">

                    {/* CODING PROFILES TAB CONTENT */}
                    {activeTab === 'coding' && (
                        <div className={`tab-content ${activeTab === 'coding' ? 'active' : ''}`}>
                            <div className="profiles-section-header">
                                <h3 className="profiles-section-title">Coding Profiles</h3>
                                {!isEditingStats ? (
                                    <button className="edit-handles-btn" onClick={() => setIsEditingStats(true)}>
                                        <Edit2 size={12} /> Edit Handles
                                    </button>
                                ) : (
                                    <div className="action-buttons flex gap-2">
                                        <button className="icon-btn cancel" onClick={() => setIsEditingStats(false)} title="Cancel">
                                            <X size={18} />
                                        </button>
                                        <button className="icon-btn save" onClick={handleSaveStatsHandles} title="Save">
                                            <Save size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {isEditingStats && (
                                <div className="profile-card glass-panel mb-6 fade-in">
                                    <div className="card-content">
                                        <div className="handles-edit-grid">
                                            <div className="form-group">
                                                <label className="text-xs">LeetCode Username</label>
                                                <input className="input-field" value={statsHandles.leetcode} onChange={e => setStatsHandles({ ...statsHandles, leetcode: e.target.value })} placeholder="username" />
                                            </div>
                                            <div className="form-group">
                                                <label className="text-xs">CodeForces Handle</label>
                                                <input className="input-field" value={statsHandles.codeforces} onChange={e => setStatsHandles({ ...statsHandles, codeforces: e.target.value })} placeholder="handle" />
                                            </div>
                                            <div className="form-group">
                                                <label className="text-xs">CodeChef Handle</label>
                                                <input className="input-field" value={statsHandles.codechef} onChange={e => setStatsHandles({ ...statsHandles, codechef: e.target.value })} placeholder="handle" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {loadingStats ? <div className="spinner"></div> : (
                                <div className="stats-cards-grid">
                                    {/* LeetCode Card */}
                                    {leetcodeData ? (
                                        <div className="profile-card glass-panel platform-card leetcode-card">
                                            <div className="card-header-mini">
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={leetcodeData.avatar || 'https://assets.leetcode.com/static_assets/public/images/LeetCode_logo_rvs.png'}
                                                        className="stat-avatar"
                                                        alt="LC"
                                                        style={{ width: '64px', height: '64px', borderRadius: '12px', border: '2px solid #FFA116' }}
                                                    />
                                                    <div>
                                                        <h4 className="font-bold text-xl">LeetCode</h4>
                                                        <span className="text-sm text-muted">Rank: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{leetcodeData.ranking?.toLocaleString()}</span></span>
                                                    </div>
                                                </div>
                                                <div className="rating-pill lc">
                                                    {leetcodeData.contest?.rating ? Math.round(leetcodeData.contest.rating) : 'N/A'}
                                                </div>
                                            </div>

                                            <div className="lc-stats-grid">
                                                {/* Chart Section */}
                                                <div className="lc-chart-col">
                                                    <div style={{ width: 120, height: 120, position: 'relative' }}>
                                                        <ResponsiveContainer>
                                                            <PieChart>
                                                                <Pie data={[
                                                                    { value: leetcodeData.solved.easy, fill: '#00b8a3' },
                                                                    { value: leetcodeData.solved.medium, fill: '#ffc01e' },
                                                                    { value: leetcodeData.solved.hard, fill: '#ef4743' },
                                                                    { value: (leetcodeData.total.all - leetcodeData.solved.all), fill: 'rgba(255,255,255,0.05)' }
                                                                ]} innerRadius={42} outerRadius={55} dataKey="value" stroke="none" paddingAngle={2} />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                                                            <span className="text-xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{leetcodeData.solved.all}</span>
                                                            <span className="text-[0.65rem] text-muted tracking-widest uppercase">Solved</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Stats Bars */}
                                                <div className="lc-stats-col">
                                                    <div className="lc-stat-item">
                                                        <div className="lc-stat-header">
                                                            <span className="lc-stat-label">Easy</span>
                                                            <span className="lc-stat-value">{leetcodeData.solved.easy} <span className="lc-stat-total">/ {leetcodeData.total.easy}</span></span>
                                                        </div>
                                                        <div className="lc-progress-bg"><div className="lc-progress-bar" style={{ backgroundColor: '#00b8a3', width: `${(leetcodeData.solved.easy / leetcodeData.total.easy) * 100}%` }}></div></div>
                                                    </div>
                                                    <div className="lc-stat-item">
                                                        <div className="lc-stat-header">
                                                            <span className="lc-stat-label">Medium</span>
                                                            <span className="lc-stat-value">{leetcodeData.solved.medium} <span className="lc-stat-total">/ {leetcodeData.total.medium}</span></span>
                                                        </div>
                                                        <div className="lc-progress-bg"><div className="lc-progress-bar" style={{ backgroundColor: '#ffc01e', width: `${(leetcodeData.solved.medium / leetcodeData.total.medium) * 100}%` }}></div></div>
                                                    </div>
                                                    <div className="lc-stat-item">
                                                        <div className="lc-stat-header">
                                                            <span className="lc-stat-label">Hard</span>
                                                            <span className="lc-stat-value">{leetcodeData.solved.hard} <span className="lc-stat-total">/ {leetcodeData.total.hard}</span></span>
                                                        </div>
                                                        <div className="lc-progress-bg"><div className="lc-progress-bar" style={{ backgroundColor: '#ef4743', width: `${(leetcodeData.solved.hard / leetcodeData.total.hard) * 100}%` }}></div></div>
                                                    </div>
                                                </div>

                                                {/* Badges Section */}
                                                <div className="lc-badges-col">
                                                    <h5 className="lc-badges-title">Recent Badges</h5>
                                                    {leetcodeData.badges && leetcodeData.badges.length > 0 ? (
                                                        <div className="lc-badges-list">
                                                            {leetcodeData.badges.slice(0, 3).map((badge, idx) => (
                                                                <div key={idx} className="lc-badge-wrapper" title={badge.displayName}>
                                                                    <img src={badge.icon.startsWith('http') ? badge.icon : `https://leetcode.com${badge.icon}`} alt={badge.displayName} className="lc-badge-img" />
                                                                </div>
                                                            ))}
                                                            {leetcodeData.badges.length > 3 && (
                                                                <div className="lc-more-badge" title={`+${leetcodeData.badges.length - 3} more`}>
                                                                    +{leetcodeData.badges.length - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted italic">No badges earned yet.</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}

                                    {/* CodeForces Card */}
                                    {codeforcesData && (
                                        <div className="profile-card glass-panel platform-card codeforces-card">
                                            <div className="card-header-mini">
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={codeforcesData.avatar}
                                                        className="stat-avatar"
                                                        alt="CF"
                                                        style={{ width: '64px', height: '64px', borderRadius: '12px', border: '2px solid #318CE7' }}
                                                    />
                                                    <div>
                                                        <h4 className="font-bold text-xl">CodeForces</h4>
                                                        <span className="text-sm text-muted">@{codeforcesData.username}</span>
                                                    </div>
                                                </div>
                                                <div className="rating-pill" style={{ backgroundColor: codeforcesData.rating >= 1400 ? 'rgba(3, 168, 158, 0.2)' : 'rgba(160, 160, 160, 0.2)', color: codeforcesData.rating >= 1400 ? '#03a89e' : '#a0a0a0' }}>
                                                    {codeforcesData.rating}
                                                </div>
                                            </div>

                                            <div className="stats-grid-2 mt-4">
                                                <div className="stat-box">
                                                    <div className="label">Max Rating</div>
                                                    <div className="value">{codeforcesData.maxRating}</div>
                                                </div>
                                                <div className="stat-box">
                                                    <div className="label">Rank</div>
                                                    <div className="value capitalize">{codeforcesData.rank}</div>
                                                </div>
                                                <div className="stat-box">
                                                    <div className="label">Max Rank</div>
                                                    <div className="value capitalize">{codeforcesData.maxRank}</div>
                                                </div>
                                                <div className="stat-box">
                                                    <div className="label">Friend of</div>
                                                    <div className="value">{codeforcesData.friendOfCount}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* CodeChef Card */}
                                    {codechefData && (
                                        <div className="profile-card glass-panel platform-card codechef-card">
                                            <div className="card-header-mini">
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={codechefData.avatar || 'https://cdn.codechef.com/sites/all/themes/abessive/logo.png'}
                                                        className="stat-avatar"
                                                        alt="CC"
                                                        style={{ width: '64px', height: '64px', borderRadius: '12px', border: '2px solid #5B4638' }}
                                                    />
                                                    <div>
                                                        <h4 className="font-bold text-xl">CodeChef</h4>
                                                        <span className="text-sm text-muted text-yellow-500 font-bold">{codechefData.stars}</span>
                                                    </div>
                                                </div>
                                                <div className="rating-pill cc">
                                                    {codechefData.rating}
                                                </div>
                                            </div>

                                            <div className="stats-grid-2 mt-4">
                                                <div className="stat-box">
                                                    <div className="label">Global Rank</div>
                                                    <div className="value">#{codechefData.globalRank}</div>
                                                </div>
                                                <div className="stat-box">
                                                    <div className="label">Country Rank</div>
                                                    <div className="value">#{codechefData.countryRank}</div>
                                                </div>
                                                <div className="stat-box">
                                                    <div className="label">Max Rating</div>
                                                    <div className="value">{codechefData.maxRating}</div>
                                                </div>
                                                <div className="stat-box">
                                                    <div className="label">Country</div>
                                                    <div className="flex items-center gap-2">
                                                        <img src={codechefData.countryFlag} alt="Flag" className="w-5 h-4" />
                                                        <span className="value text-sm truncate">{codechefData.countryName}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!leetcodeData && !codeforcesData && !codechefData && !isEditingStats && (
                                        <div className="profile-card glass-panel p-8 text-center">
                                            <p className="text-muted text-sm mb-4">No coding stats available.</p>
                                            <button className="primary-btn text-sm" onClick={() => setIsEditingStats(true)}>
                                                <Edit2 size={14} className="mr-2" /> Link Accounts
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PERSONAL INFO TAB CONTENT */}
                    {activeTab === 'personal' && (
                        <div className="profile-card glass-panel fade-in">
                            <div className="card-header">
                                <h3>Personal Information</h3>
                                {!isEditing ? (
                                    <button className="icon-btn" onClick={handleEditToggle} title="Edit Profile">
                                        <Edit2 size={18} />
                                    </button>
                                ) : (
                                    <div className="action-buttons">
                                        <button className="icon-btn cancel" onClick={handleEditToggle} title="Cancel">
                                            <X size={18} />
                                        </button>
                                        <button className="icon-btn save" onClick={handleSaveProfile} title="Save">
                                            <Save size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="card-content form-layout">
                                {error && <div className="alert error">{error}</div>}
                                {successMsg && <div className="alert success">{successMsg}</div>}

                                <div className="form-group">
                                    <label><User size={16} /> Full Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="input-field"
                                        />
                                    ) : (
                                        <div className="read-only-field">{profile?.name}</div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label><Mail size={16} /> Email</label>
                                    <div className="read-only-field disabled">
                                        {profile?.workEmail || 'No email set'}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label><Hash size={16} /> Student ID</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.studentId}
                                            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                            className="input-field"
                                        />
                                    ) : (
                                        <div className="read-only-field">{profile?.studentId || 'Not set'}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Col: Stats, Portfolio & Security (Common) */}
                <div className="profile-side-col">
                    {/* Resume Card */}
                    <div className="profile-card glass-panel resume-card">
                        <div className="card-header">
                            <h3>Resume</h3>
                            {!isEditing ? (
                                <button className="icon-btn" onClick={() => setIsEditing(true)} title="Update Resume">
                                    <Edit2 size={16} />
                                </button>
                            ) : (
                                <button className="icon-btn cancel" onClick={handleEditToggle} title="Close">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <div className="card-content">
                            {profile?.resume ? (
                                <div className="current-resume">
                                    <div className="resume-icon">
                                        <FileText size={24} />
                                    </div>
                                    <div className="resume-info">
                                        <span className="resume-label">Current Resume</span>
                                        <div className="resume-link-row">
                                            <a href={profile.resume} target="_blank" rel="noopener noreferrer" className="view-resume-link">
                                                View Resume
                                            </a>
                                            {isEditing && (
                                                <button
                                                    className="resume-remove-btn"
                                                    onClick={handleRemoveResume}
                                                    title="Remove Resume"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="no-resume">
                                    <p>No resume uploaded yet.</p>
                                </div>
                            )}

                            {isEditing && (
                                <div className="upload-resume-section">
                                    <input
                                        type="file"
                                        id="resume-upload"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleResumeChange}
                                        className="hidden-input"
                                    />
                                    <label htmlFor="resume-upload" className="upload-label">
                                        <Upload size={16} />
                                        {resumeFile ? resumeFile.name : "Select Resume"}
                                    </label>

                                    {resumeFile && (
                                        <button
                                            className="primary-btn sm w-full mt-2"
                                            onClick={handleResumeUpload}
                                            disabled={uploadingResume}
                                        >
                                            {uploadingResume ? 'Uploading...' : 'Upload'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Portfolio Links */}
                    <div className="profile-card glass-panel">
                        <div className="card-header">
                            <h3>Portfolio Links</h3>
                            {!isEditing ? (
                                <button className="icon-btn" onClick={() => setIsEditing(true)} title="Edit Links">
                                    <Edit2 size={16} />
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button className="add-btn" onClick={addHandle}>+ Add</button>
                                    <button className="icon-btn cancel" onClick={handleEditToggle} title="Cancel">
                                        <X size={16} />
                                    </button>
                                    <button className="icon-btn save" onClick={handleSaveProfile} title="Save">
                                        <Save size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="card-content handles-list">
                            {isEditing ? (
                                formData.codingHandles.map((handle, index) => (
                                    <div key={index} className="handle-edit-row">
                                        <input
                                            type="text"
                                            value={handle}
                                            onChange={(e) => handleHandleChange(index, e.target.value)}
                                            placeholder="https://..."
                                            className="input-field"
                                        />
                                        <button className="remove-btn" onClick={() => removeHandle(index)}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                profile?.codingHandles?.length > 0 ? (
                                    profile.codingHandles.map((handle, index) => (
                                        <a key={index} href={handle} target="_blank" rel="noopener noreferrer" className="handle-link">
                                            {getPlatformIcon(handle)}
                                            <span>{handle.replace(/^https?:\/\/(www\.)?/, '')}</span>
                                        </a>
                                    ))
                                ) : (
                                    <div className="empty-msg">No portfolio links.</div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Security Card */}
                    <div className="profile-card glass-panel security-card">
                        <div className="card-header">
                            <h3>Security</h3>
                        </div>
                        <div className="card-content">
                            {!showPasswordChange ? (
                                <button className="change-pass-btn" onClick={() => setShowPasswordChange(true)}>
                                    <Lock size={16} /> Change Password
                                </button>
                            ) : (
                                <form onSubmit={handlePasswordChange} className="password-form">
                                    {passwordError && <div className="alert error small">{passwordError}</div>}
                                    {passwordSuccess && <div className="alert success small">{passwordSuccess}</div>}

                                    <div className="pass-input-wrapper">
                                        <input
                                            type={showPasswords.old ? "text" : "password"}
                                            placeholder="Current Password"
                                            value={passwordData.oldPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                            required
                                        />
                                        <div className="eye-icon" onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}>
                                            {showPasswords.old ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </div>
                                    </div>
                                    <div className="pass-input-wrapper">
                                        <input
                                            type={showPasswords.new ? "text" : "password"}
                                            placeholder="New Password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            required
                                        />
                                        <div className="eye-icon" onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}>
                                            {showPasswords.new ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </div>
                                    </div>
                                    <div className="pass-input-wrapper">
                                        <input
                                            type={showPasswords.confirm ? "text" : "password"}
                                            placeholder="Confirm New Password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            required
                                        />
                                        <div className="eye-icon" onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}>
                                            {showPasswords.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </div>
                                    </div>

                                    <div className="form-actions">
                                        <button type="button" className="cancel-btn" onClick={() => setShowPasswordChange(false)}>Cancel</button>
                                        <button type="submit" className="submit-btn">Update</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ProfilePage;
