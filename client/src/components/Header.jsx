import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { Bell, Search, AlertTriangle, Watch, Activity, X, Check } from 'lucide-react';
import API_URL from '../config';




const Header = ({ role, userId }) => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
    const [showNotifications, setShowNotifications] = useState(false);
    const location = useLocation();

    // Determine Title based on Path
    const getPageTitle = () => {
        const path = location.pathname;
        if (path.includes('vitals')) return 'My Vitals';
        if (path.includes('appointments')) return 'Appointments';
        if (path.includes('settings')) return 'Settings';
        if (path.includes('patient') || path.includes('doctor')) return 'Health Overview';
        return 'Dashboard';
    };

    const handleEmergency = () => {
        const confirmAlert = window.confirm("Are you sure you want to send an EMERGENCY ALERT?");
        if (!confirmAlert) return;

        const sendAlert = async (locationData = null) => {
            try {
                const payload = { userId };
                if (locationData) {
                    payload.location = locationData;
                }

                const response = await fetch(`${API_URL}/api/emergency`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                const data = await response.json();
                if (data.success) {
                    alert(`ALERT SENT! ${data.message} ETA: ${data.eta}`);
                } else {
                    alert("Failed to send alert server-side.");
                }
            } catch (error) {
                console.error("Emergency Alert Network Error:", error);
                alert("Network error. Please call emergency services directly.");
            }
        };

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    sendAlert({ latitude, longitude });
                },
                (error) => {
                    console.warn("Location access denied or failed:", error.message);
                    // Send alert without location
                    sendAlert(null);
                },
                { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 }
            );
        } else {
            console.warn("Geolocation not supported");
            sendAlert(null);
        }
    };

    return (
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-40 ml-64">


            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white transition-all duration-300">{getPageTitle()}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                    {role === 'doctor'
                        ? "Welcome back, check your patient's latest vitals."
                        : "Welcome back, track your health metrics."}
                </p>
            </div>

            <div className="flex items-center space-x-4">
                {/* Device Connection Controls */}


                <button
                    onClick={handleEmergency}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors animate-pulse font-bold"
                >
                    <AlertTriangle className="w-5 h-5" />
                    <span>EMERGENCY</span>
                </button>

                {role === 'doctor' && (
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            className="pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 w-64 bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
                        />
                    </div>
                )}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    >
                        <Bell className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 z-50 overflow-hidden animate-fadeIn">
                            <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-700/50">
                                <h3 className="font-semibold text-gray-800 dark:text-white">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                        No new notifications
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50 dark:divide-slate-700">
                                        {notifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors flex gap-3 ${notif.read ? 'opacity-60' : 'bg-blue-50/30 dark:bg-blue-900/10'}`}
                                            >
                                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notif.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <p className={`text-sm font-medium ${notif.type === 'warning' ? 'text-orange-700 dark:text-orange-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                                            {notif.title}
                                                        </p>
                                                        {!notif.read && (
                                                            <button onClick={() => markAsRead(notif.id)} className="text-gray-400 hover:text-green-600">
                                                                <Check className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notif.message}</p>
                                                    <p className="text-[10px] text-gray-400 mt-2">
                                                        {new Date(notif.timestamp).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
