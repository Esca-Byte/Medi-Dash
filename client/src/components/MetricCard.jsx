import React from 'react';
import { ArrowUp, ArrowDown, Activity } from 'lucide-react';

const MetricCard = ({ title, value, unit, trend, status, icon: Icon, color }) => {
    const getStatusColor = (s) => {
        switch (s) {
            case 'normal': return 'text-gray-500';
            case 'warning': return 'text-yellow-500';
            case 'critical': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    const getBgColor = (c) => {
        switch (c) {
            case 'blue': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
            case 'red': return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400';
            case 'green': return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400';
            case 'yellow': return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400';
            default: return 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-400';
        }
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                        {value} <span className="text-sm font-normal text-gray-400">{unit}</span>
                    </h3>
                </div>
                <div className={`p-3 rounded-lg ${getBgColor(color)}`}>
                    {Icon ? <Icon className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                </div>
            </div>

            <div className="flex items-center text-sm">
                {trend === 'up' && (
                    <div className="flex items-center text-green-500 font-medium bg-green-50 px-2 py-0.5 rounded-full mr-2">
                        <ArrowUp className="w-3 h-3 mr-1" />
                        <span>2.5%</span>
                    </div>
                )}
                {trend === 'down' && (
                    <div className="flex items-center text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded-full mr-2">
                        <ArrowDown className="w-3 h-3 mr-1" />
                        <span>1.2%</span>
                    </div>
                )}
                <span className={`${getStatusColor(status)}`}>
                    {status === 'normal' ? 'Normal' : status === 'warning' ? 'Check Required' : 'Critical'}
                </span>
            </div>
        </div>
    );
};

export default MetricCard;
