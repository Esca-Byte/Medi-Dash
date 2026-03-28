import React from 'react';
import { createPortal } from 'react-dom';
import { X, User, Activity, Heart, Calendar, Mail, Phone, AlertTriangle } from 'lucide-react';

const PatientDetailsModal = ({ isOpen, onClose, patient }) => {
    if (!isOpen || !patient) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'critical': return 'bg-red-100 text-red-700 border-red-200';
            case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'stable': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full relative animate-fadeIn overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="p-4 bg-blue-100 rounded-full text-blue-600 h-16 w-16 flex items-center justify-center">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(patient.status)} capitalize`}>
                                    {patient.status}
                                </span>
                                <span className="text-sm text-gray-500">• ID: #{patient.id}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8">
                    {/* Vitals Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-2 mb-2 text-blue-600">
                                <Activity className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Heart Rate</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{patient.heartRate} <span className="text-sm text-gray-500 font-normal">bpm</span></p>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                            <div className="flex items-center gap-2 mb-2 text-indigo-600">
                                <Activity className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Blood Pressure</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{patient.bp} <span className="text-sm text-gray-500 font-normal">mmHg</span></p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                            <div className="flex items-center gap-2 mb-2 text-purple-600">
                                <Heart className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Condition</span>
                            </div>
                            <p className="text-lg font-semibold text-gray-900 truncate" title={patient.condition}>{patient.condition}</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                            <div className="flex items-center gap-2 mb-2 text-orange-600">
                                <Calendar className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Age</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{patient.age} <span className="text-sm text-gray-500 font-normal">yrs</span></p>
                        </div>
                    </div>

                    {/* Personal Info */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Personal Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Email Address</p>
                                    <p className="font-medium text-gray-900">{patient.email || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Phone Number</p>
                                    <p className="font-medium text-gray-900">{patient.phone || '+1 (555) 000-0000'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Date of Birth</p>
                                    <p className="font-medium text-gray-900">Jan 1, 1980</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Allergies</p>
                                    <p className="font-medium text-gray-900">{patient.allergies || 'None'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PatientDetailsModal;
