import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Pill, Clock, Check } from 'lucide-react';
import API_URL from '../config';

const PrescriptionModal = ({ isOpen, onClose, patientName }) => {
    const [medData, setMedData] = useState({ name: '', dosage: '', time: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Convert time 24h to 12h for consistent DB format
            const [hours, minutes] = medData.time.split(':');
            const date = new Date();
            date.setHours(hours);
            date.setMinutes(minutes);
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

            const payload = { ...medData, time: formattedTime };

            const res = await fetch(`${API_URL}/api/medicines`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert(`Prescription for ${medData.name} sent to ${patientName}!`);
                onClose();
                setMedData({ name: '', dosage: '', time: '' });
            } else {
                alert("Failed to send prescription.");
            }
        } catch (error) {
            console.error("Prescription error:", error);
            alert("Network error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full relative animate-fadeIn mx-4">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                        <Pill className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Prescribe Medication</h2>
                    <p className="text-sm text-gray-500">Add a new prescription for <span className="font-semibold text-gray-700">{patientName}</span></p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 uppercase mb-1">Medicine Name</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Amoxicillin"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                            value={medData.name}
                            onChange={(e) => setMedData({ ...medData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 uppercase mb-1">Dosage</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. 500mg"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                                value={medData.dosage}
                                onChange={(e) => setMedData({ ...medData, dosage: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 uppercase mb-1">Schedule Time</label>
                            <div className="relative">
                                <input
                                    type="time"
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                                    value={medData.time}
                                    onChange={(e) => setMedData({ ...medData, time: e.target.value })}
                                />
                                <Clock className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        {isSubmitting ? (
                            <span className="animate-pulse">Processing...</span>
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Confirm Prescription
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default PrescriptionModal;
