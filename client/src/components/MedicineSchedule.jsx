import React, { useState, useEffect } from 'react';
import { Pill, CheckCircle, Clock, AlertCircle, Plus, Trash2, X, Camera } from 'lucide-react';
import MedicineScannerModal from './MedicineScannerModal';
import API_URL from '../config';

const MedicineSchedule = () => {
    const [medicines, setMedicines] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [newMed, setNewMed] = useState({ name: '', dosage: '', time: '' });

    useEffect(() => {
        fetchMedicines();
    }, [medicines]); // Re-run check if medicines update

    const fetchMedicines = () => {
        fetch(`${API_URL}/api/medicines`)
            .then(res => res.json())
            .then(data => setMedicines(data))
            .catch(err => console.error("Error loading medicines:", err));
    };



    const handleAddMedicine = async (e) => {
        e.preventDefault();
        try {
            // Convert 24h time input to 12h format for consistency with mock data
            const [hours, minutes] = newMed.time.split(':');
            const date = new Date();
            date.setHours(hours);
            date.setMinutes(minutes);
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

            const payload = { ...newMed, time: formattedTime };

            const res = await fetch(`${API_URL}/api/medicines`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                fetchMedicines();
                setShowAddForm(false);
                setNewMed({ name: '', dosage: '', time: '' });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'taken' ? 'upcoming' : 'taken';
        try {
            await fetch(`${API_URL}/api/medicines/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            fetchMedicines();
        } catch (err) {
            console.error(err);
        }
    };

    const deleteMedicine = async (id) => {
        if (!confirm('Delete this medicine?')) return;
        try {
            await fetch(`${API_URL}/api/medicines/${id}`, { method: 'DELETE' });
            fetchMedicines();
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'taken': return 'text-green-500 bg-green-50 border-green-200';
            case 'due': return 'text-red-500 bg-red-50 border-red-200 animate-pulse';
            default: return 'text-blue-500 bg-blue-50 border-blue-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'taken': return <CheckCircle className="w-5 h-5" />;
            case 'due': return <AlertCircle className="w-5 h-5" />;
            default: return <Clock className="w-5 h-5" />;
        }
    };

    const handleScanComplete = async (detectedList) => {
        if (!detectedList || detectedList.length === 0) return;

        // Process all items
        // We'll add them one by one. In a real app, use a bulk insert endpoint.
        let addedCount = 0;
        for (const med of detectedList) {
            try {
                const payload = {
                    name: med.name,
                    dosage: med.dosage,
                    time: med.time // Scanner now provides formatted "09:00 AM" directly
                };

                await fetch(`${API_URL}/api/medicines`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                addedCount++;
            } catch (err) {
                console.error("Failed to add scanned medicine:", med.name, err);
            }
        }

        if (addedCount > 0) {
            fetchMedicines();
            alert(`Successfully added ${addedCount} medicines to your schedule.`);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Pill className="w-5 h-5 text-indigo-500" />
                    Daily Medications
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowScanner(true)}
                        className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        title="Scan Prescription"
                    >
                        <Camera className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                        title="Add Medicine"
                    >
                        {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <MedicineScannerModal
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
                onScanComplete={handleScanComplete}
            />

            {showAddForm && (
                <form onSubmit={handleAddMedicine} className="mb-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-100 dark:border-slate-600 space-y-3">
                    <input
                        type="text" placeholder="Medicine Name" required
                        className="w-full px-3 py-2 text-sm border dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
                        value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })}
                    />
                    <div className="flex gap-2">
                        <input
                            type="text" placeholder="Dosage" required
                            className="w-full px-3 py-2 text-sm border dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
                            value={newMed.dosage} onChange={e => setNewMed({ ...newMed, dosage: e.target.value })}
                        />
                        <input
                            type="time" required
                            className="w-full px-3 py-2 text-sm border dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
                            value={newMed.time} onChange={e => setNewMed({ ...newMed, time: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors">
                        Add Medicine
                    </button>
                </form>
            )}

            <div className="space-y-4 flex-1 overflow-y-auto">
                {medicines.map(med => (
                    <div key={med.id} className={`flex items-center justify-between p-4 rounded-lg border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 transition-colors ${med.status === 'due' ? 'bg-red-50/50 dark:bg-red-900/10' : 'bg-gray-50 dark:bg-slate-700/50'}`}>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => toggleStatus(med.id, med.status)}
                                className={`p-2 rounded-full transition-colors ${med.status === 'taken' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-200 text-gray-400 dark:bg-slate-600 dark:text-gray-300 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400'}`}
                            >
                                <CheckCircle className="w-5 h-5" />
                            </button>
                            <div>
                                <h4 className={`font-semibold text-gray-800 dark:text-white ${med.status === 'taken' ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>{med.name} <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">({med.dosage})</span></h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{med.time}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(med.status)} dark:bg-opacity-20`}>
                                {getStatusIcon(med.status)}
                                <span className="capitalize">{med.status}</span>
                            </div>
                            <button
                                onClick={() => deleteMedicine(med.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MedicineSchedule;
