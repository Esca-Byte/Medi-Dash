# 🏥 Med-Dash — Health Monitoring Dashboard

A comprehensive, real-time Health Monitoring Dashboard that bridges the gap between **patients** and **doctors**. Built with React and Node.js, Med-Dash provides live vital-sign tracking, intelligent medicine management with OCR scanning, real-time patient-doctor chat, an AI-powered health chatbot, and role-based dashboards — all connected through WebSocket for instant updates.

---

## ✨ Features

### 🔐 Authentication & Authorization
- **Role-Based Login** — Separate flows for Patients and Doctors
- **User Registration** — Sign up as a new Patient or Doctor with form validation
- **Session Management** — Token-based authentication with persistent login

### 📊 Real-Time Health Monitoring
- **Live Vital Signs** — Heart Rate, Blood Pressure, Glucose, and Temperature update every 5 seconds via WebSocket (Socket.io)
- **Interactive Charts** — Visual data trends powered by Chart.js with smooth animations
- **Metric Cards** — At-a-glance health indicators with color-coded status (normal / warning / critical)

### 👤 Patient Dashboard
- Personal health metrics overview with live charts
- Medicine schedules with status tracking (Upcoming / Taken / Missed)
- Doctor search and connection request system
- Emergency alert with one-click SOS and geolocation
- Health report generation and PDF download
- Profile and settings management with emergency contact configuration

### 🩺 Doctor Dashboard
- Patient list management with real-time vitals overview
- Detailed patient health records via modal view
- Incoming connection request management (Accept / Reject)
- Add new patients directly from the dashboard (credentials auto-generated and emailed)
- Prescription management

### 💬 Real-Time Chat System
- **Patient-Doctor Messaging** — Direct, real-time communication between connected patients and doctors via Socket.io
- **Conversation List** — Sidebar showing all active conversations with last-message preview and unread badges
- **Typing Indicators** — Live "typing…" feedback for a natural chat experience
- **Message History** — Persistent message storage with full conversation retrieval
- **Read Receipts** — Automatic read-status tracking with unread counts per conversation
- **Header Notification Badge** — Global unread message count displayed in the app header

### 💊 Medicine Management
- **CRUD Operations** — Add, update, and delete medication schedules
- **Medicine Scanner** — OCR-powered label scanning via Tesseract.js for hands-free entry
- **Automated Reminders** — Status tracking with visual indicators
- **Type Support** — Pills, syrups, injections, and more

### 🤖 AI Health Chatbot
- Powered by **Google Gemini API** (Gemini 2.5 Flash) with automatic model fallback
- Conversational health assistant with chat history
- Provides general health information with appropriate medical disclaimers
- Emergency symptom detection and escalation advice
- Built-in retry logic with rate-limit handling

### 📱 Device Pairing
- **Scan-to-Pair** — QR code generation for simulated external device connectivity
- **Webhook Integration** — Real-time data ingestion from paired devices via `POST /api/webhook/:sessionId`

### 🚨 Emergency System
- One-click emergency alert with automatic geolocation capture
- Emergency contact notification (simulated email/SMS)
- Ambulance dispatch simulation with ETA response
- Shares live vitals and Google Maps location link with emergency contacts

### 📄 Reports
- Generate comprehensive health reports
- Download as PDF using jsPDF with auto-table formatting

---

## 🛠️ Tech Stack

### Frontend (Client)
| Technology | Purpose |
|---|---|
| [React 19](https://react.dev/) | UI framework |
| [Vite 7](https://vitejs.dev/) | Build tool & dev server |
| [Tailwind CSS 3](https://tailwindcss.com/) | Utility-first styling |
| [React Router v7](https://reactrouter.com/) | Client-side routing |
| [Socket.io Client](https://socket.io/) | Real-time communication (vitals & chat) |
| [Chart.js](https://www.chartjs.org/) + react-chartjs-2 | Interactive health charts |
| [Tesseract.js 7](https://tesseract.projectnaptha.com/) | OCR for medicine scanning |
| [jsPDF](https://github.com/parallax/jsPDF) + jspdf-autotable | PDF report generation |
| [Lucide React](https://lucide.dev/) | Icon library |

### Backend (Server)
| Technology | Purpose |
|---|---|
| [Node.js](https://nodejs.org/) | JavaScript runtime |
| [Express 5](https://expressjs.com/) | Web framework |
| [Socket.io](https://socket.io/) | WebSocket server for real-time data & chat |
| [Helmet](https://helmetjs.github.io/) | HTTP security headers |
| [CORS](https://github.com/expressjs/cors) | Cross-origin resource sharing |
| [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) | API rate limiting |
| JSON file (`db.json`) | Lightweight local database (demo) |

---

## 📁 Project Structure

```
Med-Dash/
├── client/                          # React frontend
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── Register.jsx         # Registration page
│   │   │   ├── Dashboard.jsx        # Patient dashboard
│   │   │   ├── DoctorDashboard.jsx  # Doctor dashboard
│   │   │   ├── Header.jsx           # Top navigation bar (with chat badge)
│   │   │   ├── Sidebar.jsx          # Side navigation
│   │   │   ├── Layout.jsx           # App layout wrapper
│   │   │   ├── MetricCard.jsx       # Vital sign card component
│   │   │   ├── MedicineSchedule.jsx # Medicine list & management
│   │   │   ├── MedicineReminder.jsx # Medicine reminder alerts
│   │   │   ├── MedicineScannerModal.jsx  # OCR medicine scanner
│   │   │   ├── ChatPanel.jsx        # Real-time patient-doctor chat
│   │   │   ├── Chatbot.jsx          # AI health chatbot
│   │   │   ├── DoctorSearch.jsx     # Find & connect with doctors
│   │   │   ├── Appointments.jsx     # Appointment management
│   │   │   ├── Settings.jsx         # User profile & settings
│   │   │   ├── AddPatientModal.jsx  # Doctor: add patient form
│   │   │   ├── PatientDetailsModal.jsx   # Doctor: view patient details
│   │   │   ├── PrescriptionModal.jsx     # Prescription management
│   │   │   └── ErrorBoundary.jsx    # React error boundary
│   │   ├── context/                 # React context providers
│   │   ├── config.js                # API base URL configuration
│   │   ├── App.jsx                  # Main app with routing
│   │   ├── App.css                  # App-level styles
│   │   ├── main.jsx                 # React entry point
│   │   └── index.css                # Global styles
│   ├── index.html                   # HTML entry point
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   ├── postcss.config.js            # PostCSS configuration
│   ├── vercel.json                  # Vercel deployment config
│   └── package.json                 # Client dependencies
│
├── server/                          # Express backend
│   ├── utils/
│   │   ├── db.js                    # Database read/write helpers
│   │   └── helpers.js               # Password generation & email mock
│   ├── index.js                     # Server entry point (all routes + Socket.io)
│   └── package.json                 # Server dependencies
│
├── db.json                          # Root-level JSON database
├── start.bat                        # Windows one-click launcher
├── package.json                     # Root package (monorepo scripts)
├── .gitignore                       # Git ignore rules
└── README.md                        # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher — [Download](https://nodejs.org/)
- **npm** (comes with Node.js)

### Quick Start (Windows)

The easiest way to run the app on Windows:

```bash
# Double-click start.bat or run:
.\start.bat
```

This will automatically:
1. Check for Node.js installation
2. Install all dependencies (if missing)
3. Start the backend server on port **5000**
4. Start the frontend dev server on port **5173**

### Manual Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Med-Dash.git
   cd Med-Dash
   ```

2. **Install all dependencies** (root, client, and server)
   ```bash
   npm run install:all
   ```

   Or install individually:
   ```bash
   # Root dependencies
   npm install

   # Client dependencies
   cd client
   npm install

   # Server dependencies
   cd ../server
   npm install
   ```

3. **Start the application**

   You need to run both the server and client concurrently in separate terminals:

   **Terminal 1 — Backend Server:**
   ```bash
   cd server
   npm run dev
   ```
   Server starts on → `http://localhost:5000`

   **Terminal 2 — Frontend Client:**
   ```bash
   cd client
   npm run dev
   ```
   Client starts on → `http://localhost:5173`

4. **Open in browser**
   Navigate to `http://localhost:5173`

---

## 🔑 Demo Credentials

Use these pre-configured accounts to explore the app:

### Patient Accounts
| Username | Password | Name |
|---|---|---|
| `patient` | `patient123` | Arjun Sharma |
| `rohit` | `health123` | Rohit Verma |
| `esca` | `health123` | Eshaan Kulkarni |

### Doctor Accounts
| Username | Password | Name | Specialization |
|---|---|---|---|
| `doctor` | `doctor123` | Dr. Kavita Deshmukh | Cardiologist |
| `opena` | `opena123` | Dr. Omkar Nair | General |

> **Tip:** You can also register new accounts via the Register page.

---

## 📡 API Reference

All API endpoints are served from `http://localhost:5000`.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/login` | Login with username & password |
| `POST` | `/api/register` | Register a new user (patient/doctor) |

### Vital Signs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/vitals` | Get current simulated vital signs |

> Vitals also stream in real-time via Socket.io event `vitals-update`.

### Medicine Management

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/medicines` | List all medicines |
| `POST` | `/api/medicines` | Add a new medicine |
| `PUT` | `/api/medicines/:id` | Update medicine status |
| `DELETE` | `/api/medicines/:id` | Delete a medicine |

### User Management

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/:id` | Get user by ID |
| `PUT` | `/api/users/:id` | Update user profile |
| `GET` | `/api/doctors` | List all doctors |
| `GET` | `/api/doctors/search` | Search for doctors |
| `GET` | `/api/patients` | List patients (optionally filter by `?doctorId=`) |
| `POST` | `/api/patients` | Create patient (doctor action, sends email) |

### Connection Requests

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/requests` | Get requests (`?userId=&role=`) |
| `POST` | `/api/requests` | Send connection request to a doctor |
| `PUT` | `/api/requests/:id` | Accept or reject a request |

### Messaging

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/messages` | Get messages between two users (`?userId=&partnerId=`) |
| `GET` | `/api/conversations` | Get conversation list for a user (`?userId=`) |
| `PUT` | `/api/messages/read` | Mark messages from a partner as read |
| `GET` | `/api/messages/unread-count` | Get total unread count for a user (`?userId=`) |

### Other

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/emergency` | Trigger emergency alert |
| `POST` | `/api/chat` | AI chatbot (Gemini API) |
| `POST` | `/api/webhook/:sessionId` | Webhook for external device data |

### WebSocket Events

| Event | Direction | Description |
|---|---|---|
| `vitals-update` | Server → Client | Live vital signs broadcast (every 5s) |
| `device-update` | Server → Client | External device data broadcast |
| `webhook-data` | Server → Client | Webhook data for specific session |
| `new-message` | Server → Client | New chat message delivered to sender/receiver |
| `user-typing` | Server → Client | Typing indicator for chat partner |
| `user-stop-typing` | Server → Client | Stop-typing indicator for chat partner |
| `join-session` | Client → Server | Join a device pairing session room |
| `device-data` | Client → Server | Send device data |
| `join-chat` | Client → Server | Join personal chat room (by userId) |
| `chat-message` | Client → Server | Send a chat message to another user |
| `typing` | Client → Server | Notify partner that user is typing |
| `stop-typing` | Client → Server | Notify partner that user stopped typing |

---

## 🏗️ Build for Production

```bash
# Build the client for production
cd client
npm run build
```

The built files are output to `client/dist/`. The Express server is configured to serve these static files automatically, so in production you only need to run:

```bash
cd server
node index.js
```

The app will be available at `http://localhost:5000`.

---

## ☁️ Deployment

### Vercel (Frontend)
The client includes a `vercel.json` with SPA rewrites configured. Deploy the `client/` directory to Vercel for the frontend.

### Server
Deploy the `server/` directory to any Node.js hosting platform (Render, Railway, Heroku, etc.). Set the `PORT` environment variable if needed.

> **Note:** For production, replace the JSON file database with a proper database (MongoDB, PostgreSQL, etc.) and implement proper authentication with hashed passwords and JWT tokens.

---

## ⚠️ Important Notes

- **Demo Purpose** — This app uses a JSON file (`db.json`) as a database and stores passwords in plain text. This is intentional for demo/educational purposes. **Do not use in production as-is.**
- **AI Chatbot** — The chatbot uses the Google Gemini API. The API key is bundled in the server code for demo convenience. For production, use environment variables.
- **Email Service** — The email feature is mocked (logs to console). Integrate a real email service (SendGrid, Nodemailer + SMTP) for production.
- **CORS** — The server allows all origins (`*`) for demo purposes. Restrict this in production.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).

---

<p align="center">
  Made with ❤️ for better healthcare
</p>#   M e d i - D a s h  
 