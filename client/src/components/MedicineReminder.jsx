import React, { useEffect, useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { Bell } from 'lucide-react';
import API_URL from '../config';

const MedicineReminder = () => {
    const { addNotification } = useNotification();
    const [medicines, setMedicines] = useState([]);
    const [lastAlertTime, setLastAlertTime] = useState(null);

    useEffect(() => {
        // Request permission on mount
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }

        const fetchMeds = () => {
            fetch(`${API_URL}/api/medicines`)
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .then(data => {
                    setMedicines(data);
                })
                .catch(err => {
                    console.error("Reminder check failed:", err);
                });
        };

        fetchMeds();
        const pollInterval = setInterval(fetchMeds, 60000); // Update list every minute to catch new adds

        return () => clearInterval(pollInterval);
    }, []);

    useEffect(() => {
        const checkTime = () => {
            const now = new Date();
            // Format: "02:30 PM" - matching the format used in MedicineSchedule/DB
            const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

            // Avoid alerting multiple times in the same minute
            if (lastAlertTime === currentTime) return;

            medicines.forEach(med => {
                // If time matches and not already marked as taken for the day
                // Note: The simple schema doesn't track "taken for today", just "status". 
                // We assume 'upcoming' means not taken yet.
                if (med.time === currentTime && med.status !== 'taken') {
                    sendNotification(med);
                    setLastAlertTime(currentTime);
                }
            });
        };

        // Check every 10 seconds to ensure we hit the minute mark
        const checkInterval = setInterval(checkTime, 10000);
        return () => clearInterval(checkInterval);
    }, [medicines, lastAlertTime]);

    const sendNotification = (med) => {
        const title = `Time for ${med.name}`;
        const body = `Take ${med.dosage}. Scheduled for ${med.time}.`;

        // 0. Add to In-App History
        addNotification(title, body, 'warning');

        // 1. Browser Notification
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(title, { body, icon: '/vite.svg' });
        }

        // 2. Fallback Audio / Alert (optional, but good for visibility)
        try {
            // Simple beep using AudioContext or just console for now
            console.log(`[REMINDER] ${title} - ${body}`);
        } catch (e) {
            console.error(e);
        }
    };

    return null; // Invisible component
};

export default MedicineReminder;
