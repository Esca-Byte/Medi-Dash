import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Activity, Heart, Settings, User, Calendar, LogOut, MessageSquare } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import API_URL from '../config';

const Sidebar = ({ role, onLogout, userId }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userName, setUserName] = useState('');
    const [unreadChatCount, setUnreadChatCount] = useState(0);

    // Fetch real user name
    useEffect(() => {
        if (userId) {
            fetch(`${API_URL}/api/users/${userId}`)
                .then(res => res.json())
                .then(data => {
                    if (data?.name) setUserName(data.name);
                })
                .catch(err => console.error('Failed to fetch user info', err));
        }
    }, [userId]);

    // Fetch unread chat count
    useEffect(() => {
        if (userId) {
            const fetchUnread = () => {
                fetch(`${API_URL}/api/messages/unread-count?userId=${userId}`)
                    .then(res => res.json())
                    .then(data => setUnreadChatCount(data.unreadCount || 0))
                    .catch(() => { });
            };
            fetchUnread();
            const interval = setInterval(fetchUnread, 10000); // Poll every 10s
            return () => clearInterval(interval);
        }
    }, [userId]);

    const isActive = (path) => location.pathname === path;

    const getLinkClass = (path) => {
        const activeClass = "w-full flex items-center space-x-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg transition-colors";
        const inactiveClass = "w-full flex items-center space-x-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors";
        return isActive(path) ? activeClass : inactiveClass;
    };

    // Get user initials
    const getInitials = (name) => {
        if (!name) return role === 'doctor' ? 'DR' : 'PT';
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    return (
        <div className="h-screen w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-700 flex flex-col fixed left-0 top-0 z-50">
            <div className="p-6 flex items-center space-x-2 border-b border-gray-50 dark:border-slate-800">
                <div className="bg-blue-600 p-2 rounded-lg">
                    <Activity className="text-white w-6 h-6" />
                </div>
                <span className="text-xl font-bold text-gray-800 dark:text-white">MediDash</span>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <button onClick={() => navigate(`/${role}`)} className={getLinkClass(`/${role}`)}>
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="font-medium">Dashboard</span>
                </button>

                {role === 'patient' && (
                    <>
                        <button onClick={() => navigate('/patient/vitals')} className={getLinkClass('/patient/vitals')}>
                            <Heart className="w-5 h-5" />
                            <span className="font-medium">My Vitals</span>
                        </button>
                        <button onClick={() => navigate('/appointments')} className={getLinkClass('/appointments')}>
                            <Calendar className="w-5 h-5" />
                            <span className="font-medium">Appointments</span>
                        </button>
                    </>
                )}

                {role === 'doctor' && (
                    <>
                        <button onClick={() => navigate('/doctor')} className={getLinkClass('/doctor')}>
                            <User className="w-5 h-5" />
                            <span className="font-medium">All Patients</span>
                        </button>
                    </>
                )}

                {/* Chat Link */}
                <button onClick={() => navigate('/chat')} className={getLinkClass('/chat')}>
                    <div className="relative">
                        <MessageSquare className="w-5 h-5" />
                        {unreadChatCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-1">
                                {unreadChatCount > 9 ? '9+' : unreadChatCount}
                            </span>
                        )}
                    </div>
                    <span className="font-medium">Messages</span>
                    {unreadChatCount > 0 && (
                        <span className="ml-auto px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                            {unreadChatCount}
                        </span>
                    )}
                </button>

                <button onClick={() => navigate('/settings')} className={getLinkClass('/settings')}>
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Settings</span>
                </button>
            </nav>

            <div className="p-4 border-t border-gray-50 dark:border-slate-800">
                <button
                    onClick={onLogout}
                    className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-semibold"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>

                <div className="flex items-center space-x-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                        {getInitials(userName)}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-800 dark:text-white truncate max-w-[120px]">
                            {userName || (role === 'doctor' ? 'Doctor' : 'Patient')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{role}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
