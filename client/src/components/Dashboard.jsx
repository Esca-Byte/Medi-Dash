import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import API_URL from '../config';

import MetricCard from './MetricCard';
import MedicineSchedule from './MedicineSchedule';
import Appointments from './Appointments';
import { Activity, Heart, Thermometer, Droplet, FileDown, UserPlus } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const Dashboard = ({ userId }) => {
    const navigate = useNavigate();
    const { addNotification } = useNotification();
    const [vitals, setVitals] = useState(null);
    const lastAlertTime = useRef(0); // Throttle alerts
    const [history, setHistory] = useState({
        timestamps: [],
        heartRate: [],
        glucose: [],
        systolic: [],
        diastolic: []
    });

    const [error, setError] = useState(null);
    const [userProfile, setUserProfile] = useState(null);

    // Fetch user profile for PDF and display
    useEffect(() => {
        if (userId) {
            fetch(`${API_URL}/api/users/${userId}`)
                .then(res => res.json())
                .then(data => setUserProfile(data))
                .catch(err => console.error('Failed to fetch user profile', err));
        }
    }, [userId]);

    // Determine status based on thresholds
    const getStatus = (val, min, max) => {
        if (val < min || val > max) return 'critical';
        if (val < min + 5 || val > max - 5) return 'warning';
        return 'normal';
    };

    useEffect(() => {
        const fetchVitals = async () => {
            try {
                const res = await fetch(`${API_URL}/api/vitals`);
                if (!res.ok) throw new Error('Failed to connect to server');
                const data = await res.json();

                setVitals(data);
                setError(null);

                // Check for Critical Vitals (Throttle: 60s)
                const now = Date.now();
                if (now - lastAlertTime.current > 60000) {
                    const hrStatus = getStatus(data.heartRate, 60, 100);
                    const bpStatus = getStatus(data.bloodPressure.systolic, 90, 140);

                    if (hrStatus === 'critical') {
                        addNotification('Abnormal Heart Rate', `Heart Rate is ${data.heartRate} BPM. Please check immediately.`, 'warning');
                        lastAlertTime.current = now;
                    } else if (bpStatus === 'critical') {
                        addNotification('High Blood Pressure', `Systolic BP is ${data.bloodPressure.systolic} mmHg.`, 'warning');
                        lastAlertTime.current = now;
                    }
                }

                // Update history for charts
                setHistory(prev => {
                    const newLabels = [...prev.timestamps, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })].slice(-10); // keep last 10
                    const newHeartRate = [...prev.heartRate, data.heartRate].slice(-10);
                    const newGlucose = [...prev.glucose, data.glucose].slice(-10);
                    const newSystolic = [...prev.systolic, data.bloodPressure.systolic].slice(-10);
                    const newDiastolic = [...prev.diastolic, data.bloodPressure.diastolic].slice(-10);

                    return {
                        timestamps: newLabels,
                        heartRate: newHeartRate,
                        glucose: newGlucose,
                        systolic: newSystolic,
                        diastolic: newDiastolic
                    };
                });

            } catch (err) {
                console.error("Failed to fetch vitals", err);
                setError("Unable to connect to health monitor system. Please verify backend server is running.");
            }
        };

        fetchVitals(); // Initial fetch
        const interval = setInterval(fetchVitals, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [addNotification]); // Added addNotification to dependencies

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-red-500 gap-4">
                <Activity className="w-12 h-12" />
                <p className="font-medium">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    if (!vitals) {
        return <div className="flex items-center justify-center h-full text-gray-400">Loading Vital Signs...</div>;
    }

    const hrChartData = {
        labels: history.timestamps,
        datasets: [
            {
                label: 'Heart Rate (BPM)',
                data: history.heartRate,
                fill: true,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: 'rgb(59, 130, 246)',
                tension: 0.4,
            },
        ],
    };

    const bpChartData = {
        labels: history.timestamps,
        datasets: [
            {
                label: 'Systolic',
                data: history.systolic,
                backgroundColor: 'rgba(239, 68, 68, 0.5)',
                borderColor: 'rgb(239, 68, 68)',
            },
            {
                label: 'Diastolic',
                data: history.diastolic,
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
            }
        ]
    };

    const glucoseChartData = {
        labels: history.timestamps,
        datasets: [
            {
                label: 'Glucose (mg/dL)',
                data: history.glucose,
                fill: true,
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                borderColor: 'rgb(234, 179, 8)',
                tension: 0.4,
            },
        ],
    };

    const generatePDF = async () => {
        try {
            console.log("Starting PDF generation...");
            const doc = new jsPDF();

            // 1. Fetch Data
            let medicinesList = [];
            try {
                const res = await fetch(`${API_URL}/api/vitals`);
                if (!res.ok) throw new Error("Failed to fetch medicines");
                medicinesList = await res.json();
            } catch (e) {
                console.warn("Using empty medicine list due to fetch error:", e);
            }

            // 2. Report Header
            doc.setFontSize(24);
            doc.setTextColor(33, 150, 243); // Blue
            doc.text("Medical Health Report", 105, 20, { align: 'center' });

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });

            doc.setDrawColor(200);
            doc.line(15, 35, 195, 35);

            // 3. Patient Details Section
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("Patient Details", 15, 45);

            doc.setFontSize(11);
            doc.setTextColor(60);
            // In a real app, these would come from props or context
            doc.text(`Name: ${userProfile?.name || 'Patient'}`, 20, 55);
            doc.text(`Age: ${userProfile?.age || 'N/A'} | ID: #P-${userId || '000000'}`, 20, 62);
            doc.text(`Email: ${userProfile?.email || 'N/A'}`, 120, 55);
            doc.text(`Blood Type: O+`, 120, 62);

            // 4. Vitals Section
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("Current Vital Signs", 15, 75);

            const vitalsData = [
                ["Heart Rate", `${vitals.heartRate} bpm`, getStatus(vitals.heartRate, 60, 100).toUpperCase()],
                ["Blood Pressure", `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg`, getStatus(vitals.bloodPressure.systolic, 90, 140).toUpperCase()],
                ["Glucose", `${vitals.glucose} mg/dL`, getStatus(vitals.glucose, 70, 140).toUpperCase()],
                ["Temperature", `${vitals.temperature} °F`, getStatus(vitals.temperature, 97, 99).toUpperCase()]
            ];

            autoTable(doc, {
                startY: 80,
                head: [['Metric', 'Value', 'Status']],
                body: vitalsData,
                theme: 'grid',
                headStyles: { fillColor: [66, 66, 66], textColor: 255 },
                styles: { fontSize: 10, cellPadding: 3 },
            });

            // 5. Medicines Section
            let lastY = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(14);
            doc.text("Prescribed Medicines", 15, lastY);

            const medRows = medicinesList.length > 0
                ? medicinesList.map(m => [m.name, m.dosage, m.time, (m.status || 'Active').toUpperCase()])
                : [['No medicines found', '-', '-', '-']];

            autoTable(doc, {
                startY: lastY + 5,
                head: [['Medicine Name', 'Dosage', 'Schedule Time', 'Status']],
                body: medRows,
                theme: 'striped',
                headStyles: { fillColor: [33, 150, 243], textColor: 255 },
                styles: { fontSize: 10 },
            });

            // 6. Recent History Table
            lastY = doc.lastAutoTable.finalY + 15;
            // Check if we need a new page
            if (lastY > 250) {
                doc.addPage();
                lastY = 20;
            }

            doc.setFontSize(14);
            doc.text("Recent Activity Log", 15, lastY);

            const historyRows = history.timestamps.map((t, i) => [
                t,
                `${history.heartRate[i] || '-'} bpm`,
                `${history.glucose[i] || '-'} mg/dL`,
                `${history.systolic[i] || '-'}/${history.diastolic[i] || '-'} mmHg`
            ]).reverse();

            autoTable(doc, {
                startY: lastY + 5,
                head: [['Timestamp', 'Heart Rate', 'Glucose', 'Blood Pressure']],
                body: historyRows,
                theme: 'plain',
                styles: { fontSize: 9 },
                headStyles: { fillColor: [220, 220, 220], textColor: 50 }
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Page ${i} of ${pageCount}`, 195, 290, { align: 'right' });
                doc.text("Confidential Medical Report - Health Dashboard", 105, 290, { align: 'center' });
            }

            const patientName = (userProfile?.name || 'Patient').replace(/\s+/g, '_');
            doc.save(`Patient_Report_${patientName}_${new Date().toISOString().slice(0, 10)}.pdf`);
            console.log("PDF download triggered.");
        } catch (error) {
            console.error("PDF Export Critical Failure:", error);
            alert("Unexpected error generating PDF. Check console for details: " + error.message);
        }
    };

    const commonOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        maintainAspectRatio: false,
        scales: {
            x: { display: false }
        },
        animation: {
            duration: 0 // Disable animation for real-time feel if desired, or keep it
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Patient Vitals Overview</h2>
                    <span className="text-xs text-gray-400">Last updated: {new Date(vitals.timestamp).toLocaleTimeString()}</span>
                </div>
                <button
                    onClick={() => navigate('/find-doctors')}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium shadow-sm mr-3"
                >
                    <UserPlus className="w-4 h-4" />
                    Find Doctors
                </button>
                <button
                    onClick={generatePDF}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shadow-sm"
                >
                    <FileDown className="w-4 h-4" />
                    Export Report
                </button>
            </div>

            {/* Summary Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Heart Rate"
                    value={vitals.heartRate}
                    unit="bpm"
                    icon={Heart}
                    color="red"
                    trend={vitals.heartRate > 80 ? 'up' : 'down'}
                    status={getStatus(vitals.heartRate, 60, 100)}
                />
                <MetricCard
                    title="Blood Pressure"
                    value={`${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}`}
                    unit="mmHg"
                    icon={Activity}
                    color="blue"
                    trend="normal"
                    status={getStatus(vitals.bloodPressure.systolic, 90, 140)}
                />
                <MetricCard
                    title="Glucose Level"
                    value={vitals.glucose}
                    unit="mg/dL"
                    icon={Droplet}
                    color="yellow"
                    trend="up"
                    status={getStatus(vitals.glucose, 70, 140)}
                />
                <MetricCard
                    title="Body Temp"
                    value={vitals.temperature}
                    unit="°F"
                    icon={Thermometer}
                    color="green"
                    trend="normal"
                    status={getStatus(vitals.temperature, 97, 99)}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4">Heart Rate History</h3>
                    <div className="h-64">
                        <Line data={hrChartData} options={commonOptions} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4">Blood Pressure Trends</h3>
                    <div className="h-64">
                        <Bar data={bpChartData} options={commonOptions} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 lg:col-span-1">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4">Glucose Levels</h3>
                    <div className="h-64">
                        <Line data={glucoseChartData} options={commonOptions} />
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <MedicineSchedule />
                </div>

                <div className="lg:col-span-1">
                    <Appointments />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
