import React, { useState, useEffect } from 'react';
import API_URL from '../config';
import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, CheckCircle, Activity, MessageSquare, Phone, Plus, Stethoscope } from 'lucide-react';
import PrescriptionModal from './PrescriptionModal';
import AddPatientModal from './AddPatientModal';
import PatientDetailsModal from './PatientDetailsModal';

const DoctorDashboard = ({ userId }) => {
    const navigate = useNavigate();
    // ... (existing state)
    const [patients, setPatients] = useState([]);

    useEffect(() => {
        if (userId) {
            fetchPatients();
        }
    }, [userId]);

    const fetchPatients = async () => {
        try {
            const res = await fetch(`${API_URL}/api/patients?doctorId=${userId}`);
            const data = await res.json();
            setPatients(data);
        } catch (error) {
            console.error("Error fetching patients:", error);
        }
    };

    const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
    const [addPatientModalOpen, setAddPatientModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null); // For prescription
    const [viewPatient, setViewPatient] = useState(null); // For details view

    const handlePrescribe = (e, patient) => {
        e.stopPropagation(); // Prevent row click
        setSelectedPatient(patient);
        setPrescriptionModalOpen(true);
    };

    const handleRowClick = (patient) => {
        setViewPatient(patient);
        setDetailsModalOpen(true);
    };

    const getStatusColor = (status) => {
        // ... (existing status color logic)
        switch (status) {
            case 'critical': return 'bg-red-100 text-red-700 border-red-200';
            case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'stable': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handleAddPatient = async (newPatient) => {
        // ... (existing add patient logic)
        if (!userId) {
            alert("Session invalid. Please Log Out and Log In again.");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/patients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newPatient, doctorId: userId })
            });
            const data = await res.json();
            if (data.success) {
                fetchPatients(); // Refresh list
                alert(`Patient added! \nUsername: ${data.user.username}\nPassword: ${data.user.password}`);
            }
        } catch (error) {
            console.error("Error adding patient:", error);
        }
    };

    const [requests, setRequests] = useState([]);

    useEffect(() => {
        if (userId) {
            fetchPatients();
            fetchRequests();
        }
    }, [userId]);

    const fetchRequests = async () => {
        try {
            const res = await fetch(`${API_URL}/api/requests?userId=${userId}&role=doctor`);
            const data = await res.json();
            setRequests(data);
        } catch (err) {
            console.error("Failed to fetch requests", err);
        }
    };

    const handleRequest = async (requestId, status) => {
        try {
            const res = await fetch(`${API_URL}/api/requests/${requestId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                fetchRequests();
                if (status === 'accepted') {
                    fetchPatients();
                }
            }
        } catch (err) {
            console.error("Failed to update request", err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Doctor Dashboard</h2>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">Monitoring {patients.length} active patients</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setAddPatientModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Patient
                    </button>
                </div>
            </div>

            {/* Requests Section */}
            {requests.length > 0 && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-orange-100 dark:border-orange-900/30 bg-orange-50/30 dark:bg-orange-900/10">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        Pending Patient Requests
                    </h2>
                    <div className="grid gap-4">
                        {requests.map(req => (
                            <div key={req.id} className="bg-white dark:bg-slate-700 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30 flex items-center justify-between shadow-sm">
                                <div>
                                    <h3 className="font-semibold text-gray-800 dark:text-white">{req.patientName}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{req.patientAge} years • {req.patientCondition}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleRequest(req.id, 'rejected')}
                                        className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                                    >
                                        Decline
                                    </button>
                                    <button
                                        onClick={() => handleRequest(req.id, 'accepted')}
                                        className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium shadow-lg shadow-blue-200"
                                    >
                                        Accept
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {/* Stats Cards ... (Keep existing) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* ... (Keep existing stats cards) ... */}
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-100 dark:border-red-900/30">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Critical Alerts</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{patients.filter(p => p.status === 'critical').length}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Heart Rate</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">86 bpm</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-100 dark:border-green-900/30">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg text-green-600 dark:text-green-400">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Stable Patients</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{patients.filter(p => p.status === 'stable').length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-gray-800 dark:text-white">Patient Status Overview</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm border-b border-gray-200 dark:border-slate-600">
                            <tr>
                                <th className="px-6 py-4 font-medium">Patient Name</th>
                                <th className="px-6 py-4 font-medium">Condition</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Latest Vitals</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {patients.map((patient) => (
                                <tr
                                    key={patient.id}
                                    className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                                    onClick={() => handleRowClick(patient)}
                                >
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-white">{patient.name}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{patient.age} yrs • Male</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{patient.condition}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(patient.status)} capitalize`}>
                                            {patient.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                                            <span className="flex items-center gap-1"><Activity className="w-4 h-4 text-blue-500" /> {patient.heartRate}</span>
                                            <span className="flex items-center gap-1"><Activity className="w-4 h-4 text-red-500" /> {patient.bp}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={(e) => handlePrescribe(e, patient)}
                                                className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors tooltip"
                                                title="Prescribe Medication"
                                            >
                                                <Stethoscope className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/chat?partnerId=${patient.id}&partnerName=${encodeURIComponent(patient.name)}`);
                                                }}
                                                className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                                                title="Chat with Patient"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/chat?partnerId=${patient.id}&partnerName=${encodeURIComponent(patient.name)}`);
                                                }}
                                                className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-all"
                                                title="Contact Patient"
                                            >
                                                <Phone className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <PrescriptionModal
                isOpen={prescriptionModalOpen}
                onClose={() => setPrescriptionModalOpen(false)}
                patientName={selectedPatient?.name}
            />
            <AddPatientModal
                isOpen={addPatientModalOpen}
                onClose={() => setAddPatientModalOpen(false)}
                onAdd={handleAddPatient}
            />
            <PatientDetailsModal
                isOpen={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                patient={viewPatient}
            />
        </div>
    );
};
export default DoctorDashboard;
