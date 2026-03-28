const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/db.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

function readDb() {
    if (!fs.existsSync(DB_PATH)) {
        // Return default structure if file doesn't exist
        return { users: [], medicines: [], requests: [] };
    }
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading DB:", error);
        return { users: [], medicines: [], requests: [] };
    }
}

function writeDb(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error("Error writing DB:", error);
        return false;
    }
}

module.exports = { readDb, writeDb };
