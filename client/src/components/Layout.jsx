import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MedicineReminder from './MedicineReminder';

const Layout = ({ children, role, onLogout, userId }) => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex">
            <Sidebar role={role} onLogout={onLogout} userId={userId} />
            <div className="flex-1 flex flex-col">
                <Header role={role} userId={userId} />
                <main className="flex-1 p-8 ml-64 overflow-y-auto">
                    {children}
                </main>
                <MedicineReminder />
            </div>
        </div>
    );
};

export default Layout;
