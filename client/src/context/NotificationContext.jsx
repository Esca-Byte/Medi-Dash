import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([
        // Initial sample notification
        {
            id: Date.now(),
            title: 'Welcome',
            message: 'Notification system active.',
            type: 'info',
            timestamp: new Date(),
            read: false
        }
    ]);

    const addNotification = useCallback((title, message, type = 'info') => {
        setNotifications(prev => [
            {
                id: Date.now(),
                title,
                message,
                type, // 'info', 'warning', 'success', 'error'
                timestamp: new Date(),
                read: false
            },
            ...prev
        ]);
    }, []);

    const markAsRead = useCallback((id) => {
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            addNotification,
            markAsRead,
            markAllAsRead,
            clearNotifications,
            unreadCount
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
