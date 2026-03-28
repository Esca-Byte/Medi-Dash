import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, FileText, Calendar } from 'lucide-react';

const AddPatientModal = ({ isOpen, onClose, onAdd }) => {
    const [patientData, setPatientData] = useState({
        name: '',
        email: '',
        age: '',
        condition: '', // ... rest staying the same
        status: 'stable',
        heartRate: '80',
        bp: '120/80'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd({
            ...patientData,
            id: Date.now()
        });
        setPatientData({
            name: '', email: '', age: '', condition: '', status: 'stable', heartRate: '80', bp: '120/80'
        });
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full relative animate-fadeIn mx-4">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                        <UserPlus className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Add New Patient</h2>
                        <p className="text-sm text-gray-500">Admit a new patient to the dashboard</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700 uppercase mb-1">Full Name</label>
                            <input
                                type="text" required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                value={patientData.name}
                                onChange={e => setPatientData({ ...patientData, name: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700 uppercase mb-1">Email Address</label>
                            <input
                                type="email" required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                value={patientData.email}
                                onChange={e => setPatientData({ ...patientData, email: e.target.value })}
                                placeholder="patient@example.com"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 uppercase mb-1">Age</label>
                            <input
                                type="number" required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                value={patientData.age}
                                onChange={e => setPatientData({ ...patientData, age: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 uppercase mb-1">Status</label>
                            <select
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all bg-white"
                                value={patientData.status}
                                onChange={e => setPatientData({ ...patientData, status: e.target.value })}
                            >
                                <option value="stable">Stable</option>
                                <option value="warning">Warning</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 uppercase mb-1">Medical Condition</label>
                        <input
                            type="text" required
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                            value={patientData.condition}
                            onChange={e => setPatientData({ ...patientData, condition: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all mt-4"
                    >
                        Add Patient
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default AddPatientModal;
