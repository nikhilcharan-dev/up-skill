import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import Modal from './Modal';
import Button from './Button';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/TraineeProfileModal.css';
const TraineeProfileModal = ({ isOpen, onClose, trainee }) => {
    const navigate = useNavigate();

    const getCFRankColor = (rank) => {
        if (!rank) return '#fff';
        const r = rank.toLowerCase();
        if (r.includes('newbie')) return '#a0a0a0';
        if (r.includes('pupil')) return '#008000';
        if (r.includes('specialist')) return '#03a89e';
        if (r.includes('expert')) return '#0000ff';
        if (r.includes('candidate')) return '#a0a';
        if (r.includes('master')) return '#ff8c00';
        if (r.includes('grand')) return '#ff0000';
        return '#fff';
    };

    const [codingProfile, setCodingProfile] = useState({
        leetcode: '',
        codeforces: '',
        codechef: '',
        hackerrank: ''
    });
    const [leetcodeData, setLeetcodeData] = useState(null);
    const [codeforcesData, setCodeforcesData] = useState(null);
    const [codechefData, setCodechefData] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [isEditingHandles, setIsEditingHandles] = useState(false);

    useEffect(() => {
        if (isOpen && trainee) {
            fetchCodingProfile();
        }
    }, [isOpen, trainee]);

    const fetchCodingProfile = async () => {
        try {
            setLoadingProfile(true);
            const response = await api.get(`/admin/trainee/${trainee._id}/coding-profile`);
            if (response.data) {
                setCodingProfile({
                    leetcode: response.data.leetcode || '',
                    codeforces: response.data.codeforces || '',
                    codechef: response.data.codechef || '',
                    hackerrank: response.data.hackerrank || ''
                });

                // Set LeetCode data if returned by backend
                if (response.data.leetcodeData) {
                    setLeetcodeData(response.data.leetcodeData);
                } else {
                    setLeetcodeData(null);
                }

                // Set CodeForces data if returned by backend
                if (response.data.codeforcesData) {
                    setCodeforcesData(response.data.codeforcesData);
                } else {
                    setCodeforcesData(null);
                }

                // Set CodeChef data if returned by backend
                if (response.data.codechefData) {
                    setCodechefData(response.data.codechefData);
                } else {
                    setCodechefData(null);
                }
            }
        } catch (err) {
            console.error("Failed to fetch coding profile", err);
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleSaveHandles = async () => {
        try {
            await api.put(`/admin/trainee/${trainee._id}/coding-profile`, codingProfile);
            showToast('Coding handles updated', 'success');
            setIsEditingHandles(false);
            // Re-fetch to get updated data from backend (including leetcode stats)
            fetchCodingProfile();
        } catch (err) {
            showToast('Failed to update handles', 'error');
        }
    };

    if (!trainee) return null;

    const handleBatchClick = (batchId) => {
        navigate('/admin/batches');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Trainee Profile"
            size="lg"
        >
            <div className="trainee-profile-premium">
                <div className="profile-summary-card">
                    <div className="profile-avatar-large">
                        {trainee.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="profile-name">{trainee.name}</h2>
                        <div className="flex items-center gap-2">
                            <p className="text-secondary profile-email">{trainee.workEmail}</p>
                            {trainee.studentId && <span className="tag-tiny" style={{ fontSize: '0.7rem' }}>{trainee.studentId}</span>}
                        </div>
                        <div className="flex gap-2 mt-3">
                            <span className="tag-tiny role-badge">{trainee.role}</span>
                            <span className="tag-tiny status-badge">Active Account</span>
                        </div>
                    </div>
                </div>

                {/* Top Row: Account & Batches */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Left Column: Account Info */}
                    <div className="flex flex-col gap-6">
                        <section>
                            <h4 className="section-title" style={{ color: 'var(--accent-primary)' }}>
                                <span>User</span> ACCOUNT INFORMATION
                            </h4>
                            <div className="flex flex-col gap-4">
                                <div className="info-card">
                                    <p className="info-label">Student ID</p>
                                    <p className="info-value">{trainee.studentId || 'Not set'}</p>
                                </div>
                                <div className="info-card">
                                    <p className="info-label">Joined Date</p>
                                    <p>{new Date(trainee.createdAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}</p>
                                </div>
                                {trainee.collegeEmail && (
                                    <div className="info-card">
                                        <p className="info-label">College Email</p>
                                        <p>{trainee.collegeEmail}</p>
                                    </div>
                                )}
                                <div className="info-card">
                                    <p className="info-label">Resume Status</p>
                                    {trainee.resume ? (
                                        <div className="flex flex-col gap-3 mt-2">
                                            <p className="text-success text-sm flex items-center gap-2">
                                                <span>Verified</span> Document uploaded
                                            </p>
                                            <a
                                                href={trainee.resume}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-primary btn-sm flex items-center justify-center gap-2 resume-btn"
                                            >
                                                <span>View</span> View Document
                                            </a>
                                        </div>
                                    ) : (
                                        <p className="text-muted italic text-sm py-2">No resume uploaded by student</p>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Batches */}
                    <div className="flex flex-col gap-6">
                        <section>
                            <h4 className="section-title" style={{ color: 'var(--accent-secondary)' }}>
                                <span>Batch</span> BATCH ENROLLMENTS
                            </h4>
                            <div className="flex flex-col gap-3">
                                {trainee.assignedBatches?.length > 0 ? (
                                    trainee.assignedBatches.map(b => (
                                        <div
                                            key={b._id}
                                            className="info-card batch-card group"
                                            onClick={() => handleBatchClick(b._id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div>
                                                <p className="font-bold text-lg">{b.name}</p>
                                                <p className="text-muted text-xs">{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</p>
                                            </div>
                                            <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">View Batch →</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center rounded-xl border border-dashed border-white-10 text-muted">
                                        Not assigned to any batches yet
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Bottom Row: Coding Profiles (Full Width) */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="section-title" style={{ color: '#FFA116', margin: 0 }}>
                            <span>Coding</span> CODING PROFILES
                        </h4>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => isEditingHandles ? handleSaveHandles() : setIsEditingHandles(true)}
                        >
                            {isEditingHandles ? 'Save' : 'Edit Handles'}
                        </Button>
                    </div>

                    {isEditingHandles ? (
                        <div className="flex flex-col gap-3 info-card">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="text-xs text-muted uppercase">LeetCode Username</label>
                                    <input
                                        className="form-input"
                                        value={codingProfile.leetcode}
                                        onChange={e => setCodingProfile({ ...codingProfile, leetcode: e.target.value })}
                                        placeholder="e.g. NIKHILCHARAN"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="text-xs text-muted uppercase">CodeForces</label>
                                    <input
                                        className="form-input"
                                        value={codingProfile.codeforces}
                                        onChange={e => setCodingProfile({ ...codingProfile, codeforces: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="text-xs text-muted uppercase">CodeChef</label>
                                    <input
                                        className="form-input"
                                        value={codingProfile.codechef}
                                        onChange={e => setCodingProfile({ ...codingProfile, codechef: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="text-xs text-muted uppercase">HackerRank</label>
                                    <input
                                        className="form-input"
                                        value={codingProfile.hackerrank}
                                        onChange={e => setCodingProfile({ ...codingProfile, hackerrank: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {codingProfile.leetcode && <span className="tag-tiny" style={{ background: '#FFA116', color: '#000' }}>LeetCode: {codingProfile.leetcode}</span>}
                            {codingProfile.codeforces && <span className="tag-tiny" style={{ background: '#318CE7', color: '#fff' }}>CF: {codingProfile.codeforces}</span>}
                            {codingProfile.codechef && <span className="tag-tiny" style={{ background: '#5B4638', color: '#fff' }}>CC: {codingProfile.codechef}</span>}
                            {codingProfile.hackerrank && <span className="tag-tiny" style={{ background: '#2EC866', color: '#fff' }}>HR: {codingProfile.hackerrank}</span>}
                            {!codingProfile.leetcode && !codingProfile.codeforces && <p className="text-muted text-sm italic">No handles linked.</p>}
                        </div>
                    )}

                    {/* LeetCode Stats Card */}
                    {codingProfile.leetcode && (
                        <div className="leetcode-card mt-4" style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {loadingProfile ? (
                                <div className="flex items-center justify-center p-8">
                                    <div className="spinner"></div>
                                </div>
                            ) : leetcodeData ? (
                                <>
                                    {/* Header Section */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={leetcodeData.avatar || 'https://assets.leetcode.com/static_assets/public/images/LeetCode_logo_rvs.png'}
                                                alt="Avatar"
                                                style={{ width: '70px', height: '70px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #FFA116' }}
                                            />
                                            <div>
                                                <h3 className="font-bold text-xl">{leetcodeData.name} <span className="text-muted text-sm font-normal">({leetcodeData.username})</span></h3>
                                                <p className="text-xs text-muted mt-1 mb-2">{leetcodeData.about}</p>

                                                {/* Unique Rank & Rating Styling */}
                                                <div className="flex gap-3">
                                                    <div className="stat-box">
                                                        <div className="stat-content">
                                                            <span className="stat-label">Rank</span>
                                                            <span className="stat-value">{leetcodeData.ranking?.toLocaleString() || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="stat-box">
                                                        <div className="stat-content">
                                                            <span className="stat-label">Rating</span>
                                                            <span className="stat-value">{leetcodeData.contest?.rating || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {leetcodeData.country && (
                                            <span className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10">{leetcodeData.country}</span>
                                        )}
                                    </div>

                                    {/* Circular Graph Section & Stats */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div className="flex flex-col gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                                            <div className="flex items-center gap-6">
                                                <div style={{ width: 80, height: 80, position: 'relative', minWidth: '80px' }}>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={[
                                                                    { name: 'Easy', value: leetcodeData.solved.easy },
                                                                    { name: 'Medium', value: leetcodeData.solved.medium },
                                                                    { name: 'Hard', value: leetcodeData.solved.hard },
                                                                    { name: 'Remaining', value: leetcodeData.total.all - leetcodeData.solved.all }
                                                                ]}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={28}
                                                                outerRadius={38}
                                                                startAngle={90}
                                                                endAngle={-270}
                                                                dataKey="value"
                                                                stroke="none"
                                                                paddingAngle={2}
                                                            >
                                                                <Cell fill="#00b8a3" /> {/* Easy */}
                                                                <Cell fill="#ffc01e" /> {/* Medium */}
                                                                <Cell fill="#ef4743" /> {/* Hard */}
                                                                <Cell fill="#333" />    {/* Remaining */}
                                                            </Pie>
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                        <span className="text-sm font-bold text-white">{leetcodeData.solved.all}</span>
                                                        <span className="text-[0.5rem] text-muted">SOLVED</span>
                                                    </div>
                                                </div>

                                                {/* Visual Difficulty Bars */}
                                                <div className="flex-1 flex flex-col gap-2 min-w-0">
                                                    {['Easy', 'Medium', 'Hard'].map(diff => {
                                                        const level = diff.toLowerCase();
                                                        const solved = leetcodeData.solved[level];
                                                        const total = leetcodeData.total[level];
                                                        const percentage = total > 0 ? (solved / total) * 100 : 0;
                                                        const colors = {
                                                            easy: '#00b8a3',
                                                            medium: '#ffc01e',
                                                            hard: '#ef4743'
                                                        };

                                                        return (
                                                            <div key={diff} className="w-full">
                                                                <div className="flex justify-between items-center text-[0.65rem] mb-0.5 uppercase tracking-wider text-muted font-semibold">
                                                                    <span style={{ color: colors[level] }}>{diff}</span>
                                                                    <span className="whitespace-nowrap ml-2"><span className="text-white">{solved}</span> / {total}</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full transition-all duration-500"
                                                                        style={{ width: `${percentage}%`, backgroundColor: colors[level] }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Badges Section */}
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 overflow-hidden">
                                            <h5 className="text-xs text-muted uppercase mb-3 font-bold">Badges</h5>
                                            {leetcodeData.badges && leetcodeData.badges.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {leetcodeData.badges.slice(0, 6).map(badge => (
                                                        <div key={badge.id} className="relative group w-14 h-14 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 p-2 transition-transform hover:scale-105" title={badge.displayName}>
                                                            {badge.icon.startsWith('http') ? (
                                                                <img src={badge.icon} alt={badge.name} className="object-contain drop-shadow-md" style={{ width: '40px', height: '40px' }} />
                                                            ) : (
                                                                <img src={`https://leetcode.com${badge.icon}`} alt={badge.name} className="object-contain drop-shadow-md" style={{ width: '40px', height: '40px' }} />
                                                            )}
                                                        </div>
                                                    ))}
                                                    {leetcodeData.badges.length > 6 && (
                                                        <div className="w-14 h-14 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 text-xs text-muted font-bold">
                                                            +{leetcodeData.badges.length - 6}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-muted italic">No badges earned yet.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Skill Tags - New Format */}
                                    {leetcodeData.skillTags && leetcodeData.skillTags.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-white/5">
                                            <h5 className="text-xs text-muted uppercase mb-3 font-bold">Top Skills</h5>
                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/80">
                                                {(() => {
                                                    // Deduplicate logic
                                                    const seen = new Set();
                                                    return leetcodeData.skillTags.filter(skill => {
                                                        const normalized = skill.toLowerCase();
                                                        if (seen.has(normalized)) return false;
                                                        seen.add(normalized);
                                                        return true;
                                                    }).map((skill, index) => (
                                                        <div key={skill} className="flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: index % 2 === 0 ? '#FFA116' : '#2EC866' }}></span>
                                                            <span className="font-medium tracking-wide">{skill}</span>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center p-6">
                                    <p className="text-danger mb-1">Failed to load LeetCode profile.</p>
                                    <p className="text-xs text-muted">Please check if the username <strong>{codingProfile.leetcode}</strong> is correct.</p>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* CodeForces Profile Section */}
                <div className="mt-8">
                    {codingProfile.codeforces && (
                        <div className="codeforces-card" style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {loadingProfile ? (
                                <div className="flex items-center justify-center p-8">
                                    <div className="spinner"></div>
                                </div>
                            ) : codeforcesData ? (
                                <>
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img
                                                    src={codeforcesData.avatar || 'https://cdn.iconscout.com/icon/free/png-256/free-codeforces-3628695-3029920.png'}
                                                    alt="CF Avatar"
                                                    style={{ width: '70px', height: '70px', borderRadius: '12px', objectFit: 'cover' }}
                                                    className="border-2 border-white/10"
                                                />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-xl">{codeforcesData.name}</h3>
                                                <p className="text-sm font-medium opacity-80 mb-2">@{codeforcesData.username}</p>

                                                <div className="flex gap-3">
                                                    <div className="stat-box">
                                                        <div className="stat-content">
                                                            <span className="stat-label">Rating</span>
                                                            <span className="stat-value" style={{ color: codeforcesData.rating >= 2400 ? '#ff0000' : codeforcesData.rating >= 2100 ? '#ff8c00' : codeforcesData.rating >= 1900 ? '#a0a' : codeforcesData.rating >= 1600 ? '#0000ff' : codeforcesData.rating >= 1400 ? '#03a89e' : codeforcesData.rating >= 1200 ? '#008000' : '#a0a0a0' }}>
                                                                {codeforcesData.rating}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="stat-box">
                                                        <div className="stat-content">
                                                            <span className="stat-label">Max</span>
                                                            <span className="stat-value">{codeforcesData.maxRating}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white/5 p-3 rounded-lg border border-white/10 flex flex-row items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors">
                                            <span className="text-sm font-bold">Friends</span>
                                            <div>
                                                <p className="text-[0.6rem] text-muted uppercase font-bold tracking-wider mb-0.5 leading-none">Friend Of</p>
                                                <p className="text-base font-bold text-white leading-none">{codeforcesData.friendOfCount?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-lg border border-white/10 flex flex-row items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors">
                                            <span className="text-sm font-bold">Joined</span>
                                            <div>
                                                <p className="text-[0.6rem] text-muted uppercase font-bold tracking-wider mb-0.5 leading-none">Registered</p>
                                                <p className="text-sm font-bold text-white leading-none">
                                                    {codeforcesData.registrationTime ? new Date(codeforcesData.registrationTime * 1000).getFullYear() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-lg border border-white/10 flex flex-row items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors">
                                            <span className="text-sm font-bold">Online</span>
                                            <div>
                                                <p className="text-[0.6rem] text-muted uppercase font-bold tracking-wider mb-0.5 leading-none">Last Online</p>
                                                <p className="text-xs font-bold text-white leading-none">
                                                    {codeforcesData.lastOnline ? new Date(codeforcesData.lastOnline * 1000).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-6">
                                    <p className="text-danger mb-1">Failed to load CodeForces profile.</p>
                                    <p className="text-xs text-muted">Check username <strong>{codingProfile.codeforces}</strong></p>
                                </div>
                            )}
                        </div>
                    )}
                </div>


                <div className="mt-8">
                    {codingProfile.codechef && (
                        <div className="codechef-card" style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {loadingProfile ? (
                                <div className="flex items-center justify-center p-8">
                                    <div className="spinner"></div>
                                </div>
                            ) : codechefData ? (
                                <>
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img
                                                    src={codechefData.avatar || 'https://img.icons8.com/fluent-systems-regular/1200/codechef.jpg'}
                                                    alt="CC Avatar"
                                                    style={{ width: '70px', height: '70px', borderRadius: '12px', objectFit: 'cover' }}
                                                    className="border-2 border-white/10"
                                                />
                                                {/* Stars Stripe */}
                                                <div className="absolute -bottom-1 -right-1 w-full text-center">
                                                    <span className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full bg-black/80 border border-white/20 uppercase" style={{ color: '#fff' }}>
                                                        {codechefData.stars || 'Unrated'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-xl">{codechefData.name}</h3>
                                                <p className="text-sm font-medium opacity-80 mb-2">@{codechefData.username}</p>

                                                <div className="flex gap-3">
                                                    <div className="stat-box">
                                                        <div className="stat-content">
                                                            <span className="stat-label">Rating</span>
                                                            <span className="stat-value" style={{ color: '#5B4638' }}>{codechefData.rating}</span>
                                                        </div>
                                                    </div>
                                                    <div className="stat-box">
                                                        <div className="stat-content">
                                                            <span className="stat-label">High</span>
                                                            <span className="stat-value">{codechefData.maxRating}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* CodeChef Logo Watermark */}
                                        <div className="opacity-10 grayscale">
                                            <img src="https://img.icons8.com/fluent-systems-regular/1200/codechef.jpg" width="80" alt="CC" />
                                        </div>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white/5 p-3 rounded-lg border border-white/10 flex flex-row items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors">
                                            <span className="text-sm font-bold">Global</span>
                                            <div>
                                                <p className="text-[0.6rem] text-muted uppercase font-bold tracking-wider mb-0.5 leading-none">Global Rank</p>
                                                <p className="text-base font-bold text-white leading-none">{codechefData.globalRank?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-lg border border-white/10 flex flex-row items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors">
                                            <span className="text-sm font-bold">Country</span>
                                            <div>
                                                <p className="text-[0.6rem] text-muted uppercase font-bold tracking-wider mb-0.5 leading-none">Country Rank</p>
                                                <p className="text-base font-bold text-white leading-none">
                                                    {codechefData.countryRank?.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-lg border border-white/10 flex flex-row items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors">
                                            <span className="text-sm font-bold">Loc</span>
                                            <div>
                                                <p className="text-[0.6rem] text-muted uppercase font-bold tracking-wider mb-0.5 leading-none">Country</p>
                                                <p className="text-xs font-bold text-white leading-none">
                                                    {codechefData.countryName || 'Unknown'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-6">
                                    <p className="text-danger mb-1">Failed to load CodeChef profile.</p>
                                    <p className="text-xs text-muted">Check username <strong>{codingProfile.codechef}</strong></p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <Button variant="secondary" onClick={onClose}>
                        Done
                    </Button>
                </div>
            </div >
        </Modal >
    );
};

export default TraineeProfileModal;
