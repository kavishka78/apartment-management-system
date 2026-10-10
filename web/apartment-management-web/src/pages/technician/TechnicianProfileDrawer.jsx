import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAuthToken } from '../../services/api';
import { MAINTENANCE_API_BASE } from '../maintenance/maintenanceApi';
import { MdClose, MdVpnKey, MdOutlinePhotoCamera, MdToggleOn, MdToggleOff, MdPerson, MdPhone, MdEmail, MdError } from 'react-icons/md';

export default function TechnicianProfileDrawer({ isOpen, onClose }) {
    const { currentUser, logout } = useAuth();
    const [tech, setTech] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    // Password Modal State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passError, setPassError] = useState('');
    const [passSuccess, setPassSuccess] = useState('');
    const [isSavingPass, setIsSavingPass] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        
        // Auto-open password modal if forced reset
        if (currentUser?.requiresPasswordReset) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShowPasswordModal(true);
        }

        const fetchDetails = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${MAINTENANCE_API_BASE}/technicians`, {
                    headers: { Authorization: `Bearer ${getAuthToken() || ''}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const me = data.find(t => t.email.toLowerCase() === currentUser.email.toLowerCase());
                    if (me) setTech(me);
                }
            } catch (err) {
                console.error("Failed to fetch technician details", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [isOpen, currentUser]);

    const toggleStatus = async () => {
        if (!tech) return;
        const newStatus = tech.status === 'Available' ? 'Offline' : 'Available';
        try {
            const updatedTech = { ...tech, status: newStatus };
            const res = await fetch(`${MAINTENANCE_API_BASE}/technicians/${tech.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken() || ''}` },
                body: JSON.stringify(updatedTech)
            });
            if (res.ok) {
                setTech(updatedTech);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result;
            try {
                const updatedTech = { ...tech, photoBase64: base64String };
                const res = await fetch(`${MAINTENANCE_API_BASE}/technicians/${tech.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken() || ''}` },
                    body: JSON.stringify(updatedTech)
                });
                if (res.ok) {
                    setTech(updatedTech);
                } else {
                    alert("Failed to upload photo.");
                }
            } catch (err) {
                console.error(err);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPassError('');
        setPassSuccess('');

        if (newPassword !== confirmPassword) {
            setPassError("New passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setPassError("Password must be at least 6 characters.");
            return;
        }

        setIsSavingPass(true);
        try {
            const res = await fetch(`${MAINTENANCE_API_BASE}/v1/auth/change-password`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            
            // 401/404 responses can have an empty body, so don't assume JSON
            const text = await res.text();
            let data = {};
            try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }

            if (res.ok) {
                setPassSuccess("Password changed! Please log in with your new password.");
                // Cached user still has requiresPasswordReset=true, so start a fresh session
                setTimeout(() => {
                    logout();
                    window.location.href = '/login';
                }, 1500);
            } else if (res.status === 401) {
                setPassError("Your session has expired. Please log in again.");
            } else {
                setPassError(data.message || `Failed to change password (error ${res.status}).`);
            }
        } catch {
            setPassError("Cannot reach the server. Is the backend running?");
        } finally {
            setIsSavingPass(false);
        }
    };

    if (!isOpen) return null;

    const isAvailable = tech?.status === 'Available';
    const isForcedReset = currentUser?.requiresPasswordReset;

    return (
        <div className="technician-profile-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-end',
            backdropFilter: 'blur(2px)'
        }}>
            {/* Drawer */}
            <div className="technician-profile-drawer" style={{
                width: '100%', maxWidth: '450px',
                background: '#f8fafc',
                height: '100%',
                boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
                display: 'flex', flexDirection: 'column',
                animation: 'slideInRight 0.3s ease-out'
            }}>
                <style>{`
                    @keyframes slideInRight {
                        from { transform: translateX(100%); }
                        to { transform: translateX(0); }
                    }
                    .drawer-content {
                        flex: 1; overflow-y: auto; padding: 24px;
                    }
                    .drawer-card {
                        background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    }
                    @media (max-width: 600px) {
                        .drawer-card { padding: 15px; }
                    }
                `}</style>

                {/* Header */}
                <div className="technician-profile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '700' }}>Technician Profile</h2>
                    {!isForcedReset && (
                        <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
                            <MdClose size={20} />
                        </button>
                    )}
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading details...</div>
                ) : (
                    <div className="drawer-content">
                        
                        {/* Avatar & Name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                            <div style={{ position: 'relative' }}>
                                {tech?.photoBase64 ? (
                                    <img src={tech.photoBase64} alt="Profile" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }} />
                                ) : (
                                    <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#1e3a8a', fontWeight: 'bold' }}>
                                        {tech?.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>{tech?.name}</h3>
                                <div style={{ color: '#64748b', fontSize: '13px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '50px', display: 'inline-block' }}>
                                    {tech?.skills?.split(',')[0]} Technician
                                </div>
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} style={{ display: 'none' }} />
                                <button onClick={() => fileInputRef.current.click()} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: 0, marginTop: '8px' }}>
                                    <MdOutlinePhotoCamera /> Edit account photo
                                </button>
                            </div>
                        </div>

                        {/* Personal Details Card */}
                        <div className="drawer-card">
                            <h4 style={{ margin: '0 0 15px 0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact & Info</h4>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                                <div style={{ color: '#94a3b8' }}><MdPerson size={18} /></div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Full Name</div>
                                    <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{tech?.name}</div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                                <div style={{ color: '#94a3b8' }}><MdPhone size={18} /></div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Phone Number</div>
                                    <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{tech?.contactInformation || '-'}</div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                                <div style={{ color: '#94a3b8' }}><MdEmail size={18} /></div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Email Address</div>
                                    <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{tech?.email}</div>
                                </div>
                            </div>
                        </div>

                        {/* Status Card */}
                        <div className="drawer-card">
                            <h4 style={{ margin: '0 0 15px 0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Availability</h4>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>Accepting New Jobs</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Toggle when clocking out</div>
                                </div>
                                <div onClick={toggleStatus} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    {isAvailable ? (
                                        <MdToggleOn size={48} color="#10b981" />
                                    ) : (
                                        <MdToggleOff size={48} color="#94a3b8" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Change Password Button */}
                        <button onClick={() => setShowPasswordModal(true)} style={{ width: '100%', padding: '12px', borderRadius: '50px', border: '1px solid #1e3a8a', background: '#fff', color: '#1e3a8a', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <MdVpnKey size={18} /> Change Password
                        </button>
                        
                    </div>
                )}
            </div>

            {/* Change Password Modal (Overlay inside Drawer) */}
            {showPasswordModal && (
                <div className="technician-password-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                    <div className="technician-password-modal" style={{ background: '#fff', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                            <div style={{ background: '#dbeafe', padding: '8px', borderRadius: '50%', color: '#1e3a8a' }}><MdVpnKey size={20} /></div>
                            <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '700' }}>
                                {isForcedReset ? 'Set Permanent Password' : 'Change Password'}
                            </h2>
                        </div>
                        
                        {isForcedReset && (
                            <div style={{ color: '#b45309', fontSize: '12px', fontWeight: '600', background: '#fffbeb', padding: '10px', borderRadius: '8px', border: '1px solid #fde68a', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <MdError size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                                For security reasons, you must change your temporary password before viewing work orders.
                            </div>
                        )}

                        {passError && <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '15px', padding: '10px', background: '#fef2f2', borderRadius: '6px' }}>{passError}</div>}
                        {passSuccess && <div style={{ color: '#10b981', fontSize: '12px', marginBottom: '15px', padding: '10px', background: '#ecfdf5', borderRadius: '6px' }}>{passSuccess}</div>}

                        <form onSubmit={handleChangePassword}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Current Temporary Password</label>
                                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '50px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }} />
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>New Password</label>
                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} style={{ width: '100%', padding: '10px', borderRadius: '50px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }} />
                            </div>
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Confirm New Password</label>
                                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} style={{ width: '100%', padding: '10px', borderRadius: '50px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                {!isForcedReset && (
                                    <button type="button" onClick={() => setShowPasswordModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '50px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                                )}
                                <button type="submit" disabled={isSavingPass} style={{ flex: 1, padding: '10px', borderRadius: '50px', border: 'none', background: '#1e3a8a', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
                                    {isSavingPass ? 'Saving...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
