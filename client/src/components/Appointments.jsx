import React from 'react';
import { Calendar, Video, MapPin, Clock } from 'lucide-react';

const Appointments = () => {
    const appointments = [
        { id: 1, doctor: "Dr. Emily Stone", specialty: "Cardiologist", date: "Today", time: "10:30 AM", type: "video" },
        { id: 2, doctor: "Dr. Mark Wilson", specialty: "General Checkup", date: "Tomorrow", time: "02:00 PM", type: "in-person", location: "City Hospital, Room 304" },
        { id: 3, doctor: "Dr. Sarah Lee", specialty: "Endocrinologist", date: "Dec 24, 2025", time: "11:15 AM", type: "video" },
    ];

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 h-full">
            <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                Upcoming Appointments
            </h3>

            <div className="space-y-4">
                {appointments.map(apt => (
                    <div key={apt.id} className="p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600 hover:border-indigo-100 dark:hover:border-indigo-900 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-semibold text-gray-800 dark:text-white">{apt.doctor}</h4>
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{apt.specialty}</p>
                            </div>
                            {apt.type === 'video' ? (
                                <span className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md">
                                    <Video className="w-4 h-4" />
                                </span>
                            ) : (
                                <span className="p-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-md">
                                    <MapPin className="w-4 h-4" />
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-3">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> {apt.date}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> {apt.time}
                            </span>
                        </div>

                        {apt.type === 'video' && (
                            <button className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                                <Video className="w-3 h-3" />
                                Join Call
                            </button>
                        )}
                        {apt.type === 'in-person' && (
                            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {apt.location}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Appointments;
