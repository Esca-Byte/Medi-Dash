import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Check, Clock, Stethoscope, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

const DoctorSearch = ({ userId }) => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDoctors();
        fetchMyRequests();
    }, []);

    const fetchDoctors = async () => {
        try {
            const res = await fetch(`${API_URL}/api/doctors/search`);
            const data = await res.json();
            setDoctors(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch doctors", err);
            setLoading(false);
        }
    };

    const fetchMyRequests = async () => {
        try {
            const res = await fetch(`${API_URL}/api/requests?userId=${userId}&role=patient`);
            const data = await res.json();
            setRequests(data);
        } catch (err) {
            console.error("Failed to fetch requests", err);
        }
    };

    const sendRequest = async (doctorId) => {
        try {
            const res = await fetch(`${API_URL}/api/requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientId: userId, doctorId })
            });
            const data = await res.json();
            if (data.success) {
                fetchMyRequests(); // Refresh status
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error("Failed to send request", err);
        }
    };

    const getRequestStatus = (doctorId) => {
        const req = requests.find(r => r.doctorId === doctorId);
        return req ? req.status : null;
    };

    const filteredDoctors = doctors.filter(doctor =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doctor.specialization && doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-gray-300" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Find a Doctor</h1>
                    <p className="text-slate-500 dark:text-gray-400">Search and connect with specialists</p>
                </div>
            </div>

            <div className="mb-8 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search by name or specialization..."
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none shadow-sm transition-all dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-500">Loading doctors...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDoctors.map(doctor => {
                        const status = getRequestStatus(doctor.id);

                        return (
                            <div key={doctor.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <Stethoscope className="w-6 h-6" />
                                    </div>
                                    <span className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-600">
                                        {doctor.specialization || 'General'}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{doctor.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">{doctor.degree || 'Medical Doctor'}</p>

                                <div className="mt-auto">
                                    {status === 'pending' ? (
                                        <button disabled className="w-full py-2.5 bg-yellow-50 text-yellow-700 font-medium rounded-lg flex items-center justify-center gap-2 cursor-not-allowed">
                                            <Clock className="w-4 h-4" />
                                            Request Pending
                                        </button>
                                    ) : status === 'accepted' ? (
                                        <button disabled className="w-full py-2.5 bg-green-50 text-green-700 font-medium rounded-lg flex items-center justify-center gap-2 cursor-not-allowed">
                                            <Check className="w-4 h-4" />
                                            Connected
                                        </button>
                                    ) : status === 'rejected' ? (
                                        <button disabled className="w-full py-2.5 bg-red-50 text-red-700 font-medium rounded-lg flex items-center justify-center gap-2 cursor-not-allowed">
                                            Request Declined
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => sendRequest(doctor.id)}
                                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            Connect
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {filteredDoctors.length === 0 && !loading && (
                <div className="text-center py-12 text-slate-500">
                    No doctors found matching your search.
                </div>
            )}
        </div>
    );
};

export default DoctorSearch;
