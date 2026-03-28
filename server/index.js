const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const { readDb, writeDb } = require('./utils/db');

const helmet = require('helmet');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS first
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', '*'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
}));

app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for demo purposes, or specify "http://localhost:5173"
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join a specific session room
    socket.on('join-session', (sessionId) => {
        socket.join(sessionId);
        console.log('Socket ' + socket.id + ' joined session ' + sessionId);
    });

    // --- CHAT EVENTS ---
    // User joins their personal chat room (userId-based)
    socket.on('join-chat', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`Socket ${socket.id} joined chat room user-${userId}`);
    });

    // Real-time chat message
    socket.on('chat-message', (data) => {
        // data = { senderId, receiverId, text, senderName }
        const db = readDb();
        const newMessage = {
            id: Date.now(),
            senderId: data.senderId,
            receiverId: data.receiverId,
            text: data.text,
            timestamp: new Date().toISOString(),
            read: false
        };
        db.messages = db.messages || [];
        db.messages.push(newMessage);
        writeDb(db);

        // Emit to both sender and receiver rooms
        io.to(`user-${data.receiverId}`).emit('new-message', { ...newMessage, senderName: data.senderName });
        io.to(`user-${data.senderId}`).emit('new-message', { ...newMessage, senderName: data.senderName });
    });

    // Typing indicator
    socket.on('typing', (data) => {
        // data = { senderId, receiverId, senderName }
        io.to(`user-${data.receiverId}`).emit('user-typing', { senderId: data.senderId, senderName: data.senderName });
    });

    socket.on('stop-typing', (data) => {
        io.to(`user-${data.receiverId}`).emit('user-stop-typing', { senderId: data.senderId });
    });

    socket.on('device-data', (data) => {
        io.emit('device-update', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Mock Data Storage for Real-time Vitals (Transient)
let vitalSigns = {
    heartRate: 72,
    bloodPressure: { systolic: 120, diastolic: 80 },
    glucose: 90,
    temperature: 98.6,
    timestamp: new Date()
};

// Webhook for External Devices (Scan-to-Pair)
app.post('/api/webhook/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const data = req.body;

    console.log(`Webhook received for session ${sessionId}: `, data);

    // Broadcast to the specific session room
    io.to(sessionId).emit('webhook-data', data);

    res.json({ success: true, message: 'Data received' });
});

// Mock Data Generator
function updateVitals() {
    // Simulate slight fluctuations
    vitalSigns = {
        heartRate: Math.floor(60 + Math.random() * 40), // 60-100
        bloodPressure: {
            systolic: Math.floor(110 + Math.random() * 30), // 110-140
            diastolic: Math.floor(70 + Math.random() * 20)  // 70-90
        },
        glucose: Math.floor(80 + Math.random() * 40), // 80-120
        temperature: +(97 + Math.random() * 2).toFixed(1), // 97-99
        timestamp: new Date()
    };
    // Emit updates via socket as well so real-time clients don't have to poll
    io.emit('vitals-update', vitalSigns);
}

// Update every 5 seconds
setInterval(updateVitals, 5000);

app.get('/api/vitals', (req, res) => {
    res.json(vitalSigns);
});

// --- PERSISTENT DATA ENDPOINTS ---

app.get('/api/medicines', (req, res) => {
    const db = readDb();
    res.json(db.medicines);
});

app.post('/api/medicines', (req, res) => {
    const { name, dosage, time, type } = req.body;
    const db = readDb();
    const newMedicine = {
        id: Date.now(),
        name,
        dosage,
        time,
        type: type || 'pill',
        status: 'upcoming'
    };

    db.medicines.push(newMedicine);
    if (writeDb(db)) {
        console.log('Added medicine:', newMedicine); // Debug log
        res.json(newMedicine);
    } else {
        res.status(500).json({ message: "Failed to save medicine" });
    }
});

app.put('/api/medicines/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const db = readDb();

    const medicineIndex = db.medicines.findIndex(m => m.id === parseInt(id));

    if (medicineIndex !== -1) {
        db.medicines[medicineIndex].status = status;
        if (writeDb(db)) {
            res.json(db.medicines[medicineIndex]);
        } else {
            res.status(500).json({ message: "Failed to update medicine" });
        }
    } else {
        res.status(404).json({ message: 'Medicine not found' });
    }
});

app.delete('/api/medicines/:id', (req, res) => {
    const { id } = req.params;
    const db = readDb();

    const initialLength = db.medicines.length;
    db.medicines = db.medicines.filter(m => m.id !== parseInt(id));

    if (db.medicines.length < initialLength) {
        if (writeDb(db)) {
            res.json({ success: true, message: 'Medicine deleted' });
        } else {
            res.status(500).json({ message: "Failed to delete medicine" });
        }
    } else {
        res.json({ success: true, message: 'Medicine deleted (id not found)' });
    }
});

app.post('/api/emergency', (req, res) => {
    const { location, userId } = req.body;
    console.log('EMERGENCY ALERT RECEIVED!');

    const db = readDb();
    const user = userId ? db.users.find(u => u.id === parseInt(userId)) : null;

    let alertMessage = 'Emergency alert received. Ambulance dispatched to your location.';
    let contactInfo = 'No emergency contact configured.';

    if (user) {
        console.log(`Alert from user: ${user.name} (ID: ${user.id})`);
        console.log(`Location: Lat ${location.latitude}, Long ${location.longitude}`);
        console.log('Current Vitals:', vitalSigns);

        // Simulate sending alert to emergency contact
        if (user.emergencyContactName && (user.emergencyContactPhone || user.emergencyContactEmail)) {
            contactInfo = `Alert sent to ${user.emergencyContactName}`;
            if (user.emergencyContactPhone) contactInfo += ` (${user.emergencyContactPhone})`;
            if (user.emergencyContactEmail) contactInfo += ` and ${user.emergencyContactEmail}`;

            const locationStr = location
                ? `https://maps.google.com/?q=${location.latitude},${location.longitude}`
                : 'Unknown Location';

            console.log(`[SIMULATION] SENDING ALERT TO CONTACT:`);
            console.log(`To: ${user.emergencyContactName}`);
            console.log(`Message: EMERGENCY ALERT for ${user.name}. Location: ${locationStr}. Vitals: HR ${vitalSigns.heartRate}, BP ${vitalSigns.bloodPressure.systolic}/${vitalSigns.bloodPressure.diastolic}.`);
        } else {
            console.log(`[SIMULATION] No emergency contact found for user ${user.name}. Alerting only local services.`);
        }
    } else {
        console.log('Alert from unknown user.');
        console.log('Location:', location);
    }

    res.json({
        success: true,
        message: `${alertMessage} ${contactInfo}`,
        eta: '8 minutes'
    });
});

// --- DOCTOR SEARCH & REQUESTS ---

app.get('/api/doctors/search', (req, res) => {
    const db = readDb();
    // Return all doctors for now. Can filter by query params later.
    const doctors = db.users.filter(u => u.role === 'doctor').map(d => ({
        id: d.id,
        name: d.name,
        specialization: d.specialization,
        degree: d.degree,
        email: d.email
    }));
    res.json(doctors);
});

app.post('/api/requests', (req, res) => {
    const { patientId, doctorId } = req.body;
    const db = readDb();

    // Check if request already exists
    const existingRequest = db.requests.find(r => r.patientId === patientId && r.doctorId === doctorId && r.status === 'pending');
    if (existingRequest) {
        return res.status(400).json({ message: 'Request already pending' });
    }

    // Check if already connected
    const patient = db.users.find(u => u.id === patientId);
    if (patient && patient.doctorId === doctorId) {
        return res.status(400).json({ message: 'Already connected to this doctor' });
    }

    const newRequest = {
        id: Date.now(),
        patientId,
        doctorId,
        status: 'pending',
        timestamp: new Date()
    };

    db.requests.push(newRequest);
    if (writeDb(db)) {
        res.json({ success: true, message: 'Request sent successfully' });
    } else {
        res.status(500).json({ message: 'Failed to send request' });
    }
});

app.get('/api/requests', (req, res) => {
    const { userId, role } = req.query;
    const db = readDb();
    let requests = [];

    if (role === 'doctor') {
        // Get incoming requests for this doctor
        requests = db.requests.filter(r => r.doctorId === parseInt(userId) && r.status === 'pending');
        // Enrich with patient details
        requests = requests.map(r => {
            const patient = db.users.find(u => u.id === r.patientId);
            return {
                ...r,
                patientName: patient ? patient.name : 'Unknown',
                patientAge: patient ? patient.age : 'N/A',
                patientCondition: patient ? patient.condition : 'N/A'
            };
        });
    } else if (role === 'patient') {
        // Get outgoing requests for this patient
        requests = db.requests.filter(r => r.patientId === parseInt(userId));
        // Enrich with doctor details
        requests = requests.map(r => {
            const doctor = db.users.find(u => u.id === r.doctorId);
            return {
                ...r,
                doctorName: doctor ? doctor.name : 'Unknown',
                doctorSpecialization: doctor ? doctor.specialization : 'N/A'
            };
        });
    }

    res.json(requests);
});

app.put('/api/requests/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'
    const db = readDb();

    const resultIndex = db.requests.findIndex(r => r.id === parseInt(id));
    if (resultIndex === -1) {
        return res.status(404).json({ message: 'Request not found' });
    }

    db.requests[resultIndex].status = status;

    if (status === 'accepted') {
        // Link patient to doctor
        const request = db.requests[resultIndex];
        const patientIndex = db.users.findIndex(u => u.id === request.patientId);
        if (patientIndex !== -1) {
            db.users[patientIndex].doctorId = request.doctorId;
        }
    }

    if (writeDb(db)) {
        res.json({ success: true, message: `Request ${status} ` });
    } else {
        res.status(500).json({ message: 'Failed to update request' });
    }
});

// --- MESSAGING ENDPOINTS ---

// Get messages between two users
app.get('/api/messages', (req, res) => {
    const { userId, partnerId } = req.query;
    const db = readDb();
    const messages = (db.messages || []).filter(m =>
        (m.senderId === parseInt(userId) && m.receiverId === parseInt(partnerId)) ||
        (m.senderId === parseInt(partnerId) && m.receiverId === parseInt(userId))
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    res.json(messages);
});

// Get conversations list for a user
app.get('/api/conversations', (req, res) => {
    const { userId } = req.query;
    const db = readDb();
    const uid = parseInt(userId);
    const messages = db.messages || [];

    // Find all unique partners this user has chatted with
    const partnerIds = new Set();
    messages.forEach(m => {
        if (m.senderId === uid) partnerIds.add(m.receiverId);
        if (m.receiverId === uid) partnerIds.add(m.senderId);
    });

    // For each partner, get last message and unread count
    const conversations = Array.from(partnerIds).map(partnerId => {
        const thread = messages.filter(m =>
            (m.senderId === uid && m.receiverId === partnerId) ||
            (m.senderId === partnerId && m.receiverId === uid)
        ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const lastMessage = thread[0];
        const unreadCount = thread.filter(m => m.senderId === partnerId && !m.read).length;
        const partner = db.users.find(u => u.id === partnerId);

        return {
            partnerId,
            partnerName: partner ? partner.name : 'Unknown',
            partnerRole: partner ? partner.role : 'unknown',
            lastMessage: lastMessage ? lastMessage.text : '',
            lastTimestamp: lastMessage ? lastMessage.timestamp : '',
            unreadCount
        };
    }).sort((a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp));

    res.json(conversations);
});

// Mark messages as read
app.put('/api/messages/read', (req, res) => {
    const { userId, partnerId } = req.body;
    const db = readDb();
    let updated = 0;
    (db.messages || []).forEach(m => {
        if (m.senderId === parseInt(partnerId) && m.receiverId === parseInt(userId) && !m.read) {
            m.read = true;
            updated++;
        }
    });
    if (writeDb(db)) {
        res.json({ success: true, updatedCount: updated });
    } else {
        res.status(500).json({ message: 'Failed to update messages' });
    }
});

// Get total unread count for a user
app.get('/api/messages/unread-count', (req, res) => {
    const { userId } = req.query;
    const db = readDb();
    const count = (db.messages || []).filter(m => m.receiverId === parseInt(userId) && !m.read).length;
    res.json({ unreadCount: count });
});

// --- AI CHATBOT ENDPOINT ---

const GEMINI_API_KEY = 'AIzaSyAkuizc3q2WieCef2nRiMF6ESsU3DDmMr8';

// Helper: try calling Gemini with retry on 429
async function callGemini(requestBody, retries = 2) {
    const MODELS = [
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
    ];

    for (const modelUrl of MODELS) {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await fetch(modelUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-goog-api-key': GEMINI_API_KEY
                    },
                    body: JSON.stringify(requestBody)
                });

                const data = await response.json();

                if (data.error && data.error.code === 429) {
                    console.log(`Rate limited on ${modelUrl.split('models/')[1]} (attempt ${attempt + 1}). Waiting...`);
                    if (attempt < retries) {
                        await new Promise(r => setTimeout(r, (attempt + 1) * 3000));
                        continue;
                    }
                    break;
                }

                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    return { success: true, text: data.candidates[0].content.parts[0].text };
                }

                console.error(`Gemini error on ${modelUrl.split('models/')[1]}:`, data.error?.message || 'Unknown');
                break;
            } catch (fetchErr) {
                console.error(`Fetch error on ${modelUrl.split('models/')[1]}:`, fetchErr.message);
                break;
            }
        }
    }

    return { success: false, error: 'AI service is temporarily busy. Please wait a moment and try again.' };
}

app.post('/api/chat', async (req, res) => {
    const { message, history } = req.body;

    const systemPrompt = `You are a friendly health assistant on a medical dashboard app called MediDash.
    Rules:
    - Keep ALL responses SHORT (2-3 sentences max).
    - Help users understand their health conditions in simple terms.
    - If something sounds serious or critical, tell them: "This sounds serious. Please go to the Find Doctors section in your dashboard to connect with a doctor right away."
    - Never diagnose. Just give brief helpful info and suggest seeing a doctor when needed.
    - Be warm and casual, not robotic.`;

    try {
        // Filter and sanitize history for Gemini (must alternate user/model)
        const cleanHistory = (history || [])
            .filter(msg => msg.text && msg.text.trim())
            .map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

        // Remove consecutive same-role messages (Gemini requirement)
        const validHistory = [];
        for (const msg of cleanHistory) {
            if (validHistory.length === 0 || validHistory[validHistory.length - 1].role !== msg.role) {
                validHistory.push(msg);
            }
        }

        const requestBody = {
            system_instruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: [
                ...validHistory,
                { role: 'user', parts: [{ text: message }] }
            ]
        };

        const result = await callGemini(requestBody);

        if (result.success) {
            res.json({ success: true, reply: result.text });
        } else {
            res.json({ success: true, reply: result.error });
        }

    } catch (error) {
        console.error("Chat API Error:", error);
        res.json({ success: true, reply: "I'm experiencing a temporary issue. Please try again in a few seconds." });
    }
});

// --- USER MANAGEMENT ENDPOINTS ---

app.get('/api/doctors', (req, res) => {
    const db = readDb();
    const doctors = db.users.filter(u => u.role === 'doctor');
    res.json(doctors);
});

app.get('/api/patients', (req, res) => {
    const { doctorId } = req.query;
    const db = readDb();

    let patients = db.users.filter(u => u.role === 'patient');

    if (doctorId) {
        patients = patients.filter(u => u.doctorId === parseInt(doctorId));
    }

    // Enrich with dummy health data for dashboard if missing
    // In a real app, this would be in a separate VitalSigns table per user
    const patientsWithVitals = patients.map(p => ({
        ...p,
        age: p.age || 40, // Default if not set
        condition: p.condition || 'General Checkup',
        status: p.status || 'stable',
        heartRate: p.heartRate || 75,
        bp: p.bp || '120/80'
    }));

    res.json(patientsWithVitals);
});

const { generatePassword, sendEmail } = require('./utils/helpers');

// ... (existing imports)

// ...

app.post('/api/patients', (req, res) => {
    const { name, email, age, condition, status, doctorId } = req.body;
    const db = readDb();

    // Generate a simple username (or use email as username)
    const username = email ? email.split('@')[0] : name.toLowerCase().replace(/\s+/g, '');
    const password = generatePassword(12); // Secure random password

    const newUser = {
        id: Date.now(),
        username,
        email,
        password,
        role: 'patient',
        name,
        age: parseInt(age),
        condition,
        status,
        doctorId: parseInt(doctorId),
        heartRate: 75, // Default/Mock
        bp: '120/80'   // Default/Mock
    };

    db.users.push(newUser);

    if (writeDb(db)) {
        // Send email with credentials
        sendEmail(
            email,
            "Welcome to MediDash - Your Account Credentials",
            `Hello ${name}, \n\nYour account has been created.\n\nUsername: ${username} \nPassword: ${password} \n\nPlease log in and change your password if desired.`
        );

        res.json({ success: true, user: newUser, message: `Patient created.Credentials sent to ${email} ` });
    } else {
        res.status(500).json({ message: "Failed to create patient" });
    }
});

app.get('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const user = db.users.find(u => u.id === parseInt(id));

    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: "User not found" });
    }
});

app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const db = readDb();

    const index = db.users.findIndex(u => u.id === parseInt(id));

    if (index !== -1) {
        db.users[index] = { ...db.users[index], ...updates };
        if (writeDb(db)) {
            res.json(db.users[index]);
        } else {
            res.status(500).json({ message: "Failed to update user" });
        }
    } else {
        res.status(404).json({ message: "User not found" });
    }
});

app.post('/api/register', (req, res) => {
    const { username, password, role, name, email, age, condition, status, doctorId } = req.body;
    const db = readDb();

    // Check if username or email already exists
    const existingUser = db.users.find(u => u.username === username || u.email === email);
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username or Email already exists' });
    }

    const newUser = {
        id: Date.now(),
        username,
        password, // In a real app, hash this!
        role,
        name,
        email,
        ...(role === 'patient' && {
            age: age ? parseInt(age) : 30, // Default for demo
            condition: condition || 'General Checkup',
            status: status || 'stable',
            doctorId: doctorId ? parseInt(doctorId) : null,
            heartRate: 75,
            bp: '120/80'
        }),
        ...(role === 'doctor' && {
            specialization: 'General', // Default
            degree: req.body.degree || 'MBBS', // Default if missing, but frontend should send it
            schedule: []
        })
    };

    db.users.push(newUser);

    if (writeDb(db)) {
        // In a real app, generate a real JWT token
        const token = `${newUser.role} -token - ${newUser.id} `;
        res.json({ success: true, token, role: newUser.role, name: newUser.name, id: newUser.id });
    } else {
        res.status(500).json({ message: 'Failed to create user' });
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const db = readDb();

    const user = db.users.find(u => u.username === username && u.password === password);

    if (user) {
        // In a real app, generate a real JWT token
        const token = `${user.role} -token - ${user.id} `;
        res.json({ success: true, token, role: user.role, name: user.name, id: user.id });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Handle React routing, return all requests to React app
app.use((req, res, next) => {
    // If request is for API, don't serve index.html (though it should be handled above)
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

server.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});
