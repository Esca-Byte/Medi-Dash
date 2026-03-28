import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API_URL from '../config';
import io from 'socket.io-client';
import {
    MessageSquare, Send, ArrowLeft, Search, Circle, CheckCheck,
    User, Clock, Smile, ChevronLeft
} from 'lucide-react';

const socket = io(API_URL);

const ChatPanel = ({ userId, role }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // State
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null); // { partnerId, partnerName, partnerRole }
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [typingUser, setTypingUser] = useState(null);
    const [contactList, setContactList] = useState([]);
    const [loading, setLoading] = useState(true);

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const inputRef = useRef(null);
    const activeChatRef = useRef(null);

    // Keep ref in sync with state
    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Join chat room on mount
    useEffect(() => {
        if (userId) {
            socket.emit('join-chat', userId);
        }

        return () => {
            socket.off('new-message');
            socket.off('user-typing');
            socket.off('user-stop-typing');
        };
    }, [userId]);

    // Listen for new messages
    useEffect(() => {
        const handleNewMessage = (msg) => {
            const chat = activeChatRef.current;
            // If this message belongs to the active conversation, add it
            if (chat && (msg.senderId === chat.partnerId || msg.receiverId === chat.partnerId)) {
                setMessages(prev => {
                    // Prevent duplicates — check by text+sender for optimistic msgs
                    const isDupe = prev.some(m =>
                        m.id === msg.id ||
                        (m.senderId === msg.senderId && m.text === msg.text && Math.abs(new Date(m.timestamp) - new Date(msg.timestamp)) < 5000)
                    );
                    if (isDupe) return prev;
                    return [...prev, msg];
                });
                // Auto mark as read if we're viewing this conversation
                if (msg.senderId === chat.partnerId) {
                    markAsRead(chat.partnerId);
                }
            }
            // Refresh conversation list
            fetchConversations();
        };

        socket.on('new-message', handleNewMessage);
        return () => socket.off('new-message', handleNewMessage);
    }, [userId]);

    // Typing indicators
    useEffect(() => {
        const handleTyping = (data) => {
            const chat = activeChatRef.current;
            if (chat && data.senderId === chat.partnerId) {
                setTypingUser(data.senderName);
            }
        };
        const handleStopTyping = (data) => {
            const chat = activeChatRef.current;
            if (chat && data.senderId === chat.partnerId) {
                setTypingUser(null);
            }
        };

        socket.on('user-typing', handleTyping);
        socket.on('user-stop-typing', handleStopTyping);

        return () => {
            socket.off('user-typing', handleTyping);
            socket.off('user-stop-typing', handleStopTyping);
        };
    }, []);

    // Fetch conversations
    const fetchConversations = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/conversations?userId=${userId}`);
            const data = await res.json();
            setConversations(data);
        } catch (err) {
            console.error('Failed to fetch conversations', err);
        }
    }, [userId]);

    // Fetch contact list (doctors for patients, patients for doctors)
    const fetchContacts = useCallback(async () => {
        try {
            if (role === 'patient') {
                const res = await fetch(`${API_URL}/api/doctors`);
                const data = await res.json();
                setContactList(data);
            } else {
                const res = await fetch(`${API_URL}/api/patients?doctorId=${userId}`);
                const data = await res.json();
                setContactList(data);
            }
        } catch (err) {
            console.error('Failed to fetch contacts', err);
        }
    }, [userId, role]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchConversations(), fetchContacts()]);
            setLoading(false);
        };
        if (userId) init();
    }, [userId, fetchConversations, fetchContacts]);

    // Handle incoming partnerId from URL query param
    useEffect(() => {
        const partnerId = searchParams.get('partnerId');
        const partnerName = searchParams.get('partnerName');
        if (partnerId && partnerName) {
            openChat(parseInt(partnerId), partnerName, role === 'patient' ? 'doctor' : 'patient');
        }
    }, [searchParams]);

    // Fetch messages for a conversation
    const fetchMessages = async (partnerId) => {
        try {
            const res = await fetch(`${API_URL}/api/messages?userId=${userId}&partnerId=${partnerId}`);
            const data = await res.json();
            setMessages(data);
        } catch (err) {
            console.error('Failed to fetch messages', err);
        }
    };

    // Mark messages as read
    const markAsRead = async (partnerId) => {
        try {
            await fetch(`${API_URL}/api/messages/read`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, partnerId })
            });
            fetchConversations();
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    };

    // Open a chat with a specific partner
    const openChat = (partnerId, partnerName, partnerRole) => {
        setActiveChat({ partnerId, partnerName, partnerRole });
        fetchMessages(partnerId);
        markAsRead(partnerId);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    // Send message
    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        const userName = localStorage.getItem('auth')
            ? JSON.parse(localStorage.getItem('auth')).name || 'User'
            : 'User';

        const tempId = Date.now();
        const messageText = newMessage.trim();

        // Optimistically add to UI immediately
        const optimisticMsg = {
            id: tempId,
            senderId: userId,
            receiverId: activeChat.partnerId,
            text: messageText,
            timestamp: new Date().toISOString(),
            read: false
        };
        setMessages(prev => [...prev, optimisticMsg]);

        // Emit via socket for real-time delivery & persistence
        socket.emit('chat-message', {
            senderId: userId,
            receiverId: activeChat.partnerId,
            text: messageText,
            senderName: userName
        });

        // Stop typing indicator
        socket.emit('stop-typing', { senderId: userId, receiverId: activeChat.partnerId });

        setNewMessage('');
    };

    // Handle typing indicator
    const handleTypingInput = (e) => {
        setNewMessage(e.target.value);

        if (!activeChat) return;

        const userName = localStorage.getItem('auth')
            ? JSON.parse(localStorage.getItem('auth')).name || 'User'
            : 'User';

        socket.emit('typing', {
            senderId: userId,
            receiverId: activeChat.partnerId,
            senderName: userName
        });

        // Clear previous timeout
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stop-typing', { senderId: userId, receiverId: activeChat.partnerId });
        }, 2000);
    };

    // Format timestamp
    const formatTime = (ts) => {
        const date = new Date(ts);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    // Merge conversations with contacts for the sidebar
    const allContacts = (() => {
        const conversationPartnerIds = new Set(conversations.map(c => c.partnerId));
        const newContacts = contactList
            .filter(c => !conversationPartnerIds.has(c.id))
            .filter(c => c.id !== userId)
            .map(c => ({
                partnerId: c.id,
                partnerName: c.name,
                partnerRole: c.role || (role === 'patient' ? 'doctor' : 'patient'),
                lastMessage: '',
                lastTimestamp: '',
                unreadCount: 0,
                isNew: true
            }));

        return [...conversations, ...newContacts];
    })();

    // Filter by search
    const filteredContacts = allContacts.filter(c =>
        c.partnerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get initials
    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    // Get avatar color based on role
    const getAvatarColor = (partnerRole) => {
        return partnerRole === 'doctor'
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
            : 'bg-gradient-to-br from-emerald-500 to-teal-600';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Loading conversations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            {/* ===== LEFT SIDEBAR: Conversations List ===== */}
            <div className={`${activeChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r border-gray-100 dark:border-slate-700`}>
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Messages</h2>
                        </div>
                        {conversations.reduce((acc, c) => acc + c.unreadCount, 0) > 0 && (
                            <span className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                                {conversations.reduce((acc, c) => acc + c.unreadCount, 0)}
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={role === 'patient' ? 'Search doctors...' : 'Search patients...'}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredContacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 p-8">
                            <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
                            <p className="text-sm font-medium">No conversations yet</p>
                            <p className="text-xs mt-1">
                                {role === 'patient' ? 'Connect with a doctor to start chatting' : 'Your patients will appear here'}
                            </p>
                        </div>
                    ) : (
                        filteredContacts.map((conv) => (
                            <button
                                key={conv.partnerId}
                                onClick={() => openChat(conv.partnerId, conv.partnerName, conv.partnerRole)}
                                className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all duration-200 border-b border-gray-50 dark:border-slate-700/50
                                    ${activeChat?.partnerId === conv.partnerId ? 'bg-blue-50/70 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}
                                    ${conv.unreadCount > 0 ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                            >
                                <div className={`relative w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${getAvatarColor(conv.partnerRole)}`}>
                                    {getInitials(conv.partnerName)}
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex justify-between items-center">
                                        <h4 className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-200'}`}>
                                            {conv.partnerName}
                                        </h4>
                                        {conv.lastTimestamp && (
                                            <span className={`text-xs flex-shrink-0 ml-2 ${conv.unreadCount > 0 ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-400'}`}>
                                                {formatTime(conv.lastTimestamp)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center mt-0.5">
                                        <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                                            {conv.lastMessage || (conv.isNew ? `Tap to start a conversation` : 'No messages')}
                                        </p>
                                        {conv.unreadCount > 0 && (
                                            <span className="ml-2 min-w-[20px] h-5 flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold rounded-full px-1.5">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* ===== RIGHT: Chat Area ===== */}
            <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-col flex-1`}>
                {activeChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                            <button
                                onClick={() => setActiveChat(null)}
                                className="md:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </button>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(activeChat.partnerRole)}`}>
                                {getInitials(activeChat.partnerName)}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800 dark:text-white text-sm">{activeChat.partnerName}</h3>
                                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <Circle className="w-2 h-2 fill-current" /> Online
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize
                                ${activeChat.partnerRole === 'doctor'
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
                                {activeChat.partnerRole}
                            </span>
                        </div>

                        {/* Messages Body */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-slate-900/30"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)',
                                backgroundSize: '24px 24px'
                            }}
                        >
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                                        <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                    </div>
                                    <p className="text-sm font-medium">No messages yet</p>
                                    <p className="text-xs text-gray-400">Send a message to start the conversation</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMine = msg.senderId === userId;
                                    const showAvatar = idx === 0 || messages[idx - 1].senderId !== msg.senderId;

                                    return (
                                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-3' : 'mt-0.5'}`}>
                                            {!isMine && showAvatar && (
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-auto ${getAvatarColor(activeChat.partnerRole)}`}>
                                                    {getInitials(activeChat.partnerName)}
                                                </div>
                                            )}
                                            {!isMine && !showAvatar && <div className="w-8 mr-2 flex-shrink-0" />}
                                            <div className={`max-w-[70%] group`}>
                                                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words
                                                    ${isMine
                                                        ? 'bg-blue-600 text-white rounded-br-md'
                                                        : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 rounded-bl-md shadow-sm border border-gray-100 dark:border-slate-600'
                                                    }`}>
                                                    {msg.text}
                                                </div>
                                                <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                                                    <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {formatTime(msg.timestamp)}
                                                    </span>
                                                    {isMine && (
                                                        <CheckCheck className={`w-3 h-3 ${msg.read ? 'text-blue-500' : 'text-gray-400'}`} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                            {/* Typing Indicator */}
                            {typingUser && (
                                <div className="flex items-center gap-2 text-gray-400 text-xs pl-10">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                    <span>{typingUser} is typing...</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="flex-1 relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={newMessage}
                                        onChange={handleTypingInput}
                                        placeholder="Type your message..."
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-300 transition-all"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:dark:bg-slate-600 text-white rounded-xl transition-all duration-200 disabled:cursor-not-allowed transform active:scale-95 shadow-lg shadow-blue-200 dark:shadow-none disabled:shadow-none"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    /* Empty state when no chat selected */
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 gap-4">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                            <MessageSquare className="w-12 h-12 text-blue-300 dark:text-slate-400" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-1">Your Messages</h3>
                            <p className="text-sm max-w-xs">
                                Select a conversation from the list or start a new one with your {role === 'patient' ? 'doctor' : 'patient'}.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPanel;
