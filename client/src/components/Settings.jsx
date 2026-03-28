import React, { useState, useEffect } from 'react';
import { User, Bell, Moon, Shield, Save, Activity, Stethoscope } from 'lucide-react';
import API_URL from '../config';

const Settings = ({ userId, role }) => {
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    // Safe LocalStorage Access
    useEffect(() => {
        try {
            const isDark = localStorage.getItem('theme') === 'dark';
            setDarkMode(isDark);
            if (isDark) {
                document.documentElement.classList.add('dark');
            }
        } catch (e) {
            console.warn("LocalStorage access denied", e);
        }
    }, []);

    const toggleTheme = () => {
        try {
            const newMode = !darkMode;
            setDarkMode(newMode);
            if (newMode) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        } catch (e) {
            console.warn("Failed to set theme", e);
        }
    };

    // Doctor Selection State
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState("");

    // User Profile State
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        specialization: '',
        degree: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactEmail: ''
    });

    useEffect(() => {
        if (role === 'patient') {
            fetchDoctors();
        }
        if (userId) {
            fetchUserData();
        }
    }, [role, userId]);

    const fetchDoctors = async () => {
        try {
            const res = await fetch(`${API_URL}/api/doctors`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setDoctors(data);
                } else {
                    setDoctors([]);
                }
            }
        } catch (error) {
            console.error("Error fetching doctors:", error);
            setDoctors([]);
        }
    };

    const fetchUserData = async () => {
        if (!userId) return;
        try {
            const response = await fetch(`${API_URL}/api/users/${userId}`);
            if (response.ok) {
                const data = await response.json();
                // Safe access to data properties
                setUserData(prev => ({
                    ...prev,
                    name: data?.name || '',
                    email: data?.email || '',
                    phone: data?.phone || '',
                    address: data?.address || '',
                    specialization: data?.specialization || '',
                    degree: data?.degree || '',
                    emergencyContactName: data?.emergencyContactName || '',
                    emergencyContactPhone: data?.emergencyContactPhone || '',
                    emergencyContactEmail: data?.emergencyContactEmail || ''
                }));
                if (data?.doctorId) setSelectedDoctor(data.doctorId);
            }
        } catch (error) {
            console.error("Failed to fetch user data", error);
        }
    };

    const handleChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
            if (response.ok) {
                alert("Profile updated successfully!");
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData?.message || 'Update failed'}`);
            }
        } catch (error) {
            alert("Connection error. Please try again.");
        }
    };

    const handleDoctorChange = async (e) => {
        const newDoctorId = e.target.value;
        setSelectedDoctor(newDoctorId);

        try {
            await fetch(`${API_URL}/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ doctorId: parseInt(newDoctorId) })
            });
            alert("Doctor updated successfully!");
        } catch (error) {
            console.error("Error updating doctor:", error);
        }
    };

    // Helper to find selected doctor details - Defensive find
    const doctorDetails = Array.isArray(doctors)
        ? doctors.find(d => d.id === parseInt(selectedDoctor || 0))
        : null;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Settings</h2>

            {/* Profile Section */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            className="w-full p-2 border border-blue-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
                            value={userData.name}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            className="w-full p-2 border border-blue-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
                            value={userData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            className="w-full p-2 border border-blue-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
                            value={userData.phone}
                            onChange={handleChange}
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>
                </div>
            </div>

            {/* Emergency Contact Section */}
            {role === 'patient' && (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-red-500" />
                        Emergency Contact
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Name</label>
                            <input
                                type="text"
                                name="emergencyContactName"
                                className="w-full p-2 border border-blue-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
                                value={userData.emergencyContactName || ''}
                                onChange={handleChange}
                                placeholder="e.g. Jane Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Phone</label>
                            <input
                                type="tel"
                                name="emergencyContactPhone"
                                className="w-full p-2 border border-blue-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
                                value={userData.emergencyContactPhone || ''}
                                onChange={handleChange}
                                placeholder="+1 (555) 999-9999"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Email</label>
                            <input
                                type="email"
                                name="emergencyContactEmail"
                                className="w-full p-2 border border-blue-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
                                value={userData.emergencyContactEmail || ''}
                                onChange={handleChange}
                                placeholder="emergency@example.com"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Professional Details Section (Doctor Only) */}
            {role === 'doctor' && (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <Stethoscope className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Professional Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Specialization</label>
                            <input
                                type="text"
                                name="specialization"
                                className="w-full p-2 border border-blue-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
                                value={userData.specialization}
                                onChange={handleChange}
                                placeholder="e.g. Cardiologist"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Degree / Qualification</label>
                            <input
                                type="text"
                                name="degree"
                                className="w-full p-2 border border-blue-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
                                value={userData.degree}
                                onChange={handleChange}
                                placeholder="e.g. MBBS, MD"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Clinic / Hospital Address</label>
                            <input
                                type="text"
                                name="address"
                                className="w-full p-2 border border-blue-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
                                value={userData.address}
                                onChange={handleChange}
                                placeholder="e.g. 123 Health St, Medical City"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Medical Details Section */}
            {role === 'patient' && (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-red-500" />
                        Medical Details
                    </h3>

                    <div className="mb-6 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                        <label className="block text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">My Assigned Doctor</label>
                        <select
                            className="w-full p-2 border border-blue-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-white outline-none mb-2"
                            value={selectedDoctor}
                            onChange={handleDoctorChange}
                        >
                            <option value="">Select a Doctor</option>
                            {Array.isArray(doctors) && doctors.map(doc => (
                                <option key={doc?.id} value={doc?.id}>
                                    {doc?.name} {doc?.specialization ? `- ${doc.specialization}` : ''}
                                </option>
                            ))}
                        </select>

                        {doctorDetails && (
                            <div className="p-3 bg-white/50 dark:bg-slate-700/50 rounded-lg border border-blue-200 dark:border-slate-600 space-y-1">
                                <p className="font-semibold text-blue-900 dark:text-blue-300">{doctorDetails.name}</p>
                                <p className="text-sm text-blue-700 dark:text-blue-400">{doctorDetails.specialization || 'General Practitioner'}</p>
                                <p className="text-xs text-blue-500 dark:text-blue-400">{doctorDetails.degree || 'MD'} • Verified</p>
                                {doctorDetails.phone && <p className="text-xs text-blue-600 dark:text-blue-400">📞 {doctorDetails.phone}</p>}
                                {doctorDetails.address && <p className="text-xs text-blue-600 dark:text-blue-400">📍 {doctorDetails.address}</p>}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
                            <select className="w-full p-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                                <option>O+</option>
                                <option>O-</option>
                                <option>A+</option>
                                <option>A-</option>
                            </select>
                        </div>
                        {/* Placeholder fields for demo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Height (cm)</label>
                            <input type="number" className="w-full p-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-white" defaultValue="175" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight (kg)</label>
                            <input type="number" className="w-full p-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-white" defaultValue="70" />
                        </div>
                    </div>
                </div>
            )}

            {/* Preferences Section */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    Preferences
                </h3>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-800 dark:text-white">Email Notifications</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Receive daily health summaries</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={notifications} onChange={() => setNotifications(!notifications)} />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
                                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-800 dark:text-white">Dark Mode</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Switch to dark theme</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={darkMode} onChange={toggleTheme} />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Save className="w-4 h-4" />
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default Settings;
