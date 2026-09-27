import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    MdCheckCircle,
    MdPlayArrow,
    MdOutlineBuild,
    MdAccessTime,
    MdLogout,
    MdConfirmationNumber,
    MdLocalPhone,
    MdFlag,
    MdAssignment,
    MdBuild
} from 'react-icons/md';
import './TechnicianDashboard.css';

const colors = {
    ink: '#17231D',
    slate: '#68756E',
    slateLight: '#9AA39E',
    canvas: '#F7F7F4',
    surface: '#FFFFFF',
    line: '#E4E7E4',
    teal: '#285C4D',
    tealSoft: '#E8F1EE',
    green: '#3D8065',
    greenSoft: '#EAF4EF',
    amber: '#A56B22',
    amberSoft: '#F8F0E2',
    red: '#B84439',
    redSoft: '#F9E9E7'
};

const statusStyle = (status) => {
    if (status === 'In Progress') {
        return {
            color: colors.teal,
            bg: colors.tealSoft,
            bar: colors.teal,
            Icon: MdOutlineBuild
        };
    }
    return {
        color: colors.amber,
        bg: colors.amberSoft,
        bar: colors.amber,
        Icon: MdAccessTime
    };
};

const priorityColor = (priority) => {
    if (priority === 'High' || priority === 'Urgent') return colors.red;
    if (priority === 'Medium') return colors.amber;
    return colors.green;
};

const initials = (name = '') =>
    name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || 'T';

function TechnicianDashboard() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchJobs = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:5073/api/maintenance');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();

            const techJobs = data.filter(j =>
                (j.status === 'Assigned' || j.status === 'In Progress') &&
                j.technician &&
                (
                    j.technician.contactInformation === currentUser.phone ||
                    j.technician.name === currentUser.name ||
                    j.technician.contactInformation === currentUser.email
                )
            );

            setJobs(techJobs);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser?.role !== 'Technician') {
            navigate('/login');
            return;
        }
        
        fetchJobs();
    }, [currentUser, navigate, fetchJobs]);


    const handleStartWork = async (id) => {
        try {
            await fetch(`http://localhost:5073/api/maintenance/${id}/start`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('ah_token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
        fetchJobs();
        } catch (err) {
            console.error(err);
            alert('Error starting work');
        }
    };

    const handleResolve = async (id) => {
        const notes = prompt("Enter resolution notes (What did you fix?):");
        if (!notes) return;

        const costStr = prompt("Enter repair cost (LKR):", "0");
        const cost = parseFloat(costStr) || 0;

        try {
            await fetch(`http://localhost:5073/api/maintenance/${id}/resolve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('ah_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    resolutionNotes: notes,
                    repairCost: cost
                })
            });
            
        fetchJobs();
        } catch (err) {
            console.error(err);
            alert('Error resolving ticket');
        }
    };

    const assignedCount = jobs.filter(j => j.status === 'Assigned').length;
    const inProgressCount = jobs.filter(j => j.status === 'In Progress').length;

    return (
        <div className="technician-page">
            <div className="ah-container">

                {/* Header */}
                <div className="ah-header">
                    <div className="profile-section">
                        <div className="profile-avatar">
                            {initials(currentUser?.name)}
                        </div>

                        <div>
                            <h1>My work orders</h1>
                            <div className="user-info">
                                <span>{currentUser?.name}</span>
                                {currentUser?.phone && (
                                    <>
                                        <MdLocalPhone size={12} />
                                        <span>{currentUser.phone}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="header-right">
                        {!loading && jobs.length > 0 && (
                            <div className="status-counts">
                                <span className="assigned-count">
                                    {assignedCount} assigned
                                </span>
                                <span className="progress-count">
                                    {inProgressCount} in progress
                                </span>
                            </div>
                        )}

                        <button onClick={logout} className="signout-btn">
                            <MdLogout size={15} />
                            Sign out
                        </button>
                    </div>
                </div>

                {/* Hero */}
                <div className="hero-section">
                    <div className="hero-text">
                        <h4>TECHNICIAN PORTAL</h4>

                        <h2>
                            Manage your
                            <br />
                            assigned work orders.
                        </h2>

                        <p>
                            Access your daily maintenance tickets, track your repair
                            progress, and ensure residents receive fast and reliable service.
                        </p>
                    </div>

                    <div className="feature-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <MdAssignment size={21} />
                            </div>
                            <h3>VIEW ASSIGNMENTS</h3>
                            <p>Instantly see all maintenance tickets routed to you.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <MdBuild size={21} />
                            </div>
                            <h3>TRACK PROGRESS</h3>
                            <p>Start repairs and update your ongoing jobs.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <MdCheckCircle size={21} />
                            </div>
                            <h3>RESOLVE TICKETS</h3>
                            <p>Mark completed jobs as resolved quickly.</p>
                        </div>
                    </div>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="jobs-grid">
                        {[0, 1].map(i => (
                            <div key={i} className="loading-card" />
                        ))}
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="empty-card">
                        <div className="empty-icon">
                            <MdCheckCircle size={26} />
                        </div>

                        <h2>You're all caught up</h2>
                        <p>No jobs need your attention right now.</p>
                    </div>
                ) : (
                    <div className="jobs-grid">
                        {jobs.map(job => {
                            const s = statusStyle(job.status);
                            const StatusIcon = s.Icon;

                            return (
                                <div key={job.id} className="job-card">
                                    <div
                                        className="status-bar"
                                        style={{ backgroundColor: s.bar }}
                                    />

                                    <div className="job-top">
                                        <div className="job-main">
                                            <div className="job-meta">
                                                <span
                                                    className="status-badge"
                                                    style={{
                                                        backgroundColor: s.bg,
                                                        color: s.color
                                                    }}
                                                >
                                                    <StatusIcon size={12} />
                                                    {job.status}
                                                </span>

                                                <span className="ticket-number">
                                                    <MdConfirmationNumber size={12} />
                                                    Ticket {job.id}
                                                </span>
                                            </div>

                                            <h3>{job.title}</h3>
                                            <p>{job.description}</p>
                                        </div>

                                        <div className="priority-badge">
                                            <MdFlag
                                                size={13}
                                                color={priorityColor(job.priority)}
                                            />
                                            <span
                                                style={{
                                                    color: priorityColor(job.priority)
                                                }}
                                            >
                                                {job.priority}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="job-divider" />

                                    <div className="job-bottom">
                                        <div className="sla">
                                            <MdAccessTime size={14} />
                                            SLA due{' '}
                                            {job.slaDueDate
                                                ? new Date(job.slaDueDate).toLocaleString()
                                                : 'N/A'}
                                        </div>

                                        {job.status === 'Assigned' && (
                                            <button
                                                onClick={() => handleStartWork(job.id)}
                                                className="action-btn start-btn"
                                            >
                                                <MdPlayArrow size={16} />
                                                Start repair
                                            </button>
                                        )}

                                        {job.status === 'In Progress' && (
                                            <button
                                                onClick={() => handleResolve(job.id)}
                                                className="action-btn resolve-btn"
                                            >
                                                <MdCheckCircle size={16} />
                                                Mark resolved
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TechnicianDashboard;
